import { agentManager } from './AgentManager';
import { ExecutionContext, AgentResult } from './interfaces';
import { agentLogger } from './AgentLogger';

export interface OrchestrationResult {
  handled: boolean;
  text: string;
  contributingAgents: string[];
  isMock: boolean;
  hasPartialFailure: boolean;
}

export class AgentOrchestrator {
  /**
   * Classifies a user prompt to determine which agent(s) are relevant.
   */
  public classifyRequest(prompt: string): string[] {
    const p = prompt.toLowerCase();
    const selectedAgents: Set<string> = new Set();

    // Supervisor Agent triggers
    if (
      /\b(supervisor|agent health|agent status|monitor agents|auto-fix agent|repair agent|system health report)\b/i.test(p)
    ) {
      return ['supervisor_agent'];
    }

    // Calling Agent triggers (English & Hinglish)
    if (
      /\b(call|dial|phone call)\b/i.test(p) ||
      /\bko\s+call\s+karo\b/i.test(p)
    ) {
      return ['calling_agent'];
    }

    // WhatsApp Agent triggers (English & Hinglish)
    if (
      /\b(whatsapp|send whatsapp|message whatsapp)\b/i.test(p) ||
      /\bko\s+whatsapp\s+(?:karo|bhejo)\b/i.test(p)
    ) {
      return ['whatsapp_agent'];
    }

    // Meta-Agent explicit triggers (scaffolding new agent code)
    if (
      /\b(create|scaffold|build|make|generate)\b.*?\bagent\b/i.test(p) ||
      /\b(new agent for|agent scaffolding)\b/i.test(p)
    ) {
      return ['meta_agent'];
    }

    // Trading triggers
    if (
      /\b(trading|trade|trader|technical analysis|candlestick|chart pattern|stop loss|risk reward|options|call option|put option|futures|forex|crypto trading|crypto|day trading|swing trading|moving average|rsi|macd)\b/i.test(p)
    ) {
      selectedAgents.add('trading_agent');
    }

    // Financial / Investment / Insurance triggers
    if (
      /\b(financial|finance|invest|investment|portfolio|net worth|savings|budget|yield|mutual fund|stock|stock market|insurance|premium|sum assured)\b/i.test(p)
    ) {
      if (/\b(trading|trade|technical analysis|options|futures|forex|crypto trading)\b/i.test(p)) {
        selectedAgents.add('trading_agent');
      } else if (/\b(invest|investment|portfolio|yield|stock|mutual fund)\b/i.test(p)) {
        selectedAgents.add('investment_agent');
      } else if (/\b(insurance|policy|premium|sum assured)\b/i.test(p)) {
        selectedAgents.add('insurance_agent');
      } else {
        selectedAgents.add('financial_agent');
      }
    }

    // Browser / Web search triggers
    if (
      /\b(search the web|web search|google|scrape|search online|online rates|fetch website|latest rates|search for|look up online)\b/i.test(p)
    ) {
      selectedAgents.add('browser_agent');
    }

    // Coding triggers
    if (
      /\b(write code|code generation|refactor|debug|build project|compile|python script|typescript|git status|terminal command|create app)\b/i.test(p)
    ) {
      selectedAgents.add('coding_agent');
    }

    // Automation triggers
    if (
      /\b(schedule cron|recurring task|automation loop|trigger job|cron job|automate)\b/i.test(p)
    ) {
      selectedAgents.add('automation_agent');
    }

    // Full Autonomy Fallback: If prompt explicitly asks for a task/tracker/agent workflow
    // and no existing domain agent matches, route to Meta-Agent for autonomous agent creation + direct LLM answer!
    if (
      selectedAgents.size === 0 &&
      /\b(tracker|manager|specialist|assistant|workflow|routine|workout|fitness|diet|hydration|habit)\b/i.test(p)
    ) {
      return ['meta_agent'];
    }

    return Array.from(selectedAgents);
  }

  /**
   * Main orchestration method: classifies, executes, and synthesizes agent responses.
   */
  public async orchestrate(prompt: string, context?: Partial<ExecutionContext>): Promise<OrchestrationResult> {
    const agentIds = this.classifyRequest(prompt);

    if (agentIds.length === 0) {
      return {
        handled: false,
        text: '',
        contributingAgents: [],
        isMock: false,
        hasPartialFailure: false,
      };
    }

    agentLogger.log('orchestrator', 'start_orchestration', 'info', { prompt, agentIds });

    const execContext: ExecutionContext = {
      userId: context?.userId || 'usr_guest',
      conversationId: context?.conversationId || `conv_${Date.now()}`,
      workspaceId: context?.workspaceId || 'ws_default',
      variables: context?.variables || {},
    };

    // Execute relevant agents in parallel
    const agentTasks = agentIds.map(async (agentId) => {
      const agent = agentManager.getAgent(agentId);
      const agentName = agent ? agent.name : agentId;
      const task = agentManager.tasks.createTask(
        `${agentName} Task`,
        prompt
      );
      task.assignedAgentId = agentId;

      try {
        const result = await agentManager.executeTask(task.id, execContext);
        return {
          agentId,
          agentName,
          success: result.success,
          result,
          error: result.error,
        };
      } catch (err: any) {
        return {
          agentId,
          agentName,
          success: false,
          result: null,
          error: err.message || String(err),
        };
      }
    });

    const results = await Promise.allSettled(agentTasks);
    const fulfilledResults = results.map((r, i) => {
      if (r.status === 'fulfilled') {
        return r.value;
      }
      const agentId = agentIds[i];
      const agent = agentManager.getAgent(agentId);
      return {
        agentId,
        agentName: agent ? agent.name : agentId,
        success: false,
        result: null,
        error: r.reason?.message || 'Task execution failed',
      };
    });

    return this.synthesizeResponse(prompt, fulfilledResults);
  }

  /**
   * Synthesizes outputs from multiple agent results while preserving mock status,
   * financial disclaimers, partial failure reports, and security boundaries.
   */
  public synthesizeResponse(
    _prompt: string,
    executedResults: Array<{
      agentId: string;
      agentName: string;
      success: boolean;
      result: AgentResult | null;
      error?: string;
    }>
  ): OrchestrationResult {
    const successful = executedResults.filter((r) => r.success && r.result);
    const failed = executedResults.filter((r) => !r.success);

    const contributingAgents = successful.map((r) => r.agentName);
    let isMock = false;
    let hasFinancialDisclaimer = false;

    // Check mock flags and disclaimers across all executed agents
    executedResults.forEach((r) => {
      if (r.result?.data?.isMock === true) {
        isMock = true;
      }
      if (['financial_agent', 'investment_agent', 'insurance_agent', 'trading_agent'].includes(r.agentId)) {
        hasFinancialDisclaimer = true;
      }
    });

    const sections: string[] = [];

    // Header indicating contributing agents
    if (contributingAgents.length > 0) {
      const mockBadge = isMock ? ' `[SIMULATED SOURCES INCLUDED]`' : '';
      sections.push(`### Multi-Agent Intelligence Synthesis${mockBadge}\n**Contributing Agents**: ${contributingAgents.join(', ')}\n`);
    }

    // Report partial failures if any occurred
    if (failed.length > 0) {
      const failedNames = failed.map((f) => `**${f.agentName}** (${f.error || 'Execution Error'})`).join(', ');
      sections.push(`> ⚠️ **Partial Execution Notice**: The following agent(s) encountered issues: ${failedNames}. Showing available findings below.\n`);
    }

    // Process successful outputs
    successful.forEach((s) => {
      const agentData = s.result?.data;
      const isAgentMock = agentData?.isMock === true;
      const mockLabel = isAgentMock ? ' `[SIMULATED]`' : ' `[VERIFIED REAL EXECUTION]`';

      sections.push(`#### ${s.agentName}${mockLabel}`);

      if (typeof agentData === 'string') {
        sections.push(agentData);
      } else if (agentData?.analysis) {
        sections.push(agentData.analysis);
      } else if (agentData?.yieldReport) {
        sections.push(agentData.yieldReport);
      } else if (agentData?.audit) {
        sections.push(agentData.audit);
      } else if (agentData?.htmlContent) {
        sections.push(`**Web Content**: ${agentData.htmlContent}`);
      } else if (agentData?.code) {
        sections.push(`\`\`\`typescript\n${agentData.code}\n\`\`\`\n*Build Status*: ${agentData.buildResult || 'Simulated build'}`);
      } else if (agentData?.status) {
        sections.push(agentData.status);
      } else if (agentData) {
        sections.push(JSON.stringify(agentData, null, 2));
      }
      sections.push('');
    });

    // Append financial disclaimer if financial/investment/insurance agent participated
    if (hasFinancialDisclaimer) {
      sections.push(`---\n*Disclaimer: AI-generated financial analysis is for informational purposes only and does not constitute licensed financial or investment advice.*`);
    }

    const text = sections.join('\n');

    return {
      handled: true,
      text,
      contributingAgents,
      isMock,
      hasPartialFailure: failed.length > 0,
    };
  }
}

export const agentOrchestrator = new AgentOrchestrator();
export default agentOrchestrator;

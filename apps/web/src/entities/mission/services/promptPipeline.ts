import type { Mission } from '../model/types'

export interface PromptContext {
  mission: Mission
  stageName: string
  workspacePath: string
  memorySnippet?: string
}

class PromptPipeline {
  private systemPromptTemplate = `You are JARVIS OS Mission Agent, an elite autonomous AI engineer operating within JARVIS OS.
Your objective is to execute complex engineering missions with precision, safety, and visual elegance.`

  public buildAgentPrompt(agentName: string, taskPrompt: string, context: PromptContext): string {
    return `${this.systemPromptTemplate}

[AGENT CONTEXT]
Agent Name: ${agentName}
Active Mission: ${context.mission.title} (ID: ${context.mission.id})
Current Stage: ${context.stageName}
Workspace Directory: ${context.workspacePath}
${context.memorySnippet ? `Memory Context:\n${context.memorySnippet}\n` : ''}

[TASK INSTRUCTION]
${taskPrompt}

Provide structured markdown reasoning and execution plan.`
  }

  public buildPlanningPrompt(goalPrompt: string): string {
    return `${this.systemPromptTemplate}

Decompose the following mission goal into a structured sequence of execution stages.

Goal: "${goalPrompt}"`
  }
}

export const promptPipeline = new PromptPipeline()

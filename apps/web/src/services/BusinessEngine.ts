import { leadService } from './LeadService';
import { emailService } from './EmailService';
import { voiceService } from './VoiceService';
import { analyticsService } from './AnalyticsService';
import { proposalService } from './ProposalService';
import { notificationService } from './NotificationService';
import { memoryService } from './MemoryService';
import { automationService } from './AutomationService';
import { aiRouter } from '../shared/ai/AIRouter';

export interface CommandExecutionResult {
  command: string;
  response: string;
  actionTaken?: string;
  data?: any;
  timestamp: string;
}

export class BusinessEngine {
  private static instance: BusinessEngine;

  private constructor() {}

  public static getInstance(): BusinessEngine {
    if (!BusinessEngine.instance) {
      BusinessEngine.instance = new BusinessEngine();
    }
    return BusinessEngine.instance;
  }

  public async executeCommand(query: string): Promise<CommandExecutionResult> {
    const q = query.toLowerCase().trim();
    const timestamp = new Date().toISOString();

    // 1. Revenue Queries
    if (q.includes('revenue') || q.includes('ecosystem value') || q.includes('pipeline value')) {
      const metrics = analyticsService.getOverviewMetrics();
      const formattedRev = "₹" + metrics.totalRevenueINR.toLocaleString('en-IN');
      return {
        command: query,
        response: metrics.totalRevenueINR > 0 ? `Current Ecosystem Revenue is ${formattedRev} across ${metrics.totalLeads} leads.` : 'No data available',
        actionTaken: 'FETCH_REVENUE',
        data: { revenue: metrics.totalRevenueINR, formatted: formattedRev },
        timestamp,
      };
    }

    // 2. Hot Leads Queries
    if (q.includes('hot lead') || q.includes('hot leads')) {
      const hotLeads = leadService.getHotLeads();
      if (hotLeads.length === 0) {
        return { command: query, response: 'No data available', timestamp };
      }
      const names = hotLeads.map((l) => `${l.name} (${l.value})`).join(', ');
      return {
        command: query,
        response: `Found ${hotLeads.length} Hot Leads: ${names}`,
        actionTaken: 'FETCH_HOT_LEADS',
        data: hotLeads,
        timestamp,
      };
    }

    // 3. Outbound Calls / Call Premium Customers
    if (q.includes('call') || q.includes('outbound call')) {
      const hotLeads = leadService.getHotLeads();
      if (hotLeads.length === 0) {
        return { command: query, response: 'No data available for outbound calls', timestamp };
      }
      for (const lead of hotLeads) {
        await voiceService.initiateOutboundCall(lead.phone, 'proposal');
      }
      return {
        command: query,
        response: `Initiated LiveKit outbound calls for ${hotLeads.length} hot leads.`,
        actionTaken: 'DISPATCH_OUTBOUND_CALLS',
        timestamp,
      };
    }

    // 4. Generate Weekly / Daily Report
    if (q.includes('report') || q.includes('weekly report')) {
      const metrics = analyticsService.getOverviewMetrics();
      const reportText = `JARVIS OS Ecosystem Report:\n- Total Leads: ${metrics.totalLeads}\n- Hot Leads: ${metrics.hotLeads}\n- Conversion Rate: ${metrics.conversionRatePercent}%\n- Revenue: ₹${metrics.totalRevenueINR.toLocaleString('en-IN')}`;
      await notificationService.sendTelegramAlert('Weekly Ecosystem Report', reportText);
      return {
        command: query,
        response: reportText,
        actionTaken: 'GENERATE_REPORT',
        data: metrics,
        timestamp,
      };
    }

    // 5. Schedule Follow-ups
    if (q.includes('schedule follow-up') || q.includes('schedule followups') || q.includes('schedule')) {
      const task = automationService.scheduleTask('Automated Follow-up Campaign', '0 9 * * 1-5');
      return {
        command: query,
        response: `Scheduled follow-up automation task ${task.id} (Cron: 0 9 * * 1-5).`,
        actionTaken: 'SCHEDULE_TASK',
        data: task,
        timestamp,
      };
    }

    // 6. Pending Emails / Support Tickets
    if (q.includes('email') || q.includes('pending email') || q.includes('ticket')) {
      const emails = emailService.getEmails().filter((e) => e.status === 'open');
      if (emails.length === 0) {
        return { command: query, response: 'No data available', timestamp };
      }
      return {
        command: query,
        response: `Found ${emails.length} open support tickets requiring attention.`,
        actionTaken: 'FETCH_TICKETS',
        data: emails,
        timestamp,
      };
    }

    // 7. Create Proposal
    if (q.includes('create proposal') || q.includes('proposal')) {
      const proposal = proposalService.createProposal({
        lead_id: 'LEAD-AUTO',
        client: 'Executive Partner',
        company: 'Global Systems Inc.',
        value: '₹1,50,000',
        status: 'draft',
      });
      return {
        command: query,
        response: `Drafted proposal ${proposal.id} for ₹1,50,000.`,
        actionTaken: 'CREATE_PROPOSAL',
        data: proposal,
        timestamp,
      };
    }

    // 8. General AI Business Reasoning via Gemini API
    try {
      const metrics = analyticsService.getOverviewMetrics();
      const prompt = `You are JARVIS OS Business Engine. Context: Total Leads: ${metrics.totalLeads}, Revenue: ₹${metrics.totalRevenueINR}, Conversion: ${metrics.conversionRatePercent}%. User command: "${query}". Respond concisely with actionable business insights.`;
      const aiResponse = await aiRouter.generateResponse(prompt);

      memoryService.storeContext(`User query: ${query} | AI Response: ${aiResponse}`, 'business_command');

      return {
        command: query,
        response: aiResponse || 'No data available',
        actionTaken: 'GEMINI_INFERENCE',
        timestamp,
      };
    } catch (err) {
      return {
        command: query,
        response: 'API Connection Error: Unable to reach Gemini inference engine.',
        actionTaken: 'ERROR',
        timestamp,
      };
    }
  }
}

export const businessEngine = BusinessEngine.getInstance();

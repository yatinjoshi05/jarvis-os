import { ecosystemDb } from '../shared/database/EcosystemDatabase';

export interface EcosystemOverviewMetrics {
  totalLeads: number;
  hotLeads: number;
  hotRatioPercent: number;
  totalRevenueINR: number;
  totalMessages: number;
  totalCalls: number;
  totalTickets: number;
  totalProposals: number;
  conversionRatePercent: number;
}

export class AnalyticsService {
  private static instance: AnalyticsService;

  private constructor() {}

  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  public getOverviewMetrics(): EcosystemOverviewMetrics {
    const leads = ecosystemDb.getLeads();
    const messages = ecosystemDb.getMessages();
    const calls = ecosystemDb.getCalls();
    const tickets = ecosystemDb.getEmails();
    const proposals = ecosystemDb.getProposals();

    const totalLeads = leads.length;
    const hotLeads = leads.filter((l) => l.qualification === 'hot').length;
    const hotRatioPercent = totalLeads > 0 ? Math.round((hotLeads / totalLeads) * 100) : 0;

    const totalRevenueINR = leads.reduce((sum, l) => {
      const val = parseInt(String(l.value).replace(/[^0-9]/g, '')) || 0;
      return sum + val;
    }, 0);

    const wonLeads = leads.filter((l) => l.status === 'won').length;
    const conversionRatePercent = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0;

    return {
      totalLeads,
      hotLeads,
      hotRatioPercent,
      totalRevenueINR,
      totalMessages: messages.length,
      totalCalls: calls.length,
      totalTickets: tickets.length,
      totalProposals: proposals.length,
      conversionRatePercent,
    };
  }

  public getLeadQualificationBreakdown(): { hot: number; warm: number; cold: number } {
    const leads = ecosystemDb.getLeads();
    const res = { hot: 0, warm: 0, cold: 0 };
    leads.forEach((l) => {
      if (l.qualification === 'hot') res.hot++;
      else if (l.qualification === 'warm') res.warm++;
      else if (l.qualification === 'cold') res.cold++;
    });
    return res;
  }

  public getAgentSourcesBreakdown(): Record<string, number> {
    const leads = ecosystemDb.getLeads();
    const res: Record<string, number> = {};
    leads.forEach((l) => {
      res[l.source] = (res[l.source] || 0) + 1;
    });
    return res;
  }

  public getVoiceAnalysisBreakdown(): { positive: number; neutral: number; negative: number } {
    const calls = ecosystemDb.getCalls();
    const res = { positive: 0, neutral: 0, negative: 0 };
    calls.forEach((c) => {
      if (c.sentiment === 'positive') res.positive++;
      else if (c.sentiment === 'neutral') res.neutral++;
      else if (c.sentiment === 'negative') res.negative++;
    });
    return res;
  }
}

export const analyticsService = AnalyticsService.getInstance();

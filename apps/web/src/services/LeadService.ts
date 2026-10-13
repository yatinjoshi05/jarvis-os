import { ecosystemDb, LeadRecord } from '../shared/database/EcosystemDatabase';

export class LeadService {
  private static instance: LeadService;

  private constructor() {}

  public static getInstance(): LeadService {
    if (!LeadService.instance) {
      LeadService.instance = new LeadService();
    }
    return LeadService.instance;
  }

  public getAllLeads(): LeadRecord[] {
    return ecosystemDb.getLeads();
  }

  public getHotLeads(): LeadRecord[] {
    return this.getAllLeads().filter((l) => l.qualification === 'hot');
  }

  public createLead(payload: Omit<LeadRecord, 'id' | 'created_at'>): LeadRecord {
    const newLead: LeadRecord = {
      ...payload,
      id: `LEAD-${Math.floor(1000 + Math.random() * 9000)}`,
      created_at: new Date().toISOString(),
    };
    ecosystemDb.saveLead(newLead);
    return newLead;
  }

  public updateLeadStatus(id: string, status: LeadRecord['status']): LeadRecord | null {
    const leads = this.getAllLeads();
    const existing = leads.find((l) => l.id === id);
    if (!existing) return null;

    const updated: LeadRecord = { ...existing, status };
    ecosystemDb.saveLead(updated);
    return updated;
  }

  public getTotalRevenue(): number {
    return this.getAllLeads().reduce((sum, lead) => {
      const numericVal = parseInt(lead.value.replace(/[^0-9]/g, '')) || 0;
      return sum + numericVal;
    }, 0);
  }
}

export const leadService = LeadService.getInstance();

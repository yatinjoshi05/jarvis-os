import { ecosystemDb, ProposalRecord } from '../shared/database/EcosystemDatabase';

export class ProposalService {
  private static instance: ProposalService;

  private constructor() {}

  public static getInstance(): ProposalService {
    if (!ProposalService.instance) {
      ProposalService.instance = new ProposalService();
    }
    return ProposalService.instance;
  }

  public getProposals(): ProposalRecord[] {
    return ecosystemDb.getProposals();
  }

  public createProposal(payload: Omit<ProposalRecord, 'id' | 'created_at'>): ProposalRecord {
    const proposal: ProposalRecord = {
      ...payload,
      id: `PROP-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    ecosystemDb.saveProposal(proposal);
    return proposal;
  }

  public updateProposalStatus(id: string, status: ProposalRecord['status']): ProposalRecord | null {
    const proposals = this.getProposals();
    const existing = proposals.find((p) => p.id === id);
    if (!existing) return null;

    const updated: ProposalRecord = { ...existing, status };
    ecosystemDb.saveProposal(updated);
    return updated;
  }
}

export const proposalService = ProposalService.getInstance();

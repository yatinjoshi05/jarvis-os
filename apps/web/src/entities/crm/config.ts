import { LeadStatus } from './types';

export const CRM_CONFIG = {
  pipelineStages: [
    'New Lead',
    'Contacted',
    'Qualified',
    'Meeting Scheduled',
    'Proposal Sent',
    'Negotiation',
    'Won',
    'Lost'
  ] as LeadStatus[],

  leadScoringWeights: {
    engagement: 0.3,   // activity count weight
    financial: 0.4,    // income/assets suitability weight
    source: 0.2,       // lead generation medium weight
    manual: 0.1        // manual scoring override weight
  },

  leadSourcePoints: {
    Referral: 10,
    Website: 8,
    Campaign: 7,
    Social: 6,
    ColdCall: 3,
    Unknown: 2
  } as Record<string, number>,

  defaultTaskDeadlineMs: 24 * 3600 * 1000, // 24 hours

  communicationProviders: {
    whatsappBusiness: { enabled: false, apiVersion: 'v18.0' },
    emailProvider: { enabled: false, service: 'SMTP' },
    telephonyProvider: { enabled: false, codec: 'G711' }
  }
};

export default CRM_CONFIG;

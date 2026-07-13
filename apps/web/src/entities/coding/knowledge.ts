export interface CodingStandard {
  id: string;
  title: string;
  description: string;
  rules: string[];
}

export class KnowledgeManager {
  private standards: CodingStandard[] = [];
  private apiReferences = new Map<string, { description: string; signature: string; usage: string }>();

  constructor() {
    this.seedDefaultKnowledge();
  }

  private seedDefaultKnowledge() {
    this.standards.push({
      id: 'ts_standards',
      title: 'TypeScript Coding Standards',
      description: 'The core formatting and syntax policies for JARVIS OS TypeScript development.',
      rules: [
        'Strict TypeScript compliance must be enabled.',
        'Use Feature-Sliced Design to organize application elements.',
        'Zero code duplication is mandatory across feature slices.',
        'Unused variables must be prefixed with underscore or removed.'
      ]
    });

    this.apiReferences.set('financialManager', {
      description: 'The main orchestrator of the Financial OS Core module.',
      signature: 'export const financialManager: FinancialManager',
      usage: "import { financialManager } from '@/entities/financial';\nconst profile = financialManager.getProfile(userId);"
    });

    this.apiReferences.set('crmManager', {
      description: 'The customer relationship management manager for lead/customer lifecycle.',
      signature: 'export const crmManager: CRMManager',
      usage: "import { crmManager } from '@/entities/crm';\ncrmManager.createLead(name, email, phone);"
    });
  }

  public getStandards(): CodingStandard[] {
    return this.standards;
  }

  public getAPIReference(symbol: string) {
    return this.apiReferences.get(symbol);
  }

  public registerAPIReference(symbol: string, details: { description: string; signature: string; usage: string }) {
    this.apiReferences.set(symbol, details);
  }
}

export const knowledgeManager = new KnowledgeManager();
export default knowledgeManager;

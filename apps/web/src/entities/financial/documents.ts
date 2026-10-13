import { aiManager } from '../../shared/ai';
import { FinancialDocument } from './interfaces';
import { DocumentType } from './types';
import { DocumentFailureError } from './errors';

export class FinancialDocumentsModule {
  private documents: FinancialDocument[] = [];

  constructor() {
    this.loadData();
  }

  private loadData() {
    try {
      const stored = localStorage.getItem('jarvis_financial_documents');
      if (stored) {
        this.documents = JSON.parse(stored) as FinancialDocument[];
      }
    } catch (_) { /* ignore */ }
  }

  private saveData() {
    try {
      localStorage.setItem('jarvis_financial_documents', JSON.stringify(this.documents));
    } catch (_) { /* ignore */ }
  }

  public uploadDocument(userId: string, name: string, type: DocumentType, fileUrl: string): FinancialDocument {
    if (!name || !fileUrl) {
      throw new DocumentFailureError('Invalid document details: missing name or file URL.');
    }

    const doc: FinancialDocument = {
      id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      userId,
      name,
      type,
      uploadDate: Date.now(),
      fileUrl,
      status: 'pending'
    };

    this.documents.push(doc);
    this.saveData();
    return doc;
  }

  public getDocuments(userId: string): FinancialDocument[] {
    return this.documents.filter((d) => d.userId === userId);
  }

  public deleteDocument(userId: string, docId: string) {
    this.documents = this.documents.filter((d) => !(d.userId === userId && d.id === docId));
    this.saveData();
  }

  /**
   * Simulates OCR text extraction and updates document status and data.
   */
  public async simulateOCR(docId: string): Promise<FinancialDocument> {
    const doc = this.documents.find((d) => d.id === docId);
    if (!doc) {
      throw new DocumentFailureError(`Document ${docId} not found.`);
    }

    doc.status = 'processed';

    if (doc.type === 'policy') {
      doc.extractedData = {
        provider: 'MetLife Assurance',
        premium: 1200,
        coverage: 500000,
        date: Date.now() - 30 * 24 * 3600 * 1000, // 30 days ago
        text: 'POLICY DOCUMENT SUMMARY\nHolder: John Doe\nPlan: Term Life Secure\nSum Assured: $500,000\nAnnual Premium: $1,200\nPayment Frequency: Yearly\nStatus: Active'
      };
    } else if (doc.type === 'statement') {
      doc.extractedData = {
        provider: 'Vanguard Asset Management',
        amount: 25000,
        date: Date.now(),
        holdings: [
          { symbol: 'VTI', name: 'Vanguard Total Stock Market', assetClass: 'equity', quantity: 100, avgPrice: 220, currentPrice: 245 },
          { symbol: 'BND', name: 'Vanguard Total Bond Market', assetClass: 'fixed_income', quantity: 50, avgPrice: 75, currentPrice: 76 }
        ],
        text: 'VANGUARD INVESTMENT ACCOUNT STATEMENT\nAccount Holder: John Doe\nTotal Balance: $25,000\nHoldings:\n- VTI: 100 units @ $245.00\n- BND: 50 units @ $76.00'
      };
    } else {
      doc.extractedData = {
        text: 'FINANCIAL STATEMENT SUMMARY REPORT\nGenerated on: July 2026\nContains net worth summaries and monthly budget audits.'
      };
    }

    this.saveData();
    return doc;
  }

  /**
   * Integrates with AI Core (AIManager) to analyze the OCR-extracted text and return insights.
   */
  public async analyzeDocumentWithAI(docId: string): Promise<string> {
    const doc = this.documents.find((d) => d.id === docId);
    if (!doc) {
      throw new DocumentFailureError(`Document ${docId} not found.`);
    }

    if (doc.status !== 'processed' || !doc.extractedData) {
      // Run OCR first if not done
      await this.simulateOCR(docId);
    }

    const ocrText = doc.extractedData?.text || '';
    if (!ocrText) {
      throw new DocumentFailureError(`No OCR data available for document ${docId}.`);
    }

    try {
      const prompt = `Analyze this OCR text extracted from a financial document (${doc.type}):
"${ocrText}"
Provide a high-level summary of the document.
Highlight key parameters (Premium, Coverage, Total Valuations, Holdings) and flag any potential issues (high fees, insufficient coverage, policy lapse).
Format the output as a clean bulleted list, under 150 words.`;

      const analysis = await aiManager.generateResponse(prompt);
      return analysis.trim();
    } catch (_) {
      // Fallback analysis if AI core is offline
      if (doc.type === 'policy') {
        return `Simulated Analysis for Policy Document:\n- Plan: Term Life Secure\n- Provider: ${doc.extractedData?.provider || 'Unknown'}\n- Cover: $${doc.extractedData?.coverage?.toLocaleString() || 0}\n- Premium: $${doc.extractedData?.premium || 0}/year\n- Status: active policy in good standing.`;
      } else {
        return `Simulated Analysis for Statement/Report:\n- Provider: ${doc.extractedData?.provider || 'Unknown'}\n- Balance: $${doc.extractedData?.amount?.toLocaleString() || 0}\n- Holdings count: ${doc.extractedData?.holdings?.length || 0} items.`;
      }
    }
  }
}

export const financialDocumentsModule = new FinancialDocumentsModule();
export default financialDocumentsModule;

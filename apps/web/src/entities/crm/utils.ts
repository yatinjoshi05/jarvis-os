import { LeadStatus } from './types';
import { CRM_CONFIG } from './config';

export class CRMUtils {
  // ─── DATE HELPERS ───────────────────────────────────────────
  
  public static formatDate(timestamp: number, locale = 'en-US'): string {
    return new Date(timestamp).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  public static isPastDue(deadline: number): boolean {
    return Date.now() > deadline;
  }

  // ─── PIPELINE HELPERS ───────────────────────────────────────

  public static isValidStage(stage: LeadStatus): boolean {
    return CRM_CONFIG.pipelineStages.includes(stage);
  }

  public static isClosedWon(stage: LeadStatus): boolean {
    return stage === 'Won';
  }

  public static isClosedLost(stage: LeadStatus): boolean {
    return stage === 'Lost';
  }

  public static getPipelinePosition(stage: LeadStatus): number {
    return CRM_CONFIG.pipelineStages.indexOf(stage);
  }

  // ─── LEAD SCORING HELPERS ───────────────────────────────────

  public static calculateSourcePoints(source: string): number {
    const key = source.replace(/\s+/g, '') as keyof typeof CRM_CONFIG.leadSourcePoints;
    return CRM_CONFIG.leadSourcePoints[key] || CRM_CONFIG.leadSourcePoints.Unknown;
  }

  public static normalizeScore(score: number, max = 10): number {
    return Math.max(0, Math.min(max, score));
  }

  // ─── SEARCH HELPERS ─────────────────────────────────────────

  public static containsKeyword(text: string, query: string): boolean {
    if (!text || !query) return false;
    const cleanText = text.toLowerCase();
    const cleanQuery = query.toLowerCase().trim();
    return cleanText.includes(cleanQuery);
  }
}

export default CRMUtils;

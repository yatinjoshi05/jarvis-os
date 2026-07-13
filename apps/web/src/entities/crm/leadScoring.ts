import { aiManager } from '../../shared/ai';
import { financialManager } from '../financial';
import { Lead, Customer } from './interfaces';
import { CRM_CONFIG } from './config';
import { CRMUtils } from './utils';

export class LeadScoringEngine {
  /**
   * Estimates a financial suitability score (0-10) using Financial OS profile if available.
   */
  public static calculateFinancialScore(customer?: Customer): number {
    if (!customer) return 5; // Default middle-ground score if no profile linked

    try {
      // Attempt to load financial profile via linked financialProfileId or customer userId
      const targetId = customer.financialProfileId || customer.userId || customer.id;
      const finProfile = financialManager.getProfile(targetId);

      const income = finProfile.financialMetrics.annualIncome;
      let score = 5;

      if (income >= 200000) score = 10;
      else if (income >= 120000) score = 8;
      else if (income >= 80000) score = 6;
      else if (income >= 40000) score = 4;
      else score = 2;

      // Bonus for asset/liability health
      const assets = finProfile.financialMetrics.totalAssets;
      const liabilities = finProfile.financialMetrics.totalLiabilities;
      if (assets > liabilities * 3) {
        score = Math.min(10, score + 2);
      }

      return score;
    } catch (_) {
      // If profile doesn't exist yet in Financial OS, fallback to average score
      return 5;
    }
  }

  /**
   * Calculates engagement score (0-10) based on communications and timeline activity count.
   */
  public static calculateEngagementScore(activitiesCount: number): number {
    return Math.min(10, activitiesCount * 2);
  }

  /**
   * Simulates AI purchasing intent scoring using AIManager.
   */
  public static async calculateAIScore(lead: Lead, notes: string[]): Promise<number> {
    if (notes.length === 0) return 5; // Default if no notes/conversations to analyze

    try {
      const prompt = `You are an AI sales expert analyzing a lead for purchasing intent.
Lead Name: ${lead.name}
Lead Source: ${lead.source}
Lead Status: ${lead.status}
Interaction history:
${notes.join('\n')}

Rate this lead's purchase intent and responsiveness on a scale of 0 to 10 (where 0 is completely cold and 10 is ready to buy).
Provide ONLY the raw rating number as an integer, with no other text, explanation or punctuation.`;

      const response = await aiManager.generateResponse(prompt);
      const score = parseInt(response.trim(), 10);
      return isNaN(score) ? 5 : CRMUtils.normalizeScore(score);
    } catch (_) {
      return 5; // Fallback
    }
  }

  /**
   * Calculates the overall weighted priority score (0-10) for a lead.
   */
  public static calculatePriorityScore(
    engagementScore: number,
    financialScore: number,
    sourceScore: number,
    manualScore: number
  ): number {
    const weights = CRM_CONFIG.leadScoringWeights;
    
    const rawScore =
      engagementScore * weights.engagement +
      financialScore * weights.financial +
      sourceScore * weights.source +
      manualScore * weights.manual;

    return Math.round(CRMUtils.normalizeScore(rawScore) * 10) / 10;
  }
}

export default LeadScoringEngine;

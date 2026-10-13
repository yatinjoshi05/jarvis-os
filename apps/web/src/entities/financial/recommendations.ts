import { RiskProfile, Recommendation, CustomerProfile, Portfolio, Investment, Insurance } from './interfaces';
import { FINANCIAL_CONFIG } from './config';
import { RiskCategory } from './types';
import { FinancialCalculators } from './calculators';

export class FinancialRecommendations {
  /**
   * Generates a risk profile based on questionnaire heuristics.
   */
  public static assessRisk(profile: CustomerProfile): RiskProfile {
    const weights = FINANCIAL_CONFIG.riskToleranceWeights;
    
    // Normalize income vs expense ratio
    const expenseIncomeRatio = profile.financialMetrics.monthlyExpenses * 12 / profile.financialMetrics.annualIncome;
    const surplusScore = expenseIncomeRatio < 0.4 ? 10 : expenseIncomeRatio < 0.7 ? 6 : 3;

    // Dependents impact
    const dependentsScore = profile.personalInfo.dependentsCount === 0 ? 10 : profile.personalInfo.dependentsCount <= 2 ? 7 : 4;

    // Experience weights
    const expScore = profile.investmentExperience === 'advanced' ? 10 : profile.investmentExperience === 'basic' ? 6 : 3;

    // Direct score
    const questionnaireScore = profile.riskScore;

    // Weighted average
    const finalScore = 
      (surplusScore * weights.expenses) +
      (dependentsScore * weights.dependents) +
      (expScore * weights.experience) +
      (questionnaireScore * weights.income);

    let category: RiskCategory = 'moderate';
    if (finalScore >= 7.5) {
      category = 'aggressive';
    } else if (finalScore < 4.5) {
      category = 'conservative';
    }

    const alloc = FINANCIAL_CONFIG.defaultAssetAllocations[category];

    return {
      score: finalScore,
      category,
      suitability: {
        equityAllocationPercent: alloc.equity,
        debtAllocationPercent: alloc.debt,
        goldAllocationPercent: alloc.gold,
        cashAllocationPercent: alloc.cash
      }
    };
  }

  /**
   * Generates dynamic actionable recommendations.
   */
  public static generate(
    profile: CustomerProfile,
    portfolio?: Portfolio,
    investments: Investment[] = [],
    insurance: Insurance[] = []
  ): Recommendation[] {
    const recs: Recommendation[] = [];
    const userId = profile.userId;

    // 1. GOAL RECOMMENDATIONS
    profile.goals.forEach((goal) => {
      if (!goal.isCompleted) {
        const yearsRemaining = Math.max((goal.targetDate - Date.now()) / (365 * 24 * 3600 * 1000), 0.1);
        const requiredSIP = FinancialCalculators.calculateGoal(goal.targetAmount, yearsRemaining, goal.currentAmount);
        
        if (requiredSIP > 0) {
          recs.push({
            id: `rec_goal_${goal.id}_${Date.now()}`,
            userId,
            category: 'goal',
            title: `Fund Goal: ${goal.name}`,
            description: `Start a monthly SIP of $${Math.round(requiredSIP)} to secure your target of $${goal.targetAmount} in ${yearsRemaining.toFixed(1)} years.`,
            priority: yearsRemaining < 3 ? 'high' : 'medium',
            createdAt: Date.now()
          });
        }
      }
    });

    // 2. RISK RECOMMENDATIONS
    const riskProfile = this.assessRisk(profile);
    recs.push({
      id: `rec_risk_${Date.now()}`,
      userId,
      category: 'risk',
      title: `Risk Profile: ${riskProfile.category.toUpperCase()}`,
      description: `Your computed risk tolerance score is ${riskProfile.score.toFixed(1)}/10. Standard asset suitability suggests keeping equity around ${riskProfile.suitability.equityAllocationPercent}%, debt at ${riskProfile.suitability.debtAllocationPercent}%, and gold/cash at ${riskProfile.suitability.goldAllocationPercent + riskProfile.suitability.cashAllocationPercent}%.`,
      priority: 'low',
      createdAt: Date.now()
    });

    // 3. INSURANCE RECOMMENDATIONS
    const termNeed = FinancialCalculators.calculateInsuranceNeed(
      profile.financialMetrics.annualIncome,
      profile.financialMetrics.totalLiabilities,
      profile.personalInfo.dependentsCount
    );

    const activeLifeInsuranceCover = insurance
      .filter((ins) => ins.status === 'active' && (ins.type === 'life' || ins.type === 'term'))
      .reduce((sum, ins) => sum + ins.sumAssured, 0);

    const activeHealthInsuranceCover = insurance
      .filter((ins) => ins.status === 'active' && ins.type === 'health')
      .reduce((sum, ins) => sum + ins.sumAssured, 0);

    if (activeLifeInsuranceCover < termNeed) {
      const gap = termNeed - activeLifeInsuranceCover;
      recs.push({
        id: `rec_ins_life_${Date.now()}`,
        userId,
        category: 'insurance',
        title: 'Life Insurance Gap Identified',
        description: `Your estimated life cover requirement is $${termNeed.toLocaleString()}. Currently active cover is $${activeLifeInsuranceCover.toLocaleString()}, leaving a gap of $${gap.toLocaleString()}. Obtain additional term cover.`,
        priority: profile.personalInfo.dependentsCount > 0 ? 'high' : 'medium',
        createdAt: Date.now()
      });
    }

    if (activeHealthInsuranceCover <= 0) {
      recs.push({
        id: `rec_ins_health_${Date.now()}`,
        userId,
        category: 'insurance',
        title: 'Missing Health Insurance',
        description: 'No active health insurance policy found. Add medical cover to protect against emergency hospital expenses.',
        priority: 'high',
        createdAt: Date.now()
      });
    }

    // 4. PORTFOLIO RECOMMENDATIONS
    if (portfolio) {
      const totalVal = portfolio.cashBalance + portfolio.holdings.reduce((sum, h) => sum + (h.quantity * h.currentPrice), 0);
      if (totalVal > 0) {
        const equityVal = portfolio.holdings.filter((h) => h.assetClass === 'equity').reduce((sum, h) => sum + (h.quantity * h.currentPrice), 0);

        const currentEquityPct = (equityVal / totalVal) * 100;
        const targetEquityPct = riskProfile.suitability.equityAllocationPercent;

        if (Math.abs(currentEquityPct - targetEquityPct) > 10) {
          recs.push({
            id: `rec_port_rebalance_${Date.now()}`,
            userId,
            category: 'portfolio',
            title: 'Portfolio Rebalancing Needed',
            description: `Your current equity allocation is ${currentEquityPct.toFixed(1)}% vs targeted ${targetEquityPct}%. Consider rebalancing your portfolio.`,
            priority: 'medium',
            createdAt: Date.now()
          });
        }
      }
    }

    // 5. INVESTMENT RECOMMENDATIONS
    const monthlyIncome = profile.financialMetrics.annualIncome / 12;
    const surplus = monthlyIncome - profile.financialMetrics.monthlyExpenses;
    if (surplus > 0) {
      const sipInvested = investments
        .filter((i) => i.status === 'active' && i.type === 'SIP')
        .reduce((sum, i) => sum + i.amount, 0);

      const investableCash = surplus - sipInvested;
      if (investableCash > 100) {
        recs.push({
          id: `rec_invest_surplus_${Date.now()}`,
          userId,
          category: 'investment',
          title: 'Deploy Monthly Surplus Cash',
          description: `You have an unallocated monthly savings surplus of $${Math.round(investableCash)}. Automate investment via index funds (SIP) or PPF/NPS for long-term compounding.`,
          priority: 'medium',
          createdAt: Date.now()
        });
      }
    }

    return recs;
  }
}
export default FinancialRecommendations;

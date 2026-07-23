import {
  CustomerProfile,
  Portfolio,
  Holding,
  Recommendation,
  Goal,
  Investment,
  Insurance,
  FinancialReport,
  RiskProfile
} from './interfaces';
import { FinancialCalculators } from './calculators';
import { FinancialRecommendations } from './recommendations';
import { financialEventEmitter, FinancialEntityEvents } from './events';
import { FinancialUtils } from './utils';
import { financialTimeline } from './timeline';
import { financialKnowledgeEngine } from './knowledge';
import { financialDocumentsModule } from './documents';
import { FINANCIAL_CONFIG } from './config';
import { DocumentType } from './types';

// Integrations
import { authenticationManager } from '../../shared/auth';
import { memoryManager } from '../../shared/memory';
import { notificationManager } from '../../shared/dashboard';
import { serviceRegistry } from '../../shared/providers';

export class FinancialManager {
  private profiles = new Map<string, CustomerProfile>();
  private portfolios = new Map<string, Portfolio>();
  private investments = new Map<string, Investment[]>();
  private insurance = new Map<string, Insurance[]>();

  constructor() {
    this.loadData();
  }

  private loadData() {
    try {
      const storedProfiles = localStorage.getItem('jarvis_financial_profiles');
      if (storedProfiles) {
        const list = JSON.parse(storedProfiles) as CustomerProfile[];
        list.forEach((p) => this.profiles.set(p.userId, p));
      }

      const storedPortfolios = localStorage.getItem('jarvis_financial_portfolios');
      if (storedPortfolios) {
        const list = JSON.parse(storedPortfolios) as Portfolio[];
        list.forEach((p) => this.portfolios.set(p.userId, p));
      }

      const storedInvestments = localStorage.getItem('jarvis_financial_investments');
      if (storedInvestments) {
        const list = JSON.parse(storedInvestments) as [string, Investment[]][];
        this.investments = new Map(list);
      }

      const storedInsurance = localStorage.getItem('jarvis_financial_insurance');
      if (storedInsurance) {
        const list = JSON.parse(storedInsurance) as [string, Insurance[]][];
        this.insurance = new Map(list);
      }
    } catch (_) { /* ignore */ }
  }

  private saveData() {
    try {
      localStorage.setItem('jarvis_financial_profiles', JSON.stringify(Array.from(this.profiles.values())));
      localStorage.setItem('jarvis_financial_portfolios', JSON.stringify(Array.from(this.portfolios.values())));
      localStorage.setItem('jarvis_financial_investments', JSON.stringify(Array.from(this.investments.entries())));
      localStorage.setItem('jarvis_financial_insurance', JSON.stringify(Array.from(this.insurance.entries())));
    } catch (_) { /* ignore */ }
  }

  private getActiveUserId(userId?: string): string {
    return userId || authenticationManager.getCurrentUser()?.id || 'usr_guest';
  }

  // ─── PROFILE LIFECYCLE ───────────────────────────────────────

  public createDefaultProfile(userId: string = 'usr_guest'): CustomerProfile {
    const defaultProfile: CustomerProfile = {
      id: `prof_${userId}`,
      userId,
      personalInfo: {
        fullName: 'Guest User',
        occupation: 'Guest',
        age: 30,
        dependentsCount: 0
      },
      financialMetrics: {
        annualIncome: 75000,
        monthlyExpenses: 3500,
        totalAssets: 10000,
        totalLiabilities: 0
      },
      riskScore: 5.0,
      riskCategory: 'moderate',
      investmentExperience: 'basic',
      goals: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.profiles.set(userId, defaultProfile);
    this.saveData();

    financialEventEmitter.emit(FinancialEntityEvents.FINANCIAL_PROFILE_UPDATED, defaultProfile);
    this.syncProfileToMemory(defaultProfile);

    return defaultProfile;
  }

  public createProfile(
    userId: string,
    personalInfo: CustomerProfile['personalInfo'] & { age: number },
    financialMetrics: CustomerProfile['financialMetrics'],
    riskScore: number,
    investmentExperience: CustomerProfile['investmentExperience']
  ): CustomerProfile {
    const profileWithoutCategory: CustomerProfile = {
      id: `prof_${Date.now()}`,
      userId,
      personalInfo,
      financialMetrics,
      riskScore,
      riskCategory: 'moderate',
      investmentExperience,
      goals: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const riskProfile = FinancialRecommendations.assessRisk(profileWithoutCategory);
    profileWithoutCategory.riskCategory = riskProfile.category;

    this.profiles.set(userId, profileWithoutCategory);
    this.saveData();

    financialEventEmitter.emit(FinancialEntityEvents.FINANCIAL_PROFILE_UPDATED, profileWithoutCategory);
    this.syncProfileToMemory(profileWithoutCategory);

    return profileWithoutCategory;
  }

  public updateProfile(userId: string, updates: Partial<CustomerProfile>): CustomerProfile {
    const activeUserId = this.getActiveUserId(userId);
    const profile = this.getProfile(activeUserId);

    Object.assign(profile, updates);
    profile.updatedAt = Date.now();

    const assessed = FinancialRecommendations.assessRisk(profile);
    profile.riskCategory = assessed.category;

    this.profiles.set(activeUserId, profile);
    this.saveData();

    financialEventEmitter.emit(FinancialEntityEvents.FINANCIAL_PROFILE_UPDATED, profile);
    this.syncProfileToMemory(profile);

    return profile;
  }

  public getProfile(userId?: string): CustomerProfile {
    const activeUserId = this.getActiveUserId(userId);
    let profile = this.profiles.get(activeUserId);
    if (!profile) {
      profile = this.createDefaultProfile(activeUserId);
    }
    return profile;
  }

  public deleteProfile(userId?: string) {
    const activeUserId = this.getActiveUserId(userId);
    this.profiles.delete(activeUserId);
    this.portfolios.delete(activeUserId);
    this.investments.delete(activeUserId);
    this.insurance.delete(activeUserId);
    this.saveData();
  }

  // ─── GOAL MANAGEMENT ─────────────────────────────────────────

  public addGoal(userId: string, goal: Omit<Goal, 'id' | 'isCompleted'>): Goal {
    const activeUserId = this.getActiveUserId(userId);
    const profile = this.getProfile(activeUserId);

    const newGoal: Goal = {
      ...goal,
      id: `goal_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      isCompleted: goal.currentAmount >= goal.targetAmount
    };

    profile.goals.push(newGoal);
    profile.updatedAt = Date.now();
    this.saveData();

    financialEventEmitter.emit(FinancialEntityEvents.GOAL_CREATED, newGoal);
    financialTimeline.addMilestone(activeUserId, {
      type: 'goal',
      title: `Goal Created: ${newGoal.name}`,
      description: `Target amount: $${newGoal.targetAmount.toLocaleString()}. Target date: ${new Date(newGoal.targetDate).toLocaleDateString()}`,
      amount: newGoal.targetAmount
    });

    if (newGoal.isCompleted) {
      financialEventEmitter.emit(FinancialEntityEvents.GOAL_COMPLETED, newGoal);
      notificationManager.showNotification('success', 'Goal Completed!', `Congratulations! You have reached your goal: ${newGoal.name}.`);
    }

    return newGoal;
  }

  public updateGoal(userId: string, goalId: string, updates: Partial<Goal>): Goal {
    const activeUserId = this.getActiveUserId(userId);
    const profile = this.getProfile(activeUserId);

    const goal = profile.goals.find((g) => g.id === goalId);
    if (!goal) {
      throw new Error(`Goal ${goalId} not found.`);
    }

    const wasCompleted = goal.isCompleted;
    Object.assign(goal, updates);

    if (goal.currentAmount !== undefined && goal.targetAmount !== undefined) {
      goal.isCompleted = goal.currentAmount >= goal.targetAmount;
    }

    profile.updatedAt = Date.now();
    this.saveData();

    if (goal.isCompleted && !wasCompleted) {
      financialEventEmitter.emit(FinancialEntityEvents.GOAL_COMPLETED, goal);
      financialTimeline.addMilestone(activeUserId, {
        type: 'goal',
        title: `Goal Accomplished: ${goal.name}`,
        description: `Successfully accumulated $${goal.currentAmount.toLocaleString()} of your $${goal.targetAmount.toLocaleString()} target!`,
        amount: goal.targetAmount
      });
      notificationManager.showNotification('success', 'Goal Completed!', `Congratulations! You have reached your goal: ${goal.name}.`);
    }

    return goal;
  }

  public deleteGoal(userId: string, goalId: string) {
    const activeUserId = this.getActiveUserId(userId);
    const profile = this.getProfile(activeUserId);

    profile.goals = profile.goals.filter((g) => g.id !== goalId);
    profile.updatedAt = Date.now();
    this.saveData();
  }

  public getGoals(userId?: string): Goal[] {
    const activeUserId = this.getActiveUserId(userId);
    return this.getProfile(activeUserId).goals;
  }

  public checkGoalStatus(userId: string, goalId: string): Goal {
    return this.updateGoal(userId, goalId, {});
  }

  // ─── RISK PROFILING ──────────────────────────────────────────

  public getRiskQuestionnaire() {
    return [
      {
        id: 'age',
        question: 'What is your age range?',
        options: [
          { text: 'Under 30 (Aggressive potential)', score: 10 },
          { text: '30 to 45 (Moderate potential)', score: 7 },
          { text: '45 to 60 (Conservative bias)', score: 4 },
          { text: 'Over 60 (Highly conservative)', score: 1 }
        ]
      },
      {
        id: 'horizon',
        question: 'What is your primary investment time horizon?',
        options: [
          { text: 'Short term (1-3 years)', score: 2 },
          { text: 'Medium term (3-7 years)', score: 6 },
          { text: 'Long term (7+ years)', score: 10 }
        ]
      },
      {
        id: 'drop',
        question: 'If the stock market falls by 20%, what would you do?',
        options: [
          { text: 'Sell everything to protect capital', score: 1 },
          { text: 'Do nothing and wait for recovery', score: 5 },
          { text: 'Buy more at discounted prices', score: 10 }
        ]
      },
      {
        id: 'experience',
        question: 'How would you describe your investment experience?',
        options: [
          { text: 'None (No knowledge)', score: 2 },
          { text: 'Basic (Some knowledge of mutual funds/fixed income)', score: 6 },
          { text: 'Advanced (Stocks, ETFs, derivatives)', score: 10 }
        ]
      }
    ];
  }

  public submitRiskAnswers(userId: string, answers: { questionId: string; score: number }[]): RiskProfile {
    const activeUserId = this.getActiveUserId(userId);
    const sum = answers.reduce((acc, curr) => acc + curr.score, 0);
    const averageScore = sum / answers.length;

    const profile = this.getProfile(activeUserId);
    profile.riskScore = averageScore;
    profile.updatedAt = Date.now();

    const riskProfile = FinancialRecommendations.assessRisk(profile);
    profile.riskCategory = riskProfile.category;

    this.profiles.set(activeUserId, profile);
    this.saveData();

    financialEventEmitter.emit(FinancialEntityEvents.FINANCIAL_PROFILE_UPDATED, profile);
    this.syncProfileToMemory(profile);

    notificationManager.showNotification(
      'info',
      'Risk Profile Assessment Completed',
      `Your risk category has been assessed as ${riskProfile.category.toUpperCase()} (Score: ${averageScore.toFixed(1)}/10).`
    );

    return riskProfile;
  }

  // ─── PORTFOLIO ENGINE ────────────────────────────────────────

  public getPortfolio(userId: string): Portfolio {
    const activeUserId = this.getActiveUserId(userId);
    let portfolio = this.portfolios.get(activeUserId);
    if (!portfolio) {
      portfolio = {
        id: `port_${Date.now()}`,
        userId: activeUserId,
        holdings: [],
        cashBalance: 10000,
        updatedAt: Date.now()
      };
      this.portfolios.set(activeUserId, portfolio);
      this.saveData();
    }
    return portfolio;
  }

  public updatePortfolio(userId: string, holdings: Holding[], cashBalance: number): Portfolio {
    const activeUserId = this.getActiveUserId(userId);
    const portfolio = this.getPortfolio(activeUserId);
    portfolio.holdings = holdings;
    portfolio.cashBalance = cashBalance;
    portfolio.updatedAt = Date.now();

    this.portfolios.set(activeUserId, portfolio);
    this.saveData();

    financialEventEmitter.emit(FinancialEntityEvents.PORTFOLIO_UPDATED, portfolio);
    return portfolio;
  }

  public getPortfolioSummary(userId?: string) {
    const activeUserId = this.getActiveUserId(userId);
    const portfolio = this.getPortfolio(activeUserId);
    
    const holdingsValue = portfolio.holdings.reduce((sum, h) => sum + (h.quantity * h.currentPrice), 0);
    const costBasis = portfolio.holdings.reduce((sum, h) => sum + (h.quantity * h.avgPrice), 0);
    const totalValuation = holdingsValue + portfolio.cashBalance;
    const totalReturns = holdingsValue - costBasis;
    const returnsPercentage = costBasis > 0 ? (totalReturns / costBasis) * 100 : 0;

    return {
      portfolioId: portfolio.id,
      holdingsValue,
      cashBalance: portfolio.cashBalance,
      totalValuation,
      totalReturns,
      returnsPercentage
    };
  }

  public getAssetAllocation(userId?: string) {
    const activeUserId = this.getActiveUserId(userId);
    const portfolio = this.getPortfolio(activeUserId);
    const summary = this.getPortfolioSummary(activeUserId);
    
    if (summary.totalValuation === 0) {
      return { equity: 0, debt: 0, gold: 0, cash: 100 };
    }

    const equity = portfolio.holdings.filter((h) => h.assetClass === 'equity').reduce((sum, h) => sum + (h.quantity * h.currentPrice), 0);
    const debt = portfolio.holdings.filter((h) => h.assetClass === 'fixed_income').reduce((sum, h) => sum + (h.quantity * h.currentPrice), 0);
    const gold = portfolio.holdings.filter((h) => h.assetClass === 'gold').reduce((sum, h) => sum + (h.quantity * h.currentPrice), 0);
    const cash = portfolio.cashBalance;

    return {
      equity: (equity / summary.totalValuation) * 100,
      debt: (debt / summary.totalValuation) * 100,
      gold: (gold / summary.totalValuation) * 100,
      cash: (cash / summary.totalValuation) * 100
    };
  }

  public rebalancePortfolio(userId?: string): { recommendedTrades: { symbol: string; action: 'buy' | 'sell'; quantity: number }[] } {
    const activeUserId = this.getActiveUserId(userId);
    const profile = this.getProfile(activeUserId);
    const portfolio = this.getPortfolio(activeUserId);
    const summary = this.getPortfolioSummary(activeUserId);
    
    const targetAlloc = FINANCIAL_CONFIG.defaultAssetAllocations[profile.riskCategory];
    const recommendedTrades: { symbol: string; action: 'buy' | 'sell'; quantity: number }[] = [];

    portfolio.holdings.forEach((h) => {
      const targetPct = h.assetClass === 'equity' ? targetAlloc.equity : targetAlloc.debt;
      const currentVal = h.quantity * h.currentPrice;
      const targetVal = summary.totalValuation * (targetPct / 100);
      const diffVal = targetVal - currentVal;

      if (Math.abs(diffVal) > summary.totalValuation * 0.05) {
        const action = diffVal > 0 ? 'buy' : 'sell';
        const quantity = Math.round(Math.abs(diffVal) / h.currentPrice);
        if (quantity > 0) {
          recommendedTrades.push({ symbol: h.symbol, action, quantity });
        }
      }
    });

    return { recommendedTrades };
  }

  // ─── INSURANCE MODULE ────────────────────────────────────────

  public addInsurancePolicy(userId: string, policy: Omit<Insurance, 'id' | 'status' | 'userId'>): Insurance {
    const activeUserId = this.getActiveUserId(userId);
    const userPolicies = this.insurance.get(activeUserId) || [];

    const newPolicy: Insurance = {
      ...policy,
      id: `ins_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      userId: activeUserId,
      status: 'active'
    };

    userPolicies.push(newPolicy);
    this.insurance.set(activeUserId, userPolicies);
    this.saveData();

    financialEventEmitter.emit(FinancialEntityEvents.INSURANCE_CREATED, newPolicy);
    financialTimeline.addMilestone(activeUserId, {
      type: 'insurance',
      title: `Insurance Policy Created: ${newPolicy.policyName}`,
      description: `Provider: ${newPolicy.provider}. Premium: $${newPolicy.premium}/${newPolicy.premiumFrequency}. Sum Assured: $${newPolicy.sumAssured.toLocaleString()}`,
      amount: newPolicy.premium
    });

    notificationManager.showNotification(
      'success',
      'Insurance Registered',
      `Policy ${newPolicy.policyName} has been added successfully.`
    );

    return newPolicy;
  }

  public getInsurancePolicies(userId?: string): Insurance[] {
    const activeUserId = this.getActiveUserId(userId);
    return this.insurance.get(activeUserId) || [];
  }

  public updateInsurancePolicy(userId: string, policyId: string, updates: Partial<Insurance>): Insurance {
    const activeUserId = this.getActiveUserId(userId);
    const policies = this.getInsurancePolicies(activeUserId);
    const policy = policies.find((p) => p.id === policyId);
    if (!policy) {
      throw new Error(`Insurance policy ${policyId} not found.`);
    }

    Object.assign(policy, updates);
    this.insurance.set(activeUserId, policies);
    this.saveData();

    return policy;
  }

  public deleteInsurancePolicy(userId: string, policyId: string) {
    const activeUserId = this.getActiveUserId(userId);
    const policies = this.getInsurancePolicies(activeUserId);
    const filtered = policies.filter((p) => p.id !== policyId);
    this.insurance.set(activeUserId, filtered);
    this.saveData();
  }

  public checkInsuranceCoverage(userId?: string) {
    const activeUserId = this.getActiveUserId(userId);
    const profile = this.getProfile(activeUserId);
    const policies = this.getInsurancePolicies(activeUserId);

    const activeLifeCover = policies
      .filter((p) => p.status === 'active' && (p.type === 'life' || p.type === 'term'))
      .reduce((sum, p) => sum + p.sumAssured, 0);

    const neededCover = FinancialCalculators.calculateInsuranceNeed(
      profile.financialMetrics.annualIncome,
      profile.financialMetrics.totalLiabilities,
      profile.personalInfo.dependentsCount
    );

    return {
      activeLifeCover,
      neededCover,
      gap: Math.max(0, neededCover - activeLifeCover),
      isCovered: activeLifeCover >= neededCover
    };
  }

  // ─── INVESTMENT MODULE ───────────────────────────────────────

  public addInvestment(userId: string, investment: Omit<Investment, 'id' | 'status' | 'userId'>): Investment {
    const activeUserId = this.getActiveUserId(userId);
    const userInvestments = this.investments.get(activeUserId) || [];

    const newInvestment: Investment = {
      ...investment,
      id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      userId: activeUserId,
      status: 'active'
    };

    userInvestments.push(newInvestment);
    this.investments.set(activeUserId, userInvestments);
    this.saveData();

    financialEventEmitter.emit(FinancialEntityEvents.INVESTMENT_CREATED, newInvestment);
    financialTimeline.addMilestone(activeUserId, {
      type: 'investment',
      title: `Investment Created: ${newInvestment.name}`,
      description: `Type: ${newInvestment.type}. Amount: $${newInvestment.amount.toLocaleString()}`,
      amount: newInvestment.amount
    });

    notificationManager.showNotification(
      'success',
      'Investment Created',
      `Investment in ${newInvestment.name} registered.`
    );

    return newInvestment;
  }

  public getInvestments(userId?: string): Investment[] {
    const activeUserId = this.getActiveUserId(userId);
    return this.investments.get(activeUserId) || [];
  }

  public updateInvestment(userId: string, investmentId: string, updates: Partial<Investment>): Investment {
    const activeUserId = this.getActiveUserId(userId);
    const list = this.getInvestments(activeUserId);
    const investment = list.find((i) => i.id === investmentId);
    if (!investment) {
      throw new Error(`Investment ${investmentId} not found.`);
    }

    Object.assign(investment, updates);
    this.investments.set(activeUserId, list);
    this.saveData();

    return investment;
  }

  public deleteInvestment(userId: string, investmentId: string) {
    const activeUserId = this.getActiveUserId(userId);
    const list = this.getInvestments(activeUserId);
    const filtered = list.filter((i) => i.id !== investmentId);
    this.investments.set(activeUserId, filtered);
    this.saveData();
  }

  public executeSIPCycle(userId?: string): { executedCount: number; totalAmount: number } {
    const activeUserId = this.getActiveUserId(userId);
    const portfolio = this.getPortfolio(activeUserId);
    const userInvestments = this.investments.get(activeUserId) || [];
    
    const activeSIPs = userInvestments.filter(
      (inv) => inv.type === 'SIP' && inv.status === 'active' && (!inv.nextExecutionDate || inv.nextExecutionDate <= Date.now())
    );

    let executedCount = 0;
    let totalAmount = 0;

    activeSIPs.forEach((sip) => {
      if (portfolio.cashBalance >= sip.amount) {
        portfolio.cashBalance -= sip.amount;
        totalAmount += sip.amount;
        executedCount++;

        const symbol = sip.name.split(' ')[0].toUpperCase();
        let holding = portfolio.holdings.find((h) => h.symbol === symbol);
        
        const returnRate = FINANCIAL_CONFIG.defaultInvestmentReturnsPercent[sip.type] || 10;
        const currentPrice = sip.amount * (1 + returnRate / 100);
        
        if (holding) {
          const totalCostBasis = (holding.quantity * holding.avgPrice) + sip.amount;
          holding.quantity += 1;
          holding.currentPrice = currentPrice;
          holding.avgPrice = totalCostBasis / holding.quantity;
        } else {
          holding = {
            symbol,
            name: sip.name,
            assetClass: 'equity',
            quantity: 1,
            avgPrice: sip.amount,
            currentPrice: currentPrice
          };
          portfolio.holdings.push(holding);
        }

        sip.nextExecutionDate = FinancialUtils.getNextFrequencyDate(sip.nextExecutionDate || Date.now(), 'monthly');

        financialTimeline.addMilestone(activeUserId, {
          type: 'transaction',
          title: `SIP Executed: ${sip.name}`,
          description: `Automatically processed monthly SIP contribution of $${sip.amount.toLocaleString()}.`,
          amount: -sip.amount
        });
      } else {
        notificationManager.showNotification(
          'warning',
          'SIP Execution Failed',
          `Insufficient cash balance ($${portfolio.cashBalance.toFixed(2)}) to execute SIP: ${sip.name} ($${sip.amount}).`
        );
      }
    });

    if (executedCount > 0) {
      this.updatePortfolio(activeUserId, portfolio.holdings, portfolio.cashBalance);
      this.saveData();
      
      notificationManager.showNotification(
        'success',
        'SIP Cycle Processed',
        `Successfully executed ${executedCount} SIPs, totaling $${totalAmount.toFixed(2)}.`
      );
    }

    return { executedCount, totalAmount };
  }

  // ─── CALCULATORS DELEGATES ───────────────────────────────────

  public calculateGoal(targetAmount: number, yearsRemaining: number, currentSavings: number, annualRate = 12): number {
    return FinancialCalculators.calculateGoal(targetAmount, yearsRemaining, currentSavings, annualRate);
  }

  public calculateSIP(monthlyInvestment: number, annualRate: number, tenureYears: number): number {
    return FinancialCalculators.calculateSIP(monthlyInvestment, annualRate, tenureYears);
  }

  public calculateEMI(principal: number, annualRate: number, tenureMonths: number): number {
    return FinancialCalculators.calculateEMI(principal, annualRate, tenureMonths);
  }

  public calculateInsuranceNeed(annualIncome: number, liabilities: number, dependentsCount: number): number {
    return FinancialCalculators.calculateInsuranceNeed(annualIncome, liabilities, dependentsCount);
  }

  public calculateLumpsum(principal: number, annualRate: number, tenureYears: number): number {
    return FinancialCalculators.calculateLumpsum(principal, annualRate, tenureYears);
  }

  public calculateCompoundInterest(principal: number, annualRate: number, timesCompoundedPerYear: number, tenureYears: number): number {
    return FinancialCalculators.calculateCompoundInterest(principal, annualRate, timesCompoundedPerYear, tenureYears);
  }

  public calculateInflation(amount: number, years: number, rate?: number): number {
    return FinancialCalculators.calculateInflation(amount, years, rate);
  }

  public calculateLoanEligibility(monthlyIncome: number, monthlyEMIs: number, interestRate?: number, tenureMonths?: number): number {
    return FinancialCalculators.calculateLoanEligibility(monthlyIncome, monthlyEMIs, interestRate, tenureMonths);
  }

  public calculateTax(annualIncome: number): number {
    return FinancialCalculators.calculateTax(annualIncome);
  }

  // ─── RECOMMENDATIONS ─────────────────────────────────────────

  public generateRecommendation(userId?: string): Recommendation[] {
    const activeUserId = this.getActiveUserId(userId);
    const profile = this.getProfile(activeUserId);
    const portfolio = this.getPortfolio(activeUserId);
    const investments = this.getInvestments(activeUserId);
    const policies = this.getInsurancePolicies(activeUserId);
    
    const recs = FinancialRecommendations.generate(profile, portfolio, investments, policies);
    financialEventEmitter.emit(FinancialEntityEvents.REPORT_GENERATED, { userId: activeUserId, count: recs.length });
    return recs;
  }

  // ─── KNOWLEDGE ENGINE DELEGATES ──────────────────────────────

  public getGlossary() {
    return financialKnowledgeEngine.getGlossary();
  }

  public getConcepts() {
    return financialKnowledgeEngine.getConcepts();
  }

  public getConcept(id: string) {
    return financialKnowledgeEngine.getConcept(id);
  }

  public getFAQs() {
    return financialKnowledgeEngine.getFAQs();
  }

  public getLearningModules() {
    return financialKnowledgeEngine.getLearningModules();
  }

  public async getAIExplanation(term: string, userId?: string): Promise<string> {
    const activeUserId = userId || authenticationManager.getCurrentUser()?.id;
    const profile = activeUserId ? this.profiles.get(activeUserId) : undefined;
    return financialKnowledgeEngine.getAIExplanation(term, profile);
  }

  // ─── DOCUMENTS MODULE DELEGATES ──────────────────────────────

  public uploadDocument(name: string, type: DocumentType, fileUrl: string, userId?: string) {
    const activeUserId = this.getActiveUserId(userId);
    return financialDocumentsModule.uploadDocument(activeUserId, name, type, fileUrl);
  }

  public getDocuments(userId?: string) {
    const activeUserId = this.getActiveUserId(userId);
    return financialDocumentsModule.getDocuments(activeUserId);
  }

  public deleteDocument(docId: string, userId?: string) {
    const activeUserId = this.getActiveUserId(userId);
    financialDocumentsModule.deleteDocument(activeUserId, docId);
  }

  public async simulateOCR(docId: string) {
    return financialDocumentsModule.simulateOCR(docId);
  }

  public async analyzeDocumentWithAI(docId: string) {
    return financialDocumentsModule.analyzeDocumentWithAI(docId);
  }

  // ─── TIMELINE DELEGATES ──────────────────────────────────────

  public getTimeline(userId?: string) {
    const activeUserId = this.getActiveUserId(userId);
    return financialTimeline.getTimeline(activeUserId);
  }

  public getReminders(userId?: string) {
    const activeUserId = this.getActiveUserId(userId);
    return financialTimeline.getReminders(activeUserId);
  }

  public addTimelineEvent(
    type: 'transaction' | 'investment' | 'insurance' | 'goal' | 'milestone' | 'reminder',
    title: string,
    description: string,
    amount?: number,
    userId?: string
  ) {
    const activeUserId = this.getActiveUserId(userId);
    financialTimeline.addMilestone(activeUserId, { type, title, description, amount });
  }

  public clearTimeline(userId?: string) {
    const activeUserId = this.getActiveUserId(userId);
    financialTimeline.clear(activeUserId);
  }

  // ─── ANALYTICS ───────────────────────────────────────────────

  public getAnalyticsReport(userId?: string): FinancialReport {
    const activeUserId = this.getActiveUserId(userId);
    const profile = this.getProfile(activeUserId);
    const portfolio = this.getPortfolio(activeUserId);
    const insurance = this.getInsurancePolicies(activeUserId);

    const portfolioValuation = portfolio.holdings.reduce((sum, h) => sum + (h.quantity * h.currentPrice), 0);
    const netWorth = portfolioValuation + portfolio.cashBalance + profile.financialMetrics.totalAssets - profile.financialMetrics.totalLiabilities;

    const monthlyIncome = profile.financialMetrics.annualIncome / 12;
    const surplus = monthlyIncome - profile.financialMetrics.monthlyExpenses;
    const savingsRatePercent = monthlyIncome > 0 ? (surplus / monthlyIncome) * 100 : 0;

    let goalProgressPercent = 0;
    if (profile.goals.length > 0) {
      const totalGoalTargets = profile.goals.reduce((sum, g) => sum + g.targetAmount, 0);
      const totalGoalCurrents = profile.goals.reduce((sum, g) => sum + g.currentAmount, 0);
      goalProgressPercent = totalGoalTargets > 0 ? (totalGoalCurrents / totalGoalTargets) * 100 : 0;
    }

    const termNeed = FinancialCalculators.calculateInsuranceNeed(
      profile.financialMetrics.annualIncome,
      profile.financialMetrics.totalLiabilities,
      profile.personalInfo.dependentsCount
    );
    const activeLifeCover = insurance
      .filter((ins) => ins.status === 'active' && (ins.type === 'life' || ins.type === 'term'))
      .reduce((sum, ins) => sum + ins.sumAssured, 0);
    const insuranceGap = Math.max(0, termNeed - activeLifeCover);

    const report: FinancialReport = {
      id: `report_${Date.now()}`,
      userId: activeUserId,
      netWorth,
      cashFlow: {
        monthlySurplus: surplus,
        savingsRatePercent
      },
      goalProgressPercent,
      insuranceGap,
      createdAt: Date.now()
    };

    financialEventEmitter.emit(FinancialEntityEvents.REPORT_GENERATED, report);

    return report;
  }

  // ─── PRIVATE INTERNALS ───────────────────────────────────────

  private async syncProfileToMemory(profile: CustomerProfile) {
    try {
      await memoryManager.saveMemory(
        `financial_profile_${profile.userId}`,
        JSON.stringify(profile),
        'fact',
        'persistent',
        8,
        ['financial', 'profile', 'metrics']
      );
    } catch (_) { /* ignore memory sync failure gracefully */ }
  }
}

export const financialManager = new FinancialManager();
serviceRegistry.register('financialManager', financialManager);
export default financialManager;

import { aiManager } from '../../shared/ai';
import { CustomerProfile } from './interfaces';

export interface GlossaryTerm {
  term: string;
  definition: string;
}

export interface ConceptArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface LearningModule {
  id: string;
  title: string;
  description: string;
  concepts: string[]; // Concept IDs
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export class FinancialKnowledgeEngine {
  private glossary: GlossaryTerm[] = [
    { term: 'CAGR', definition: 'Compound Annual Growth Rate is the mean annual growth rate of an investment over a specified period of time longer than one year, represented as the rate if it grew at a steady rate.' },
    { term: 'IRR', definition: 'Internal Rate of Return is a metric used in financial analysis to estimate the profitability of potential investments. It is the discount rate that makes the net present value (NPV) of all cash flows equal to zero.' },
    { term: 'SIP', definition: 'Systematic Investment Plan is an investment route offered by mutual funds where one can invest a fixed amount in a chosen scheme periodically (e.g., monthly) instead of a lump sum.' },
    { term: 'Asset Allocation', definition: 'An investment strategy that aims to balance risk and reward by apportioning a portfolio\'s assets according to an individual\'s goals, risk tolerance, and investment horizon.' },
    { term: 'Inflation', definition: 'The rate at which the general level of prices for goods and services is rising, and, consequently, purchasing power is falling.' },
    { term: 'Compound Interest', definition: 'Interest calculated on the initial principal and also on the accumulated interest of previous periods of a deposit or loan.' },
    { term: 'NPV', definition: 'Net Present Value is the difference between the present value of cash inflows and the present value of cash outflows over a period of time.' },
    { term: 'Term Insurance', definition: 'A type of life insurance policy that provides coverage for a certain period of time or a specified "term" of years. If the insured dies during the term, the death benefit is paid to the beneficiary.' }
  ];

  private concepts: ConceptArticle[] = [
    {
      id: 'diversification',
      title: 'Power of Diversification',
      summary: 'Spread your investments across multiple asset classes to minimize volatility.',
      content: 'Diversification is the practice of spreading your investments around so that your exposure to any one type of asset is limited. This practice is designed to help reduce the volatility of your portfolio over time. By investing in stocks, bonds, gold, and cash, you ensure that if one asset class underperforms, another might overperform to balance the net results.',
      difficulty: 'beginner'
    },
    {
      id: 'compounding',
      title: 'Compounding: The Eighth Wonder of the World',
      summary: 'How earning interest on interest builds massive wealth over time.',
      content: 'Compound interest is the concept of earning interest on interest. Over short periods, the effect is small, but over 10, 20, or 30 years, it results in exponential growth. Starting to invest early is the single most important factor in harnessing compounding, because time is the exponent in the compound interest formula.',
      difficulty: 'beginner'
    },
    {
      id: 'debt_vs_equity',
      title: 'Debt vs Equity: Choosing the Right Mix',
      summary: 'Understand the difference between fixed income safety and equity growth.',
      content: 'Equity (stocks/mutual funds) represents ownership in businesses and offers high long-term growth potential at the cost of short-term volatility. Debt (bonds/FDs) represents loans to entities that pay fixed interest, offering high capital safety but lower returns. Finding the right mix depends heavily on your age, risk category, and time remaining until your goals.',
      difficulty: 'intermediate'
    }
  ];

  private faqs: FAQItem[] = [
    { question: 'How much emergency fund do I need?', answer: 'It is generally recommended to keep 3 to 6 months of your monthly expenses in a highly liquid account (savings account or liquid mutual funds) as an emergency reserve.' },
    { question: 'What is the 50-30-20 rule?', answer: 'It is a popular budgeting method: spend 50% of net income on Needs (rent, bills, groceries), 30% on Wants (entertainment, dining out), and allocate 20% to Savings, debt payments, and investments.' },
    { question: 'Should I pay off debt or invest?', answer: 'If your debt has a high interest rate (like credit cards at 15-20%), pay it off first, as it is a guaranteed return. If it is a low-interest loan (like a home loan at 7-8%), you can invest simultaneously if your expected investment yield is higher.' }
  ];

  private modules: LearningModule[] = [
    {
      id: 'basics',
      title: 'Personal Finance Basics',
      description: 'Master budgeting, emergency funds, and compound interest.',
      concepts: ['compounding', 'diversification'],
      difficulty: 'beginner'
    },
    {
      id: 'allocation',
      title: 'Portfolio & Risk Allocation',
      description: 'Learn how to structure asset allocations based on risk profiles.',
      concepts: ['debt_vs_equity'],
      difficulty: 'intermediate'
    }
  ];

  public getGlossary(): GlossaryTerm[] {
    return this.glossary;
  }

  public getConcepts(): ConceptArticle[] {
    return this.concepts;
  }

  public getConcept(id: string): ConceptArticle | null {
    return this.concepts.find((c) => c.id === id) || null;
  }

  public getFAQs(): FAQItem[] {
    return this.faqs;
  }

  public getLearningModules(): LearningModule[] {
    return this.modules;
  }

  /**
   * Generates a personalized explanation of a financial term using AIManager,
   * taking the user's financial profile into account.
   */
  public async getAIExplanation(term: string, profile?: CustomerProfile): Promise<string> {
    try {
      const termObj = this.glossary.find((g) => g.term.toLowerCase() === term.toLowerCase());
      const baseDefinition = termObj ? termObj.definition : 'a financial concept';

      let contextStr = '';
      if (profile) {
        contextStr = `The user is ${profile.personalInfo.age} years old, working as a ${profile.personalInfo.occupation}. ` +
          `They have a risk category of ${profile.riskCategory} and investment experience level of "${profile.investmentExperience}". ` +
          `Their monthly savings surplus is approximately $${Math.round(profile.financialMetrics.annualIncome / 12 - profile.financialMetrics.monthlyExpenses)}.`;
      }

      const prompt = `Explain the financial term "${term}" in simple terms.
Base definition: "${baseDefinition}"
${contextStr ? `Please personalize the explanation with simple analogies suitable for this profile: ${contextStr}` : ''}
Keep the explanation under 150 words, clean, and highly actionable. No markdown headings, just plain paragraphs.`;

      // Call the AI Core
      const explanation = await aiManager.generateResponse(prompt);
      return explanation.trim();
    } catch (_) {
      // Fallback if AI core fails or is offline
      const termObj = this.glossary.find((g) => g.term.toLowerCase() === term.toLowerCase());
      return termObj ? termObj.definition : `No explanation found for "${term}".`;
    }
  }
}

export const financialKnowledgeEngine = new FinancialKnowledgeEngine();
export default financialKnowledgeEngine;

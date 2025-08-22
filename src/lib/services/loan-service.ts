import { orderBy, Timestamp } from 'firebase/firestore';
import { BaseFirebaseService } from '../firebase-service';
import { Loan, LoanType, CurrencyAmount, CurrencyExposure } from '../../types/financial';
import { currencyService } from './currency-service';
import { userService } from './user-service';

export class LoanService extends BaseFirebaseService<Loan> {
  constructor() {
    super('loans');
  }

  // Get loans by type
  async getByType(userId: string, type: LoanType): Promise<Loan[]> {
    try {
      // Get all loans and filter in memory to avoid Firebase index issues
      const allLoans = await this.getAllOrdered(userId);
      return allLoans.filter(loan => loan.type === type);
    } catch (error) {
      console.error('Error getting loans by type:', error);
      return []; // Return empty array instead of throwing
    }
  }

  // Get active loans (with remaining balance)
  async getActiveLoans(userId: string): Promise<Loan[]> {
    try {
      // Get all loans and filter in memory to avoid complex Firebase queries
      const allLoans = await this.getAllOrdered(userId);
      return allLoans
        .filter(loan => loan.currentBalance.amount > 0)
        .sort((a, b) => {
          try {
            const dateA = a.nextPaymentDate instanceof Timestamp ? a.nextPaymentDate.toDate() : new Date(a.nextPaymentDate as any);
            const dateB = b.nextPaymentDate instanceof Timestamp ? b.nextPaymentDate.toDate() : new Date(b.nextPaymentDate as any);
            return dateA.getTime() - dateB.getTime();
          } catch (error) {
            console.error('Error comparing payment dates:', error);
            return 0;
          }
        });
    } catch (error) {
      console.error('Error getting active loans:', error);
      return []; // Return empty array instead of throwing
    }
  }

  // Get all loans ordered by start date
  async getAllOrdered(userId: string): Promise<Loan[]> {
    return this.getAll(userId, [orderBy('startDate', 'desc')]);
  }

  // Calculate total debt with multi-currency support
  async getTotalDebt(userId: string, primaryCurrency?: string): Promise<{ amount: number; currency: string }> {
    try {
      const activeLoans = await this.getActiveLoans(userId);
      if (!activeLoans || activeLoans.length === 0) return { amount: 0, currency: primaryCurrency || 'USD' };
      
      // Get user's primary currency if not provided
      if (!primaryCurrency) {
        const user = await userService.getById(userId);
        primaryCurrency = user?.preferences?.primaryCurrency || 'USD';
      }
      
      let totalDebt = 0;
      
      // Convert each loan balance to primary currency and sum
      for (const loan of activeLoans) {
        const loanCurrency = loan.currentBalance.currency;
        const loanAmount = loan.currentBalance.amount || 0;
        
        if (loanCurrency === primaryCurrency) {
          totalDebt += loanAmount;
        } else {
          try {
            const convertedAmount = await currencyService.convertAmount(loanAmount, loanCurrency, primaryCurrency);
            totalDebt += convertedAmount.amount;
          } catch (error) {
            console.error(`Error converting ${loanAmount} ${loanCurrency} to ${primaryCurrency}:`, error);
            // Fallback to original amount with warning
            totalDebt += loanAmount;
          }
        }
      }
      
      return { 
        amount: totalDebt, 
        currency: primaryCurrency 
      };
    } catch (error) {
      console.error('Error calculating total debt:', error);
      return { amount: 0, currency: primaryCurrency || 'USD' };
    }
  }

  // Calculate total monthly payments with multi-currency support
  async getTotalMonthlyPayments(userId: string, primaryCurrency?: string): Promise<{ amount: number; currency: string }> {
    try {
      const activeLoans = await this.getActiveLoans(userId);
      if (!activeLoans || activeLoans.length === 0) return { amount: 0, currency: primaryCurrency || 'USD' };
      
      // Get user's primary currency if not provided
      if (!primaryCurrency) {
        const user = await userService.getById(userId);
        primaryCurrency = user?.preferences?.primaryCurrency || 'USD';
      }
      
      let totalPayments = 0;
      
      // Convert each loan payment to primary currency and sum
      for (const loan of activeLoans) {
        const paymentCurrency = loan.monthlyPayment.currency;
        const paymentAmount = loan.monthlyPayment.amount || 0;
        
        if (paymentCurrency === primaryCurrency) {
          totalPayments += paymentAmount;
        } else {
          try {
            const convertedAmount = await currencyService.convertAmount(paymentAmount, paymentCurrency, primaryCurrency);
            totalPayments += convertedAmount.amount;
          } catch (error) {
            console.error(`Error converting ${paymentAmount} ${paymentCurrency} to ${primaryCurrency}:`, error);
            // Fallback to original amount with warning
            totalPayments += paymentAmount;
          }
        }
      }
      
      return { 
        amount: totalPayments, 
        currency: primaryCurrency 
      };
    } catch (error) {
      console.error('Error calculating total monthly payments:', error);
      return { amount: 0, currency: primaryCurrency || 'USD' };
    }
  }

  // Calculate debt-to-income ratio with multi-currency support
  async getDebtToIncomeRatio(userId: string, monthlyIncome: { amount: number; currency: string }): Promise<number> {
    if (monthlyIncome.amount <= 0) return 0;
    
    // Get total monthly payments in the same currency as income
    const totalMonthlyPayments = await this.getTotalMonthlyPayments(userId, monthlyIncome.currency);
    
    // Both amounts are now in the same currency, safe to calculate ratio
    return (totalMonthlyPayments.amount / monthlyIncome.amount) * 100;
  }

  // Generate amortization schedule for a loan
  generateAmortizationSchedule(loan: Loan): {
    paymentNumber: number;
    paymentDate: Date;
    principalPayment: number;
    interestPayment: number;
    remainingBalance: number;
  }[] {
    if (!loan || !loan.currentBalance || loan.currentBalance.amount <= 0 || !loan.monthlyPayment || loan.monthlyPayment.amount <= 0) {
      return [];
    }

    const schedule = [];
    const monthlyRate = (loan.interestRate || 0) / 100 / 12;
    let remainingBalance = loan.currentBalance.amount;
    
    let currentDate = loan.nextPaymentDate instanceof Timestamp ? loan.nextPaymentDate.toDate() : new Date(loan.nextPaymentDate as any);
    
    const maxPayments = Math.min(loan.termMonths || 360, 360 * 2); // Cap at 60 years to be safe
    
    for (let i = 1; remainingBalance > 0.01 && i <= maxPayments; i++) {
      const interestPayment = remainingBalance * monthlyRate;
      const principalPayment = Math.min(loan.monthlyPayment.amount - interestPayment, remainingBalance);
      
      if (principalPayment <= 0 && remainingBalance > 0) {
        console.warn('Loan payment is less than interest, amortization will not complete.');
        break;
      }
      
      remainingBalance -= principalPayment;
      
      schedule.push({
        paymentNumber: i,
        paymentDate: new Date(currentDate),
        principalPayment: Math.round(principalPayment * 100) / 100,
        interestPayment: Math.round(interestPayment * 100) / 100,
        remainingBalance: Math.max(0, Math.round(remainingBalance * 100) / 100)
      });
      
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    return schedule;
  }

  // Calculate payoff date for a loan
  calculatePayoffDate(loan: Loan): Date {
    try {
      if (!loan || !loan.currentBalance || loan.currentBalance.amount <= 0) {
        return new Date();
      }
      
      const schedule = this.generateAmortizationSchedule(loan);
      return schedule.length > 0 ? schedule[schedule.length - 1].paymentDate : new Date();
    } catch (error) {
      console.error('Error calculating payoff date:', error);
      return new Date();
    }
  }

  // Calculate total interest for remaining loan term
  calculateTotalInterest(loan: Loan): number {
    try {
      if (!loan || !loan.currentBalance || loan.currentBalance.amount <= 0) {
        return 0;
      }
      
      const schedule = this.generateAmortizationSchedule(loan);
      return schedule.reduce((total, payment) => total + (payment.interestPayment || 0), 0);
    } catch (error) {
      console.error('Error calculating total interest:', error);
      return 0;
    }
  }

  // Get debt payoff strategies
  async getDebtPayoffStrategies(userId: string): Promise<{
    snowball: { order: Loan[]; totalInterest: number; payoffTime: number };
    avalanche: { order: Loan[]; totalInterest: number; payoffTime: number };
  }> {
    try {
      const activeLoans = await this.getActiveLoans(userId);
      
      if (!activeLoans || activeLoans.length === 0) {
        return {
          snowball: { order: [], totalInterest: 0, payoffTime: 0 },
          avalanche: { order: [], totalInterest: 0, payoffTime: 0 }
        };
      }
      
      const snowballOrder = [...activeLoans].sort((a, b) => 
        (a.currentBalance?.amount || 0) - (b.currentBalance?.amount || 0)
      );
      
      const avalancheOrder = [...activeLoans].sort((a, b) => 
        (b.interestRate || 0) - (a.interestRate || 0)
      );
      
      const snowballTotalInterest = snowballOrder.reduce((total, loan) => 
        total + this.calculateTotalInterest(loan), 0
      );
      
      const avalancheTotalInterest = avalancheOrder.reduce((total, loan) => 
        total + this.calculateTotalInterest(loan), 0
      );
      
      const totalMonthlyPayments = await this.getTotalMonthlyPayments(userId);
      const totalDebt = await this.getTotalDebt(userId);
      
      const payoffTime = totalDebt.amount > 0 && totalMonthlyPayments.amount > 0 
        ? Math.ceil(totalDebt.amount / totalMonthlyPayments.amount) 
        : 0;
      
      return {
        snowball: {
          order: snowballOrder,
          totalInterest: snowballTotalInterest,
          payoffTime
        },
        avalanche: {
          order: avalancheOrder,
          totalInterest: avalancheTotalInterest,
          payoffTime
        }
      };
    } catch (error) {
      console.error('Error getting debt payoff strategies:', error);
      return {
        snowball: { order: [], totalInterest: 0, payoffTime: 0 },
        avalanche: { order: [], totalInterest: 0, payoffTime: 0 }
      };
    }
  }

  // Make a payment on a loan
  async makePayment(userId: string, loanId: string, paymentAmount: number): Promise<void> {
    const loan = await this.getById(userId, loanId);
    if (!loan) throw new Error('Loan not found');
    
    const newBalanceAmount = Math.max(0, loan.currentBalance.amount - paymentAmount);
    
    let nextPaymentDate = loan.nextPaymentDate instanceof Timestamp ? loan.nextPaymentDate.toDate() : new Date(loan.nextPaymentDate as any);
    nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
    
    const newBalance: CurrencyAmount = {
      ...loan.currentBalance,
      amount: newBalanceAmount,
    };

    await this.update(userId, loanId, {
      currentBalance: newBalance,
      nextPaymentDate: Timestamp.fromDate(nextPaymentDate)
    });
  }

  // Get loans requiring payment soon (within next 7 days)
  async getUpcomingPayments(userId: string): Promise<Loan[]> {
    try {
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
      
      const activeLoans = await this.getActiveLoans(userId);
      if (!activeLoans || activeLoans.length === 0) return [];
      
      return activeLoans.filter(loan => {
        try {
          const paymentDate = loan.nextPaymentDate instanceof Timestamp ? loan.nextPaymentDate.toDate() : new Date(loan.nextPaymentDate as any);
          return paymentDate <= sevenDaysFromNow;
        } catch (error) {
          console.error('Error comparing payment date:', error);
          return false;
        }
      });
    } catch (error) {
      console.error('Error getting upcoming payments:', error);
      return [];
    }
  }

  // Get currency exposure analysis for loans
  async getCurrencyExposure(userId: string, primaryCurrency?: string): Promise<CurrencyExposure[]> {
    try {
      const activeLoans = await this.getActiveLoans(userId);
      if (!activeLoans || activeLoans.length === 0) return [];

      // Get user's primary currency if not provided
      if (!primaryCurrency) {
        const user = await userService.getById(userId);
        primaryCurrency = user?.preferences?.primaryCurrency || 'USD';
      }

      // Group loans by currency
      const currencyGroups: { [currency: string]: Loan[] } = {};
      activeLoans.forEach(loan => {
        const currency = loan.currentBalance.currency;
        if (!currencyGroups[currency]) {
          currencyGroups[currency] = [];
        }
        currencyGroups[currency].push(loan);
      });

      // Calculate total debt in primary currency for percentage calculations
      const totalDebt = await this.getTotalDebt(userId, primaryCurrency);

      // Create exposure analysis for each currency
      const exposures: CurrencyExposure[] = [];
      
      for (const [currency, loans] of Object.entries(currencyGroups)) {
        const currencyDebt = loans.reduce((sum, loan) => sum + loan.currentBalance.amount, 0);
        
        // Convert to primary currency for comparison
        let convertedAmount = currencyDebt;
        if (currency !== primaryCurrency) {
          try {
            const converted = await currencyService.convertAmount(currencyDebt, currency, primaryCurrency);
            convertedAmount = converted.amount;
          } catch (error) {
            console.error(`Error converting ${currencyDebt} ${currency} to ${primaryCurrency}:`, error);
          }
        }

        const percentage = totalDebt.amount > 0 ? (convertedAmount / totalDebt.amount) * 100 : 0;
        
        // Determine risk level based on currency and exposure
        let riskLevel: 'low' | 'medium' | 'high' = 'low';
        if (currency !== primaryCurrency) {
          if (percentage > 50) riskLevel = 'high';
          else if (percentage > 20) riskLevel = 'medium';
        }

        exposures.push({
          currency,
          totalValue: {
            amount: currencyDebt,
            currency,
            convertedAmount,
            lastUpdated: new Date()
          },
          percentage,
          riskLevel
        });
      }

      return exposures.sort((a, b) => b.percentage - a.percentage);
    } catch (error) {
      console.error('Error calculating currency exposure:', error);
      return [];
    }
  }

  // Get multi-currency loan projections with exchange rate impact
  async getMultiCurrencyProjections(userId: string, primaryCurrency?: string): Promise<{
    month: number;
    year: number;
    totalDebt: CurrencyAmount;
    totalPayments: CurrencyAmount;
    currencyBreakdown: { [currency: string]: { debt: number; payments: number } };
    exchangeRateImpact: number; // Percentage change due to exchange rates
  }[]> {
    try {
      const activeLoans = await this.getActiveLoans(userId);
      if (!activeLoans || activeLoans.length === 0) return [];

      // Get user's primary currency if not provided
      if (!primaryCurrency) {
        const user = await userService.getById(userId);
        primaryCurrency = user?.preferences?.primaryCurrency || 'USD';
      }

      const projections = [];
      const currentDate = new Date();

      // Project 12 months ahead
      for (let i = 0; i < 12; i++) {
        const projectionDate = new Date(currentDate);
        projectionDate.setMonth(projectionDate.getMonth() + i);

        let totalDebt = 0;
        let totalPayments = 0;
        const currencyBreakdown: { [currency: string]: { debt: number; payments: number } } = {};

        // Calculate remaining debt and payments for each loan at this point in time
        for (const loan of activeLoans) {
          const schedule = this.generateAmortizationSchedule(loan);
          const paymentsToDate = Math.min(i, schedule.length);
          
          let remainingBalance = loan.currentBalance.amount;
          let monthlyPayment = loan.monthlyPayment.amount;

          // Apply payments made up to this projection date
          for (let j = 0; j < paymentsToDate; j++) {
            if (schedule[j]) {
              remainingBalance = schedule[j].remainingBalance;
            }
          }

          const currency = loan.currentBalance.currency;
          
          // Initialize currency breakdown if not exists
          if (!currencyBreakdown[currency]) {
            currencyBreakdown[currency] = { debt: 0, payments: 0 };
          }

          currencyBreakdown[currency].debt += remainingBalance;
          currencyBreakdown[currency].payments += monthlyPayment;

          // Convert to primary currency
          if (currency === primaryCurrency) {
            totalDebt += remainingBalance;
            totalPayments += monthlyPayment;
          } else {
            try {
              const convertedDebt = await currencyService.convertAmount(remainingBalance, currency, primaryCurrency);
              const convertedPayment = await currencyService.convertAmount(monthlyPayment, currency, primaryCurrency);
              totalDebt += convertedDebt.amount;
              totalPayments += convertedPayment.amount;
            } catch (error) {
              console.error(`Error converting loan amounts for projection:`, error);
              totalDebt += remainingBalance;
              totalPayments += monthlyPayment;
            }
          }
        }

        // Calculate exchange rate impact (simplified - comparing to no conversion scenario)
        const noConversionTotal = Object.values(currencyBreakdown).reduce((sum, curr) => sum + curr.debt, 0);
        const exchangeRateImpact = noConversionTotal > 0 ? ((totalDebt - noConversionTotal) / noConversionTotal) * 100 : 0;

        projections.push({
          month: projectionDate.getMonth() + 1,
          year: projectionDate.getFullYear(),
          totalDebt: {
            amount: totalDebt,
            currency: primaryCurrency
          },
          totalPayments: {
            amount: totalPayments,
            currency: primaryCurrency
          },
          currencyBreakdown,
          exchangeRateImpact
        });
      }

      return projections;
    } catch (error) {
      console.error('Error generating multi-currency projections:', error);
      return [];
    }
  }

  // Get currency-specific loan comparison and optimization recommendations
  async getLoanOptimizationRecommendations(userId: string, primaryCurrency?: string): Promise<{
    currencyRiskAnalysis: {
      highRiskLoans: Loan[];
      recommendations: string[];
    };
    refinancingOpportunities: {
      loan: Loan;
      potentialSavings: CurrencyAmount;
      recommendation: string;
    }[];
    payoffOptimization: {
      strategy: 'avalanche' | 'snowball' | 'currency_focused';
      description: string;
      estimatedSavings: CurrencyAmount;
      timeToPayoff: number; // months
    };
  }> {
    try {
      const activeLoans = await this.getActiveLoans(userId);
      if (!activeLoans || activeLoans.length === 0) {
        return {
          currencyRiskAnalysis: { highRiskLoans: [], recommendations: [] },
          refinancingOpportunities: [],
          payoffOptimization: {
            strategy: 'avalanche',
            description: 'No active loans to optimize',
            estimatedSavings: { amount: 0, currency: primaryCurrency || 'USD' },
            timeToPayoff: 0
          }
        };
      }

      // Get user's primary currency if not provided
      if (!primaryCurrency) {
        const user = await userService.getById(userId);
        primaryCurrency = user?.preferences?.primaryCurrency || 'USD';
      }

      // Currency risk analysis
      const currencyExposure = await this.getCurrencyExposure(userId, primaryCurrency);
      const highRiskLoans = activeLoans.filter(loan => {
        const exposure = currencyExposure.find(exp => exp.currency === loan.currentBalance.currency);
        return exposure && exposure.riskLevel === 'high';
      });

      const currencyRecommendations: string[] = [];
      if (highRiskLoans.length > 0) {
        currencyRecommendations.push(`Consider hedging or refinancing ${highRiskLoans.length} high-risk foreign currency loans`);
        currencyRecommendations.push('Monitor exchange rates closely for foreign currency loans');
        currencyRecommendations.push('Consider making extra payments on foreign currency loans when exchange rates are favorable');
      }

      // Refinancing opportunities (simplified analysis)
      const refinancingOpportunities = activeLoans
        .filter(loan => loan.interestRate > 7) // High interest rate threshold
        .map(loan => ({
          loan,
          potentialSavings: {
            amount: this.calculateTotalInterest(loan) * 0.3, // Assume 30% savings potential
            currency: loan.currentBalance.currency
          },
          recommendation: `Consider refinancing this ${loan.interestRate}% loan to potentially save on interest`
        }));

      // Payoff optimization strategy
      const strategies = await this.getDebtPayoffStrategies(userId);
      const avalancheSavings = strategies.avalanche.totalInterest;
      const snowballSavings = strategies.snowball.totalInterest;

      let optimalStrategy: 'avalanche' | 'snowball' | 'currency_focused' = 'avalanche';
      let description = 'Pay off highest interest rate loans first to minimize total interest';
      let estimatedSavings = { amount: Math.abs(avalancheSavings - snowballSavings), currency: primaryCurrency };

      // If there are foreign currency loans, consider currency-focused strategy
      const foreignCurrencyLoans = activeLoans.filter(loan => loan.currentBalance.currency !== primaryCurrency);
      if (foreignCurrencyLoans.length > 0 && foreignCurrencyLoans.length < activeLoans.length) {
        optimalStrategy = 'currency_focused';
        description = 'Focus on paying off foreign currency loans first to reduce exchange rate risk';
        estimatedSavings = { amount: avalancheSavings * 0.1, currency: primaryCurrency }; // Assume 10% additional savings from reduced FX risk
      }

      return {
        currencyRiskAnalysis: {
          highRiskLoans,
          recommendations: currencyRecommendations
        },
        refinancingOpportunities,
        payoffOptimization: {
          strategy: optimalStrategy,
          description,
          estimatedSavings,
          timeToPayoff: strategies.avalanche.payoffTime
        }
      };
    } catch (error) {
      console.error('Error generating loan optimization recommendations:', error);
      return {
        currencyRiskAnalysis: { highRiskLoans: [], recommendations: [] },
        refinancingOpportunities: [],
        payoffOptimization: {
          strategy: 'avalanche',
          description: 'Error calculating optimization strategy',
          estimatedSavings: { amount: 0, currency: primaryCurrency || 'USD' },
          timeToPayoff: 0
        }
      };
    }
  }

  // Detect currency based on lender location/name
  detectCurrencyFromLender(lenderName: string, loanType: LoanType): string {
    const lenderName_lower = lenderName.toLowerCase();
    
    // Common international lenders and their currencies
    const lenderCurrencyMap: { [key: string]: string } = {
      // US lenders
      'chase': 'USD',
      'bank of america': 'USD',
      'wells fargo': 'USD',
      'citibank': 'USD',
      'capital one': 'USD',
      'discover': 'USD',
      'american express': 'USD',
      
      // UK lenders
      'barclays': 'GBP',
      'lloyds': 'GBP',
      'hsbc uk': 'GBP',
      'natwest': 'GBP',
      'santander uk': 'GBP',
      
      // European lenders
      'deutsche bank': 'EUR',
      'bnp paribas': 'EUR',
      'ing': 'EUR',
      'unicredit': 'EUR',
      'santander': 'EUR',
      
      // Canadian lenders
      'rbc': 'CAD',
      'td bank': 'CAD',
      'scotiabank': 'CAD',
      'bmo': 'CAD',
      
      // Australian lenders
      'commonwealth bank': 'AUD',
      'westpac': 'AUD',
      'anz': 'AUD',
      'nab': 'AUD',
      
      // Japanese lenders
      'mitsubishi': 'JPY',
      'sumitomo': 'JPY',
      'mizuho': 'JPY',
      
      // Swiss lenders
      'ubs': 'CHF',
      'credit suisse': 'CHF',
    };

    // Check for exact matches first
    for (const [lender, currency] of Object.entries(lenderCurrencyMap)) {
      if (lenderName_lower.includes(lender)) {
        return currency;
      }
    }

    // Country-specific patterns
    if (lenderName_lower.includes('uk') || lenderName_lower.includes('britain')) return 'GBP';
    if (lenderName_lower.includes('canada') || lenderName_lower.includes('canadian')) return 'CAD';
    if (lenderName_lower.includes('australia') || lenderName_lower.includes('australian')) return 'AUD';
    if (lenderName_lower.includes('japan') || lenderName_lower.includes('japanese')) return 'JPY';
    if (lenderName_lower.includes('swiss') || lenderName_lower.includes('switzerland')) return 'CHF';
    if (lenderName_lower.includes('euro') || lenderName_lower.includes('european')) return 'EUR';

    // Default to USD for unknown lenders
    return 'USD';
  }
}

export const loanService = new LoanService();

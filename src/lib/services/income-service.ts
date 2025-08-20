import { BaseFirebaseService } from '../firebase-service';
import { Income, IncomeDocument, CurrencyAmount, CurrencyExposure } from '@/types/financial';
import { orderBy } from 'firebase/firestore';
import { currencyService } from './currency-service';
import { userService } from './user-service';

export class IncomeService extends BaseFirebaseService<IncomeDocument> {
  constructor() {
    super('incomes');
  }

  // Get all active income sources for a user
  async getActiveIncomes(userId: string): Promise<IncomeDocument[]> {
    return this.getFiltered(
      userId,
      [{ field: 'isActive', operator: '==', value: true }],
      'createdAt',
      'desc'
    );
  }

  // Get income sources by type
  async getIncomesByType(userId: string, type: string): Promise<IncomeDocument[]> {
    return this.getFiltered(
      userId,
      [{ field: 'type', operator: '==', value: type }],
      'createdAt',
      'desc'
    );
  }

  // Calculate total monthly income for a user with multi-currency support
  async calculateMonthlyIncome(userId: string): Promise<CurrencyAmount> {
    const incomes = await this.getActiveIncomes(userId);

    if (incomes.length === 0) {
      const user = await userService.getById(userId);
      const primaryCurrency = user?.preferences?.primaryCurrency || 'USD';
      return { amount: 0, currency: primaryCurrency };
    }

    // Get user's primary currency
    const user = await userService.getById(userId);
    const primaryCurrency = user?.preferences?.primaryCurrency || 'USD';

    let totalAmount = 0;

    // Convert each income to primary currency and sum
    for (const income of incomes) {
      const monthlyAmount = this.convertToMonthly(income.amount.amount, income.frequency);

      if (income.amount.currency === primaryCurrency) {
        totalAmount += monthlyAmount;
      } else {
        try {
          const converted = await currencyService.convertAmount(
            monthlyAmount,
            income.amount.currency,
            primaryCurrency
          );
          totalAmount += converted.amount;
        } catch (error) {
          console.error(`Failed to convert ${income.amount.currency} to ${primaryCurrency}:`, error);
          // Fallback: add original amount (not ideal but prevents total failure)
          totalAmount += monthlyAmount;
        }
      }
    }

    return {
      amount: totalAmount,
      currency: primaryCurrency
    };
  }

  // Alias for calculateMonthlyIncome for consistency with other services
  async getMonthlyIncome(userId: string): Promise<CurrencyAmount> {
    return this.calculateMonthlyIncome(userId);
  }

  // Calculate annual income projection
  async calculateAnnualIncome(userId: string): Promise<CurrencyAmount> {
    const monthlyIncome = await this.calculateMonthlyIncome(userId);
    return {
      amount: monthlyIncome.amount * 12,
      currency: monthlyIncome.currency
    };
  }

  // Get income projections for the next 12 months with multi-currency support
  async getIncomeProjections(userId: string): Promise<{ month: string; amount: number; currency: string }[]> {
    const incomes = await this.getActiveIncomes(userId);
    const user = await userService.getById(userId);
    const primaryCurrency = user?.preferences?.primaryCurrency || 'USD';

    const projections: { month: string; amount: number; currency: string }[] = [];

    const currentDate = new Date();
    for (let i = 0; i < 12; i++) {
      const projectionDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
      const monthName = projectionDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

      let monthlyTotal = 0;

      // Convert each active income to primary currency for this month
      for (const income of incomes) {
        if (this.isIncomeActiveForMonth(income, projectionDate)) {
          const monthlyAmount = this.convertToMonthly(income.amount.amount, income.frequency);

          if (income.amount.currency === primaryCurrency) {
            monthlyTotal += monthlyAmount;
          } else {
            try {
              const converted = await currencyService.convertAmount(
                monthlyAmount,
                income.amount.currency,
                primaryCurrency
              );
              monthlyTotal += converted.amount;
            } catch (error) {
              console.error(`Failed to convert ${income.amount.currency} to ${primaryCurrency}:`, error);
              monthlyTotal += monthlyAmount; // Fallback
            }
          }
        }
      }

      projections.push({
        month: monthName,
        amount: monthlyTotal,
        currency: primaryCurrency
      });
    }

    return projections;
  }

  // Helper method to check if income is active for a specific month
  private isIncomeActiveForMonth(income: IncomeDocument, date: Date): boolean {
    const startDate = income.startDate instanceof Date ? income.startDate : income.startDate.toDate();
    const endDate = income.endDate ?
      (income.endDate instanceof Date ? income.endDate : income.endDate.toDate()) :
      null;

    return startDate <= date && (!endDate || endDate >= date) && income.isActive;
  }

  // Helper method to convert any frequency to monthly amount
  private convertToMonthly(amount: number, frequency: string): number {
    switch (frequency) {
      case 'weekly':
        return amount * 4.33; // Average weeks per month
      case 'bi-weekly':
        return amount * 2.17; // Average bi-weeks per month
      case 'monthly':
        return amount;
      case 'quarterly':
        return amount / 3;
      case 'annually':
        return amount / 12;
      default:
        return amount;
    }
  }

  // Get income breakdown by type with multi-currency support
  async getIncomeBreakdown(userId: string): Promise<{ type: string; amount: number; percentage: number; currency: string }[]> {
    const incomes = await this.getActiveIncomes(userId);
    const totalMonthly = await this.calculateMonthlyIncome(userId);
    const user = await userService.getById(userId);
    const primaryCurrency = user?.preferences?.primaryCurrency || 'USD';

    const breakdown = new Map<string, number>();

    // Convert each income to primary currency and group by type
    for (const income of incomes) {
      const monthlyAmount = this.convertToMonthly(income.amount.amount, income.frequency);
      let convertedAmount = monthlyAmount;

      if (income.amount.currency !== primaryCurrency) {
        try {
          const converted = await currencyService.convertAmount(
            monthlyAmount,
            income.amount.currency,
            primaryCurrency
          );
          convertedAmount = converted.amount;
        } catch (error) {
          console.error(`Failed to convert ${income.amount.currency} to ${primaryCurrency}:`, error);
          // Use original amount as fallback
        }
      }

      const currentAmount = breakdown.get(income.type) || 0;
      breakdown.set(income.type, currentAmount + convertedAmount);
    }

    return Array.from(breakdown.entries()).map(([type, amount]) => ({
      type,
      amount,
      percentage: totalMonthly.amount > 0 ? (amount / totalMonthly.amount) * 100 : 0,
      currency: primaryCurrency
    }));
  }

  // Get income breakdown by currency
  async getIncomeByCurrency(userId: string): Promise<CurrencyExposure[]> {
    const incomes = await this.getActiveIncomes(userId);
    const totalMonthly = await this.calculateMonthlyIncome(userId);
    const user = await userService.getById(userId);
    const primaryCurrency = user?.preferences?.primaryCurrency || 'USD';

    const currencyBreakdown = new Map<string, number>();

    // Group incomes by currency
    incomes.forEach(income => {
      const monthlyAmount = this.convertToMonthly(income.amount.amount, income.frequency);
      const currentAmount = currencyBreakdown.get(income.amount.currency) || 0;
      currencyBreakdown.set(income.amount.currency, currentAmount + monthlyAmount);
    });

    // Convert to CurrencyExposure format
    const exposures: CurrencyExposure[] = [];

    for (const [currency, amount] of currencyBreakdown.entries()) {
      let convertedAmount = amount;
      let exchangeRate = 1;

      if (currency !== primaryCurrency) {
        try {
          const converted = await currencyService.convertAmount(amount, currency, primaryCurrency);
          convertedAmount = converted.amount;
          exchangeRate = converted.exchangeRate || 1;
        } catch (error) {
          console.error(`Failed to convert ${currency} to ${primaryCurrency}:`, error);
        }
      }

      const percentage = totalMonthly.amount > 0 ? (convertedAmount / totalMonthly.amount) * 100 : 0;

      // Determine risk level based on currency volatility and exposure
      let riskLevel: 'low' | 'medium' | 'high' = 'low';
      if (currency !== primaryCurrency) {
        if (percentage > 50) riskLevel = 'high';
        else if (percentage > 20) riskLevel = 'medium';
      }

      exposures.push({
        currency,
        totalValue: {
          amount: convertedAmount,
          currency: primaryCurrency,
          convertedAmount: amount,
          exchangeRate,
          lastUpdated: new Date()
        },
        percentage,
        riskLevel
      });
    }

    return exposures.sort((a, b) => b.percentage - a.percentage);
  }

  // Get exchange rate impact analysis for foreign income sources
  async getExchangeRateImpact(userId: string): Promise<{
    totalForeignIncome: CurrencyAmount;
    currencyRisks: Array<{
      currency: string;
      monthlyAmount: CurrencyAmount;
      volatility30d?: number;
      potentialImpact: {
        best: number;
        worst: number;
      };
    }>;
    recommendations: string[];
  }> {
    const incomes = await this.getActiveIncomes(userId);
    const user = await userService.getById(userId);
    const primaryCurrency = user?.preferences?.primaryCurrency || 'USD';

    // Filter foreign currency incomes
    const foreignIncomes = incomes.filter(income => income.amount.currency !== primaryCurrency);

    let totalForeignAmount = 0;
    const currencyRisks = [];
    const recommendations: string[] = [];

    for (const income of foreignIncomes) {
      const monthlyAmount = this.convertToMonthly(income.amount.amount, income.frequency);

      try {
        const converted = await currencyService.convertAmount(
          monthlyAmount,
          income.amount.currency,
          primaryCurrency
        );
        totalForeignAmount += converted.amount;

        // Calculate potential impact (simplified volatility analysis)
        const volatility = 0.1; // 10% assumed volatility for demo
        const potentialImpact = {
          best: converted.amount * (1 + volatility),
          worst: converted.amount * (1 - volatility)
        };

        currencyRisks.push({
          currency: income.amount.currency,
          monthlyAmount: {
            amount: monthlyAmount,
            currency: income.amount.currency,
            convertedAmount: converted.amount,
            exchangeRate: converted.exchangeRate,
            lastUpdated: new Date()
          },
          volatility30d: volatility * 100,
          potentialImpact
        });

        // Generate recommendations
        if (converted.amount > totalForeignAmount * 0.3) {
          recommendations.push(
            `Consider hedging your ${income.amount.currency} income exposure as it represents a significant portion of your total income.`
          );
        }

      } catch (error) {
        console.error(`Failed to analyze ${income.amount.currency} income:`, error);
      }
    }

    if (foreignIncomes.length > 0) {
      recommendations.push(
        'Monitor exchange rates regularly to understand the impact on your income.',
        'Consider setting up currency alerts for significant rate changes.',
        'Diversify your income sources across different currencies if possible.'
      );
    }

    return {
      totalForeignIncome: {
        amount: totalForeignAmount,
        currency: primaryCurrency
      },
      currencyRisks,
      recommendations
    };
  }

  // Get currency-specific income projections
  async getCurrencySpecificProjections(userId: string, targetCurrency: string): Promise<{
    projections: { month: string; amount: number; currency: string }[];
    exchangeRateAssumptions: { currency: string; rate: number }[];
  }> {
    const incomes = await this.getActiveIncomes(userId);
    const projections: { month: string; amount: number; currency: string }[] = [];
    const exchangeRateAssumptions: { currency: string; rate: number }[] = [];

    // Get current exchange rates for assumptions
    const uniqueCurrencies = [...new Set(incomes.map(income => income.amount.currency))];
    for (const currency of uniqueCurrencies) {
      if (currency !== targetCurrency) {
        try {
          const rate = await currencyService.getExchangeRate(currency, targetCurrency);
          exchangeRateAssumptions.push({ currency, rate: rate.rate });
        } catch (error) {
          console.error(`Failed to get exchange rate for ${currency}:`, error);
        }
      }
    }

    const currentDate = new Date();
    for (let i = 0; i < 12; i++) {
      const projectionDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
      const monthName = projectionDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

      let monthlyTotal = 0;

      for (const income of incomes) {
        if (this.isIncomeActiveForMonth(income, projectionDate)) {
          const monthlyAmount = this.convertToMonthly(income.amount.amount, income.frequency);

          if (income.amount.currency === targetCurrency) {
            monthlyTotal += monthlyAmount;
          } else {
            try {
              const converted = await currencyService.convertAmount(
                monthlyAmount,
                income.amount.currency,
                targetCurrency
              );
              monthlyTotal += converted.amount;
            } catch (error) {
              console.error(`Failed to convert ${income.amount.currency} to ${targetCurrency}:`, error);
              monthlyTotal += monthlyAmount; // Fallback
            }
          }
        }
      }

      projections.push({
        month: monthName,
        amount: monthlyTotal,
        currency: targetCurrency
      });
    }

    return { projections, exchangeRateAssumptions };
  }

  // Get tax implications for international income
  async getTaxImplications(userId: string): Promise<{
    domesticIncome: CurrencyAmount;
    foreignIncome: CurrencyAmount;
    taxConsiderations: Array<{
      currency: string;
      monthlyAmount: CurrencyAmount;
      considerations: string[];
    }>;
    generalRecommendations: string[];
  }> {
    const incomes = await this.getActiveIncomes(userId);
    const user = await userService.getById(userId);
    const primaryCurrency = user?.preferences?.primaryCurrency || 'USD';

    let domesticAmount = 0;
    let foreignAmount = 0;
    const taxConsiderations = [];

    for (const income of incomes) {
      const monthlyAmount = this.convertToMonthly(income.amount.amount, income.frequency);

      if (income.amount.currency === primaryCurrency) {
        domesticAmount += monthlyAmount;
      } else {
        try {
          const converted = await currencyService.convertAmount(
            monthlyAmount,
            income.amount.currency,
            primaryCurrency
          );
          foreignAmount += converted.amount;

          const considerations = [
            'Foreign income may be subject to withholding tax in the source country',
            'You may be eligible for foreign tax credits to avoid double taxation',
            'Exchange rate fluctuations affect the taxable amount in your home currency',
            'Consider the timing of currency conversion for tax optimization'
          ];

          taxConsiderations.push({
            currency: income.amount.currency,
            monthlyAmount: {
              amount: monthlyAmount,
              currency: income.amount.currency,
              convertedAmount: converted.amount,
              exchangeRate: converted.exchangeRate,
              lastUpdated: new Date()
            },
            considerations
          });
        } catch (error) {
          console.error(`Failed to analyze tax implications for ${income.amount.currency}:`, error);
        }
      }
    }

    const generalRecommendations = [
      'Consult with a tax professional familiar with international taxation',
      'Keep detailed records of exchange rates used for tax reporting',
      'Consider the impact of currency hedging on tax treatment',
      'Review tax treaties between countries to optimize your tax position'
    ];

    if (foreignAmount > domesticAmount * 0.1) {
      generalRecommendations.unshift(
        'Foreign income represents a significant portion of your total income - professional tax advice is strongly recommended'
      );
    }

    return {
      domesticIncome: { amount: domesticAmount, currency: primaryCurrency },
      foreignIncome: { amount: foreignAmount, currency: primaryCurrency },
      taxConsiderations,
      generalRecommendations
    };
  }
}

// Export singleton instance
export const incomeService = new IncomeService();
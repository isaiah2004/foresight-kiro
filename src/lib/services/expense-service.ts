import { orderBy } from 'firebase/firestore';
import { BaseFirebaseService } from '../firebase-service';
import { Expense, ExpenseCategory, ExpenseFrequency, CurrencyAmount, CurrencyExposure } from '../../types/financial';
import { currencyService } from './currency-service';

export class ExpenseService extends BaseFirebaseService<Expense> {
  constructor() {
    super('expenses');
  }

  // Get expenses by category
  async getByCategory(userId: string, category: ExpenseCategory): Promise<Expense[]> {
    return this.getFiltered(userId, [
      { field: 'category', operator: '==', value: category }
    ], 'startDate', 'desc');
  }

  // Get fixed expenses
  async getFixedExpenses(userId: string): Promise<Expense[]> {
    return this.getFiltered(userId, [
      { field: 'isFixed', operator: '==', value: true }
    ], 'startDate', 'desc');
  }

  // Get variable expenses
  async getVariableExpenses(userId: string): Promise<Expense[]> {
    return this.getFiltered(userId, [
      { field: 'isFixed', operator: '==', value: false }
    ], 'startDate', 'desc');
  }

  // Get all expenses ordered by start date
  async getAllOrdered(userId: string): Promise<Expense[]> {
    return this.getAll(userId, [orderBy('startDate', 'desc')]);
  }

  // Calculate monthly expense total with currency conversion
  async getMonthlyExpenseTotal(userId: string, primaryCurrency: string = 'USD'): Promise<CurrencyAmount> {
    const expenses = await this.getAllOrdered(userId);
    
    if (expenses.length === 0) {
      return { amount: 0, currency: primaryCurrency };
    }
    
    let total = 0;
    
    for (const expense of expenses) {
      const monthlyAmount = this.convertToMonthlyAmount(expense.amount.amount, expense.frequency);
      
      // Convert to primary currency if different
      if (expense.amount.currency !== primaryCurrency) {
        try {
          const convertedAmount = await currencyService.convertAmount(
            monthlyAmount,
            expense.amount.currency,
            primaryCurrency
          );
          total += convertedAmount.amount;
        } catch (error) {
          console.warn(`Failed to convert ${expense.amount.currency} to ${primaryCurrency}, using original amount:`, error);
          total += monthlyAmount; // Fallback to original amount
        }
      } else {
        total += monthlyAmount;
      }
    }
    
    return { 
      amount: total, 
      currency: primaryCurrency
    };
  }

  // Calculate annual expense total
  async getAnnualExpenseTotal(userId: string, primaryCurrency: string = 'USD'): Promise<CurrencyAmount> {
    const monthlyTotal = await this.getMonthlyExpenseTotal(userId, primaryCurrency);
    return { 
      amount: monthlyTotal.amount * 12,
      currency: monthlyTotal.currency
    };
  }

  // Get expense breakdown by category with currency conversion
  async getExpenseBreakdown(userId: string, primaryCurrency: string = 'USD'): Promise<Record<ExpenseCategory, CurrencyAmount>> {
    const expenses = await this.getAllOrdered(userId);
    
    const breakdown: Record<ExpenseCategory, CurrencyAmount> = {
      rent: { amount: 0, currency: primaryCurrency },
      groceries: { amount: 0, currency: primaryCurrency },
      utilities: { amount: 0, currency: primaryCurrency },
      entertainment: { amount: 0, currency: primaryCurrency },
      other: { amount: 0, currency: primaryCurrency }
    };

    for (const expense of expenses) {
      const monthlyAmount = this.convertToMonthlyAmount(expense.amount.amount, expense.frequency);
      
      // Convert to primary currency if different
      let convertedAmount = monthlyAmount;
      if (expense.amount.currency !== primaryCurrency) {
        try {
          const converted = await currencyService.convertAmount(
            monthlyAmount,
            expense.amount.currency,
            primaryCurrency
          );
          convertedAmount = converted.amount;
        } catch (error) {
          console.warn(`Failed to convert ${expense.amount.currency} to ${primaryCurrency}:`, error);
        }
      }
      
      breakdown[expense.category].amount += convertedAmount;
    }

    return breakdown;
  }

  // Helper method to convert any frequency to monthly amount
  private convertToMonthlyAmount(amount: number, frequency: ExpenseFrequency): number {
    switch (frequency) {
      case 'daily':
        return amount * 30.44; // Average days per month
      case 'weekly':
        return amount * 52 / 12; // 52 weeks per year / 12 months
      case 'monthly':
        return amount;
      case 'quarterly':
        return amount / 3; // 1 quarter = 3 months
      case 'annually':
        return amount / 12; // 1 year = 12 months
      default:
        return 0;
    }
  }

  // Get expense projections for next 12 months
  async getExpenseProjections(userId: string): Promise<{ month: number; year: number; amount: number }[]> {
    const expenses = await this.getAllOrdered(userId);
    const projections: { month: number; year: number; amount: number }[] = [];
    
    const currentDate = new Date();
    
    for (let i = 0; i < 12; i++) {
      const projectionDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
      const month = projectionDate.getMonth() + 1;
      const year = projectionDate.getFullYear();
      
      let monthlyTotal = 0;
      
      expenses.forEach(expense => {
        // Check if expense is active during this projection month
        const expenseStart = expense.startDate.toDate();
        const expenseEnd = expense.endDate ? expense.endDate.toDate() : null;
        
        if (expenseStart <= projectionDate && (!expenseEnd || expenseEnd >= projectionDate)) {
          monthlyTotal += this.convertToMonthlyAmount(expense.amount.amount, expense.frequency);
        }
      });
      
      projections.push({ month, year, amount: monthlyTotal });
    }
    
    return projections;
  }

  // Analyze spending patterns and suggest optimizations with multi-currency support
  async getSpendingAnalysis(userId: string, primaryCurrency: string = 'USD'): Promise<{
    totalMonthly: CurrencyAmount;
    fixedExpenses: CurrencyAmount;
    variableExpenses: CurrencyAmount;
    categoryBreakdown: Record<ExpenseCategory, CurrencyAmount>;
    suggestions: string[];
  }> {
    const totalMonthly = await this.getMonthlyExpenseTotal(userId, primaryCurrency);
    const fixedExpenses = await this.getFixedExpenses(userId);
    const variableExpenses = await this.getVariableExpenses(userId);
    const categoryBreakdown = await this.getExpenseBreakdown(userId, primaryCurrency);
    
    // Calculate fixed and variable totals with currency conversion
    let fixedTotal = 0;
    let variableTotal = 0;
    
    for (const expense of fixedExpenses) {
      const monthlyAmount = this.convertToMonthlyAmount(expense.amount.amount, expense.frequency);
      
      if (expense.amount.currency !== primaryCurrency) {
        try {
          const converted = await currencyService.convertAmount(monthlyAmount, expense.amount.currency, primaryCurrency);
          fixedTotal += converted.amount;
        } catch (error) {
          console.warn(`Failed to convert ${expense.amount.currency} to ${primaryCurrency}:`, error);
          fixedTotal += monthlyAmount; // Fallback
        }
      } else {
        fixedTotal += monthlyAmount;
      }
    }
    
    for (const expense of variableExpenses) {
      const monthlyAmount = this.convertToMonthlyAmount(expense.amount.amount, expense.frequency);
      
      if (expense.amount.currency !== primaryCurrency) {
        try {
          const converted = await currencyService.convertAmount(monthlyAmount, expense.amount.currency, primaryCurrency);
          variableTotal += converted.amount;
        } catch (error) {
          console.warn(`Failed to convert ${expense.amount.currency} to ${primaryCurrency}:`, error);
          variableTotal += monthlyAmount; // Fallback
        }
      } else {
        variableTotal += monthlyAmount;
      }
    }

    // Generate suggestions based on spending patterns
    const suggestions: string[] = [];
    
    // High entertainment spending
    if (categoryBreakdown.entertainment.amount > totalMonthly.amount * 0.15) {
      suggestions.push('Consider reducing entertainment expenses - they represent more than 15% of your total spending');
    }
    
    // High variable expenses
    if (variableTotal > fixedTotal) {
      suggestions.push('Your variable expenses exceed fixed expenses - look for opportunities to reduce discretionary spending');
    }
    
    // Unbalanced category spending
    const highestCategory = Object.entries(categoryBreakdown)
      .reduce((a, b) => a[1].amount > b[1].amount ? a : b);
    
    if (highestCategory[1].amount > totalMonthly.amount * 0.5) {
      suggestions.push(`Your ${highestCategory[0]} expenses are very high - consider ways to optimize this category`);
    }

    // Multi-currency specific suggestions
    const allExpenses = await this.getAllOrdered(userId);
    const currencies = new Set(allExpenses.map(e => e.amount.currency));
    
    if (currencies.size > 1) {
      suggestions.push(`You have expenses in ${currencies.size} different currencies. Consider monitoring exchange rate impacts on your budget.`);
    }

    return {
      totalMonthly,
      fixedExpenses: { amount: fixedTotal, currency: primaryCurrency },
      variableExpenses: { amount: variableTotal, currency: primaryCurrency },
      categoryBreakdown,
      suggestions
    };
  }

  // Get currency exposure analysis for expenses
  async getCurrencyExposure(userId: string, primaryCurrency: string = 'USD'): Promise<CurrencyExposure[]> {
    const expenses = await this.getAllOrdered(userId);
    
    if (expenses.length === 0) {
      return [];
    }

    // Group expenses by currency
    const currencyTotals: Record<string, number> = {};
    let totalInPrimaryCurrency = 0;

    for (const expense of expenses) {
      const monthlyAmount = this.convertToMonthlyAmount(expense.amount.amount, expense.frequency);
      const currency = expense.amount.currency;
      
      if (!currencyTotals[currency]) {
        currencyTotals[currency] = 0;
      }
      currencyTotals[currency] += monthlyAmount;

      // Convert to primary currency for percentage calculation
      let convertedAmount = monthlyAmount;
      if (currency !== primaryCurrency) {
        try {
          const converted = await currencyService.convertAmount(monthlyAmount, currency, primaryCurrency);
          convertedAmount = converted.amount;
        } catch (error) {
          console.warn(`Failed to convert ${currency} to ${primaryCurrency}:`, error);
        }
      }
      totalInPrimaryCurrency += convertedAmount;
    }

    // Create currency exposure array
    const exposures: CurrencyExposure[] = [];
    
    for (const [currency, amount] of Object.entries(currencyTotals)) {
      let convertedAmount = amount;
      if (currency !== primaryCurrency) {
        try {
          const converted = await currencyService.convertAmount(amount, currency, primaryCurrency);
          convertedAmount = converted.amount;
        } catch (error) {
          console.warn(`Failed to convert ${currency} to ${primaryCurrency}:`, error);
        }
      }

      const percentage = totalInPrimaryCurrency > 0 ? (convertedAmount / totalInPrimaryCurrency) * 100 : 0;
      
      // Determine risk level based on currency and percentage
      let riskLevel: 'low' | 'medium' | 'high' = 'low';
      if (currency !== primaryCurrency) {
        if (percentage > 30) riskLevel = 'high';
        else if (percentage > 10) riskLevel = 'medium';
      }

      exposures.push({
        currency,
        totalValue: { amount, currency },
        percentage,
        riskLevel
      });
    }

    return exposures.sort((a, b) => b.percentage - a.percentage);
  }

  // Get expense projections with currency conversion
  async getMultiCurrencyProjections(userId: string, primaryCurrency: string = 'USD'): Promise<{
    month: number;
    year: number;
    amount: number;
    currency: string;
    originalAmounts: Record<string, number>;
  }[]> {
    const expenses = await this.getAllOrdered(userId);
    const projections: {
      month: number;
      year: number;
      amount: number;
      currency: string;
      originalAmounts: Record<string, number>;
    }[] = [];
    
    const currentDate = new Date();
    
    for (let i = 0; i < 12; i++) {
      const projectionDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
      const month = projectionDate.getMonth() + 1;
      const year = projectionDate.getFullYear();
      
      let monthlyTotal = 0;
      const originalAmounts: Record<string, number> = {};
      
      for (const expense of expenses) {
        // Check if expense is active during this projection month
        const expenseStart = expense.startDate.toDate();
        const expenseEnd = expense.endDate ? expense.endDate.toDate() : null;
        
        if (expenseStart <= projectionDate && (!expenseEnd || expenseEnd >= projectionDate)) {
          const monthlyAmount = this.convertToMonthlyAmount(expense.amount.amount, expense.frequency);
          const currency = expense.amount.currency;
          
          // Track original amounts by currency
          if (!originalAmounts[currency]) {
            originalAmounts[currency] = 0;
          }
          originalAmounts[currency] += monthlyAmount;

          // Convert to primary currency
          if (currency !== primaryCurrency) {
            try {
              const converted = await currencyService.convertAmount(monthlyAmount, currency, primaryCurrency);
              monthlyTotal += converted.amount;
            } catch (error) {
              console.warn(`Failed to convert ${currency} to ${primaryCurrency}:`, error);
              monthlyTotal += monthlyAmount; // Fallback
            }
          } else {
            monthlyTotal += monthlyAmount;
          }
        }
      }
      
      projections.push({ 
        month, 
        year, 
        amount: monthlyTotal, 
        currency: primaryCurrency,
        originalAmounts 
      });
    }
    
    return projections;
  }

  // Get budget alerts with currency considerations
  async getBudgetAlerts(userId: string, budgetLimits: Record<ExpenseCategory, CurrencyAmount>, primaryCurrency: string = 'USD'): Promise<{
    category: ExpenseCategory;
    currentAmount: CurrencyAmount;
    budgetLimit: CurrencyAmount;
    percentageUsed: number;
    alertLevel: 'info' | 'warning' | 'danger';
    message: string;
  }[]> {
    const breakdown = await this.getExpenseBreakdown(userId, primaryCurrency);
    const alerts: {
      category: ExpenseCategory;
      currentAmount: CurrencyAmount;
      budgetLimit: CurrencyAmount;
      percentageUsed: number;
      alertLevel: 'info' | 'warning' | 'danger';
      message: string;
    }[] = [];

    for (const [category, currentAmount] of Object.entries(breakdown)) {
      const budgetLimit = budgetLimits[category as ExpenseCategory];
      if (!budgetLimit) continue;

      // Convert budget limit to primary currency if needed
      let convertedBudgetAmount = budgetLimit.amount;
      if (budgetLimit.currency !== primaryCurrency) {
        try {
          const converted = await currencyService.convertAmount(
            budgetLimit.amount,
            budgetLimit.currency,
            primaryCurrency
          );
          convertedBudgetAmount = converted.amount;
        } catch (error) {
          console.warn(`Failed to convert budget limit for ${category}:`, error);
        }
      }

      const percentageUsed = convertedBudgetAmount > 0 ? (currentAmount.amount / convertedBudgetAmount) * 100 : 0;
      
      let alertLevel: 'info' | 'warning' | 'danger' = 'info';
      let message = `${category} spending is within budget`;
      
      if (percentageUsed >= 100) {
        alertLevel = 'danger';
        message = `${category} spending has exceeded budget by ${(percentageUsed - 100).toFixed(1)}%`;
      } else if (percentageUsed >= 80) {
        alertLevel = 'warning';
        message = `${category} spending is at ${percentageUsed.toFixed(1)}% of budget`;
      } else if (percentageUsed >= 60) {
        alertLevel = 'warning';
        message = `${category} spending is approaching budget limit (${percentageUsed.toFixed(1)}%)`;
      }

      alerts.push({
        category: category as ExpenseCategory,
        currentAmount,
        budgetLimit: { amount: convertedBudgetAmount, currency: primaryCurrency },
        percentageUsed,
        alertLevel,
        message
      });
    }

    return alerts.sort((a, b) => b.percentageUsed - a.percentageUsed);
  }
}

export const expenseService = new ExpenseService();
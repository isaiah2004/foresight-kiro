import { orderBy } from 'firebase/firestore';
import { BaseFirebaseService } from '../firebase-service';
import { Expense, ExpenseCategory, ExpenseFrequency } from '../../types/financial';

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

  // Calculate monthly expense total
  async getMonthlyExpenseTotal(userId: string): Promise<{ amount: number; currency: string }> {
    const expenses = await this.getAllOrdered(userId);
    
    if (expenses.length === 0) {
      return { amount: 0, currency: 'USD' }; // Default currency
    }
    
    const total = expenses.reduce((total, expense) => {
      const monthlyAmount = this.convertToMonthlyAmount(expense.amount.amount, expense.frequency);
      return total + monthlyAmount;
    }, 0);
    
    return { 
      amount: total, 
      currency: expenses[0].amount.currency // Use currency from first expense as default
    };
  }

  // Calculate annual expense total
  async getAnnualExpenseTotal(userId: string): Promise<{ amount: number; currency: string }> {
    const monthlyTotal = await this.getMonthlyExpenseTotal(userId);
    return { 
      amount: monthlyTotal.amount * 12,
      currency: monthlyTotal.currency
    };
  }

  // Get expense breakdown by category
  async getExpenseBreakdown(userId: string): Promise<Record<ExpenseCategory, { amount: number; currency: string }>> {
    const expenses = await this.getAllOrdered(userId);
    
    const defaultCurrency = expenses.length > 0 ? expenses[0].amount.currency : 'USD';
    
    const breakdown: Record<ExpenseCategory, { amount: number; currency: string }> = {
      rent: { amount: 0, currency: defaultCurrency },
      groceries: { amount: 0, currency: defaultCurrency },
      utilities: { amount: 0, currency: defaultCurrency },
      entertainment: { amount: 0, currency: defaultCurrency },
      other: { amount: 0, currency: defaultCurrency }
    };

    expenses.forEach(expense => {
      const monthlyAmount = this.convertToMonthlyAmount(expense.amount.amount, expense.frequency);
      breakdown[expense.category].amount += monthlyAmount;
    });

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

  // Analyze spending patterns and suggest optimizations
  async getSpendingAnalysis(userId: string): Promise<{
    totalMonthly: number;
    fixedExpenses: number;
    variableExpenses: number;
    categoryBreakdown: Record<ExpenseCategory, number>;
    suggestions: string[];
  }> {
    const totalMonthly = await this.getMonthlyExpenseTotal(userId);
    const fixedExpenses = await this.getFixedExpenses(userId);
    const variableExpenses = await this.getVariableExpenses(userId);
    const categoryBreakdown: Record<ExpenseCategory, { amount: number; currency: string }> = await this.getExpenseBreakdown(userId);
    
    const fixedTotal = fixedExpenses.reduce((total, expense) => 
      total + this.convertToMonthlyAmount(expense.amount.amount, expense.frequency), 0
    );
    
    const variableTotal = variableExpenses.reduce((total, expense) => 
      total + this.convertToMonthlyAmount(expense.amount.amount, expense.frequency), 0
    );

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

    return {
      totalMonthly: totalMonthly.amount,
      fixedExpenses: fixedTotal,
      variableExpenses: variableTotal,
      categoryBreakdown: Object.entries(categoryBreakdown).reduce((acc, [key, value]) => {
        acc[key as ExpenseCategory] = value.amount;
        return acc;
      }, {} as Record<ExpenseCategory, number>),
      suggestions
    };
  }
}

export const expenseService = new ExpenseService();
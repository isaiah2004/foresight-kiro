import { BaseFirebaseService } from '../firebase-service';
import { Income, IncomeDocument } from '@/types/financial';
import { orderBy } from 'firebase/firestore';

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

  // Calculate total monthly income for a user
  async calculateMonthlyIncome(userId: string): Promise<{ amount: number; currency: string }> {
    const incomes = await this.getActiveIncomes(userId);
    
    if (incomes.length === 0) {
      return { amount: 0, currency: 'USD' }; // Default currency
    }
    
    const total = incomes.reduce((total, income) => {
      const monthlyAmount = this.convertToMonthly(income.amount.amount, income.frequency);
      return total + monthlyAmount;
    }, 0);
    
    return { 
      amount: total, 
      currency: incomes[0].amount.currency // Use currency from first income as default
    };
  }

  // Alias for calculateMonthlyIncome for consistency with other services
  async getMonthlyIncome(userId: string): Promise<{ amount: number; currency: string }> {
    return this.calculateMonthlyIncome(userId);
  }

  // Calculate annual income projection
  async calculateAnnualIncome(userId: string): Promise<{ amount: number; currency: string }> {
    const monthlyIncome = await this.calculateMonthlyIncome(userId);
    return { 
      amount: monthlyIncome.amount * 12,
      currency: monthlyIncome.currency
    };
  }

  // Get income projections for the next 12 months
  async getIncomeProjections(userId: string): Promise<{ month: string; amount: number }[]> {
    const incomes = await this.getActiveIncomes(userId);
    const projections: { month: string; amount: number }[] = [];
    
    const currentDate = new Date();
    for (let i = 0; i < 12; i++) {
      const projectionDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
      const monthName = projectionDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      
      let monthlyTotal = 0;
      incomes.forEach(income => {
        if (this.isIncomeActiveForMonth(income, projectionDate)) {
          monthlyTotal += this.convertToMonthly(income.amount.amount, income.frequency);
        }
      });
      
      projections.push({
        month: monthName,
        amount: monthlyTotal
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

  // Get income breakdown by type
  async getIncomeBreakdown(userId: string): Promise<{ type: string; amount: number; percentage: number }[]> {
    const incomes = await this.getActiveIncomes(userId);
    const totalMonthly = await this.calculateMonthlyIncome(userId);
    
    const breakdown = new Map<string, number>();
    
    incomes.forEach(income => {
      const monthlyAmount = this.convertToMonthly(income.amount.amount, income.frequency);
      const currentAmount = breakdown.get(income.type) || 0;
      breakdown.set(income.type, currentAmount + monthlyAmount);
    });
    
    return Array.from(breakdown.entries()).map(([type, amount]) => ({
      type,
      amount,
      percentage: totalMonthly.amount > 0 ? (amount / totalMonthly.amount) * 100 : 0
    }));
  }
}

// Export singleton instance
export const incomeService = new IncomeService();
import { orderBy, limit, Timestamp } from 'firebase/firestore';
import { BaseFirebaseService } from '../firebase-service';
import { FinancialSnapshotDocument, DashboardData } from '../../types/financial';
import { investmentService } from './investment-service';
import { incomeService } from './income-service';
import { expenseService } from './expense-service';
import { loanService } from './loan-service';
import { goalService } from './goal-service';
import { userService } from './user-service';

export class FinancialSnapshotService extends BaseFirebaseService<FinancialSnapshotDocument> {
  constructor() {
    super('snapshots');
  }

  // Get latest snapshot
  async getLatestSnapshot(userId: string): Promise<FinancialSnapshotDocument | null> {
    const snapshots = await this.getAll(userId, [orderBy('date', 'desc'), limit(1)]);
    return snapshots.length > 0 ? snapshots[0] : null;
  }

  // Get snapshots for a date range
  async getSnapshotsInRange(userId: string, startDate: Date, endDate: Date): Promise<FinancialSnapshotDocument[]> {
    return this.getFiltered(userId, [
      { field: 'date', operator: '>=', value: startDate },
      { field: 'date', operator: '<=', value: endDate }
    ], 'date', 'asc');
  }

  // Create a new financial snapshot
  async createSnapshot(userId: string): Promise<string> {
    // Get user's primary currency preference
    const userPreferences = await userService.getUserPreferences(userId);
  const primaryCurrency = userPreferences?.primaryCurrency || 'USD';

    // Calculate current financial metrics
    const portfolioSummary = await investmentService.getPortfolioSummary(userId, primaryCurrency);
    const monthlyIncome = await incomeService.calculateMonthlyIncome(userId);
    const monthlyExpenses = await expenseService.getMonthlyExpenseTotal(userId);
    const totalDebt = await loanService.getTotalDebt(userId);
    
    // Calculate net worth (investments - debt)
    const netWorth = portfolioSummary.totalValue.amount - totalDebt.amount;
    
    // Calculate savings rate
    const savingsRate = monthlyIncome.amount > 0 ? ((monthlyIncome.amount - monthlyExpenses.amount) / monthlyIncome.amount) * 100 : 0;
    
    // Calculate financial health score (0-100)
    const financialHealthScore = this.calculateFinancialHealthScore({
      netWorth,
      savingsRate,
      debtToIncomeRatio: monthlyIncome.amount > 0 ? (totalDebt.amount / (monthlyIncome.amount * 12)) * 100 : 0,
      diversificationScore: portfolioSummary.diversificationScore,
      hasEmergencyFund: monthlyExpenses.amount > 0 ? (portfolioSummary.totalValue.amount / monthlyExpenses.amount) >= 3 : false
    });
    
    const snapshotData = {
      date: Timestamp.fromDate(new Date()),
      netWorth: {
        amount: netWorth,
        currency: portfolioSummary.totalValue.currency
      },
      totalIncome: {
        amount: monthlyIncome.amount * 12, // Annual income
        currency: monthlyIncome.currency
      },
      totalExpenses: {
        amount: monthlyExpenses.amount * 12, // Annual expenses
        currency: monthlyExpenses.currency
      },
      totalDebt: {
        amount: totalDebt.amount,
        currency: totalDebt.currency
      },
      savingsRate: Math.max(0, Math.min(100, savingsRate)),
      financialHealthScore,
      currencyExposure: portfolioSummary.currencyExposure,
      exchangeRatesUsed: [] // This would need to be populated with actual exchange rates used
    };
    
    return this.create(userId, snapshotData);
  }

  // Calculate financial health score
  private calculateFinancialHealthScore(metrics: {
    netWorth: number;
    savingsRate: number;
    debtToIncomeRatio: number;
    diversificationScore: number;
    hasEmergencyFund: boolean;
  }): number {
    let score = 0;
    
    // Net worth component (25 points)
    if (metrics.netWorth > 0) {
      score += 25;
    } else if (metrics.netWorth > -10000) {
      score += 15;
    } else if (metrics.netWorth > -50000) {
      score += 5;
    }
    
    // Savings rate component (25 points)
    if (metrics.savingsRate >= 20) {
      score += 25;
    } else if (metrics.savingsRate >= 10) {
      score += 20;
    } else if (metrics.savingsRate >= 5) {
      score += 15;
    } else if (metrics.savingsRate >= 0) {
      score += 10;
    }
    
    // Debt-to-income ratio component (25 points)
    if (metrics.debtToIncomeRatio <= 20) {
      score += 25;
    } else if (metrics.debtToIncomeRatio <= 36) {
      score += 20;
    } else if (metrics.debtToIncomeRatio <= 50) {
      score += 15;
    } else if (metrics.debtToIncomeRatio <= 70) {
      score += 10;
    } else {
      score += 5;
    }
    
    // Investment diversification component (15 points)
    score += Math.min(15, metrics.diversificationScore * 0.15);
    
    // Emergency fund component (10 points)
    if (metrics.hasEmergencyFund) {
      score += 10;
    }
    
    return Math.round(Math.max(0, Math.min(100, score)));
  }

  // Get dashboard data
  async getDashboardData(userId: string): Promise<DashboardData> {
    // Get user's primary currency preference
    const userPreferences = await userService.getUserPreferences(userId);
  const primaryCurrency = userPreferences?.primaryCurrency || 'USD';

    const portfolioSummary = await investmentService.getPortfolioSummary(userId, primaryCurrency);
    const monthlyIncome = await incomeService.calculateMonthlyIncome(userId);
    const monthlyExpenses = await expenseService.getMonthlyExpenseTotal(userId);
    const totalDebt = await loanService.getTotalDebt(userId);
    const goalProgress = await goalService.getGoalSummaries(userId);
    
    // Get latest snapshot for financial health score, or calculate it
    let financialHealthScore = 50; // Default score
    const latestSnapshot = await this.getLatestSnapshot(userId);
    if (latestSnapshot) {
      financialHealthScore = latestSnapshot.financialHealthScore;
    } else {
      // Calculate on the fly if no snapshot exists
      const savingsRate = monthlyIncome.amount > 0 ? ((monthlyIncome.amount - monthlyExpenses.amount) / monthlyIncome.amount) * 100 : 0;
      financialHealthScore = this.calculateFinancialHealthScore({
        netWorth: portfolioSummary.totalValue.amount - totalDebt.amount,
        savingsRate,
        debtToIncomeRatio: monthlyIncome.amount > 0 ? (totalDebt.amount / (monthlyIncome.amount * 12)) * 100 : 0,
        diversificationScore: portfolioSummary.diversificationScore,
        hasEmergencyFund: monthlyExpenses.amount > 0 ? (portfolioSummary.totalValue.amount / monthlyExpenses.amount) >= 3 : false
      });
    }
    
    return {
      netWorth: {
        amount: portfolioSummary.totalValue.amount - totalDebt.amount,
        currency: portfolioSummary.totalValue.currency
      },
      monthlyIncome: monthlyIncome,
      monthlyExpenses: monthlyExpenses,
      totalDebt: totalDebt,
      goalProgress,
      financialHealthScore,
      currencyExposure: portfolioSummary.currencyExposure
    };
  }

  // Get net worth trend data
  async getNetWorthTrend(userId: string, months: number = 12): Promise<{ date: Date; value: number }[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    
    const snapshots = await this.getSnapshotsInRange(userId, startDate, endDate);
    
    return snapshots.map(snapshot => ({
      date: snapshot.date.toDate(),
      value: snapshot.netWorth.amount
    }));
  }

  // Get financial health trend
  async getFinancialHealthTrend(userId: string, months: number = 12): Promise<{ date: Date; score: number }[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    
    const snapshots = await this.getSnapshotsInRange(userId, startDate, endDate);
    
    return snapshots.map(snapshot => ({
      date: snapshot.date.toDate(),
      score: snapshot.financialHealthScore
    }));
  }

  // Schedule automatic snapshot creation (this would typically be called by a cron job)
  async createMonthlySnapshot(userId: string): Promise<string | null> {
    const latestSnapshot = await this.getLatestSnapshot(userId);
    const now = new Date();
    
    // Only create if no snapshot exists for current month
    if (!latestSnapshot || 
        latestSnapshot.date.toDate().getMonth() !== now.getMonth() || 
        latestSnapshot.date.toDate().getFullYear() !== now.getFullYear()) {
      return this.createSnapshot(userId);
    }
    
    return null;
  }
}

export const financialSnapshotService = new FinancialSnapshotService();
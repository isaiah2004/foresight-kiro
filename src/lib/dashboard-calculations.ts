import { Investment, Income, Expense, Loan, Goal } from '@/types/financial';

// Helper types for calculations that use Date objects instead of Timestamps
type InvestmentForCalculation = Omit<Investment, 'purchaseDate'> & { purchaseDate: Date };
type IncomeForCalculation = Omit<Income, 'startDate' | 'endDate'> & { 
  startDate: Date; 
  endDate?: Date; 
};
type ExpenseForCalculation = Omit<Expense, 'startDate' | 'endDate'> & { 
  startDate: Date; 
  endDate?: Date; 
};
type LoanForCalculation = Omit<Loan, 'startDate' | 'nextPaymentDate'> & { 
  startDate: Date; 
  nextPaymentDate: Date; 
};
type GoalForCalculation = Omit<Goal, 'targetDate'> & { targetDate: Date };

// Helper functions to convert Timestamp objects to Date objects for calculations
function convertInvestmentForCalculation(investment: Investment): InvestmentForCalculation {
  return {
    ...investment,
    purchaseDate: investment.purchaseDate.toDate(),
  };
}

function convertIncomeForCalculation(income: Income): IncomeForCalculation {
  return {
    ...income,
    startDate: income.startDate.toDate(),
    endDate: income.endDate?.toDate(),
  };
}

function convertExpenseForCalculation(expense: Expense): ExpenseForCalculation {
  return {
    ...expense,
    startDate: expense.startDate.toDate(),
    endDate: expense.endDate?.toDate(),
  };
}

function convertLoanForCalculation(loan: Loan): LoanForCalculation {
  return {
    ...loan,
    startDate: loan.startDate.toDate(),
    nextPaymentDate: loan.nextPaymentDate.toDate(),
  };
}

function convertGoalForCalculation(goal: Goal): GoalForCalculation {
  return {
    ...goal,
    targetDate: goal.targetDate.toDate(),
  };
}

export interface DashboardMetrics {
  netWorth: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  totalDebt: number;
  goalProgress: GoalSummary[];
  financialHealthScore: number;
  portfolioValue: number;
  savingsRate: number;
  debtToIncomeRatio: number;
}

export interface GoalSummary {
  id: string;
  name: string;
  progress: number; // percentage
  targetAmount: number;
  currentAmount: number;
}

/**
 * Calculate total portfolio value from investments
 */
export function calculatePortfolioValue(investments: Investment[]): number {
  const investmentsForCalc = investments.map(convertInvestmentForCalculation);
  return investmentsForCalc.reduce((total, investment) => {
    const currentPrice = investment.currentPrice || investment.purchasePrice;
    return total + (investment.quantity * currentPrice.amount);
  }, 0);
}

/**
 * Calculate monthly income from all income sources
 */
export function calculateMonthlyIncome(incomes: Income[]): number {
  const incomesForCalc = incomes.map(convertIncomeForCalculation);
  return incomesForCalc
    .filter(income => income.isActive)
    .reduce((total, income) => {
      const monthlyAmount = convertToMonthly(income.amount.amount, income.frequency);
      return total + monthlyAmount;
    }, 0);
}

/**
 * Calculate monthly expenses from all expense sources
 */
export function calculateMonthlyExpenses(expenses: Expense[]): number {
  const expensesForCalc = expenses.map(convertExpenseForCalculation);
  return expensesForCalc.reduce((total, expense) => {
    const monthlyAmount = convertToMonthly(expense.amount.amount, expense.frequency);
    return total + monthlyAmount;
  }, 0);
}

/**
 * Calculate total debt from all loans
 */
export function calculateTotalDebt(loans: Loan[]): number {
  const loansForCalc = loans.map(convertLoanForCalculation);
  return loansForCalc.reduce((total, loan) => total + loan.currentBalance.amount, 0);
}

/**
 * Calculate net worth (assets - liabilities)
 */
export function calculateNetWorth(
  portfolioValue: number,
  totalDebt: number,
  cashSavings: number = 0
): number {
  return portfolioValue + cashSavings - totalDebt;
}

/**
 * Calculate savings rate as percentage
 */
export function calculateSavingsRate(
  monthlyIncome: number,
  monthlyExpenses: number
): number {
  if (monthlyIncome === 0) return 0;
  const savings = monthlyIncome - monthlyExpenses;
  return Math.max(0, (savings / monthlyIncome) * 100);
}

/**
 * Calculate debt-to-income ratio as percentage
 */
export function calculateDebtToIncomeRatio(
  totalDebt: number,
  monthlyIncome: number
): number {
  if (monthlyIncome === 0) return 0;
  const annualIncome = monthlyIncome * 12;
  return annualIncome === 0 ? 0 : (totalDebt / annualIncome) * 100;
}

/**
 * Calculate goal progress summaries
 */
export function calculateGoalProgress(goals: Goal[]): GoalSummary[] {
  const goalsForCalc = goals.map(convertGoalForCalculation);
  return goalsForCalc
    .filter(goal => goal.isActive)
    .map(goal => ({
      id: goal.id,
      name: goal.name,
      progress: goal.targetAmount.amount === 0 ? 0 : Math.min(100, (goal.currentAmount.amount / goal.targetAmount.amount) * 100),
      targetAmount: goal.targetAmount.amount,
      currentAmount: goal.currentAmount.amount,
    }));
}

/**
 * Calculate overall financial health score (0-100)
 */
export function calculateFinancialHealthScore(
  savingsRate: number,
  debtToIncomeRatio: number,
  portfolioValue: number,
  monthlyExpenses: number
): number {
  let score = 0;
  
  // Savings rate component (0-30 points)
  if (savingsRate >= 20) score += 30;
  else if (savingsRate >= 10) score += 20;
  else if (savingsRate >= 5) score += 10;
  
  // Debt-to-income ratio component (0-25 points)
  if (debtToIncomeRatio <= 20) score += 25;
  else if (debtToIncomeRatio <= 36) score += 15;
  else if (debtToIncomeRatio <= 50) score += 5;
  
  // Emergency fund component (0-25 points)
  const emergencyFundMonths = monthlyExpenses === 0 ? 0 : portfolioValue / monthlyExpenses;
  if (emergencyFundMonths >= 6) score += 25;
  else if (emergencyFundMonths >= 3) score += 15;
  else if (emergencyFundMonths >= 1) score += 5;
  
  // Investment diversification component (0-20 points)
  // Simplified: if they have investments, give some points
  if (portfolioValue > 0) score += 20;
  
  return Math.min(100, score);
}

/**
 * Convert any frequency amount to monthly equivalent
 */
function convertToMonthly(amount: number, frequency: string): number {
  switch (frequency) {
    case 'daily':
      return amount * 30.44; // Average days per month
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

/**
 * Aggregate all dashboard metrics
 */
export function calculateDashboardMetrics(
  investments: Investment[],
  incomes: Income[],
  expenses: Expense[],
  loans: Loan[],
  goals: Goal[],
  cashSavings: number = 0
): DashboardMetrics {
  const portfolioValue = calculatePortfolioValue(investments);
  const monthlyIncome = calculateMonthlyIncome(incomes);
  const monthlyExpenses = calculateMonthlyExpenses(expenses);
  const totalDebt = calculateTotalDebt(loans);
  const netWorth = calculateNetWorth(portfolioValue, totalDebt, cashSavings);
  const savingsRate = calculateSavingsRate(monthlyIncome, monthlyExpenses);
  const debtToIncomeRatio = calculateDebtToIncomeRatio(totalDebt, monthlyIncome);
  const goalProgress = calculateGoalProgress(goals);
  const financialHealthScore = calculateFinancialHealthScore(
    savingsRate,
    debtToIncomeRatio,
    portfolioValue,
    monthlyExpenses
  );

  return {
    netWorth,
    monthlyIncome,
    monthlyExpenses,
    totalDebt,
    goalProgress,
    financialHealthScore,
    portfolioValue,
    savingsRate,
    debtToIncomeRatio,
  };
}

/**
 * Format currency values for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format percentage values for display
 */
export function formatPercentage(percentage: number): string {
  return `${percentage.toFixed(1)}%`;
}

/**
 * Get financial health status based on score
 */
export function getFinancialHealthStatus(score: number): {
  status: 'excellent' | 'good' | 'fair' | 'poor';
  color: string;
  description: string;
} {
  if (score >= 80) {
    return {
      status: 'excellent',
      color: 'text-green-600 dark:text-green-400',
      description: 'Your financial health is excellent!'
    };
  } else if (score >= 60) {
    return {
      status: 'good',
      color: 'text-blue-600 dark:text-blue-400',
      description: 'Your financial health is good.'
    };
  } else if (score >= 40) {
    return {
      status: 'fair',
      color: 'text-yellow-600 dark:text-yellow-400',
      description: 'Your financial health needs some attention.'
    };
  } else {
    return {
      status: 'poor',
      color: 'text-red-600 dark:text-red-400',
      description: 'Your financial health needs significant improvement.'
    };
  }
}
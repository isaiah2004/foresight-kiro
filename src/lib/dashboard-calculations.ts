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
  // New metrics for enhanced dashboard
  thisMonthSpending: number;
  remainingBudget: number;
  monthlyBudget: number;
  emergencyFundMonths: number;
}

export interface GoalSummary {
  id: string;
  name: string;
  progress: number; // percentage
  targetAmount: number;
  currentAmount: number;
}

// Mock data generators for charts
export interface MonthlySpendingData {
  month: string;
  spending: number;
  budget: number;
  category: string;
}

export interface LoanRepaymentData {
  month: string;
  remainingBalance: number;
  principalPaid: number;
  interestPaid: number;
}

export interface DebtToIncomeData {
  month: string;
  ratio: number;
  totalDebt: number;
  monthlyIncome: number;
}

export interface InvestmentGrowthData {
  month: string;
  historical: number;
  projected: number;
  growthRate: number;
}

export interface FundProgressData {
  month: string;
  emergencyFund: number;
  carFund: number;
  retirementFund: number;
  targetEmergency: number;
  targetCar: number;
  targetRetirement: number;
}

export interface AssetData {
  month: string;
  homes: number;
  cars: number;
  land: number;
  totalAssets: number;
}

/**
 * Generate mock monthly spending data
 */
export function generateMonthlySpendingData(monthlyExpenses: number): MonthlySpendingData[] {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentMonth = new Date().getMonth();
  
  return months.slice(0, currentMonth + 1).map((month, index) => {
    const variance = 0.8 + Math.random() * 0.4; // ±20% variance
    const spending = monthlyExpenses * variance;
    const budget = monthlyExpenses * 1.1; // 10% buffer
    
    return {
      month,
      spending,
      budget,
      category: 'mixed',
    };
  });
}

/**
 * Generate mock loan repayment data
 */
export function generateLoanRepaymentData(loan: Loan): LoanRepaymentData[] {
  const months = [];
  const monthlyPayment = loan.monthlyPayment.amount;
  const interestRate = loan.interestRate / 100 / 12; // Monthly rate
  let balance = loan.currentBalance.amount;
  
  for (let i = 0; i < Math.min(24, loan.termMonths); i++) {
    const interestPaid = balance * interestRate;
    const principalPaid = monthlyPayment - interestPaid;
    balance -= principalPaid;
    
    months.push({
      month: new Date(Date.now() + i * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      remainingBalance: Math.max(0, balance),
      principalPaid,
      interestPaid,
    });
  }
  
  return months;
}

/**
 * Generate mock debt-to-income data
 */
export function generateDebtToIncomeData(totalDebt: number, monthlyIncome: number): DebtToIncomeData[] {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentMonth = new Date().getMonth();
  
  return months.slice(Math.max(0, currentMonth - 11), currentMonth + 1).map((month, index) => {
    // Simulate gradual improvement in debt-to-income ratio
    const debtReduction = index * 0.02; // 2% improvement per month
    const adjustedDebt = totalDebt * (1 - debtReduction);
    const ratio = monthlyIncome > 0 ? (adjustedDebt / (monthlyIncome * 12)) * 100 : 0;
    
    return {
      month,
      ratio,
      totalDebt: adjustedDebt,
      monthlyIncome,
    };
  });
}

/**
 * Generate mock investment growth data
 */
export function generateInvestmentGrowthData(currentValue: number): InvestmentGrowthData[] {
  const months = [];
  const avgGrowthRate = 0.08 / 12; // 8% annual growth
  
  // Historical data (last 12 months)
  for (let i = -12; i <= 0; i++) {
    const variance = 0.95 + Math.random() * 0.1; // ±5% variance
    const monthlyGrowth = avgGrowthRate * variance;
    const value = currentValue * Math.pow(1 + monthlyGrowth, i);
    
    months.push({
      month: new Date(Date.now() + i * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      historical: i <= 0 ? value : 0,
      projected: i > 0 ? value : 0,
      growthRate: monthlyGrowth * 12 * 100,
    });
  }
  
  // Projected data (next 24 months)
  for (let i = 1; i <= 24; i++) {
    const value = currentValue * Math.pow(1 + avgGrowthRate, i);
    
    months.push({
      month: new Date(Date.now() + i * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      historical: 0,
      projected: value,
      growthRate: avgGrowthRate * 12 * 100,
    });
  }
  
  return months;
}

/**
 * Generate mock fund progress data
 */
export function generateFundProgressData(goals: Goal[]): FundProgressData[] {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentMonth = new Date().getMonth();
  
  const emergencyGoal = goals.find(g => g.type === 'emergency_fund');
  const retirementGoal = goals.find(g => g.type === 'retirement');
  const carGoal = goals.find(g => g.name.toLowerCase().includes('car')) || { currentAmount: { amount: 5000 }, targetAmount: { amount: 25000 } };
  
  return months.slice(0, currentMonth + 1).map((month, index) => {
    const progress = index / 12; // Linear progress for demo
    
    return {
      month,
      emergencyFund: (emergencyGoal?.currentAmount.amount || 0) * (0.5 + progress * 0.5),
      carFund: (carGoal.currentAmount?.amount || 5000) * (0.3 + progress * 0.7),
      retirementFund: (retirementGoal?.currentAmount.amount || 0) * (0.8 + progress * 0.2),
      targetEmergency: emergencyGoal?.targetAmount.amount || 20000,
      targetCar: carGoal.targetAmount?.amount || 25000,
      targetRetirement: retirementGoal?.targetAmount.amount || 1000000,
    };
  });
}

/**
 * Generate mock asset growth data
 */
export function generateAssetGrowthData(): AssetData[] {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentMonth = new Date().getMonth();
  
  const baseHomes = 250000;
  const baseCars = 25000;
  const baseLand = 100000;
  
  return months.slice(0, currentMonth + 1).map((month, index) => {
    const homeAppreciation = 1 + (index * 0.005); // 0.5% monthly appreciation
    const carDepreciation = 1 - (index * 0.01); // 1% monthly depreciation
    const landAppreciation = 1 + (index * 0.003); // 0.3% monthly appreciation
    
    const homes = baseHomes * homeAppreciation;
    const cars = baseCars * carDepreciation;
    const land = baseLand * landAppreciation;
    
    return {
      month,
      homes,
      cars,
      land,
      totalAssets: homes + cars + land,
    };
  });
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
 * Calculate emergency fund coverage in months
 */
export function calculateEmergencyFundMonths(
  portfolioValue: number,
  monthlyExpenses: number
): number {
  return monthlyExpenses > 0 ? portfolioValue / monthlyExpenses : 0;
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
  const emergencyFundMonths = calculateEmergencyFundMonths(portfolioValue, monthlyExpenses);
  
  // Calculate additional metrics
  const monthlyBudget = monthlyIncome * 0.8; // 80% of income as budget
  const thisMonthSpending = monthlyExpenses; // This would be calculated from current month data in real app
  const remainingBudget = Math.max(0, monthlyBudget - thisMonthSpending);

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
    thisMonthSpending,
    remainingBudget,
    monthlyBudget,
    emergencyFundMonths,
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
import {
  calculatePortfolioValue,
  calculateMonthlyIncome,
  calculateMonthlyExpenses,
  calculateTotalDebt,
  calculateNetWorth,
  calculateSavingsRate,
  calculateDebtToIncomeRatio,
  calculateGoalProgress,
  calculateFinancialHealthScore,
  calculateDashboardMetrics,
  formatCurrency,
  formatPercentage,
  getFinancialHealthStatus,
} from '../dashboard-calculations';
import { Investment, Income, Expense, Loan, Goal } from '@/types/financial';
import { Timestamp } from 'firebase/firestore';

// Mock data for testing
const mockInvestments: Investment[] = [
  {
    id: '1',
    userId: 'user1',
    type: 'stocks',
    name: 'Apple Inc.',
    symbol: 'AAPL',
    quantity: 10,
    purchasePrice: { amount: 150, currency: 'USD' },
    currentPrice: { amount: 175, currency: 'USD' },
    purchaseDate: Timestamp.fromDate(new Date('2023-01-01')),
    currency: 'USD',
  },
  {
    id: '2',
    userId: 'user1',
    type: 'mutual_funds',
    name: 'S&P 500 Index Fund',
    quantity: 100,
    purchasePrice: { amount: 400, currency: 'USD' },
    currentPrice: { amount: 450, currency: 'USD' },
    purchaseDate: Timestamp.fromDate(new Date('2023-02-01')),
    currency: 'USD',
  },
];

const mockIncomes: Income[] = [
  {
    id: '1',
    userId: 'user1',
    type: 'salary',
    source: 'Tech Company',
    amount: { amount: 8000, currency: 'USD' },
    frequency: 'monthly',
    startDate: Timestamp.fromDate(new Date('2023-01-01')),
    isActive: true,
  },
  {
    id: '2',
    userId: 'user1',
    type: 'bonus',
    source: 'Annual Bonus',
    amount: { amount: 12000, currency: 'USD' },
    frequency: 'annually',
    startDate: Timestamp.fromDate(new Date('2023-01-01')),
    isActive: true,
  },
];

const mockExpenses: Expense[] = [
  {
    id: '1',
    userId: 'user1',
    category: 'rent',
    name: 'Apartment Rent',
    amount: { amount: 2500, currency: 'USD' },
    frequency: 'monthly',
    isFixed: true,
    startDate: Timestamp.fromDate(new Date('2023-01-01')),
  },
  {
    id: '2',
    userId: 'user1',
    category: 'groceries',
    name: 'Food & Groceries',
    amount: { amount: 600, currency: 'USD' },
    frequency: 'monthly',
    isFixed: false,
    startDate: Timestamp.fromDate(new Date('2023-01-01')),
  },
];

const mockLoans: Loan[] = [
  {
    id: '1',
    userId: 'user1',
    type: 'car',
    name: 'Car Loan',
    principal: { amount: 25000, currency: 'USD' },
    currentBalance: { amount: 18000, currency: 'USD' },
    interestRate: 4.5,
    termMonths: 60,
    monthlyPayment: { amount: 467, currency: 'USD' },
    startDate: Timestamp.fromDate(new Date('2022-06-01')),
    nextPaymentDate: Timestamp.fromDate(new Date('2024-02-01')),
  },
];

const mockGoals: Goal[] = [
  {
    id: '1',
    userId: 'user1',
    type: 'retirement',
    name: 'Retirement Savings',
    targetAmount: { amount: 100000, currency: 'USD' },
    currentAmount: { amount: 25000, currency: 'USD' },
    targetDate: Timestamp.fromDate(new Date('2055-01-01')),
    monthlyContribution: { amount: 1500, currency: 'USD' },
    priority: 'high',
    isActive: true,
  },
  {
    id: '2',
    userId: 'user1',
    type: 'emergency_fund',
    name: 'Emergency Fund',
    targetAmount: { amount: 20000, currency: 'USD' },
    currentAmount: { amount: 8000, currency: 'USD' },
    targetDate: Timestamp.fromDate(new Date('2025-01-01')),
    monthlyContribution: { amount: 500, currency: 'USD' },
    priority: 'high',
    isActive: true,
  },
];

describe('Dashboard Calculations', () => {
  describe('calculatePortfolioValue', () => {
    it('should calculate total portfolio value correctly', () => {
      const result = calculatePortfolioValue(mockInvestments);
      // (10 * 175) + (100 * 450) = 1750 + 45000 = 46750
      expect(result).toBe(46750);
    });

    it('should return 0 for empty investments', () => {
      const result = calculatePortfolioValue([]);
      expect(result).toBe(0);
    });

    it('should use purchase price when current price is not available', () => {
      const investmentWithoutCurrentPrice: Investment[] = [
        {
          ...mockInvestments[0],
          currentPrice: undefined,
        },
      ];
      const result = calculatePortfolioValue(investmentWithoutCurrentPrice);
      // 10 * 150 = 1500
      expect(result).toBe(1500);
    });
  });

  describe('calculateMonthlyIncome', () => {
    it('should calculate monthly income correctly', () => {
      const result = calculateMonthlyIncome(mockIncomes);
      // 8000 (monthly) + 12000/12 (annual) = 8000 + 1000 = 9000
      expect(result).toBe(9000);
    });

    it('should only include active income sources', () => {
      const inactiveIncome: Income[] = [
        {
          ...mockIncomes[0],
          isActive: false,
        },
        mockIncomes[1],
      ];
      const result = calculateMonthlyIncome(inactiveIncome);
      // Only the annual bonus: 12000/12 = 1000
      expect(result).toBe(1000);
    });

    it('should return 0 for empty incomes', () => {
      const result = calculateMonthlyIncome([]);
      expect(result).toBe(0);
    });
  });

  describe('calculateMonthlyExpenses', () => {
    it('should calculate monthly expenses correctly', () => {
      const result = calculateMonthlyExpenses(mockExpenses);
      // 2500 + 600 = 3100
      expect(result).toBe(3100);
    });

    it('should return 0 for empty expenses', () => {
      const result = calculateMonthlyExpenses([]);
      expect(result).toBe(0);
    });
  });

  describe('calculateTotalDebt', () => {
    it('should calculate total debt correctly', () => {
      const result = calculateTotalDebt(mockLoans);
      expect(result).toBe(18000);
    });

    it('should return 0 for empty loans', () => {
      const result = calculateTotalDebt([]);
      expect(result).toBe(0);
    });
  });

  describe('calculateNetWorth', () => {
    it('should calculate net worth correctly', () => {
      const result = calculateNetWorth(46750, 18000, 5000);
      // 46750 + 5000 - 18000 = 33750
      expect(result).toBe(33750);
    });

    it('should handle negative net worth', () => {
      const result = calculateNetWorth(10000, 50000, 1000);
      // 10000 + 1000 - 50000 = -39000
      expect(result).toBe(-39000);
    });
  });

  describe('calculateSavingsRate', () => {
    it('should calculate savings rate correctly', () => {
      const result = calculateSavingsRate(9000, 3100);
      // (9000 - 3100) / 9000 * 100 = 65.56%
      expect(result).toBeCloseTo(65.56, 1);
    });

    it('should return 0 when income is 0', () => {
      const result = calculateSavingsRate(0, 3100);
      expect(result).toBe(0);
    });

    it('should return 0 when expenses exceed income', () => {
      const result = calculateSavingsRate(3000, 5000);
      expect(result).toBe(0);
    });
  });

  describe('calculateDebtToIncomeRatio', () => {
    it('should calculate debt-to-income ratio correctly', () => {
      const result = calculateDebtToIncomeRatio(18000, 9000);
      // 18000 / (9000 * 12) * 100 = 18000 / 108000 * 100 = 16.67%
      expect(result).toBeCloseTo(16.67, 1);
    });

    it('should return 0 when income is 0', () => {
      const result = calculateDebtToIncomeRatio(18000, 0);
      expect(result).toBe(0);
    });
  });

  describe('calculateGoalProgress', () => {
    it('should calculate goal progress correctly', () => {
      const result = calculateGoalProgress(mockGoals);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: '1',
        name: 'Retirement Savings',
        progress: 25, // 25000 / 100000 * 100
        targetAmount: 100000,
        currentAmount: 25000,
      });
      expect(result[1]).toEqual({
        id: '2',
        name: 'Emergency Fund',
        progress: 40, // 8000 / 20000 * 100
        targetAmount: 20000,
        currentAmount: 8000,
      });
    });

    it('should only include active goals', () => {
      const inactiveGoals: Goal[] = [
        {
          ...mockGoals[0],
          isActive: false,
        },
        mockGoals[1],
      ];
      const result = calculateGoalProgress(inactiveGoals);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Emergency Fund');
    });
  });

  describe('calculateFinancialHealthScore', () => {
    it('should calculate excellent financial health score', () => {
      const result = calculateFinancialHealthScore(25, 15, 50000, 3000);
      // Savings rate: 30 points (>=20%)
      // Debt-to-income: 25 points (<=20%)
      // Emergency fund: 25 points (>=6 months)
      // Investments: 20 points (>0)
      // Total: 100 points
      expect(result).toBe(100);
    });

    it('should calculate poor financial health score', () => {
      const result = calculateFinancialHealthScore(2, 60, 0, 3000);
      // Savings rate: 0 points (<5%)
      // Debt-to-income: 0 points (>50%)
      // Emergency fund: 0 points (<1 month)
      // Investments: 0 points (=0)
      // Total: 0 points
      expect(result).toBe(0);
    });
  });

  describe('calculateDashboardMetrics', () => {
    it('should calculate all dashboard metrics correctly', () => {
      const result = calculateDashboardMetrics(
        mockInvestments,
        mockIncomes,
        mockExpenses,
        mockLoans,
        mockGoals,
        5000
      );

      expect(result.portfolioValue).toBe(46750);
      expect(result.monthlyIncome).toBe(9000);
      expect(result.monthlyExpenses).toBe(3100);
      expect(result.totalDebt).toBe(18000);
      expect(result.netWorth).toBe(33750); // 46750 + 5000 - 18000
      expect(result.savingsRate).toBeCloseTo(65.56, 1);
      expect(result.debtToIncomeRatio).toBeCloseTo(16.67, 1);
      expect(result.goalProgress).toHaveLength(2);
      expect(result.financialHealthScore).toBeGreaterThan(0);
    });
  });

  describe('formatCurrency', () => {
    it('should format currency correctly', () => {
      expect(formatCurrency(1234.56)).toBe('$1,235');
      expect(formatCurrency(0)).toBe('$0');
      expect(formatCurrency(-500)).toBe('-$500');
    });
  });

  describe('formatPercentage', () => {
    it('should format percentage correctly', () => {
      expect(formatPercentage(25.678)).toBe('25.7%');
      expect(formatPercentage(0)).toBe('0.0%');
      expect(formatPercentage(100)).toBe('100.0%');
    });
  });

  describe('getFinancialHealthStatus', () => {
    it('should return excellent status for high scores', () => {
      const result = getFinancialHealthStatus(85);
      expect(result.status).toBe('excellent');
      expect(result.color).toBe('text-green-600');
    });

    it('should return good status for medium-high scores', () => {
      const result = getFinancialHealthStatus(65);
      expect(result.status).toBe('good');
      expect(result.color).toBe('text-blue-600');
    });

    it('should return fair status for medium scores', () => {
      const result = getFinancialHealthStatus(45);
      expect(result.status).toBe('fair');
      expect(result.color).toBe('text-yellow-600');
    });

    it('should return poor status for low scores', () => {
      const result = getFinancialHealthStatus(25);
      expect(result.status).toBe('poor');
      expect(result.color).toBe('text-red-600');
    });
  });
});
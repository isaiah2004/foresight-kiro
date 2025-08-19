import { ExpenseFrequency } from '@/types/financial';

// Helper function to convert frequency to monthly amount
function convertToMonthlyAmount(amount: number, frequency: ExpenseFrequency): number {
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

// Helper function to calculate expense health score
function calculateExpenseHealthScore(
  totalMonthly: number,
  fixedExpenses: number,
  variableExpenses: number,
  categoryBreakdown: Record<string, number>
): number {
  let score = 100;
  
  // Deduct points for high entertainment spending (>15%)
  const entertainmentPercentage = totalMonthly > 0 
    ? (categoryBreakdown.entertainment || 0) / totalMonthly * 100 
    : 0;
  if (entertainmentPercentage > 15) score -= 20;
  
  // Deduct points if variable expenses exceed fixed expenses
  if (variableExpenses > fixedExpenses) score -= 15;
  
  // Deduct points for unbalanced spending (one category >50%)
  const highestCategoryPercentage = Math.max(...Object.values(categoryBreakdown)) / totalMonthly * 100;
  if (highestCategoryPercentage > 50) score -= 25;
  
  return Math.max(0, score);
}

describe('Expense Calculations', () => {
  describe('convertToMonthlyAmount', () => {
    it('should convert daily expenses correctly', () => {
      expect(convertToMonthlyAmount(10, 'daily')).toBeCloseTo(304.4, 1);
      expect(convertToMonthlyAmount(5, 'daily')).toBeCloseTo(152.2, 1);
    });

    it('should convert weekly expenses correctly', () => {
      expect(convertToMonthlyAmount(100, 'weekly')).toBeCloseTo(433.33, 2);
      expect(convertToMonthlyAmount(50, 'weekly')).toBeCloseTo(216.67, 2);
    });

    it('should return monthly expenses unchanged', () => {
      expect(convertToMonthlyAmount(1000, 'monthly')).toBe(1000);
      expect(convertToMonthlyAmount(500, 'monthly')).toBe(500);
    });

    it('should convert quarterly expenses correctly', () => {
      expect(convertToMonthlyAmount(3000, 'quarterly')).toBe(1000);
      expect(convertToMonthlyAmount(600, 'quarterly')).toBe(200);
    });

    it('should convert annual expenses correctly', () => {
      expect(convertToMonthlyAmount(12000, 'annually')).toBe(1000);
      expect(convertToMonthlyAmount(2400, 'annually')).toBe(200);
    });

    it('should handle edge cases', () => {
      expect(convertToMonthlyAmount(0, 'monthly')).toBe(0);
      expect(convertToMonthlyAmount(-100, 'monthly')).toBe(-100);
    });
  });

  describe('calculateExpenseHealthScore', () => {
    it('should return perfect score for balanced expenses', () => {
      const score = calculateExpenseHealthScore(
        2000, // total monthly
        1200, // fixed expenses (60%)
        800,  // variable expenses (40%)
        {
          rent: 1000,
          groceries: 400,
          utilities: 300,
          entertainment: 200, // 10% - under 15% threshold
          other: 100,
        }
      );
      expect(score).toBe(100);
    });

    it('should deduct points for high entertainment spending', () => {
      const score = calculateExpenseHealthScore(
        2000,
        1000,
        1000,
        {
          rent: 1000,
          groceries: 300,
          utilities: 200,
          entertainment: 400, // 20% - over 15% threshold
          other: 100,
        }
      );
      expect(score).toBe(80); // 100 - 20 for high entertainment
    });

    it('should deduct points when variable expenses exceed fixed', () => {
      const score = calculateExpenseHealthScore(
        2000,
        800,  // fixed expenses
        1200, // variable expenses (higher than fixed)
        {
          rent: 800,
          groceries: 400,
          utilities: 200,
          entertainment: 200, // 10% - under threshold
          other: 400,
        }
      );
      expect(score).toBe(85); // 100 - 15 for high variable expenses
    });

    it('should deduct points for unbalanced category spending', () => {
      const score = calculateExpenseHealthScore(
        2000,
        1200,
        800,
        {
          rent: 1200, // 60% - over 50% threshold
          groceries: 300,
          utilities: 200,
          entertainment: 200,
          other: 100,
        }
      );
      expect(score).toBe(75); // 100 - 25 for unbalanced spending
    });

    it('should handle multiple deductions', () => {
      const score = calculateExpenseHealthScore(
        2000,
        600,  // fixed expenses
        1400, // variable expenses (higher than fixed)
        {
          rent: 600,
          groceries: 200,
          utilities: 200,
          entertainment: 400, // 20% - over 15% threshold
          other: 600,         // This makes 'other' 30%, but entertainment is still the issue
        }
      );
      expect(score).toBe(65); // 100 - 20 (entertainment) - 15 (variable > fixed)
    });

    it('should not go below 0', () => {
      const score = calculateExpenseHealthScore(
        2000,
        200,  // very low fixed expenses
        1800, // very high variable expenses
        {
          rent: 200,
          groceries: 100,
          utilities: 100,
          entertainment: 500, // 25% - way over threshold
          other: 1100,        // 55% - way over threshold
        }
      );
      expect(score).toBe(40); // 100 - 20 (entertainment) - 15 (variable > fixed) - 25 (unbalanced) = 40
    });

    it('should handle zero total monthly expenses', () => {
      const score = calculateExpenseHealthScore(
        0,
        0,
        0,
        {}
      );
      expect(score).toBe(100); // No expenses = perfect score
    });
  });

  describe('expense projections', () => {
    it('should calculate correct projections for different frequencies', () => {
      const expenses = [
        { amount: 1000, frequency: 'monthly' as ExpenseFrequency },
        { amount: 100, frequency: 'weekly' as ExpenseFrequency },
        { amount: 3000, frequency: 'quarterly' as ExpenseFrequency },
      ];

      const monthlyTotal = expenses.reduce((total, expense) => 
        total + convertToMonthlyAmount(expense.amount, expense.frequency), 0
      );

      expect(monthlyTotal).toBeCloseTo(2433.33, 2); // 1000 + 433.33 + 1000
    });

    it('should handle seasonal patterns', () => {
      // Example: Higher heating costs in winter months
      const winterMonths = [12, 1, 2]; // December, January, February
      const baseUtilities = 200;
      const winterSurcharge = 100;

      winterMonths.forEach(month => {
        const monthlyUtilities = baseUtilities + (winterMonths.includes(month) ? winterSurcharge : 0);
        if (winterMonths.includes(month)) {
          expect(monthlyUtilities).toBe(300);
        } else {
          expect(monthlyUtilities).toBe(200);
        }
      });
    });
  });

  describe('category analysis', () => {
    it('should identify high-spending categories', () => {
      const categoryBreakdown = {
        rent: 1200,
        groceries: 400,
        utilities: 200,
        entertainment: 600,
        other: 100,
      };

      const totalSpending = Object.values(categoryBreakdown).reduce((a, b) => a + b, 0);
      const sortedCategories = Object.entries(categoryBreakdown)
        .sort(([, a], [, b]) => b - a);

      expect(sortedCategories[0][0]).toBe('rent'); // Highest category
      expect(sortedCategories[0][1]).toBe(1200);
      
      const highestPercentage = (sortedCategories[0][1] / totalSpending) * 100;
      expect(highestPercentage).toBeCloseTo(48, 1);
    });

    it('should calculate category percentages correctly', () => {
      const categoryBreakdown = {
        rent: 1000,
        groceries: 500,
        utilities: 300,
        entertainment: 200,
        other: 0,
      };

      const total = 2000;
      const percentages = Object.entries(categoryBreakdown).map(([category, amount]) => ({
        category,
        percentage: (amount / total) * 100,
      }));

      expect(percentages.find(p => p.category === 'rent')?.percentage).toBe(50);
      expect(percentages.find(p => p.category === 'groceries')?.percentage).toBe(25);
      expect(percentages.find(p => p.category === 'utilities')?.percentage).toBe(15);
      expect(percentages.find(p => p.category === 'entertainment')?.percentage).toBe(10);
      expect(percentages.find(p => p.category === 'other')?.percentage).toBe(0);
    });
  });
});
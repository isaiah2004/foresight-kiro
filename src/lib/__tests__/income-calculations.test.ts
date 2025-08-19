import { calculateMonthlyIncome } from '../dashboard-calculations';
import { Income } from '@/types/financial';
import { Timestamp } from 'firebase/firestore';

describe('Income Calculations', () => {
  const mockIncomes: Income[] = [
    {
      id: '1',
      userId: 'user1',
      type: 'salary',
      source: 'ABC Company',
      amount: { amount: 8000, currency: 'USD' },
      frequency: 'monthly',
      startDate: Timestamp.fromDate(new Date('2024-01-01')),
      isActive: true,
    },
    {
      id: '2',
      userId: 'user1',
      type: 'bonus',
      source: 'ABC Company',
      amount: { amount: 12000, currency: 'USD' },
      frequency: 'annually',
      startDate: Timestamp.fromDate(new Date('2024-01-01')),
      isActive: true,
    },
    {
      id: '3',
      userId: 'user1',
      type: 'other',
      source: 'Freelance',
      amount: { amount: 2000, currency: 'USD' },
      frequency: 'weekly',
      startDate: Timestamp.fromDate(new Date('2024-01-01')),
      isActive: false,
    },
    {
      id: '4',
      userId: 'user1',
      type: 'other',
      source: 'Side Gig',
      amount: { amount: 4000, currency: 'USD' },
      frequency: 'bi-weekly',
      startDate: Timestamp.fromDate(new Date('2024-01-01')),
      isActive: true,
    },
  ];

  describe('calculateMonthlyIncome', () => {
    it('should calculate monthly income correctly for various frequencies', () => {
      const result = calculateMonthlyIncome(mockIncomes);
      
      // Expected calculation:
      // Salary: 8000 (monthly)
      // Bonus: 12000 / 12 = 1000 (annual to monthly)
      // Freelance: 2000 * 4.33 = 8660 (weekly, but inactive - should be excluded)
      // Side Gig: 4000 * 2.17 = 8680 (bi-weekly)
      // Total: 8000 + 1000 + 8680 = 17680
      
      expect(result).toBeCloseTo(17680, 0);
    });

    it('should only include active income sources', () => {
      const activeIncomes = mockIncomes.filter(income => income.isActive);
      const result = calculateMonthlyIncome(activeIncomes);
      
      // Should exclude the inactive freelance income
      expect(result).toBeCloseTo(17680, 0);
    });

    it('should return 0 for empty income array', () => {
      const result = calculateMonthlyIncome([]);
      expect(result).toBe(0);
    });

    it('should handle different frequency conversions correctly', () => {
      const testIncomes: Income[] = [
        {
          id: '1',
          userId: 'user1',
          type: 'salary',
          source: 'Test',
          amount: { amount: 1000, currency: 'USD' },
          frequency: 'weekly',
          startDate: Timestamp.fromDate(new Date('2024-01-01')),
          isActive: true,
        },
        {
          id: '2',
          userId: 'user1',
          type: 'salary',
          source: 'Test',
          amount: { amount: 2000, currency: 'USD' },
          frequency: 'bi-weekly',
          startDate: Timestamp.fromDate(new Date('2024-01-01')),
          isActive: true,
        },
        {
          id: '3',
          userId: 'user1',
          type: 'salary',
          source: 'Test',
          amount: { amount: 3000, currency: 'USD' },
          frequency: 'monthly',
          startDate: Timestamp.fromDate(new Date('2024-01-01')),
          isActive: true,
        },
        {
          id: '4',
          userId: 'user1',
          type: 'salary',
          source: 'Test',
          amount: { amount: 12000, currency: 'USD' },
          frequency: 'quarterly',
          startDate: Timestamp.fromDate(new Date('2024-01-01')),
          isActive: true,
        },
        {
          id: '5',
          userId: 'user1',
          type: 'salary',
          source: 'Test',
          amount: { amount: 60000, currency: 'USD' },
          frequency: 'annually',
          startDate: Timestamp.fromDate(new Date('2024-01-01')),
          isActive: true,
        },
      ];

      const result = calculateMonthlyIncome(testIncomes);
      
      // Expected:
      // Weekly: 1000 * 4.33 = 4330
      // Bi-weekly: 2000 * 2.17 = 4340
      // Monthly: 3000
      // Quarterly: 12000 / 3 = 4000
      // Annual: 60000 / 12 = 5000
      // Total: 4330 + 4340 + 3000 + 4000 + 5000 = 20670
      
      expect(result).toBeCloseTo(20670, 0);
    });

    it('should handle edge cases gracefully', () => {
      const edgeCaseIncomes: Income[] = [
        {
          id: '1',
          userId: 'user1',
          type: 'salary',
          source: 'Test',
          amount: { amount: 0, currency: 'USD' },
          frequency: 'monthly',
          startDate: Timestamp.fromDate(new Date('2024-01-01')),
          isActive: true,
        },
        {
          id: '2',
          userId: 'user1',
          type: 'salary',
          source: 'Test',
          amount: { amount: 5000, currency: 'USD' },
          frequency: 'monthly',
          startDate: Timestamp.fromDate(new Date('2024-01-01')),
          isActive: false,
        },
      ];

      const result = calculateMonthlyIncome(edgeCaseIncomes);
      
      // Should only include the active income with 0 amount
      expect(result).toBe(0);
    });
  });
});
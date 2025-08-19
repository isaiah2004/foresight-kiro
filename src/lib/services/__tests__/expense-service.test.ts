import { ExpenseService } from '../expense-service';
import { Timestamp } from 'firebase/firestore';

// Mock Firebase completely
jest.mock('firebase/firestore', () => ({
  Timestamp: {
    now: () => ({ toDate: () => new Date() }),
    fromDate: (date: Date) => ({ toDate: () => date }),
  },
  orderBy: jest.fn(),
}));

jest.mock('../../firebase-service', () => ({
  BaseFirebaseService: class MockBaseFirebaseService {
    constructor() {}
    getAll = jest.fn();
    getFiltered = jest.fn();
    create = jest.fn();
    update = jest.fn();
    delete = jest.fn();
    getById = jest.fn();
  }
}));

// Mock fetch for Node.js environment
global.fetch = jest.fn();

describe('ExpenseService', () => {
  let expenseService: ExpenseService;

  beforeEach(() => {
    expenseService = new ExpenseService();
  });

  describe('convertToMonthlyAmount', () => {
    it('should convert daily amount to monthly', () => {
      // Access private method through any type
      const result = (expenseService as any).convertToMonthlyAmount(10, 'daily');
      expect(result).toBeCloseTo(304.4, 1);
    });

    it('should convert weekly amount to monthly', () => {
      const result = (expenseService as any).convertToMonthlyAmount(100, 'weekly');
      expect(result).toBeCloseTo(433.33, 1);
    });

    it('should return monthly amount unchanged', () => {
      const result = (expenseService as any).convertToMonthlyAmount(1000, 'monthly');
      expect(result).toBe(1000);
    });

    it('should convert quarterly amount to monthly', () => {
      const result = (expenseService as any).convertToMonthlyAmount(3000, 'quarterly');
      expect(result).toBe(1000);
    });

    it('should convert annual amount to monthly', () => {
      const result = (expenseService as any).convertToMonthlyAmount(12000, 'annually');
      expect(result).toBe(1000);
    });

    it('should return 0 for unknown frequency', () => {
      const result = (expenseService as any).convertToMonthlyAmount(100, 'unknown');
      expect(result).toBe(0);
    });
  });

  describe('getSpendingAnalysis', () => {
    it('should generate suggestions for high entertainment spending', async () => {
      // Mock the service methods
      jest.spyOn(expenseService, 'getMonthlyExpenseTotal').mockResolvedValue({ amount: 2000, currency: 'USD' });
      jest.spyOn(expenseService, 'getFixedExpenses').mockResolvedValue([
        {
          id: '1',
          userId: 'user1',
          category: 'rent',
          name: 'Rent',
          amount: { amount: 1000, currency: 'USD' },
          frequency: 'monthly',
          isFixed: true,
          startDate: Timestamp.now(),
        }
      ]);
      jest.spyOn(expenseService, 'getVariableExpenses').mockResolvedValue([
        {
          id: '2',
          userId: 'user1',
          category: 'entertainment',
          name: 'Movies',
          amount: { amount: 200, currency: 'USD' },
          frequency: 'monthly',
          isFixed: false,
          startDate: Timestamp.now(),
        }
      ]);
      jest.spyOn(expenseService, 'getExpenseBreakdown').mockResolvedValue({
        rent: { amount: 1000, currency: 'USD' },
        groceries: { amount: 300, currency: 'USD' },
        utilities: { amount: 200, currency: 'USD' },
        entertainment: { amount: 400, currency: 'USD' }, // 20% of total
        other: { amount: 100, currency: 'USD' },
      });

      const analysis = await expenseService.getSpendingAnalysis('user1');

      expect(analysis.suggestions).toContain(
        'Consider reducing entertainment expenses - they represent more than 15% of your total spending'
      );
    });

    it('should generate suggestions for high variable expenses', async () => {
      jest.spyOn(expenseService, 'getMonthlyExpenseTotal').mockResolvedValue({ amount: 2000, currency: 'USD' });
      jest.spyOn(expenseService, 'getFixedExpenses').mockResolvedValue([
        {
          id: '1',
          userId: 'user1',
          category: 'rent',
          name: 'Rent',
          amount: { amount: 500, currency: 'USD' },
          frequency: 'monthly',
          isFixed: true,
          startDate: Timestamp.now(),
        }
      ]);
      jest.spyOn(expenseService, 'getVariableExpenses').mockResolvedValue([
        {
          id: '2',
          userId: 'user1',
          category: 'entertainment',
          name: 'Entertainment',
          amount: { amount: 800, currency: 'USD' },
          frequency: 'monthly',
          isFixed: false,
          startDate: Timestamp.now(),
        }
      ]);
      jest.spyOn(expenseService, 'getExpenseBreakdown').mockResolvedValue({
        rent: { amount: 500, currency: 'USD' },
        groceries: { amount: 300, currency: 'USD' },
        utilities: { amount: 200, currency: 'USD' },
        entertainment: { amount: 800, currency: 'USD' },
        other: { amount: 200, currency: 'USD' },
      });

      const analysis = await expenseService.getSpendingAnalysis('user1');

      expect(analysis.suggestions).toContain(
        'Your variable expenses exceed fixed expenses - look for opportunities to reduce discretionary spending'
      );
    });

    it('should generate suggestions for unbalanced category spending', async () => {
      jest.spyOn(expenseService, 'getMonthlyExpenseTotal').mockResolvedValue({ amount: 2000, currency: 'USD' });
      jest.spyOn(expenseService, 'getFixedExpenses').mockResolvedValue([]);
      jest.spyOn(expenseService, 'getVariableExpenses').mockResolvedValue([]);
      jest.spyOn(expenseService, 'getExpenseBreakdown').mockResolvedValue({
        rent: { amount: 1200, currency: 'USD' }, // 60% of total
        groceries: { amount: 300, currency: 'USD' },
        utilities: { amount: 200, currency: 'USD' },
        entertainment: { amount: 200, currency: 'USD' },
        other: { amount: 100, currency: 'USD' },
      });

      const analysis = await expenseService.getSpendingAnalysis('user1');

      expect(analysis.suggestions).toContain(
        'Your rent expenses are very high - consider ways to optimize this category'
      );
    });
  });

  describe('getExpenseProjections', () => {
    it('should return 12 months of projections', async () => {
      const mockExpenses = [
        {
          id: '1',
          userId: 'user1',
          category: 'rent' as const,
          name: 'Rent',
          amount: { amount: 1000, currency: 'USD' },
          frequency: 'monthly' as const,
          isFixed: true,
          startDate: Timestamp.fromDate(new Date('2024-01-01')),
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        }
      ];

      jest.spyOn(expenseService, 'getAllOrdered').mockResolvedValue(mockExpenses);

      const projections = await expenseService.getExpenseProjections('user1');

      expect(projections).toHaveLength(12);
      expect(projections[0]).toHaveProperty('month');
      expect(projections[0]).toHaveProperty('year');
      expect(projections[0]).toHaveProperty('amount');
    });
  });
});
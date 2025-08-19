import { IncomeService } from '../income-service';
import { IncomeDocument } from '@/types/financial';
import { Timestamp } from 'firebase/firestore';

// Mock Firebase modules
jest.mock('firebase/firestore', () => ({
  Timestamp: {
    now: jest.fn(() => ({ toDate: () => new Date() })),
    fromDate: jest.fn((date: Date) => ({ toDate: () => date })),
  },
}));

jest.mock('../../firebase', () => ({
  db: {},
  auth: {},
}));

jest.mock('../../firebase-service', () => ({
  BaseFirebaseService: class MockBaseFirebaseService {
    constructor(collectionName: string) {}
    async getFiltered() { return []; }
    async create() { return 'mock-id'; }
    async getById() { return null; }
    async getAll() { return []; }
    async update() { return; }
    async delete() { return; }
  },
}));

describe('IncomeService', () => {
  let incomeService: IncomeService;
  let mockIncomes: IncomeDocument[];

  beforeEach(() => {
    incomeService = new IncomeService();
    
    // Mock income data
    mockIncomes = [
      {
        id: '1',
        userId: 'user1',
        type: 'salary',
        source: 'ABC Company',
        amount: { amount: 8000, currency: 'USD' },
        frequency: 'monthly',
        startDate: Timestamp.fromDate(new Date('2024-01-01')),
        isActive: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      },
      {
        id: '2',
        userId: 'user1',
        type: 'bonus',
        source: 'ABC Company',
        amount: { amount: 5000, currency: 'USD' },
        frequency: 'annually',
        startDate: Timestamp.fromDate(new Date('2024-01-01')),
        endDate: Timestamp.fromDate(new Date('2024-12-31')),
        isActive: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      },
      {
        id: '3',
        userId: 'user1',
        type: 'other',
        source: 'Freelance',
        amount: { amount: 2000, currency: 'USD' },
        frequency: 'monthly',
        startDate: Timestamp.fromDate(new Date('2024-01-01')),
        isActive: false,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      },
    ];

    // Mock the getActiveIncomes method
    jest.spyOn(incomeService, 'getActiveIncomes').mockResolvedValue(
      mockIncomes.filter(income => income.isActive)
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateMonthlyIncome', () => {
    it('should calculate monthly income correctly for active sources', async () => {
      const result = await incomeService.calculateMonthlyIncome('user1');
      
      // 8000 (monthly) + 5000/12 (annual) = 8000 + 416.67 = 8416.67
      expect(result.amount).toBeCloseTo(8416.67);
    });

    it('should exclude inactive income sources', async () => {
      // Test with all incomes but only active ones should be calculated
      const allIncomes = [...mockIncomes];
      jest.spyOn(incomeService, 'getActiveIncomes').mockResolvedValue(
        allIncomes.filter(income => income.isActive)
      );
      
      const result = await incomeService.calculateMonthlyIncome('user1');
      
      // Should be 8416.67 because inactive income is excluded
      expect(result.amount).toBeCloseTo(8416.67);
    });
  });

  describe('calculateAnnualIncome', () => {
    it('should calculate annual income correctly', async () => {
      jest.spyOn(incomeService, 'calculateMonthlyIncome').mockResolvedValue({ amount: 8416.67, currency: 'USD' });
      
      const result = await incomeService.calculateAnnualIncome('user1');
      
      expect(result.amount).toBeCloseTo(101000.04); // 8416.67 * 12
    });
  });

  describe('getIncomeProjections', () => {
    it('should generate 12 months of projections', async () => {
      const result = await incomeService.getIncomeProjections('user1');
      
      expect(result).toHaveLength(12);
      expect(result[0]).toHaveProperty('month');
      expect(result[0]).toHaveProperty('amount');
    });

    it('should calculate correct amounts for each month', async () => {
      const result = await incomeService.getIncomeProjections('user1');
      
      // Each month should have the same amount for ongoing income
      result.forEach(projection => {
        expect(projection.amount).toBeCloseTo(8416.67);
      });
    });
  });

  describe('getIncomeBreakdown', () => {
    it('should break down income by type with percentages', async () => {
      jest.spyOn(incomeService, 'calculateMonthlyIncome').mockResolvedValue({ amount: 8416.67, currency: 'USD' });
      
      const result = await incomeService.getIncomeBreakdown('user1');
      
      expect(result).toHaveLength(2); // salary and bonus
      
      const salaryBreakdown = result.find(item => item.type === 'salary');
      const bonusBreakdown = result.find(item => item.type === 'bonus');
      
      expect(salaryBreakdown).toEqual({
        type: 'salary',
        amount: 8000,
        percentage: (8000 / 8416.67) * 100,
      });
      
      expect(bonusBreakdown).toEqual({
        type: 'bonus',
        amount: 416.67, // 5000 / 12
        percentage: (416.67 / 8416.67) * 100,
      });
    });
  });

  describe('convertToMonthly', () => {
    it('should convert weekly amounts correctly', () => {
      const result = (incomeService as any).convertToMonthly(1000, 'weekly');
      expect(result).toBeCloseTo(4330, 0); // 1000 * 4.33
    });

    it('should convert bi-weekly amounts correctly', () => {
      const result = (incomeService as any).convertToMonthly(2000, 'bi-weekly');
      expect(result).toBeCloseTo(4340, 0); // 2000 * 2.17
    });

    it('should return monthly amounts unchanged', () => {
      const result = (incomeService as any).convertToMonthly(5000, 'monthly');
      expect(result).toBe(5000);
    });

    it('should convert quarterly amounts correctly', () => {
      const result = (incomeService as any).convertToMonthly(15000, 'quarterly');
      expect(result).toBe(5000); // 15000 / 3
    });

    it('should convert annual amounts correctly', () => {
      const result = (incomeService as any).convertToMonthly(60000, 'annually');
      expect(result).toBe(5000); // 60000 / 12
    });
  });

  describe('isIncomeActiveForMonth', () => {
    it('should return true for income active in the given month', () => {
      const income = mockIncomes[0];
      const testDate = new Date('2024-06-01');
      
      const result = (incomeService as any).isIncomeActiveForMonth(income, testDate);
      expect(result).toBe(true);
    });

    it('should return false for income that starts after the given month', () => {
      const income = {
        ...mockIncomes[0],
        startDate: Timestamp.fromDate(new Date('2024-07-01')),
      };
      const testDate = new Date('2024-06-01');
      
      const result = (incomeService as any).isIncomeActiveForMonth(income, testDate);
      expect(result).toBe(false);
    });

    it('should return false for income that ends before the given month', () => {
      const income = {
        ...mockIncomes[0],
        endDate: Timestamp.fromDate(new Date('2024-05-31')),
      };
      const testDate = new Date('2024-06-01');
      
      const result = (incomeService as any).isIncomeActiveForMonth(income, testDate);
      expect(result).toBe(false);
    });

    it('should return false for inactive income', () => {
      const income = {
        ...mockIncomes[0],
        isActive: false,
      };
      const testDate = new Date('2024-06-01');
      
      const result = (incomeService as any).isIncomeActiveForMonth(income, testDate);
      expect(result).toBe(false);
    });
  });
});
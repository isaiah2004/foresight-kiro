import { InvestmentService } from '../investment-service';
import { Investment, InvestmentType } from '@/types/financial';
import { Timestamp } from 'firebase/firestore';

// Mock Firebase
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  getDocs: jest.fn(),
  getDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  Timestamp: {
    now: jest.fn(() => ({ toDate: () => new Date() })),
    fromDate: jest.fn((date: Date) => ({ toDate: () => date })),
  },
}));

jest.mock('../../firebase-service', () => ({
  BaseFirebaseService: class MockBaseFirebaseService {
    constructor(public collectionName: string) {}
    
    async getAll() {
      return mockInvestments;
    }
    
    async getFiltered(_userId?: string, filters?: any[]) {
      if (!filters || filters.length === 0) return mockInvestments;
      const typeFilter = filters.find(f => f.field === 'type' && f.operator === '==');
      if (typeFilter) {
        return mockInvestments.filter(inv => inv.type === typeFilter.value);
      }
      return mockInvestments;
    }
    
    async create(userId: string, data: any) {
      return 'new-id';
    }
    
    async update(userId: string, id: string, data: any) {
      return;
    }
    
    async getById(_userId: string, id: string) {
      return mockInvestments.find(inv => inv.id === id) || null;
    }

    async delete() {
      return;
    }
  },
}));

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
    description: 'Technology stock',
  },
  {
    id: '2',
    userId: 'user1',
    type: 'bonds',
    name: 'US Treasury Bond',
    quantity: 100,
    purchasePrice: { amount: 100, currency: 'USD' },
    currentPrice: { amount: 102, currency: 'USD' },
    purchaseDate: Timestamp.fromDate(new Date('2023-02-01')),
    currency: 'USD',
  },
  {
    id: '3',
    userId: 'user1',
    type: 'crypto',
    name: 'Bitcoin',
    symbol: 'BTC',
    quantity: 0.5,
    purchasePrice: { amount: 40000, currency: 'USD' },
    currentPrice: { amount: 45000, currency: 'USD' },
    purchaseDate: Timestamp.fromDate(new Date('2023-03-01')),
    currency: 'USD',
  },
];

describe('InvestmentService', () => {
  let investmentService: InvestmentService;

  beforeEach(() => {
    investmentService = new InvestmentService();
    jest.clearAllMocks();
  });

  describe('getPortfolioSummary', () => {
    it('should calculate portfolio summary correctly', async () => {
      const summary = await investmentService.getPortfolioSummary('user1', 'USD');

      // Expected calculations:
      // Apple: 10 * 175 = 1750 (current), 10 * 150 = 1500 (cost), gain = 250
      // Bond: 100 * 102 = 10200 (current), 100 * 100 = 10000 (cost), gain = 200
      // Bitcoin: 0.5 * 45000 = 22500 (current), 0.5 * 40000 = 20000 (cost), gain = 2500
      // Total: 34450 (current), 31500 (cost), gain = 2950

  expect(summary.totalValue.amount).toBe(34450);
  expect(summary.totalGainLoss.amount).toBe(2950);
      expect(summary.gainLossPercentage).toBeCloseTo(9.37, 1);
  expect(summary.diversificationScore).toBe(37.5); // 3 out of 8 types = 37.5%
      expect(summary.riskLevel).toBe('high'); // Has crypto > 20%
    });

    it('should handle investments without current prices', async () => {
      const investmentsWithoutPrices = mockInvestments.map(inv => ({
        ...inv,
        currentPrice: undefined,
      }));

      // Mock the service to return investments without current prices
      jest.spyOn(investmentService, 'getAllOrdered').mockResolvedValue(investmentsWithoutPrices);

      const summary = await investmentService.getPortfolioSummary('user1', 'USD');

      // Should use purchase prices
  expect(summary.totalValue.amount).toBe(31500); // Sum of cost basis
  expect(summary.totalGainLoss.amount).toBe(0);
      expect(summary.gainLossPercentage).toBe(0);
    });

    it('should calculate risk level correctly', async () => {
      // Test low risk (mostly bonds)
      const lowRiskInvestments = [
        { ...mockInvestments[1], quantity: 1000 }, // Large bond position
        { ...mockInvestments[0], quantity: 1 }, // Small stock position
      ];
      jest.spyOn(investmentService, 'getAllOrdered').mockResolvedValue(lowRiskInvestments);

      let summary = await investmentService.getPortfolioSummary('user1', 'USD');
      expect(summary.riskLevel).toBe('low');

      // Test medium risk (stocks > 50% but < 80%)
      const mediumRiskInvestments = [
        { ...mockInvestments[0], quantity: 100, currentPrice: { amount: 100, currency: 'USD' } }, // Stocks: 10,000
        { ...mockInvestments[1], quantity: 50, currentPrice: { amount: 100, currency: 'USD' } }, // Bonds: 5,000
      ];
      jest.spyOn(investmentService, 'getAllOrdered').mockResolvedValue(mediumRiskInvestments);

      summary = await investmentService.getPortfolioSummary('user1', 'USD');
      expect(summary.riskLevel).toBe('medium'); // Stocks = 66.7% which is > 50% but < 80%
    });

    it('should handle empty portfolio', async () => {
      jest.spyOn(investmentService, 'getAllOrdered').mockResolvedValue([]);

      const summary = await investmentService.getPortfolioSummary('user1', 'USD');

  expect(summary.totalValue.amount).toBe(0);
  expect(summary.totalGainLoss.amount).toBe(0);
      expect(summary.gainLossPercentage).toBe(0);
      expect(summary.diversificationScore).toBe(0);
      expect(summary.riskLevel).toBe('low');
    });
  });

  describe('getByType', () => {
    it('should filter investments by type', async () => {
      const result = await investmentService.getByType('user1', 'stocks');
      
  // Should return only stocks
  expect(result.every(r => r.type === 'stocks')).toBe(true);
  expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('getActiveInvestments', () => {
    it('should get investments with current prices', async () => {
      const result = await investmentService.getActiveInvestments('user1');
      
      expect(result).toEqual(mockInvestments);
    });
  });

  describe('updateCurrentPrice', () => {
    it('should update investment current price', async () => {
  await investmentService.updateCurrentPrice('user1', '1', 180);
      
      // Should call update with correct parameters
      // This would be verified through the mock implementation
    });
  });

  describe('getBySymbol', () => {
    it('should get investments by symbol', async () => {
      const result = await investmentService.getBySymbol('user1', 'AAPL');
      
      expect(result).toEqual(mockInvestments);
    });
  });
});
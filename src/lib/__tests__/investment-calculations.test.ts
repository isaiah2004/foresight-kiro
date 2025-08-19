import { calculatePortfolioValue } from '../dashboard-calculations';
import { Investment } from '@/types/financial';
import { Timestamp } from 'firebase/firestore';

describe('Investment Calculations', () => {
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
      purchaseDate: Timestamp.fromDate(new Date('2023-03-01')),
      currency: 'USD',
      // No current price - should use purchase price
    },
  ];

  describe('calculatePortfolioValue', () => {
    it('should calculate total portfolio value correctly', () => {
      const result = calculatePortfolioValue(mockInvestments);

      // Expected calculation:
      // Apple: 10 * 175 = 1750
      // Bond: 100 * 102 = 10200
      // Bitcoin: 0.5 * 40000 = 20000 (using purchase price)
      // Total: 31950

      expect(result).toBe(31950);
    });

    it('should return 0 for empty investments', () => {
      const result = calculatePortfolioValue([]);
      expect(result).toBe(0);
    });

    it('should handle investments with zero quantities', () => {
      const investmentsWithZero: Investment[] = [
        {
          ...mockInvestments[0],
          quantity: 0,
        },
      ];

      const result = calculatePortfolioValue(investmentsWithZero);
      expect(result).toBe(0);
    });

    it('should handle investments with zero prices', () => {
      const investmentsWithZeroPrice: Investment[] = [
        {
          ...mockInvestments[0],
          purchasePrice: { amount: 0, currency: 'USD' },
          currentPrice: { amount: 0, currency: 'USD' },
        },
      ];

      const result = calculatePortfolioValue(investmentsWithZeroPrice);
      expect(result).toBe(0);
    });

    it('should use current price when available, purchase price otherwise', () => {
      const mixedInvestments: Investment[] = [
        {
          ...mockInvestments[0],
          currentPrice: { amount: 200, currency: 'USD' }, // Has current price
        },
        {
          ...mockInvestments[1],
          currentPrice: undefined, // No current price
        },
      ];

      const result = calculatePortfolioValue(mixedInvestments);

      // Expected calculation:
      // Apple: 10 * 200 = 2000 (using current price)
      // Bond: 100 * 100 = 10000 (using purchase price)
      // Total: 12000

      expect(result).toBe(12000);
    });

    it('should handle fractional quantities', () => {
      const fractionalInvestments: Investment[] = [
        {
          ...mockInvestments[0],
          quantity: 10.5,
          currentPrice: { amount: 100, currency: 'USD' },
        },
      ];

      const result = calculatePortfolioValue(fractionalInvestments);
      expect(result).toBe(1050); // 10.5 * 100
    });

    it('should handle large numbers correctly', () => {
      const largeInvestments: Investment[] = [
        {
          ...mockInvestments[0],
          quantity: 1000000,
          currentPrice: { amount: 1000, currency: 'USD' },
        },
      ];

      const result = calculatePortfolioValue(largeInvestments);
      expect(result).toBe(1000000000); // 1M * 1000
    });
  });

  describe('Portfolio Performance Calculations', () => {
    it('should calculate gain/loss correctly', () => {
      const investment = mockInvestments[0]; // Apple with current price 175, purchase price 150
      const currentValue = (investment.currentPrice || investment.purchasePrice).amount * investment.quantity;
      const costBasis = investment.purchasePrice.amount * investment.quantity;
      const gainLoss = currentValue - costBasis;
      const gainLossPercentage = (gainLoss / costBasis) * 100;

      expect(currentValue).toBe(1750); // 10 * 175
      expect(costBasis).toBe(1500); // 10 * 150
      expect(gainLoss).toBe(250); // 1750 - 1500
      expect(gainLossPercentage).toBeCloseTo(16.67, 2); // (250 / 1500) * 100
    });

    it('should handle negative performance', () => {
      const losingInvestment: Investment = {
        ...mockInvestments[0],
        purchasePrice: { amount: 200, currency: 'USD' },
        currentPrice: { amount: 150, currency: 'USD' },
      };

      const currentValue = losingInvestment.currentPrice!.amount * losingInvestment.quantity;
      const costBasis = losingInvestment.purchasePrice.amount * losingInvestment.quantity;
      const gainLoss = currentValue - costBasis;
      const gainLossPercentage = (gainLoss / costBasis) * 100;

      expect(currentValue).toBe(1500); // 10 * 150
      expect(costBasis).toBe(2000); // 10 * 200
      expect(gainLoss).toBe(-500); // 1500 - 2000
      expect(gainLossPercentage).toBe(-25); // (-500 / 2000) * 100
    });

    it('should handle zero cost basis', () => {
      const freeInvestment: Investment = {
        ...mockInvestments[0],
        purchasePrice: { amount: 0, currency: 'USD' },
        currentPrice: { amount: 100, currency: 'USD' },
      };

      const currentValue = freeInvestment.currentPrice!.amount * freeInvestment.quantity;
      const costBasis = freeInvestment.purchasePrice.amount * freeInvestment.quantity;
      const gainLoss = currentValue - costBasis;
      const gainLossPercentage = costBasis > 0 ? (gainLoss / costBasis) * 100 : 0;

      expect(currentValue).toBe(1000); // 10 * 100
      expect(costBasis).toBe(0); // 10 * 0
      expect(gainLoss).toBe(1000); // 1000 - 0
      expect(gainLossPercentage).toBe(0); // Avoid division by zero
    });
  });
});
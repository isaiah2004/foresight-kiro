import { incomeService } from '../income-service';
import { currencyService } from '../currency-service';
import { userService } from '../user-service';
import { IncomeDocument, CurrencyAmount, CurrencyExposure } from '@/types/financial';
import { Timestamp } from 'firebase/firestore';

// Mock the dependencies
jest.mock('../currency-service');
jest.mock('../user-service');
jest.mock('../firebase-service');

const mockCurrencyService = currencyService as jest.Mocked<typeof currencyService>;
const mockUserService = userService as jest.Mocked<typeof userService>;

describe('IncomeService Multi-Currency Support', () => {
  const userId = 'test-user-id';
  const mockUser = {
    id: userId,
    preferences: {
      primaryCurrency: 'USD',
      locale: 'en-US',
      riskTolerance: 'moderate' as const,
      notifications: true,
      showOriginalCurrencies: true,
      autoDetectCurrency: true
    }
  };

  const mockIncomes: IncomeDocument[] = [
    {
      id: '1',
      userId,
      type: 'salary',
      source: 'US Company',
      amount: { amount: 5000, currency: 'USD' },
      frequency: 'monthly',
      startDate: Timestamp.fromDate(new Date('2024-01-01')),
      isActive: true,
      createdAt: Timestamp.fromDate(new Date()),
      updatedAt: Timestamp.fromDate(new Date())
    },
    {
      id: '2',
      userId,
      type: 'salary',
      source: 'UK Company',
      amount: { amount: 3000, currency: 'GBP' },
      frequency: 'monthly',
      startDate: Timestamp.fromDate(new Date('2024-01-01')),
      isActive: true,
      createdAt: Timestamp.fromDate(new Date()),
      updatedAt: Timestamp.fromDate(new Date())
    },
    {
      id: '3',
      userId,
      type: 'bonus',
      source: 'EU Client',
      amount: { amount: 2000, currency: 'EUR' },
      frequency: 'quarterly',
      startDate: Timestamp.fromDate(new Date('2024-01-01')),
      isActive: true,
      createdAt: Timestamp.fromDate(new Date()),
      updatedAt: Timestamp.fromDate(new Date())
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock user service
    mockUserService.getById.mockResolvedValue(mockUser as any);
    
    // Mock currency conversion
    mockCurrencyService.convertAmount.mockImplementation(async (amount, from, to) => {
      const rates: Record<string, Record<string, number>> = {
        'GBP': { 'USD': 1.25 },
        'EUR': { 'USD': 1.1 },
        'USD': { 'USD': 1 }
      };
      
      const rate = rates[from]?.[to] || 1;
      return {
        amount: amount * rate,
        currency: to,
        exchangeRate: rate,
        lastUpdated: new Date()
      };
    });

    // Mock income service methods
    jest.spyOn(incomeService, 'getActiveIncomes').mockResolvedValue(mockIncomes);
  });

  describe('calculateMonthlyIncome', () => {
    it('should calculate total monthly income with currency conversion', async () => {
      const result = await incomeService.calculateMonthlyIncome(userId);

      expect(result).toEqual({
        amount: 9416.67, // 5000 + (3000 * 1.25) + (2000 * 1.1 / 3)
        currency: 'USD'
      });
      
      expect(mockCurrencyService.convertAmount).toHaveBeenCalledWith(3000, 'GBP', 'USD');
      expect(mockCurrencyService.convertAmount).toHaveBeenCalledWith(666.67, 'EUR', 'USD'); // 2000/3 quarterly to monthly
    });

    it('should handle currency conversion failures gracefully', async () => {
      mockCurrencyService.convertAmount.mockRejectedValueOnce(new Error('Conversion failed'));

      const result = await incomeService.calculateMonthlyIncome(userId);

      // Should still return a result with fallback amounts
      expect(result.currency).toBe('USD');
      expect(result.amount).toBeGreaterThan(0);
    });

    it('should return zero for users with no income', async () => {
      jest.spyOn(incomeService, 'getActiveIncomes').mockResolvedValue([]);

      const result = await incomeService.calculateMonthlyIncome(userId);

      expect(result).toEqual({
        amount: 0,
        currency: 'USD'
      });
    });
  });

  describe('getIncomeProjections', () => {
    it('should generate 12-month projections with currency conversion', async () => {
      const projections = await incomeService.getIncomeProjections(userId);

      expect(projections).toHaveLength(12);
      expect(projections[0]).toMatchObject({
        month: expect.any(String),
        amount: expect.any(Number),
        currency: 'USD'
      });

      // All projections should be in primary currency
      projections.forEach(projection => {
        expect(projection.currency).toBe('USD');
        expect(projection.amount).toBeGreaterThan(0);
      });
    });

    it('should handle inactive income sources correctly', async () => {
      const inactiveIncomes = mockIncomes.map(income => ({
        ...income,
        isActive: false
      }));
      jest.spyOn(incomeService, 'getActiveIncomes').mockResolvedValue(inactiveIncomes);

      const projections = await incomeService.getIncomeProjections(userId);

      projections.forEach(projection => {
        expect(projection.amount).toBe(0);
      });
    });
  });

  describe('getIncomeByCurrency', () => {
    it('should return currency exposure breakdown', async () => {
      const exposures = await incomeService.getIncomeByCurrency(userId);

      expect(exposures).toHaveLength(3);
      
      // Should be sorted by percentage (highest first)
      expect(exposures[0].percentage).toBeGreaterThanOrEqual(exposures[1].percentage);
      
      // Check structure
      exposures.forEach(exposure => {
        expect(exposure).toMatchObject({
          currency: expect.any(String),
          totalValue: expect.objectContaining({
            amount: expect.any(Number),
            currency: 'USD'
          }),
          percentage: expect.any(Number),
          riskLevel: expect.stringMatching(/^(low|medium|high)$/)
        });
      });
    });

    it('should assign appropriate risk levels', async () => {
      const exposures = await incomeService.getIncomeByCurrency(userId);

      // USD should be low risk (primary currency)
      const usdExposure = exposures.find(exp => exp.currency === 'USD');
      expect(usdExposure?.riskLevel).toBe('low');

      // Foreign currencies with high exposure should have higher risk
      const foreignExposures = exposures.filter(exp => exp.currency !== 'USD');
      foreignExposures.forEach(exposure => {
        if (exposure.percentage > 50) {
          expect(exposure.riskLevel).toBe('high');
        } else if (exposure.percentage > 20) {
          expect(exposure.riskLevel).toBe('medium');
        }
      });
    });
  });

  describe('getExchangeRateImpact', () => {
    it('should analyze exchange rate impact for foreign income', async () => {
      const impact = await incomeService.getExchangeRateImpact(userId);

      expect(impact).toMatchObject({
        totalForeignIncome: expect.objectContaining({
          amount: expect.any(Number),
          currency: 'USD'
        }),
        currencyRisks: expect.arrayContaining([
          expect.objectContaining({
            currency: expect.any(String),
            monthlyAmount: expect.objectContaining({
              amount: expect.any(Number),
              currency: expect.any(String)
            }),
            potentialImpact: expect.objectContaining({
              best: expect.any(Number),
              worst: expect.any(Number)
            })
          })
        ]),
        recommendations: expect.arrayContaining([
          expect.any(String)
        ])
      });
    });

    it('should provide relevant recommendations for high foreign exposure', async () => {
      const impact = await incomeService.getExchangeRateImpact(userId);

      expect(impact.recommendations.length).toBeGreaterThan(0);
      expect(impact.recommendations.some(rec => 
        rec.includes('Monitor exchange rates') || 
        rec.includes('hedging') || 
        rec.includes('diversify')
      )).toBe(true);
    });
  });

  describe('getCurrencySpecificProjections', () => {
    it('should generate projections for specific target currency', async () => {
      const result = await incomeService.getCurrencySpecificProjections(userId, 'EUR');

      expect(result).toMatchObject({
        projections: expect.arrayContaining([
          expect.objectContaining({
            month: expect.any(String),
            amount: expect.any(Number),
            currency: 'EUR'
          })
        ]),
        exchangeRateAssumptions: expect.arrayContaining([
          expect.objectContaining({
            currency: expect.any(String),
            rate: expect.any(Number)
          })
        ])
      });

      expect(result.projections).toHaveLength(12);
      result.projections.forEach(projection => {
        expect(projection.currency).toBe('EUR');
      });
    });
  });

  describe('getTaxImplications', () => {
    it('should analyze tax implications for multi-currency income', async () => {
      const implications = await incomeService.getTaxImplications(userId);

      expect(implications).toMatchObject({
        domesticIncome: expect.objectContaining({
          amount: expect.any(Number),
          currency: 'USD'
        }),
        foreignIncome: expect.objectContaining({
          amount: expect.any(Number),
          currency: 'USD'
        }),
        taxConsiderations: expect.arrayContaining([
          expect.objectContaining({
            currency: expect.any(String),
            monthlyAmount: expect.objectContaining({
              amount: expect.any(Number),
              currency: expect.any(String)
            }),
            considerations: expect.arrayContaining([
              expect.any(String)
            ])
          })
        ]),
        generalRecommendations: expect.arrayContaining([
          expect.any(String)
        ])
      });
    });

    it('should provide appropriate tax recommendations', async () => {
      const implications = await incomeService.getTaxImplications(userId);

      expect(implications.generalRecommendations.length).toBeGreaterThan(0);
      expect(implications.generalRecommendations.some(rec => 
        rec.includes('tax professional') || 
        rec.includes('records') || 
        rec.includes('treaties')
      )).toBe(true);
    });

    it('should identify high foreign income scenarios', async () => {
      // Mock scenario with high foreign income
      const highForeignIncomes = [
        {
          ...mockIncomes[0],
          amount: { amount: 1000, currency: 'USD' } // Low domestic
        },
        {
          ...mockIncomes[1],
          amount: { amount: 8000, currency: 'GBP' } // High foreign
        }
      ];
      jest.spyOn(incomeService, 'getActiveIncomes').mockResolvedValue(highForeignIncomes);

      const implications = await incomeService.getTaxImplications(userId);

      expect(implications.generalRecommendations.some(rec => 
        rec.includes('significant portion') && rec.includes('professional tax advice')
      )).toBe(true);
    });
  });

  describe('getIncomeBreakdown', () => {
    it('should provide breakdown with currency conversion', async () => {
      const breakdown = await incomeService.getIncomeBreakdown(userId);

      expect(breakdown.length).toBeGreaterThan(0);
      breakdown.forEach(item => {
        expect(item).toMatchObject({
          type: expect.any(String),
          amount: expect.any(Number),
          percentage: expect.any(Number),
          currency: 'USD'
        });
      });

      // Percentages should add up to 100
      const totalPercentage = breakdown.reduce((sum, item) => sum + item.percentage, 0);
      expect(totalPercentage).toBeCloseTo(100, 1);
    });
  });

  describe('frequency conversion', () => {
    it('should correctly convert different frequencies to monthly', async () => {
      const testIncomes: IncomeDocument[] = [
        { ...mockIncomes[0], frequency: 'weekly', amount: { amount: 1000, currency: 'USD' } },
        { ...mockIncomes[0], frequency: 'bi-weekly', amount: { amount: 2000, currency: 'USD' } },
        { ...mockIncomes[0], frequency: 'quarterly', amount: { amount: 12000, currency: 'USD' } },
        { ...mockIncomes[0], frequency: 'annually', amount: { amount: 48000, currency: 'USD' } }
      ];

      jest.spyOn(incomeService, 'getActiveIncomes').mockResolvedValue(testIncomes);

      const result = await incomeService.calculateMonthlyIncome(userId);

      // All should convert to approximately 4000/month each
      // Weekly: 1000 * 4.33 = 4330
      // Bi-weekly: 2000 * 2.17 = 4340  
      // Quarterly: 12000 / 3 = 4000
      // Annually: 48000 / 12 = 4000
      expect(result.amount).toBeCloseTo(16670, 0); // Sum of all converted amounts
    });
  });
});
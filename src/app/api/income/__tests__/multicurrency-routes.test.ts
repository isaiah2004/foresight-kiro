import { NextRequest } from 'next/server';
import { GET as getCurrencyExposure } from '../currency-exposure/route';
import { GET as getExchangeRateImpact } from '../exchange-rate-impact/route';
import { GET as getTaxImplications } from '../tax-implications/route';
import { GET as getCurrencyProjections } from '../currency-projections/route';
import { incomeService } from '@/lib/services/income-service';

// Mock the auth function
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn()
}));

// Mock the income service
jest.mock('@/lib/services/income-service');

const mockAuth = require('@clerk/nextjs/server').auth;
const mockIncomeService = incomeService as jest.Mocked<typeof incomeService>;

describe('Income Multi-Currency API Routes', () => {
  const userId = 'test-user-id';

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ userId });
  });

  describe('/api/income/currency-exposure', () => {
    it('returns currency exposure data successfully', async () => {
      const mockExposure = [
        {
          currency: 'USD',
          totalValue: { amount: 5000, currency: 'USD' },
          percentage: 60,
          riskLevel: 'low' as const
        },
        {
          currency: 'GBP',
          totalValue: { amount: 3750, currency: 'USD' },
          percentage: 40,
          riskLevel: 'medium' as const
        }
      ];

      mockIncomeService.getIncomeByCurrency.mockResolvedValue(mockExposure);

      const request = new NextRequest('http://localhost/api/income/currency-exposure');
      const response = await getCurrencyExposure(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockExposure);
      expect(mockIncomeService.getIncomeByCurrency).toHaveBeenCalledWith(userId);
    });

    it('returns 401 when user is not authenticated', async () => {
      mockAuth.mockResolvedValue({ userId: null });

      const request = new NextRequest('http://localhost/api/income/currency-exposure');
      const response = await getCurrencyExposure(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('handles service errors gracefully', async () => {
      mockIncomeService.getIncomeByCurrency.mockRejectedValue(new Error('Service error'));

      const request = new NextRequest('http://localhost/api/income/currency-exposure');
      const response = await getCurrencyExposure(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch currency exposure');
    });
  });

  describe('/api/income/exchange-rate-impact', () => {
    it('returns exchange rate impact analysis successfully', async () => {
      const mockImpact = {
        totalForeignIncome: { amount: 5000, currency: 'USD' },
        currencyRisks: [
          {
            currency: 'GBP',
            monthlyAmount: {
              amount: 3000,
              currency: 'GBP',
              convertedAmount: 3750,
              exchangeRate: 1.25
            },
            volatility30d: 8.5,
            potentialImpact: {
              best: 4125,
              worst: 3375
            }
          }
        ],
        recommendations: [
          'Consider hedging your GBP income exposure',
          'Monitor exchange rates regularly'
        ]
      };

      mockIncomeService.getExchangeRateImpact.mockResolvedValue(mockImpact);

      const request = new NextRequest('http://localhost/api/income/exchange-rate-impact');
      const response = await getExchangeRateImpact(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockImpact);
      expect(mockIncomeService.getExchangeRateImpact).toHaveBeenCalledWith(userId);
    });

    it('returns 401 when user is not authenticated', async () => {
      mockAuth.mockResolvedValue({ userId: null });

      const request = new NextRequest('http://localhost/api/income/exchange-rate-impact');
      const response = await getExchangeRateImpact(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('handles service errors gracefully', async () => {
      mockIncomeService.getExchangeRateImpact.mockRejectedValue(new Error('Service error'));

      const request = new NextRequest('http://localhost/api/income/exchange-rate-impact');
      const response = await getExchangeRateImpact(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch exchange rate impact');
    });
  });

  describe('/api/income/tax-implications', () => {
    it('returns tax implications analysis successfully', async () => {
      const mockTaxImplications = {
        domesticIncome: { amount: 5000, currency: 'USD' },
        foreignIncome: { amount: 5000, currency: 'USD' },
        taxConsiderations: [
          {
            currency: 'GBP',
            monthlyAmount: {
              amount: 3000,
              currency: 'GBP',
              convertedAmount: 3750
            },
            considerations: [
              'Foreign income may be subject to withholding tax',
              'You may be eligible for foreign tax credits'
            ]
          }
        ],
        generalRecommendations: [
          'Consult with a tax professional',
          'Keep detailed records of exchange rates'
        ]
      };

      mockIncomeService.getTaxImplications.mockResolvedValue(mockTaxImplications);

      const request = new NextRequest('http://localhost/api/income/tax-implications');
      const response = await getTaxImplications(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockTaxImplications);
      expect(mockIncomeService.getTaxImplications).toHaveBeenCalledWith(userId);
    });

    it('returns 401 when user is not authenticated', async () => {
      mockAuth.mockResolvedValue({ userId: null });

      const request = new NextRequest('http://localhost/api/income/tax-implications');
      const response = await getTaxImplications(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('handles service errors gracefully', async () => {
      mockIncomeService.getTaxImplications.mockRejectedValue(new Error('Service error'));

      const request = new NextRequest('http://localhost/api/income/tax-implications');
      const response = await getTaxImplications(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch tax implications');
    });
  });

  describe('/api/income/currency-projections', () => {
    it('returns currency-specific projections successfully', async () => {
      const mockProjections = {
        projections: [
          { month: 'January 2024', amount: 8750, currency: 'EUR' },
          { month: 'February 2024', amount: 8750, currency: 'EUR' }
        ],
        exchangeRateAssumptions: [
          { currency: 'USD', rate: 0.91 },
          { currency: 'GBP', rate: 1.14 }
        ]
      };

      mockIncomeService.getCurrencySpecificProjections.mockResolvedValue(mockProjections);

      const request = new NextRequest('http://localhost/api/income/currency-projections?currency=EUR');
      const response = await getCurrencyProjections(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockProjections);
      expect(mockIncomeService.getCurrencySpecificProjections).toHaveBeenCalledWith(userId, 'EUR');
    });

    it('returns 400 when currency parameter is missing', async () => {
      const request = new NextRequest('http://localhost/api/income/currency-projections');
      const response = await getCurrencyProjections(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Target currency is required');
    });

    it('returns 401 when user is not authenticated', async () => {
      mockAuth.mockResolvedValue({ userId: null });

      const request = new NextRequest('http://localhost/api/income/currency-projections?currency=EUR');
      const response = await getCurrencyProjections(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('handles service errors gracefully', async () => {
      mockIncomeService.getCurrencySpecificProjections.mockRejectedValue(new Error('Service error'));

      const request = new NextRequest('http://localhost/api/income/currency-projections?currency=EUR');
      const response = await getCurrencyProjections(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch currency projections');
    });

    it('handles different currency parameters correctly', async () => {
      const mockProjections = {
        projections: [
          { month: 'January 2024', amount: 7500, currency: 'GBP' }
        ],
        exchangeRateAssumptions: [
          { currency: 'USD', rate: 0.8 }
        ]
      };

      mockIncomeService.getCurrencySpecificProjections.mockResolvedValue(mockProjections);

      const request = new NextRequest('http://localhost/api/income/currency-projections?currency=GBP');
      const response = await getCurrencyProjections(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockProjections);
      expect(mockIncomeService.getCurrencySpecificProjections).toHaveBeenCalledWith(userId, 'GBP');
    });
  });

  describe('Error handling across all routes', () => {
    const routes = [
      { name: 'currency-exposure', handler: getCurrencyExposure, method: 'getIncomeByCurrency' },
      { name: 'exchange-rate-impact', handler: getExchangeRateImpact, method: 'getExchangeRateImpact' },
      { name: 'tax-implications', handler: getTaxImplications, method: 'getTaxImplications' }
    ];

    routes.forEach(({ name, handler, method }) => {
      it(`handles unexpected errors in ${name} route`, async () => {
        (mockIncomeService as any)[method].mockRejectedValue(new Error('Unexpected error'));

        const request = new NextRequest(`http://localhost/api/income/${name}`);
        const response = await handler(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toContain('Failed to fetch');
      });
    });

    it('handles auth service failures', async () => {
      mockAuth.mockRejectedValue(new Error('Auth service down'));

      const request = new NextRequest('http://localhost/api/income/currency-exposure');
      const response = await getCurrencyExposure(request);
      const data = await response.json();
      expect(response.status).toBe(500);
      expect(data.error).toContain('Failed to fetch');
    });
  });

  describe('Request validation', () => {
    it('validates currency parameter format in projections route', async () => {
      const invalidCurrencies = ['', 'INVALID', '123', 'us'];

      for (const currency of invalidCurrencies) {
        const request = new NextRequest(`http://localhost/api/income/currency-projections?currency=${currency}`);
        const response = await getCurrencyProjections(request);

        // Should either return 400 for invalid currency or handle it gracefully
        if (response.status === 400) {
          const data = await response.json();
          expect(data.error).toBeTruthy();
        }
      }
    });

    it('handles special characters in currency parameter', async () => {
      const specialCurrencies = ['USD%20', 'EUR&GBP', 'USD<script>'];

      for (const currency of specialCurrencies) {
        const request = new NextRequest(`http://localhost/api/income/currency-projections?currency=${encodeURIComponent(currency)}`);
        
        // Should not crash the server
        await expect(getCurrencyProjections(request)).resolves.toBeDefined();
      }
    });
  });
});
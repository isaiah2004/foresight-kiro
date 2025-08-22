import { LoanService } from '../loan-service';
import { currencyService } from '../currency-service';
import { userService } from '../user-service';
import { Loan, LoanType, CurrencyAmount, CurrencyExposure } from '@/types/financial';
import { Timestamp } from 'firebase/firestore';

// Mock dependencies
jest.mock('../currency-service');
jest.mock('../user-service');

// Mock Firebase service
class MockFirebaseService {
  collection: string;
  
  constructor(collection: string) {
    this.collection = collection;
  }
  
  async getAll() { return []; }
  async getAllOrdered() { return []; }
  async getById() { return null; }
  async create() { return 'mock-id'; }
  async update() { return; }
  async delete() { return; }
}

jest.mock('../firebase-service', () => ({
  BaseFirebaseService: MockFirebaseService
}));

const mockCurrencyService = currencyService as jest.Mocked<typeof currencyService>;
const mockUserService = userService as jest.Mocked<typeof userService>;

describe('LoanService Multi-Currency', () => {
  let loanService: LoanService;
  const mockUserId = 'test-user-id';
  const primaryCurrency = 'USD';

  beforeEach(() => {
    loanService = new LoanService();
    jest.clearAllMocks();

    // Mock user service
    mockUserService.getById.mockResolvedValue({
      id: mockUserId,
      userId: mockUserId,
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      preferences: {
        primaryCurrency: 'USD',
        locale: 'en-US',
        riskTolerance: 'moderate',
        notifications: true,
        showOriginalCurrencies: true,
        autoDetectCurrency: true
      },
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });

    // Mock currency service
    mockCurrencyService.convertAmount.mockImplementation(async (amount, from, to) => {
      if (from === to) return { amount, currency: to };
      
      // Simple mock conversion rates
      const rates: { [key: string]: number } = {
        'EUR-USD': 1.1,
        'GBP-USD': 1.3,
        'USD-EUR': 0.91,
        'USD-GBP': 0.77
      };
      
      const rate = rates[`${from}-${to}`] || 1;
      return { amount: amount * rate, currency: to };
    });
  });

  const createMockLoan = (
    id: string,
    amount: number,
    currency: string,
    category: LoanType,
    interestRate: number = 5
  ): Loan => ({
    id,
    userId: mockUserId,
    type: category,
    name: `Test ${category} Loan`,
    principal: { amount, currency },
    currentBalance: { amount: amount * 0.8, currency }, // 80% remaining
    interestRate,
    termMonths: 60,
    monthlyPayment: { amount: amount * 0.02, currency }, // 2% monthly
    startDate: Timestamp.now(),
    nextPaymentDate: Timestamp.now()
  });

  describe('getTotalDebt', () => {
    it('should calculate total debt with currency conversion', async () => {
      const loans = [
        createMockLoan('1', 10000, 'USD', 'personal'),
        createMockLoan('2', 5000, 'EUR', 'car'),
        createMockLoan('3', 3000, 'GBP', 'home')
      ];

      jest.spyOn(loanService, 'getActiveLoans').mockResolvedValue(loans);

      const result = await loanService.getTotalDebt(mockUserId, primaryCurrency);

      expect(result.currency).toBe('USD');
      // USD: 8000 + EUR: 4000 * 1.1 + GBP: 2400 * 1.3 = 8000 + 4400 + 3120 = 15520
      expect(result.amount).toBeCloseTo(15520, 0);
    });

    it('should handle same currency loans without conversion', async () => {
      const loans = [
        createMockLoan('1', 10000, 'USD', 'personal'),
        createMockLoan('2', 5000, 'USD', 'car')
      ];

      jest.spyOn(loanService, 'getActiveLoans').mockResolvedValue(loans);

      const result = await loanService.getTotalDebt(mockUserId, primaryCurrency);

      expect(result.currency).toBe('USD');
      expect(result.amount).toBe(12000); // 8000 + 4000
      expect(mockCurrencyService.convertAmount).not.toHaveBeenCalled();
    });

    it('should handle empty loans array', async () => {
      jest.spyOn(loanService, 'getActiveLoans').mockResolvedValue([]);

      const result = await loanService.getTotalDebt(mockUserId, primaryCurrency);

      expect(result.currency).toBe('USD');
      expect(result.amount).toBe(0);
    });
  });

  describe('getTotalMonthlyPayments', () => {
    it('should calculate total monthly payments with currency conversion', async () => {
      const loans = [
        createMockLoan('1', 10000, 'USD', 'personal'),
        createMockLoan('2', 5000, 'EUR', 'car')
      ];

      jest.spyOn(loanService, 'getActiveLoans').mockResolvedValue(loans);

      const result = await loanService.getTotalMonthlyPayments(mockUserId, primaryCurrency);

      expect(result.currency).toBe('USD');
      // USD: 200 + EUR: 100 * 1.1 = 200 + 110 = 310
      expect(result.amount).toBeCloseTo(310, 0);
    });
  });

  describe('getDebtToIncomeRatio', () => {
    it('should calculate debt-to-income ratio with currency conversion', async () => {
      const loans = [createMockLoan('1', 10000, 'EUR', 'personal')];
      jest.spyOn(loanService, 'getActiveLoans').mockResolvedValue(loans);

      const monthlyIncome = { amount: 5000, currency: 'USD' };
      const ratio = await loanService.getDebtToIncomeRatio(mockUserId, monthlyIncome);

      // EUR payment: 200 * 1.1 = 220 USD
      // Ratio: (220 / 5000) * 100 = 4.4%
      expect(ratio).toBeCloseTo(4.4, 1);
    });
  });

  describe('getCurrencyExposure', () => {
    it('should analyze currency exposure across loans', async () => {
      const loans = [
        createMockLoan('1', 10000, 'USD', 'personal'),
        createMockLoan('2', 5000, 'EUR', 'car'),
        createMockLoan('3', 3000, 'GBP', 'home')
      ];

      jest.spyOn(loanService, 'getActiveLoans').mockResolvedValue(loans);
      jest.spyOn(loanService, 'getTotalDebt').mockResolvedValue({ amount: 15520, currency: 'USD' });

      const result = await loanService.getCurrencyExposure(mockUserId, primaryCurrency);

      expect(result).toHaveLength(3);
      
      const usdExposure = result.find(e => e.currency === 'USD');
      expect(usdExposure?.percentage).toBeCloseTo(51.5, 1); // 8000/15520 * 100
      expect(usdExposure?.riskLevel).toBe('low');

      const eurExposure = result.find(e => e.currency === 'EUR');
      expect(eurExposure?.percentage).toBeCloseTo(28.4, 1); // 4400/15520 * 100
      expect(eurExposure?.riskLevel).toBe('medium');

      const gbpExposure = result.find(e => e.currency === 'GBP');
      expect(gbpExposure?.percentage).toBeCloseTo(20.1, 1); // 3120/15520 * 100
      expect(gbpExposure?.riskLevel).toBe('low');
    });

    it('should return empty array for no loans', async () => {
      jest.spyOn(loanService, 'getActiveLoans').mockResolvedValue([]);

      const result = await loanService.getCurrencyExposure(mockUserId, primaryCurrency);

      expect(result).toEqual([]);
    });
  });

  describe('getMultiCurrencyProjections', () => {
    it('should generate 12-month projections with exchange rate impact', async () => {
      const loans = [
        createMockLoan('1', 12000, 'USD', 'personal'),
        createMockLoan('2', 6000, 'EUR', 'car')
      ];

      jest.spyOn(loanService, 'getActiveLoans').mockResolvedValue(loans);
      jest.spyOn(loanService, 'generateAmortizationSchedule').mockReturnValue([
        { paymentNumber: 1, paymentDate: new Date(), principalPayment: 100, interestPayment: 50, remainingBalance: 9500 },
        { paymentNumber: 2, paymentDate: new Date(), principalPayment: 100, interestPayment: 50, remainingBalance: 9400 },
        // ... more payments
      ]);

      const result = await loanService.getMultiCurrencyProjections(mockUserId, primaryCurrency);

      expect(result).toHaveLength(12);
      expect(result[0].totalDebt.currency).toBe('USD');
      expect(result[0].currencyBreakdown).toHaveProperty('USD');
      expect(result[0].currencyBreakdown).toHaveProperty('EUR');
      expect(typeof result[0].exchangeRateImpact).toBe('number');
    });
  });

  describe('getLoanOptimizationRecommendations', () => {
    it('should provide comprehensive optimization recommendations', async () => {
      const loans = [
        createMockLoan('1', 10000, 'USD', 'personal', 3), // Low interest
        createMockLoan('2', 5000, 'EUR', 'car', 8), // High interest
        createMockLoan('3', 3000, 'GBP', 'home', 12) // Very high interest
      ];

      jest.spyOn(loanService, 'getActiveLoans').mockResolvedValue(loans);
      jest.spyOn(loanService, 'getCurrencyExposure').mockResolvedValue([
        {
          currency: 'EUR',
          totalValue: { amount: 4000, currency: 'EUR' },
          percentage: 30,
          riskLevel: 'high'
        }
      ]);
      jest.spyOn(loanService, 'getDebtPayoffStrategies').mockResolvedValue({
        snowball: { order: loans, totalInterest: 5000, payoffTime: 60 },
        avalanche: { order: loans.reverse(), totalInterest: 4500, payoffTime: 58 }
      });

      const result = await loanService.getLoanOptimizationRecommendations(mockUserId, primaryCurrency);

      expect(result.currencyRiskAnalysis.highRiskLoans).toHaveLength(1);
      expect(result.currencyRiskAnalysis.recommendations).toContain(
        expect.stringContaining('high-risk foreign currency loans')
      );
      expect(result.refinancingOpportunities).toHaveLength(2); // Loans with >7% interest
      expect(result.payoffOptimization.strategy).toBe('currency_focused');
      expect(result.payoffOptimization.estimatedSavings.currency).toBe('USD');
    });
  });

  describe('detectCurrencyFromLender', () => {
    it('should detect currency from common lender names', () => {
      expect(loanService.detectCurrencyFromLender('Chase Bank', 'personal')).toBe('USD');
      expect(loanService.detectCurrencyFromLender('Barclays UK', 'home')).toBe('GBP');
      expect(loanService.detectCurrencyFromLender('Deutsche Bank', 'car')).toBe('EUR');
      expect(loanService.detectCurrencyFromLender('RBC Royal Bank', 'personal')).toBe('CAD');
      expect(loanService.detectCurrencyFromLender('Commonwealth Bank', 'home')).toBe('AUD');
      expect(loanService.detectCurrencyFromLender('UBS Switzerland', 'personal')).toBe('CHF');
      expect(loanService.detectCurrencyFromLender('Mitsubishi Financial', 'car')).toBe('JPY');
    });

    it('should default to USD for unknown lenders', () => {
      expect(loanService.detectCurrencyFromLender('Unknown Lender', 'personal')).toBe('USD');
      expect(loanService.detectCurrencyFromLender('', 'home')).toBe('USD');
    });

    it('should detect currency from country patterns', () => {
      expect(loanService.detectCurrencyFromLender('Some UK Bank', 'personal')).toBe('GBP');
      expect(loanService.detectCurrencyFromLender('Canadian Credit Union', 'home')).toBe('CAD');
      expect(loanService.detectCurrencyFromLender('Australian Finance Co', 'car')).toBe('AUD');
      expect(loanService.detectCurrencyFromLender('Swiss Loan Company', 'personal')).toBe('CHF');
      expect(loanService.detectCurrencyFromLender('European Investment Bank', 'home')).toBe('EUR');
    });
  });

  describe('Error Handling', () => {
    it('should handle currency conversion errors gracefully', async () => {
      const loans = [createMockLoan('1', 10000, 'EUR', 'personal')];
      jest.spyOn(loanService, 'getActiveLoans').mockResolvedValue(loans);
      
      mockCurrencyService.convertAmount.mockRejectedValue(new Error('Conversion failed'));

      const result = await loanService.getTotalDebt(mockUserId, primaryCurrency);

      // Should fallback to original amount
      expect(result.amount).toBe(8000); // 80% of 10000
      expect(result.currency).toBe('USD');
    });

    it('should handle missing user preferences', async () => {
      mockUserService.getById.mockResolvedValue(null);
      
      const loans = [createMockLoan('1', 10000, 'USD', 'personal')];
      jest.spyOn(loanService, 'getActiveLoans').mockResolvedValue(loans);

      const result = await loanService.getTotalDebt(mockUserId);

      expect(result.currency).toBe('USD'); // Default currency
      expect(result.amount).toBe(8000);
    });
  });
});
import { NextRequest } from 'next/server';
import { GET as getCurrencyExposure } from '../currency-exposure/route';
import { GET as getMultiCurrencyProjections } from '../multi-currency-projections/route';
import { GET as getOptimizationRecommendations } from '../optimization-recommendations/route';
import { loanService } from '@/lib/services/loan-service';
import { userService } from '@/lib/services/user-service';
import { auth } from '@clerk/nextjs/server';
import { Timestamp } from 'firebase/firestore';

// Mock dependencies
jest.mock('@clerk/nextjs/server');
jest.mock('@/lib/services/loan-service');
jest.mock('@/lib/services/user-service');

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockLoanService = loanService as jest.Mocked<typeof loanService>;
const mockUserService = userService as jest.Mocked<typeof userService>;

// Create proper Timestamp mock
const createMockTimestamp = (): Timestamp => ({
  seconds: Math.floor(Date.now() / 1000),
  nanoseconds: 0,
  toDate: () => new Date(),
  toMillis: () => Date.now(),
  isEqual: () => false,
  toJSON: () => ({ seconds: Math.floor(Date.now() / 1000), nanoseconds: 0, type: 'timestamp' }),
  valueOf: () => 'timestamp',
} as unknown as Timestamp);

// Create proper auth mock
const createMockAuth = (userId: string | null) => ({
  userId,
  sessionClaims: {},
  sessionId: 'test-session',
  sessionStatus: 'active',
  actor: null,
  isAuthenticated: userId !== null,
  tokenType: 'session_token',
  getToken: jest.fn(),
  has: jest.fn(),
  debug: jest.fn(),
  redirectToSignIn: jest.fn(),
  redirectToSignUp: jest.fn(),
} as any);

describe('Loan Multi-Currency API Routes', () => {
  const mockUserId = 'test-user-id';
  const mockUser = {
    id: mockUserId,
    userId: mockUserId,
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    preferences: {
      primaryCurrency: 'USD',
      locale: 'en-US',
      riskTolerance: 'moderate' as const,
      notifications: true,
      showOriginalCurrencies: true,
      autoDetectCurrency: true
    },
    createdAt: createMockTimestamp(),
    updatedAt: createMockTimestamp()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/loans/currency-exposure', () => {
    it('should return currency exposure data', async () => {
      const mockExposureData = [
        {
          currency: 'USD',
          totalValue: { amount: 10000, currency: 'USD' },
          percentage: 60,
          riskLevel: 'low' as const
        },
        {
          currency: 'EUR',
          totalValue: { amount: 5000, currency: 'EUR' },
          percentage: 40,
          riskLevel: 'medium' as const
        }
      ];

      mockAuth.mockResolvedValue(createMockAuth(mockUserId));
      mockUserService.getById.mockResolvedValue(mockUser);
      mockLoanService.getCurrencyExposure.mockResolvedValue(mockExposureData);

      const request = new NextRequest('http://localhost/api/loans/currency-exposure');
      const response = await getCurrencyExposure(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockExposureData);
      expect(mockLoanService.getCurrencyExposure).toHaveBeenCalledWith(mockUserId, 'USD');
    });

    it('should return 401 when user is not authenticated', async () => {
      mockAuth.mockResolvedValue(createMockAuth(null));

      const request = new NextRequest('http://localhost/api/loans/currency-exposure');
      const response = await getCurrencyExposure(request);

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/loans/multi-currency-projections', () => {
    it('should return multi-currency projections', async () => {
      const mockProjections = [
        {
          month: 1,
          year: 2024,
          totalDebt: { amount: 9000, currency: 'USD' },
          totalPayments: { amount: 1000, currency: 'USD' },
          currencyBreakdown: {
            'USD': { debt: 9000, payments: 1000 }
          },
          exchangeRateImpact: 50
        }
      ];

      mockAuth.mockResolvedValue(createMockAuth(mockUserId));
      mockUserService.getById.mockResolvedValue(mockUser);
      mockLoanService.getMultiCurrencyProjections.mockResolvedValue(mockProjections);

      const request = new NextRequest('http://localhost/api/loans/multi-currency-projections');
      const response = await getMultiCurrencyProjections(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockProjections);
      expect(mockLoanService.getMultiCurrencyProjections).toHaveBeenCalledWith(mockUserId, 'USD');
    });

    it('should return 401 when user is not authenticated', async () => {
      mockAuth.mockResolvedValue(createMockAuth(null));

      const request = new NextRequest('http://localhost/api/loans/multi-currency-projections');
      const response = await getMultiCurrencyProjections(request);

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/loans/optimization-recommendations', () => {
    it('should return optimization recommendations', async () => {
      const mockRecommendations = {
        currencyRiskAnalysis: {
          highRiskLoans: [],
          recommendations: ['Consider hedging foreign currency exposure']
        },
        refinancingOpportunities: [
          {
            loan: {
              id: 'loan-1',
              userId: mockUserId,
              name: 'Test Loan',
              type: 'personal' as const,
              principal: { amount: 10000, currency: 'USD' },
              currentBalance: { amount: 8000, currency: 'USD' },
              interestRate: 5.5,
              termMonths: 60,
              monthlyPayment: { amount: 200, currency: 'USD' },
              startDate: createMockTimestamp(),
              nextPaymentDate: createMockTimestamp(),
            },
            potentialSavings: { amount: 500, currency: 'USD' },
            recommendation: 'Consider refinancing at lower rate'
          }
        ],
        payoffOptimization: {
          strategy: 'avalanche' as const,
          description: 'Pay off highest interest rate loans first',
          estimatedSavings: { amount: 1000, currency: 'USD' },
          timeToPayoff: 48
        }
      };

      mockAuth.mockResolvedValue(createMockAuth(mockUserId));
      mockUserService.getById.mockResolvedValue(mockUser);
      mockLoanService.getLoanOptimizationRecommendations.mockResolvedValue(mockRecommendations);

      const request = new NextRequest('http://localhost/api/loans/optimization-recommendations');
      const response = await getOptimizationRecommendations(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      // Timestamps are serialized in JSON output; compare relevant fields ignoring Timestamp methods
      expect(data).toEqual({
        currencyRiskAnalysis: mockRecommendations.currencyRiskAnalysis,
        refinancingOpportunities: [
          {
            loan: expect.objectContaining({
              id: 'loan-1',
              userId: mockUserId,
              name: 'Test Loan',
              type: 'personal',
              principal: { amount: 10000, currency: 'USD' },
              currentBalance: { amount: 8000, currency: 'USD' },
              interestRate: 5.5,
              termMonths: 60,
              monthlyPayment: { amount: 200, currency: 'USD' },
              startDate: expect.objectContaining({ seconds: expect.any(Number), nanoseconds: expect.any(Number) }),
              nextPaymentDate: expect.objectContaining({ seconds: expect.any(Number), nanoseconds: expect.any(Number) })
            }),
            potentialSavings: { amount: 500, currency: 'USD' },
            recommendation: 'Consider refinancing at lower rate'
          }
        ],
        payoffOptimization: mockRecommendations.payoffOptimization
      });
      expect(mockLoanService.getLoanOptimizationRecommendations).toHaveBeenCalledWith(mockUserId, 'USD');
    });

    it('should return 401 when user is not authenticated', async () => {
      mockAuth.mockResolvedValue(createMockAuth(null));

      const request = new NextRequest('http://localhost/api/loans/optimization-recommendations');
      const response = await getOptimizationRecommendations(request);

      expect(response.status).toBe(401);
    });
  });

  describe('Error handling', () => {
    it('should handle service errors gracefully', async () => {
      mockAuth.mockResolvedValue(createMockAuth(mockUserId));
      mockUserService.getById.mockResolvedValue(mockUser);
      mockLoanService.getCurrencyExposure.mockRejectedValue(new Error('Service error'));

      const request = new NextRequest('http://localhost/api/loans/currency-exposure');
      const response = await getCurrencyExposure(request);

      expect(response.status).toBe(500);
    });
  });
});
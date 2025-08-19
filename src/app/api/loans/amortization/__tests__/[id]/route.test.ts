import { NextRequest } from 'next/server';
import { GET } from '../../[id]/route';
import { loanService } from '@/lib/services/loan-service';
import { auth } from '@clerk/nextjs/server';
import { Timestamp } from 'firebase/firestore';
import { Loan } from '@/types/financial';

// Mock dependencies
jest.mock('@clerk/nextjs/server');
jest.mock('@/lib/services/loan-service');

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockLoanService = loanService as jest.Mocked<typeof loanService>;

describe('/api/loans/amortization/[id]', () => {
  const mockUserId = 'test-user-123';
  const mockLoanId = 'test-loan-456';
  const mockLoan: Loan = {
    id: mockLoanId,
    userId: mockUserId,
    type: 'car',
    name: 'Test Car Loan',
    principal: { amount: 25000, currency: 'USD' },
    currentBalance: { amount: 20000, currency: 'USD' },
    interestRate: 5.5,
    termMonths: 60,
    monthlyPayment: { amount: 478.66, currency: 'USD' },
    startDate: Timestamp.fromDate(new Date('2023-01-01')),
    nextPaymentDate: Timestamp.fromDate(new Date('2024-02-01')),
  };

  const mockAmortizationSchedule = [
    {
      paymentNumber: 1,
      paymentDate: new Date('2024-02-01'),
      principalPayment: 387.33,
      interestPayment: 91.33,
      remainingBalance: 19612.67,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ userId: mockUserId } as any);
  });

  describe('GET /api/loans/amortization/[id]', () => {
    it('should return amortization schedule for valid loan', async () => {
      const totalInterest = 1500.50;
      const payoffDate = new Date('2028-01-01');

      mockLoanService.getById.mockResolvedValue(mockLoan);
      mockLoanService.generateAmortizationSchedule.mockReturnValue(mockAmortizationSchedule);
      mockLoanService.calculateTotalInterest.mockReturnValue(totalInterest);
      mockLoanService.calculatePayoffDate.mockReturnValue(payoffDate);

      const request = new NextRequest(`http://localhost:3000/api/loans/amortization/${mockLoanId}`);
      const response = await GET(request, { params: Promise.resolve({ id: mockLoanId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.totalInterest).toBe(totalInterest);
      expect(new Date(data.payoffDate)).toEqual(payoffDate);
      expect(data.totalPayments).toBe(mockAmortizationSchedule.length);
    });

    it('should return 401 for unauthenticated user', async () => {
      mockAuth.mockResolvedValue({ userId: null } as any);

      const request = new NextRequest(`http://localhost:3000/api/loans/amortization/${mockLoanId}`);
      const response = await GET(request, { params: Promise.resolve({ id: mockLoanId }) });
      expect(response.status).toBe(401);
    });
  });
});
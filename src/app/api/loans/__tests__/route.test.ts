import { NextRequest } from 'next/server';
import { GET, POST } from '../route';
import { loanService } from '@/lib/services/loan-service';
import { auth } from '@clerk/nextjs/server';

// Mock dependencies
jest.mock('@clerk/nextjs/server');
jest.mock('@/lib/services/loan-service');

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockLoanService = loanService as jest.Mocked<typeof loanService>;

describe('/api/loans', () => {
  const mockUserId = 'test-user-123';
  const mockLoans = [
    {
      id: 'loan-1',
      userId: mockUserId,
      type: 'car',
      name: 'Test Car Loan',
      principal: { amount: 25000, currency: 'USD' },
      currentBalance: { amount: 20000, currency: 'USD' },
      interestRate: 5.5,
      termMonths: 60,
      monthlyPayment: { amount: 478.66, currency: 'USD' },
      startDate: new Date('2023-01-01'),
      nextPaymentDate: new Date('2024-02-01'),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ userId: mockUserId } as any);
  });

  describe('GET /api/loans', () => {
    it('should return all loans for authenticated user', async () => {
      mockLoanService.getAllOrdered.mockResolvedValue(mockLoans as any);

      const request = new NextRequest('http://localhost:3000/api/loans');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(JSON.parse(JSON.stringify(mockLoans)));
      expect(mockLoanService.getAllOrdered).toHaveBeenCalledWith(mockUserId);
    });

    it('should filter loans by type when type parameter is provided', async () => {
      mockLoanService.getByType.mockResolvedValue(mockLoans as any);

      const request = new NextRequest('http://localhost:3000/api/loans?type=car');
      await GET(request);

      expect(mockLoanService.getByType).toHaveBeenCalledWith(mockUserId, 'car');
    });

    it('should return only active loans when active=true', async () => {
      mockLoanService.getActiveLoans.mockResolvedValue(mockLoans as any);

      const request = new NextRequest('http://localhost:3000/api/loans?active=true');
      await GET(request);

      expect(mockLoanService.getActiveLoans).toHaveBeenCalledWith(mockUserId);
    });

    it('should return 401 for unauthenticated user', async () => {
      mockAuth.mockResolvedValue({ userId: null } as any);

      const request = new NextRequest('http://localhost:3000/api/loans');
      const response = await GET(request);

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/loans', () => {
    const validLoanFormData = {
      type: 'car' as const,
      name: 'New Car Loan',
      principal: 30000,
      currentBalance: 30000,
      interestRate: 4.5,
      termMonths: 72,
      monthlyPayment: 485.50,
      startDate: '2024-01-01',
      nextPaymentDate: '2024-02-01',
      currency: 'USD' as const,
    };

    it('should create a new loan with valid data', async () => {
      const createdLoanId = 'new-loan-id';
      const createdLoan = {
        id: createdLoanId,
        userId: mockUserId,
        type: 'car',
        name: 'New Car Loan',
        principal: { amount: 30000, currency: 'USD' },
        currentBalance: { amount: 30000, currency: 'USD' },
        interestRate: 4.5,
        termMonths: 72,
        monthlyPayment: { amount: 485.50, currency: 'USD' },
        startDate: new Date('2024-01-01'),
        nextPaymentDate: new Date('2024-02-01'),
      };

      mockLoanService.create.mockResolvedValue(createdLoanId);
      mockLoanService.getById.mockResolvedValue(createdLoan as any);

      const request = new NextRequest('http://localhost:3000/api/loans', {
        method: 'POST',
        body: JSON.stringify(validLoanFormData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toEqual(JSON.parse(JSON.stringify(createdLoan)));
      expect(mockLoanService.create).toHaveBeenCalledWith(
        mockUserId,
        expect.objectContaining({
          userId: mockUserId,
          principal: { amount: 30000, currency: 'USD' },
        })
      );
    });

    it('should return 400 for invalid loan data', async () => {
      const invalidLoanData = { ...validLoanFormData, principal: -100 };

      const request = new NextRequest('http://localhost:3000/api/loans', {
        method: 'POST',
        body: JSON.stringify(invalidLoanData),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });
  });
});

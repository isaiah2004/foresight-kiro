import { GET } from '@/app/api/currencies/convert/route';
import { auth } from '@clerk/nextjs/server';
import { currencyService } from '@/lib/services/currency-service';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@clerk/nextjs/server');
jest.mock('@/lib/services/currency-service');

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockCurrencyService = currencyService as jest.Mocked<typeof currencyService>;

describe('/api/currencies/convert', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should convert single amount', async () => {
      (mockAuth as any).mockResolvedValue({ userId: 'user123' });
      mockCurrencyService.convertAmount.mockResolvedValue({
        amount: 85,
        currency: 'EUR',
        convertedAmount: 85,
        exchangeRate: 0.85,
        lastUpdated: new Date()
      });

      const request = new NextRequest('http://localhost/api/currencies/convert?amount=100&from=USD&to=EUR');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.conversion.amount).toBe(85);
      expect(data.conversion.currency).toBe('EUR');
      expect(data.conversion.exchangeRate).toBe(0.85);
      expect(mockCurrencyService.convertAmount).toHaveBeenCalledWith(100, 'USD', 'EUR');
    });

    it('should convert multiple amounts', async () => {
      (mockAuth as any).mockResolvedValue({ userId: 'user123' });
      mockCurrencyService.convertMultipleAmounts.mockResolvedValue([
        {
          amount: 85,
          currency: 'EUR',
          convertedAmount: 85,
          exchangeRate: 0.85,
          lastUpdated: new Date()
        },
        {
          amount: 137,
          currency: 'USD',
          convertedAmount: 137,
          exchangeRate: 1.37,
          lastUpdated: new Date()
        }
      ]);

      const conversions = JSON.stringify([
        { amount: 100, from: 'USD', to: 'EUR' },
        { amount: 100, from: 'GBP', to: 'USD' }
      ]);
      const request = new NextRequest(`http://localhost/api/currencies/convert?conversions=${encodeURIComponent(conversions)}`);
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.conversions).toHaveLength(2);
      expect(data.count).toBe(2);
      expect(mockCurrencyService.convertMultipleAmounts).toHaveBeenCalledWith([
        { amount: 100, from: 'USD', to: 'EUR' },
        { amount: 100, from: 'GBP', to: 'USD' }
      ]);
    });

    it('should return 400 for missing parameters', async () => {
      (mockAuth as any).mockResolvedValue({ userId: 'user123' });

      const request = new NextRequest('http://localhost/api/currencies/convert?amount=100&from=USD');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required parameters: amount, from, to');
    });

    it('should return 400 for invalid amount', async () => {
      (mockAuth as any).mockResolvedValue({ userId: 'user123' });

      const request = new NextRequest('http://localhost/api/currencies/convert?amount=invalid&from=USD&to=EUR');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid parameters');
    });

    it('should return 400 for negative amount', async () => {
      (mockAuth as any).mockResolvedValue({ userId: 'user123' });

      const request = new NextRequest('http://localhost/api/currencies/convert?amount=-100&from=USD&to=EUR');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid parameters');
    });

    it('should return 401 for unauthenticated user', async () => {
      (mockAuth as any).mockResolvedValue({ userId: null });

      const request = new NextRequest('http://localhost/api/currencies/convert?amount=100&from=USD&to=EUR');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should handle service errors', async () => {
      (mockAuth as any).mockResolvedValue({ userId: 'user123' });
      mockCurrencyService.convertAmount.mockRejectedValue(
        new Error('Conversion failed')
      );

      const request = new NextRequest('http://localhost/api/currencies/convert?amount=100&from=USD&to=EUR');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to convert currency');
    });

    it('should handle zero amount conversion', async () => {
      (mockAuth as any).mockResolvedValue({ userId: 'user123' });
      mockCurrencyService.convertAmount.mockResolvedValue({
        amount: 0,
        currency: 'EUR',
        convertedAmount: 0,
        exchangeRate: 0.85,
        lastUpdated: new Date()
      });

      const request = new NextRequest('http://localhost/api/currencies/convert?amount=0&from=USD&to=EUR');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.conversion.amount).toBe(0);
      expect(mockCurrencyService.convertAmount).toHaveBeenCalledWith(0, 'USD', 'EUR');
    });
  });
});
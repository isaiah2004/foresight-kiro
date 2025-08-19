import { GET } from '@/app/api/currencies/exchange-rates/route';
import { auth } from '@clerk/nextjs/server';
import { currencyService } from '@/lib/services/currency-service';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@clerk/nextjs/server');
jest.mock('@/lib/services/currency-service');

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockCurrencyService = currencyService as jest.Mocked<typeof currencyService>;

describe('/api/currencies/exchange-rates', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return exchange rate for single pair', async () => {
      (mockAuth as any).mockResolvedValue({ userId: 'user123' });
      mockCurrencyService.getExchangeRate.mockResolvedValue({
        from: 'USD',
        to: 'EUR',
        rate: 0.85,
        timestamp: new Date(),
        source: 'api'
      });

      const request = new NextRequest('http://localhost/api/currencies/exchange-rates?from=USD&to=EUR');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.rate.from).toBe('USD');
      expect(data.rate.to).toBe('EUR');
      expect(data.rate.rate).toBe(0.85);
      expect(mockCurrencyService.getExchangeRate).toHaveBeenCalledWith('USD', 'EUR');
    });

    it('should return multiple exchange rates', async () => {
      (mockAuth as any).mockResolvedValue({ userId: 'user123' });
      mockCurrencyService.getMultipleRates.mockResolvedValue([
        {
          from: 'USD',
          to: 'EUR',
          rate: 0.85,
          timestamp: new Date(),
          source: 'api'
        },
        {
          from: 'GBP',
          to: 'USD',
          rate: 1.37,
          timestamp: new Date(),
          source: 'api'
        }
      ]);

      const pairs = JSON.stringify([
        { from: 'USD', to: 'EUR' },
        { from: 'GBP', to: 'USD' }
      ]);
      const request = new NextRequest(`http://localhost/api/currencies/exchange-rates?pairs=${encodeURIComponent(pairs)}`);
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.rates).toHaveLength(2);
      expect(data.count).toBe(2);
      expect(mockCurrencyService.getMultipleRates).toHaveBeenCalledWith([
        { from: 'USD', to: 'EUR' },
        { from: 'GBP', to: 'USD' }
      ]);
    });

    it('should return 400 for missing parameters', async () => {
      (mockAuth as any).mockResolvedValue({ userId: 'user123' });

      const request = new NextRequest('http://localhost/api/currencies/exchange-rates?from=USD');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required parameters: from and to');
    });

    it('should return 400 for invalid currency codes', async () => {
      (mockAuth as any).mockResolvedValue({ userId: 'user123' });

      const request = new NextRequest('http://localhost/api/currencies/exchange-rates?from=US&to=EUR');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid parameters');
    });

    it('should return 401 for unauthenticated user', async () => {
      (mockAuth as any).mockResolvedValue({ userId: null });

      const request = new NextRequest('http://localhost/api/currencies/exchange-rates?from=USD&to=EUR');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should handle service errors', async () => {
      (mockAuth as any).mockResolvedValue({ userId: 'user123' });
      mockCurrencyService.getExchangeRate.mockRejectedValue(
        new Error('API unavailable')
      );

      const request = new NextRequest('http://localhost/api/currencies/exchange-rates?from=USD&to=EUR');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch exchange rates');
    });

    it('should handle invalid pairs JSON', async () => {
      (mockAuth as any).mockResolvedValue({ userId: 'user123' });

      const request = new NextRequest('http://localhost/api/currencies/exchange-rates?pairs=invalid-json');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid parameters');
    });
  });
});
import { GET } from '@/app/api/currencies/route';
import { auth } from '@clerk/nextjs/server';
import { currencyService } from '@/lib/services/currency-service';

// Mock dependencies
jest.mock('@clerk/nextjs/server');
jest.mock('@/lib/services/currency-service');

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockCurrencyService = currencyService as jest.Mocked<typeof currencyService>;

describe('/api/currencies', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return supported currencies for authenticated user', async () => {
      (mockAuth as any).mockResolvedValue({ userId: 'user123' });
      mockCurrencyService.getSupportedCurrencies.mockResolvedValue([
        {
          code: 'USD',
          name: 'US Dollar',
          symbol: '$',
          decimalPlaces: 2,
          countries: ['United States']
        },
        {
          code: 'EUR',
          name: 'Euro',
          symbol: '€',
          decimalPlaces: 2,
          countries: ['Germany', 'France']
        }
      ]);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.currencies).toHaveLength(2);
      expect(data.count).toBe(2);
      expect(data.currencies[0].code).toBe('USD');
      expect(mockCurrencyService.getSupportedCurrencies).toHaveBeenCalledTimes(1);
    });

    it('should return 401 for unauthenticated user', async () => {
      (mockAuth as any).mockResolvedValue({ userId: null });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
      expect(mockCurrencyService.getSupportedCurrencies).not.toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      (mockAuth as any).mockResolvedValue({ userId: 'user123' });
      mockCurrencyService.getSupportedCurrencies.mockRejectedValue(
        new Error('Service unavailable')
      );

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch currencies');
    });
  });
});
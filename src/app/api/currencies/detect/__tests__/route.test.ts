import { GET } from '@/app/api/currencies/detect/route';
import { auth } from '@clerk/nextjs/server';
import { currencyService } from '@/lib/services/currency-service';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@clerk/nextjs/server');
jest.mock('@/lib/services/currency-service');

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockCurrencyService = currencyService as jest.Mocked<typeof currencyService>;

describe('/api/currencies/detect', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should detect currency from country code', async () => {
      (mockAuth as any).mockResolvedValue({ userId: 'user123' });
      mockCurrencyService.detectCurrencyFromLocation.mockResolvedValue('USD');
      mockCurrencyService.getCurrencyInfo.mockResolvedValue({
        code: 'USD',
        name: 'US Dollar',
        symbol: '$',
        decimalPlaces: 2,
        countries: ['United States']
      });

      const request = new NextRequest('http://localhost/api/currencies/detect?countryCode=US');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.detectedCurrency).toBe('USD');
      expect(data.detectionMethod).toBe('location');
      expect(data.currencyInfo.name).toBe('US Dollar');
      expect(data.input.countryCode).toBe('US');
      expect(mockCurrencyService.detectCurrencyFromLocation).toHaveBeenCalledWith('US');
    });

    it('should detect currency from market symbol', async () => {
      (mockAuth as any).mockResolvedValue({ userId: 'user123' });
      mockCurrencyService.detectCurrencyFromMarket.mockResolvedValue('GBP');
      mockCurrencyService.getCurrencyInfo.mockResolvedValue({
        code: 'GBP',
        name: 'British Pound Sterling',
        symbol: '£',
        decimalPlaces: 2,
        countries: ['United Kingdom']
      });

      const request = new NextRequest('http://localhost/api/currencies/detect?marketSymbol=VOD.L');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.detectedCurrency).toBe('GBP');
      expect(data.detectionMethod).toBe('market');
      expect(data.currencyInfo.name).toBe('British Pound Sterling');
      expect(data.input.marketSymbol).toBe('VOD.L');
      expect(mockCurrencyService.detectCurrencyFromMarket).toHaveBeenCalledWith('VOD.L');
    });

    it('should prioritize country code over market symbol', async () => {
      (mockAuth as any).mockResolvedValue({ userId: 'user123' });
      mockCurrencyService.detectCurrencyFromLocation.mockResolvedValue('CAD');
      mockCurrencyService.getCurrencyInfo.mockResolvedValue({
        code: 'CAD',
        name: 'Canadian Dollar',
        symbol: 'C$',
        decimalPlaces: 2,
        countries: ['Canada']
      });

      const request = new NextRequest('http://localhost/api/currencies/detect?countryCode=CA&marketSymbol=AAPL');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.detectedCurrency).toBe('CAD');
      expect(data.detectionMethod).toBe('location');
      expect(mockCurrencyService.detectCurrencyFromLocation).toHaveBeenCalledWith('CA');
      expect(mockCurrencyService.detectCurrencyFromMarket).not.toHaveBeenCalled();
    });

    it('should return 400 for missing parameters', async () => {
      (mockAuth as any).mockResolvedValue({ userId: 'user123' });

      const request = new NextRequest('http://localhost/api/currencies/detect');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid parameters');
    });

    it('should return 400 for invalid country code length', async () => {
      (mockAuth as any).mockResolvedValue({ userId: 'user123' });

      const request = new NextRequest('http://localhost/api/currencies/detect?countryCode=USA');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid parameters');
    });

    it('should return 401 for unauthenticated user', async () => {
      (mockAuth as any).mockResolvedValue({ userId: null });

      const request = new NextRequest('http://localhost/api/currencies/detect?countryCode=US');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should handle service errors', async () => {
      (mockAuth as any).mockResolvedValue({ userId: 'user123' });
      mockCurrencyService.detectCurrencyFromLocation.mockRejectedValue(
        new Error('Detection failed')
      );

      const request = new NextRequest('http://localhost/api/currencies/detect?countryCode=US');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to detect currency');
    });

    it('should handle currency info lookup errors', async () => {
      (mockAuth as any).mockResolvedValue({ userId: 'user123' });
      mockCurrencyService.detectCurrencyFromLocation.mockResolvedValue('USD');
      mockCurrencyService.getCurrencyInfo.mockRejectedValue(
        new Error('Currency not found')
      );

      const request = new NextRequest('http://localhost/api/currencies/detect?countryCode=US');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to detect currency');
    });
  });
});
import { GET, PUT } from '@/app/api/user/preferences/route';
import { auth } from '@clerk/nextjs/server';
import { userService } from '@/lib/services/user-service';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@clerk/nextjs/server');
jest.mock('@/lib/services/user-service');

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockUserService = userService as jest.Mocked<typeof userService>;

describe('/api/user/preferences', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return user preferences for authenticated user', async () => {
      (mockAuth as any).mockResolvedValue({ userId: 'user123' });
      mockUserService.getUserPreferences.mockResolvedValue({
        primaryCurrency: 'EUR',
        locale: 'de-DE',
        riskTolerance: 'moderate',
        notifications: true,
        showOriginalCurrencies: true,
        autoDetectCurrency: false
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.preferences.primaryCurrency).toBe('EUR');
      expect(data.preferences.locale).toBe('de-DE');
      expect(mockUserService.getUserPreferences).toHaveBeenCalledWith('user123');
    });

    it('should return default preferences when user has none', async () => {
      (mockAuth as any).mockResolvedValue({ userId: 'user123' });
      mockUserService.getUserPreferences.mockResolvedValue(null);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.preferences.primaryCurrency).toBe('USD');
      expect(data.preferences.locale).toBe('en-US');
      expect(data.preferences.riskTolerance).toBe('moderate');
    });

    it('should return 401 for unauthenticated user', async () => {
      (mockAuth as any).mockResolvedValue({ userId: null });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
      expect(mockUserService.getUserPreferences).not.toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      (mockAuth as any).mockResolvedValue({ userId: 'user123' });
      mockUserService.getUserPreferences.mockRejectedValue(new Error('Service error'));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch user preferences');
    });
  });

  describe('PUT', () => {
    it('should update user preferences', async () => {
      (mockAuth as any).mockResolvedValue({ userId: 'user123' });
      mockUserService.updatePreferences.mockResolvedValue();

      const request = new NextRequest('http://localhost/api/user/preferences', {
        method: 'PUT',
        body: JSON.stringify({
          primaryCurrency: 'GBP',
          riskTolerance: 'aggressive'
        })
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockUserService.updatePreferences).toHaveBeenCalledWith('user123', {
        primaryCurrency: 'GBP',
        riskTolerance: 'aggressive',
        notifications: true,
        showOriginalCurrencies: true,
        autoDetectCurrency: false
      });
    });

    it('should validate preferences data', async () => {
      (mockAuth as any).mockResolvedValue({ userId: 'user123' });

      const request = new NextRequest('http://localhost/api/user/preferences', {
        method: 'PUT',
        body: JSON.stringify({
          primaryCurrency: 'INVALID',
          riskTolerance: 'unknown'
        })
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid preferences data');
      expect(mockUserService.updatePreferences).not.toHaveBeenCalled();
    });

    it('should return 401 for unauthenticated user', async () => {
      (mockAuth as any).mockResolvedValue({ userId: null });

      const request = new NextRequest('http://localhost/api/user/preferences', {
        method: 'PUT',
        body: JSON.stringify({ primaryCurrency: 'EUR' })
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should handle service errors', async () => {
      (mockAuth as any).mockResolvedValue({ userId: 'user123' });
      mockUserService.updatePreferences.mockRejectedValue(new Error('Update failed'));

      const request = new NextRequest('http://localhost/api/user/preferences', {
        method: 'PUT',
        body: JSON.stringify({ primaryCurrency: 'EUR' })
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to update user preferences');
    });
  });
});
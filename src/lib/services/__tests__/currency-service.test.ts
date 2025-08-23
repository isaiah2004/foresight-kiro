import { CurrencyServiceImpl } from '@/lib/services/currency-service';
import { Investment } from '@/types/financial';
import { Timestamp } from 'firebase/firestore';

// Mock fetch for API testing
global.fetch = jest.fn();

// Helper to silence expected warnings/errors within specific tests
const silenceConsole = () => {
  const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  return () => {
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  };
};

describe('CurrencyService', () => {
  let currencyService: CurrencyServiceImpl;

  beforeEach(() => {
  // Ensure service runs in API mode (not mock) for tests that assert cache/api behavior
  process.env.ALPHA_VANTAGE_API_KEY = 'test';
  process.env.EXCHANGE_MAX_RETRIES = '1';
  process.env.EXCHANGE_RETRY_DELAY_MS = '1';
    currencyService = new CurrencyServiceImpl();
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
  });

  describe('getExchangeRate', () => {
    it('should return rate of 1 for same currency conversion', async () => {
      const rate = await currencyService.getExchangeRate('USD', 'USD');
      
      expect(rate.from).toBe('USD');
      expect(rate.to).toBe('USD');
      expect(rate.rate).toBe(1);
      expect(rate.source).toBe('internal');
    });

    it('should return exchange rate for different currencies', async () => {
      // Mock Alpha Vantage response
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          'Realtime Currency Exchange Rate': {
            '1. From_Currency Code': 'USD',
            '2. From_Currency Name': 'US Dollar',
            '3. To_Currency Code': 'EUR',
            '4. To_Currency Name': 'Euro',
            '5. Exchange Rate': '0.85',
            '6. Last Refreshed': new Date().toISOString(),
            '7. Time Zone': 'UTC',
            '8. Bid Price': '0.85',
            '9. Ask Price': '0.85'
          }
        })
      });

      const rate = await currencyService.getExchangeRate('USD', 'EUR');
      
      expect(rate.from).toBe('USD');
      expect(rate.to).toBe('EUR');
      expect(rate.rate).toBeCloseTo(0.85, 5);
      expect(rate.timestamp).toBeInstanceOf(Date);
      expect(rate.source).toBe('api');
    });

    it('should use cached rates when available and fresh', async () => {
      // First call should hit the API
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          'Realtime Currency Exchange Rate': {
            '1. From_Currency Code': 'USD',
            '2. From_Currency Name': 'US Dollar',
            '3. To_Currency Code': 'EUR',
            '4. To_Currency Name': 'Euro',
            '5. Exchange Rate': '0.85',
            '6. Last Refreshed': new Date().toISOString(),
            '7. Time Zone': 'UTC',
            '8. Bid Price': '0.85',
            '9. Ask Price': '0.85'
          }
        })
      });

      const rate1 = await currencyService.getExchangeRate('USD', 'EUR');
      expect(rate1.source).toBe('api');

      // Second call should use cache (no fetch call)
      const rate2 = await currencyService.getExchangeRate('USD', 'EUR');
      expect(rate2.source).toBe('cache');
      expect(rate2.rate).toBe(rate1.rate);
    });
  });

  describe('getHistoricalRates', () => {
    it('should return historical rates for date range', async () => {
      // Mock Alpha Vantage daily time series for the requested range
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          'Meta Data': {
            '1. Information': 'FX Daily Prices',
            '2. From Symbol': 'USD',
            '3. To Symbol': 'EUR',
            '4. Output Size': 'Compact',
            '5. Last Refreshed': '2023-01-03',
            '6. Time Zone': 'UTC'
          },
          'Time Series FX (Daily)': {
            '2023-01-03': { '1. open': '0.94', '2. high': '0.95', '3. low': '0.93', '4. close': '0.94' },
            '2023-01-02': { '1. open': '0.93', '2. high': '0.94', '3. low': '0.92', '4. close': '0.93' },
            '2023-01-01': { '1. open': '0.92', '2. high': '0.93', '3. low': '0.91', '4. close': '0.92' }
          }
        })
      });
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-03');
      
      const rates = await currencyService.getHistoricalRates('USD', 'EUR', startDate, endDate);
      
      expect(rates).toHaveLength(3); // 3 days inclusive
      expect(rates[0].from).toBe('USD');
      expect(rates[0].to).toBe('EUR');
      expect(rates[0].rate).toBeGreaterThan(0);
  expect(['historical-api', 'mock', 'fallback']).toContain(rates[0].source);
      expect(rates[0].date).toBeInstanceOf(Date);
    });

    it('should return empty array for invalid date range', async () => {
      const startDate = new Date('2023-01-03');
      const endDate = new Date('2023-01-01'); // End before start
      
      const rates = await currencyService.getHistoricalRates('USD', 'EUR', startDate, endDate);
      
      expect(rates).toHaveLength(0);
    });
  });

  describe('convertAmount', () => {
    it('should convert amount between currencies', async () => {
      const result = await currencyService.convertAmount(100, 'USD', 'EUR');
      
      expect(result.amount).toBeGreaterThan(0);
      expect(result.currency).toBe('EUR');
      expect(result.convertedAmount).toBe(result.amount);
      expect(result.exchangeRate).toBeGreaterThan(0);
      expect(result.lastUpdated).toBeInstanceOf(Date);
    });

    it('should handle zero amount conversion', async () => {
      const result = await currencyService.convertAmount(0, 'USD', 'EUR');
      
      expect(result.amount).toBe(0);
      expect(result.currency).toBe('EUR');
    });

    it('should handle negative amount conversion', async () => {
      const result = await currencyService.convertAmount(-100, 'USD', 'EUR');
      
      expect(result.amount).toBeLessThan(0);
      expect(result.currency).toBe('EUR');
    });
  });

  describe('getSupportedCurrencies', () => {
    it('should return list of supported currencies', async () => {
      const currencies = await currencyService.getSupportedCurrencies();
      
      expect(currencies).toBeInstanceOf(Array);
      expect(currencies.length).toBeGreaterThan(0);
      
      const usd = currencies.find(c => c.code === 'USD');
      expect(usd).toBeDefined();
      expect(usd?.name).toBe('US Dollar');
      expect(usd?.symbol).toBe('$');
      expect(usd?.decimalPlaces).toBe(2);
    });
  });

  describe('getCurrencyInfo', () => {
    it('should return currency information for valid code', async () => {
      const currency = await currencyService.getCurrencyInfo('USD');
      
      expect(currency.code).toBe('USD');
      expect(currency.name).toBe('US Dollar');
      expect(currency.symbol).toBe('$');
      expect(currency.decimalPlaces).toBe(2);
      expect(currency.countries).toContain('United States');
    });

    it('should throw error for unsupported currency', async () => {
      await expect(currencyService.getCurrencyInfo('XYZ')).rejects.toThrow('Currency XYZ not supported');
    });
  });

  describe('convertMultipleAmounts', () => {
    it('should convert multiple amounts', async () => {
      const amounts = [
        { amount: 100, from: 'USD', to: 'EUR' },
        { amount: 200, from: 'GBP', to: 'USD' },
        { amount: 300, from: 'EUR', to: 'JPY' }
      ];
      
      const results = await currencyService.convertMultipleAmounts(amounts);
      
      expect(results).toHaveLength(3);
      expect(results[0].currency).toBe('EUR');
      expect(results[1].currency).toBe('USD');
      expect(results[2].currency).toBe('JPY');
    });
  });

  describe('getMultipleRates', () => {
    it('should get multiple exchange rates', async () => {
      const pairs = [
        { from: 'USD', to: 'EUR' },
        { from: 'GBP', to: 'USD' },
        { from: 'EUR', to: 'JPY' }
      ];
      
      const rates = await currencyService.getMultipleRates(pairs);
      
      expect(rates).toHaveLength(3);
      expect(rates[0].from).toBe('USD');
      expect(rates[0].to).toBe('EUR');
      expect(rates[1].from).toBe('GBP');
      expect(rates[1].to).toBe('USD');
    });
  });

  describe('refreshRates', () => {
    it('should clear cache and update timestamp', async () => {
      // First call to populate cache
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          'Realtime Currency Exchange Rate': {
            '1. From_Currency Code': 'USD',
            '2. From_Currency Name': 'US Dollar',
            '3. To_Currency Code': 'EUR',
            '4. To_Currency Name': 'Euro',
            '5. Exchange Rate': '0.85',
            '6. Last Refreshed': new Date().toISOString(),
            '7. Time Zone': 'UTC',
            '8. Bid Price': '0.85',
            '9. Ask Price': '0.85'
          }
        })
      });
      await currencyService.getExchangeRate('USD', 'EUR');

      // Refresh rates
      await currencyService.refreshRates();

      // Next call should hit API again
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          'Realtime Currency Exchange Rate': {
            '1. From_Currency Code': 'USD',
            '2. From_Currency Name': 'US Dollar',
            '3. To_Currency Code': 'EUR',
            '4. To_Currency Name': 'Euro',
            '5. Exchange Rate': '0.86',
            '6. Last Refreshed': new Date().toISOString(),
            '7. Time Zone': 'UTC',
            '8. Bid Price': '0.86',
            '9. Ask Price': '0.86'
          }
        })
      });
      const rate = await currencyService.getExchangeRate('USD', 'EUR');
      expect(rate.source).toBe('api');
    });
  });

  describe('getCacheStatus', () => {
    it('should return cache status information', async () => {
      const status = await currencyService.getCacheStatus();
      
      expect(status.lastUpdated).toBeInstanceOf(Date);
      expect(status.nextUpdate).toBeInstanceOf(Date);
      expect(status.nextUpdate.getTime()).toBeGreaterThan(status.lastUpdated.getTime());
    });
  });

  describe('calculateCurrencyExposure', () => {
    it('should calculate currency exposure from investments', async () => {
      const investments: Investment[] = [
        {
          id: '1',
          userId: 'user1',
          type: 'stocks',
          name: 'Apple Inc.',
          symbol: 'AAPL',
          quantity: 10,
          purchasePrice: { amount: 150, currency: 'USD' },
          currentPrice: { amount: 180, currency: 'USD' },
          purchaseDate: Timestamp.fromDate(new Date()),
          currency: 'USD',
          exchange: 'NASDAQ'
        },
        {
          id: '2',
          userId: 'user1',
          type: 'stocks',
          name: 'ASML Holding',
          symbol: 'ASML',
          quantity: 5,
          purchasePrice: { amount: 600, currency: 'EUR' },
          currentPrice: { amount: 650, currency: 'EUR' },
          purchaseDate: Timestamp.fromDate(new Date()),
          currency: 'EUR',
          exchange: 'AEX'
        }
      ];
      
      const exposures = await currencyService.calculateCurrencyExposure(investments);
      
      expect(exposures).toHaveLength(2);
      
      const usdExposure = exposures.find(e => e.currency === 'USD');
      const eurExposure = exposures.find(e => e.currency === 'EUR');
      
      expect(usdExposure).toBeDefined();
      expect(eurExposure).toBeDefined();
      expect(usdExposure!.totalValue.amount).toBe(1800); // 10 * 180
      expect(eurExposure!.totalValue.amount).toBe(3250); // 5 * 650
      
      // Check percentages sum to 100%
      const totalPercentage = exposures.reduce((sum, exp) => sum + exp.percentage, 0);
      expect(totalPercentage).toBeCloseTo(100, 1);
    });

    it('should handle empty investment portfolio', async () => {
      const exposures = await currencyService.calculateCurrencyExposure([]);
      
      expect(exposures).toHaveLength(0);
    });

    it('should sort exposures by percentage descending', async () => {
      const investments: Investment[] = [
        {
          id: '1',
          userId: 'user1',
          type: 'stocks',
          name: 'Small Position',
          quantity: 1,
          purchasePrice: { amount: 100, currency: 'USD' },
          currentPrice: { amount: 100, currency: 'USD' },
          purchaseDate: Timestamp.fromDate(new Date()),
          currency: 'USD'
        },
        {
          id: '2',
          userId: 'user1',
          type: 'stocks',
          name: 'Large Position',
          quantity: 10,
          purchasePrice: { amount: 500, currency: 'EUR' },
          currentPrice: { amount: 500, currency: 'EUR' },
          purchaseDate: Timestamp.fromDate(new Date()),
          currency: 'EUR'
        }
      ];
      
      const exposures = await currencyService.calculateCurrencyExposure(investments);
      
      expect(exposures[0].percentage).toBeGreaterThan(exposures[1].percentage);
    });
  });

  describe('analyzeCurrencyRisk', () => {
    it('should analyze currency risk for portfolio', async () => {
      const investments: Investment[] = [
        {
          id: '1',
          userId: 'user1',
          type: 'stocks',
          name: 'US Stock',
          quantity: 10,
          purchasePrice: { amount: 100, currency: 'USD' },
          currentPrice: { amount: 120, currency: 'USD' },
          purchaseDate: Timestamp.fromDate(new Date()),
          currency: 'USD'
        }
      ];
      
      const analysis = await currencyService.analyzeCurrencyRisk(investments);
      
      expect(analysis.totalExposure).toHaveLength(1);
      expect(analysis.riskScore).toBeGreaterThanOrEqual(0);
      expect(analysis.riskScore).toBeLessThanOrEqual(100);
      expect(analysis.recommendations).toBeInstanceOf(Array);
      expect(analysis.hedgingOpportunities).toBeInstanceOf(Array);
      expect(analysis.volatilityMetrics).toBeInstanceOf(Array);
    });

    it('should provide recommendations for high concentration', async () => {
      const investments: Investment[] = [
        {
          id: '1',
          userId: 'user1',
          type: 'stocks',
          name: 'High Concentration',
          quantity: 100,
          purchasePrice: { amount: 100, currency: 'USD' },
          currentPrice: { amount: 100, currency: 'USD' },
          purchaseDate: Timestamp.fromDate(new Date()),
          currency: 'USD'
        }
      ];
      
      const analysis = await currencyService.analyzeCurrencyRisk(investments);
      
      // Should have recommendations due to 100% USD concentration
      expect(analysis.recommendations.length).toBeGreaterThan(0);
      expect(analysis.recommendations.some(r => r.includes('USD'))).toBe(true);
    });
  });

  describe('formatCurrencyAmount', () => {
    it('should format currency amounts with proper symbols', () => {
      const usdAmount = { amount: 1234.56, currency: 'USD' };
      const formatted = currencyService.formatCurrencyAmount(usdAmount, 'en-US');
      
      expect(formatted).toMatch(/\$1,234\.56/);
    });

    it('should handle unsupported currencies gracefully', () => {
      const unknownAmount = { amount: 1234.56, currency: 'XYZ' };
      const formatted = currencyService.formatCurrencyAmount(unknownAmount);
      
      expect(formatted).toBe('1234.56 XYZ');
    });

    it('should respect decimal places for different currencies', () => {
      const jpyAmount = { amount: 1234, currency: 'JPY' };
      const formatted = currencyService.formatCurrencyAmount(jpyAmount, 'ja-JP');
      
      // JPY has 0 decimal places
      expect(formatted).not.toContain('.00');
    });

    it('should fallback to symbol format for invalid locales', () => {
      const usdAmount = { amount: 1234.56, currency: 'USD' };
      const formatted = currencyService.formatCurrencyAmount(usdAmount, 'invalid-locale');
      
      // Accept either grouped or ungrouped as environment-specific
      expect(formatted === '$1234.56' || formatted === '$1,234.56').toBe(true);
    });
  });

  describe('isValidCurrencyCode', () => {
    it('should validate supported currency codes', () => {
      expect(currencyService.isValidCurrencyCode('USD')).toBe(true);
      expect(currencyService.isValidCurrencyCode('EUR')).toBe(true);
      expect(currencyService.isValidCurrencyCode('GBP')).toBe(true);
      expect(currencyService.isValidCurrencyCode('XYZ')).toBe(false);
      expect(currencyService.isValidCurrencyCode('')).toBe(false);
    });
  });

  describe('normalizeCurrencyCode', () => {
    it('should normalize currency codes to uppercase', () => {
      expect(currencyService.normalizeCurrencyCode('usd')).toBe('USD');
      expect(currencyService.normalizeCurrencyCode('eur')).toBe('EUR');
      expect(currencyService.normalizeCurrencyCode(' gbp ')).toBe('GBP');
      expect(currencyService.normalizeCurrencyCode('USD')).toBe('USD');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
  const restore = silenceConsole();
      // This would be tested with actual API integration
      // For now, we test that the service doesn't throw unexpected errors
  const rate = await currencyService.getExchangeRate('USD', 'EUR');
  restore();
      expect(rate).toBeDefined();
    });

    it('should handle invalid currency pairs', async () => {
  const restore = silenceConsole();
  // The service should still return a rate (mock implementation)
  const rate = await currencyService.getExchangeRate('USD', 'XYZ');
  restore();
      expect(rate.rate).toBeGreaterThan(0);
    });
  });

  describe('Performance and Caching', () => {
    it('should cache exchange rates for performance', async () => {
      // First call should be api
      const rate1 = await currencyService.getExchangeRate('USD', 'EUR');
      expect(['api', 'mock', 'fallback']).toContain(rate1.source);

      // Second call should use cache
      const rate2 = await currencyService.getExchangeRate('USD', 'EUR');
      expect(rate2.source).toBe('cache');
      expect(rate2.rate).toBe(rate1.rate);
    });

    it('should handle concurrent requests efficiently', async () => {
      const promises = Array(10).fill(null).map(() => 
        currencyService.getExchangeRate('USD', 'EUR')
      );
      
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result.rate).toBeGreaterThan(0);
      });
    });
  });

  describe('API Integration', () => {
    beforeEach(() => {
      // Mock successful Alpha Vantage API response
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          'Realtime Currency Exchange Rate': {
            '1. From_Currency Code': 'USD',
            '2. From_Currency Name': 'US Dollar',
            '3. To_Currency Code': 'EUR',
            '4. To_Currency Name': 'Euro',
            '5. Exchange Rate': '0.85',
            '6. Last Refreshed': new Date().toISOString(),
            '7. Time Zone': 'UTC',
            '8. Bid Price': '0.85',
            '9. Ask Price': '0.85'
          }
        })
      });
    });

    it('should fetch exchange rates from API', async () => {
      const rate = await currencyService.getExchangeRate('USD', 'EUR');
      
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('alphavantage.co/query')
      );
      expect(rate.rate).toBe(0.85);
      expect(rate.source).toBe('api');
    });

    it('should handle API failures gracefully', async () => {
  const restore = silenceConsole();
      (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
      
      const rate = await currencyService.getExchangeRate('USD', 'EUR');
      
  restore();
      expect(['fallback', 'mock']).toContain(rate.source);
      expect(rate.rate).toBeGreaterThan(0);
    });

    it('should use cache when available even if API fails', async () => {
      // First successful call to populate cache
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          'Realtime Currency Exchange Rate': {
            '1. From_Currency Code': 'USD',
            '2. From_Currency Name': 'US Dollar',
            '3. To_Currency Code': 'EUR',
            '4. To_Currency Name': 'Euro',
            '5. Exchange Rate': '0.85',
            '6. Last Refreshed': new Date().toISOString(),
            '7. Time Zone': 'UTC',
            '8. Bid Price': '0.85',
            '9. Ask Price': '0.85'
          }
        })
      });
      await currencyService.getExchangeRate('USD', 'EUR');
      
      // Mock API failure (should not be hit because cache is fresh)
      (fetch as jest.Mock).mockRejectedValue(new Error('API down'));
      
      const rate = await currencyService.getExchangeRate('USD', 'EUR');
      expect(rate.source).toBe('cache');
    });

  it('should retry failed API requests', async () => {
  const restore = silenceConsole();
      (fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            'Realtime Currency Exchange Rate': {
              '1. From_Currency Code': 'USD',
              '2. From_Currency Name': 'US Dollar',
              '3. To_Currency Code': 'EUR',
              '4. To_Currency Name': 'Euro',
              '5. Exchange Rate': '0.85',
              '6. Last Refreshed': new Date().toISOString(),
              '7. Time Zone': 'UTC',
              '8. Bid Price': '0.85',
              '9. Ask Price': '0.85'
            }
          })
        });
      
      const rate = await currencyService.getExchangeRate('USD', 'EUR');
      
  restore();
      expect(rate.rate).toBe(0.85);
    });
  });

  describe('Currency Auto-Detection', () => {
    it('should detect currency from country code', async () => {
      const currency = await currencyService.detectCurrencyFromLocation('US');
      expect(currency).toBe('USD');
      
      const eurCurrency = await currencyService.detectCurrencyFromLocation('DE');
      expect(eurCurrency).toBe('EUR');
      
      const gbpCurrency = await currencyService.detectCurrencyFromLocation('GB');
      expect(gbpCurrency).toBe('GBP');
    });

    it('should handle unknown country codes', async () => {
      const currency = await currencyService.detectCurrencyFromLocation('XX');
      expect(currency).toBe('USD'); // Default fallback
    });

    it('should detect currency from market symbols', async () => {
      const usCurrency = await currencyService.detectCurrencyFromMarket('AAPL');
      expect(usCurrency).toBe('USD');
      
      const ukCurrency = await currencyService.detectCurrencyFromMarket('VOD.L');
      expect(ukCurrency).toBe('GBP');
      
      const jpCurrency = await currencyService.detectCurrencyFromMarket('7203.T');
      expect(jpCurrency).toBe('JPY');
      
      const euCurrency = await currencyService.detectCurrencyFromMarket('SAP.DE');
      expect(euCurrency).toBe('EUR');
    });

    it('should default to USD for unknown market symbols', async () => {
      const currency = await currencyService.detectCurrencyFromMarket('UNKNOWN');
      expect(currency).toBe('USD');
    });
  });

  describe('Currency Formatting', () => {
    it('should format currency with locale-specific formatting', () => {
      const amount = 1234.56;
      
      const usdFormatted = currencyService.formatCurrency(amount, 'USD', 'en-US');
      expect(usdFormatted).toMatch(/\$1,234\.56/);
      
      const eurFormatted = currencyService.formatCurrency(amount, 'EUR', 'de-DE');
      expect(eurFormatted).toMatch(/1\.234,56\s*€/);
      
  const jpyFormatted = currencyService.formatCurrency(1234, 'JPY', 'ja-JP');
  // Accept both standard and full-width Yen symbols depending on Node/ICU
  expect(jpyFormatted).toMatch(/[¥￥]1,234/);
      expect(jpyFormatted).not.toContain('.00');
    });

    it('should format currency with conversion display', () => {
      const originalAmount = {
        amount: 100,
        currency: 'USD',
        convertedAmount: 85,
        exchangeRate: 0.85
      };
      
      const formatted = currencyService.formatCurrencyWithConversion(
        originalAmount, 
        'EUR', 
        'en-US'
      );
      
      expect(formatted).toContain('$100.00');
      expect(formatted).toContain('€85.00');
      expect(formatted).toContain('(');
      expect(formatted).toContain(')');
    });

    it('should handle formatting without conversion', () => {
      const originalAmount = {
        amount: 100,
        currency: 'USD'
      };
      
      const formatted = currencyService.formatCurrencyWithConversion(
        originalAmount, 
        'USD', 
        'en-US'
      );
      
      expect(formatted).toBe('$100.00');
      expect(formatted).not.toContain('(');
    });

    it('should fallback to symbol formatting for invalid locales', () => {
      const formatted = currencyService.formatCurrency(100, 'USD', 'invalid-locale');
      expect(formatted).toBe('$100.00');
    });
  });

  describe('Enhanced Currency Support', () => {
    it('should support extended currency list', async () => {
      const currencies = await currencyService.getSupportedCurrencies();
      
      // Check for additional currencies
      const currencyCodes = currencies.map(c => c.code);
      expect(currencyCodes).toContain('CNY');
      expect(currencyCodes).toContain('INR');
      expect(currencyCodes).toContain('KRW');
      expect(currencyCodes).toContain('SGD');
      expect(currencyCodes).toContain('HKD');
      expect(currencyCodes).toContain('BRL');
      expect(currencyCodes).toContain('MXN');
      
      expect(currencies.length).toBeGreaterThanOrEqual(20);
    });

    it('should provide comprehensive currency information', async () => {
      const cny = await currencyService.getCurrencyInfo('CNY');
      expect(cny.name).toBe('Chinese Yuan');
      expect(cny.symbol).toBe('¥');
      expect(cny.countries).toContain('China');
      
      const inr = await currencyService.getCurrencyInfo('INR');
      expect(inr.name).toBe('Indian Rupee');
      expect(inr.symbol).toBe('₹');
      expect(inr.countries).toContain('India');
    });
  });

  describe('Cache Management', () => {
    it('should respect 15-minute cache duration', async () => {
      // Get initial rate
      const rate1 = await currencyService.getExchangeRate('USD', 'EUR');
      expect(rate1.source).toBe('api');
      
      // Immediate second call should use cache
      const rate2 = await currencyService.getExchangeRate('USD', 'EUR');
      expect(rate2.source).toBe('cache');
      
      // Verify cache status
      const status = await currencyService.getCacheStatus();
      const cacheAge = Date.now() - status.lastUpdated.getTime();
      expect(cacheAge).toBeLessThan(15 * 60 * 1000); // Less than 15 minutes
    });

    it('should refresh stale cache', async () => {
      // This test would require mocking time or waiting, 
      // so we'll test the refresh functionality instead
      await currencyService.refreshRates();
      
      const rate = await currencyService.getExchangeRate('USD', 'EUR');
      expect(rate.source).toBe('api');
    });
  });

  describe('Historical Rates with API Integration', () => {
    beforeEach(() => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          'Meta Data': {
            '1. Information': 'FX Daily Prices',
            '2. From Symbol': 'USD',
            '3. To Symbol': 'EUR',
            '4. Output Size': 'Compact',
            '5. Last Refreshed': '2024-01-17',
            '6. Time Zone': 'UTC'
          },
          'Time Series FX (Daily)': {
            '2024-01-17': { '1. open': '0.84', '2. high': '0.86', '3. low': '0.83', '4. close': '0.85' },
            '2024-01-16': { '1. open': '0.84', '2. high': '0.86', '3. low': '0.83', '4. close': '0.845' },
            '2024-01-15': { '1. open': '0.83', '2. high': '0.85', '3. low': '0.82', '4. close': '0.84' }
          }
        })
      });
    });

    it('should fetch historical rates from API', async () => {
      const startDate = new Date('2024-01-15');
      const endDate = new Date('2024-01-17');
      
      const rates = await currencyService.getHistoricalRates('USD', 'EUR', startDate, endDate);
      
      expect(rates.length).toBeGreaterThan(0);
      expect(rates[0].from).toBe('USD');
      expect(rates[0].to).toBe('EUR');
      expect(rates[0].date).toBeInstanceOf(Date);
    });

  it('should handle historical API failures gracefully', async () => {
  const restore = silenceConsole();
      (fetch as jest.Mock).mockRejectedValue(new Error('Historical API error'));
      
      const startDate = new Date('2024-01-15');
      const endDate = new Date('2024-01-17');
      
      const rates = await currencyService.getHistoricalRates('USD', 'EUR', startDate, endDate);
      
  restore();
  expect(rates.length).toBeGreaterThan(0);
  expect(['mock', 'fallback']).toContain(rates[0].source);
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle malformed API responses', async () => {
  const restore = silenceConsole();
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          error: 'Invalid API key'
        })
      });
      
      const rate = await currencyService.getExchangeRate('USD', 'EUR');
  restore();
      expect(['fallback', 'mock']).toContain(rate.source);
      expect(rate.rate).toBeGreaterThan(0);
    });

    it('should handle network timeouts', async () => {
  const restore = silenceConsole();
      (fetch as jest.Mock).mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 100)
        )
      );
      
      const rate = await currencyService.getExchangeRate('USD', 'EUR');
  restore();
      expect(['fallback', 'mock']).toContain(rate.source);
    });

    it('should normalize currency codes in all methods', async () => {
      const rate = await currencyService.getExchangeRate('usd', 'eur');
      expect(rate.from).toBe('USD');
      expect(rate.to).toBe('EUR');
      
      const conversion = await currencyService.convertAmount(100, 'gbp', 'jpy');
      expect(conversion.currency).toBe('JPY');
    });
  });
});
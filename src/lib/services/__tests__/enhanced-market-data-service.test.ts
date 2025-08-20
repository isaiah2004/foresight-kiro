import { EnhancedMarketDataService } from '../enhanced-market-data-service';

describe('EnhancedMarketDataService', () => {
  let service: EnhancedMarketDataService;

  beforeEach(() => {
    service = new EnhancedMarketDataService();
  });

  describe('getExchangeInfo', () => {
    it('should return correct exchange info for US symbols', () => {
      const exchangeInfo = service.getExchangeInfo('AAPL');
      expect(exchangeInfo.currency).toBe('USD');
      expect(exchangeInfo.code).toBe('NASDAQ');
    });

    it('should return correct exchange info for London symbols', () => {
      const exchangeInfo = service.getExchangeInfo('AAPL.L');
      expect(exchangeInfo.currency).toBe('GBP');
      expect(exchangeInfo.code).toBe('LSE');
    });

    it('should return correct exchange info for Tokyo symbols', () => {
      const exchangeInfo = service.getExchangeInfo('7203.T');
      expect(exchangeInfo.currency).toBe('JPY');
      expect(exchangeInfo.code).toBe('TSE');
    });

    it('should return correct exchange info for Hong Kong symbols', () => {
      const exchangeInfo = service.getExchangeInfo('0700.HK');
      expect(exchangeInfo.currency).toBe('HKD');
      expect(exchangeInfo.code).toBe('HKEX');
    });
  });

  describe('getSupportedExchanges', () => {
    it('should return all supported exchanges', () => {
      const exchanges = service.getSupportedExchanges();
      expect(exchanges.length).toBeGreaterThan(10);
      expect(exchanges.some(ex => ex.code === 'NASDAQ')).toBe(true);
      expect(exchanges.some(ex => ex.code === 'LSE')).toBe(true);
      expect(exchanges.some(ex => ex.code === 'TSE')).toBe(true);
    });
  });

  describe('getCurrencyMarketRecommendations', () => {
    it('should prioritize native currency markets', () => {
      const recommendations = service.getCurrencyMarketRecommendations('GBP');
      expect(recommendations[0].exchange.currency).toBe('GBP');
      expect(recommendations[0].relevanceScore).toBe(100);
      expect(recommendations[0].reason).toBe('Native GBP market');
    });

    it('should provide USD market access for non-USD currencies', () => {
      const recommendations = service.getCurrencyMarketRecommendations('EUR');
      const usdMarket = recommendations.find(r => r.exchange.currency === 'USD');
      expect(usdMarket).toBeDefined();
      expect(usdMarket?.relevanceScore).toBe(60);
    });

    it('should sort recommendations by relevance score', () => {
      const recommendations = service.getCurrencyMarketRecommendations('JPY');
      for (let i = 1; i < recommendations.length; i++) {
        expect(recommendations[i-1].relevanceScore).toBeGreaterThanOrEqual(
          recommendations[i].relevanceScore
        );
      }
    });
  });

  describe('isMarketOpen', () => {
    it('should handle invalid exchange codes', () => {
      const isOpen = service.isMarketOpen('INVALID');
      expect(isOpen).toBe(false);
    });

    it('should return boolean for valid exchange codes', () => {
      const isOpen = service.isMarketOpen('NASDAQ');
      expect(typeof isOpen).toBe('boolean');
    });
  });

  describe('getGlobalMarketStatus', () => {
    it('should return status for all exchanges', () => {
      const marketStatus = service.getGlobalMarketStatus();
      expect(marketStatus.length).toBeGreaterThan(10);
      
      marketStatus.forEach(status => {
        expect(status.exchange).toBeDefined();
        expect(typeof status.isOpen).toBe('boolean');
        expect(typeof status.localTime).toBe('string');
      });
    });
  });
});
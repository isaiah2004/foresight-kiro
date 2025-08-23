import { MarketDataService } from '../market-data-service';

// Mock fetch
global.fetch = jest.fn();

describe('MarketDataService', () => {
  let marketDataService: MarketDataService;
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    marketDataService = new MarketDataService();
    jest.clearAllMocks();
    
    // Set up environment variables
    process.env.FINNHUB_API_KEY = 'test-finnhub-key';
    process.env.ALPHA_VANTAGE_API_KEY = 'test-alpha-vantage-key';
  });

  afterEach(() => {
    delete process.env.FINNHUB_API_KEY;
    delete process.env.ALPHA_VANTAGE_API_KEY;
  });

  describe('getRealTimeQuote', () => {
    it('should fetch real-time quote successfully', async () => {
      const mockQuoteData = {
        c: 150.25, // current price
        d: 2.50,   // change
        dp: 1.69,  // change percent
        h: 152.00, // high
        l: 148.50, // low
        o: 149.00, // open
        pc: 147.75 // previous close
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockQuoteData,
      } as Response);

      const result = await marketDataService.getRealTimeQuote('AAPL');

      expect(result).toEqual({
        symbol: 'AAPL',
        currentPrice: 150.25,
        change: 2.50,
        changePercent: 1.69,
        high: 152.00,
        low: 148.50,
        open: 149.00,
        previousClose: 147.75,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://finnhub.io/api/v1/quote?symbol=AAPL&token=test-finnhub-key',
        {
          headers: {
            'X-Finnhub-Token': 'test-finnhub-key',
          },
        }
      );
    });

    it('should return null for invalid symbol', async () => {
      const mockInvalidData = {
        c: 0, h: 0, l: 0, o: 0, pc: 0, d: 0, dp: 0
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockInvalidData,
      } as Response);

      const result = await marketDataService.getRealTimeQuote('INVALID');

      expect(result).toBeNull();
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
      } as Response);

      const result = await marketDataService.getRealTimeQuote('AAPL');

      expect(result).toBeNull();
    });

    it('should return null when API key is not configured', async () => {
      delete process.env.FINNHUB_API_KEY;
      
      const result = await marketDataService.getRealTimeQuote('AAPL');

      expect(result).toBeNull();
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('getMultipleQuotes', () => {
    it('should fetch multiple quotes with batching', async () => {
      const mockQuoteData = {
        c: 150.25, d: 2.50, dp: 1.69, h: 152.00, l: 148.50, o: 149.00, pc: 147.75
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockQuoteData,
      } as Response);

      const symbols = ['AAPL', 'MSFT', 'GOOGL'];
      const result = await marketDataService.getMultipleQuotes(symbols);

      expect(Object.keys(result)).toEqual(symbols);
      expect(result['AAPL']).toBeTruthy();
      expect(result['MSFT']).toBeTruthy();
      expect(result['GOOGL']).toBeTruthy();
    });

    it('should handle empty symbols array', async () => {
      const result = await marketDataService.getMultipleQuotes([]);

      expect(result).toEqual({});
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('getHistoricalData', () => {
    it('should fetch historical data successfully', async () => {
      const mockHistoricalData = {
        'Time Series (Daily)': {
          '2023-12-01': {
            '1. open': '150.00',
            '2. high': '155.00',
            '3. low': '148.00',
            '4. close': '152.00',
            '5. volume': '1000000'
          },
          '2023-11-30': {
            '1. open': '148.00',
            '2. high': '151.00',
            '3. low': '147.00',
            '4. close': '150.00',
            '5. volume': '900000'
          }
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockHistoricalData,
      } as Response);

      const result = await marketDataService.getHistoricalData('AAPL', 'daily');

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        date: '2023-12-01',
        open: 150.00,
        high: 155.00,
        low: 148.00,
        close: 152.00,
        volume: 1000000
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=AAPL&apikey=test-alpha-vantage-key'
      );
    });

    it('should handle API errors', async () => {
      const mockErrorData = {
        'Error Message': 'Invalid API call'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockErrorData,
      } as Response);

      const result = await marketDataService.getHistoricalData('INVALID');

      expect(result).toEqual([]);
    });

    it('should handle rate limiting', async () => {
      const mockRateLimitData = {
        'Note': 'Thank you for using Alpha Vantage! Our standard API call frequency is 5 calls per minute'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRateLimitData,
      } as Response);

      const result = await marketDataService.getHistoricalData('AAPL');

      expect(result).toEqual([]);
    });

    it('should return empty array when API key is not configured', async () => {
      delete process.env.ALPHA_VANTAGE_API_KEY;
      
      const result = await marketDataService.getHistoricalData('AAPL');

      expect(result).toEqual([]);
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('searchSymbols', () => {
    it('should search symbols successfully', async () => {
      const mockSearchData = {
        result: [
          {
            symbol: 'AAPL',
            description: 'Apple Inc',
            type: 'Common Stock'
          },
          {
            symbol: 'AAPLW',
            description: 'Apple Inc Warrant',
            type: 'Warrant'
          }
        ]
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSearchData,
      } as Response);

      const result = await marketDataService.searchSymbols('AAPL');

      // Service filters to common stocks without dot-suffixed exchanges
      expect(result).toEqual([
        {
          symbol: 'AAPL',
          description: 'Apple Inc',
          type: 'Common Stock',
        },
      ]);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://finnhub.io/api/v1/search?q=AAPL&token=test-finnhub-key',
        {
          headers: {
            'X-Finnhub-Token': 'test-finnhub-key',
          },
        }
      );
    });

    it('should handle empty search results', async () => {
      const mockEmptyData = {};

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockEmptyData,
      } as Response);

      const result = await marketDataService.searchSymbols('INVALID');

      expect(result).toEqual([]);
    });
  });

  describe('getMarketNews', () => {
    it('should fetch market news successfully', async () => {
      const mockNewsData = [
        {
          category: 'general',
          datetime: 1640995200,
          headline: 'Test News Headline',
          id: 123,
          image: 'https://example.com/image.jpg',
          related: 'AAPL',
          source: 'Reuters',
          summary: 'Test news summary',
          url: 'https://example.com/news'
        }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockNewsData,
      } as Response);

      const result = await marketDataService.getMarketNews('general', 5);

      expect(result).toEqual(mockNewsData.slice(0, 5));
      expect(mockFetch).toHaveBeenCalledWith(
        'https://finnhub.io/api/v1/news?category=general&token=test-finnhub-key',
        {
          headers: {
            'X-Finnhub-Token': 'test-finnhub-key',
          },
        }
      );
    });
  });
});
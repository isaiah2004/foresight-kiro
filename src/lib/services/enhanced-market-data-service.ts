import { MarketDataService } from './market-data-service';

export interface EnhancedMarketQuote {
  symbol: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  currency: string;
  exchange: string;
  marketCap?: number;
  volume?: number;
}

export interface MultiCurrencyQuote {
  symbol: string;
  quotes: {
    [currency: string]: {
      price: number;
      currency: string;
      exchange: string;
      lastUpdated: Date;
    };
  };
}

export interface ExchangeInfo {
  code: string;
  name: string;
  country: string;
  currency: string;
  timezone: string;
  tradingHours: {
    open: string;
    close: string;
  };
}

export class EnhancedMarketDataService extends MarketDataService {
  private readonly exchangeMap: { [suffix: string]: ExchangeInfo } = {
    '': {
      code: 'NASDAQ',
      name: 'NASDAQ/NYSE',
      country: 'United States',
      currency: 'USD',
      timezone: 'America/New_York',
      tradingHours: { open: '09:30', close: '16:00' }
    },
    '.L': {
      code: 'LSE',
      name: 'London Stock Exchange',
      country: 'United Kingdom',
      currency: 'GBP',
      timezone: 'Europe/London',
      tradingHours: { open: '08:00', close: '16:30' }
    },
    '.TO': {
      code: 'TSX',
      name: 'Toronto Stock Exchange',
      country: 'Canada',
      currency: 'CAD',
      timezone: 'America/Toronto',
      tradingHours: { open: '09:30', close: '16:00' }
    },
    '.T': {
      code: 'TSE',
      name: 'Tokyo Stock Exchange',
      country: 'Japan',
      currency: 'JPY',
      timezone: 'Asia/Tokyo',
      tradingHours: { open: '09:00', close: '15:00' }
    },
    '.HK': {
      code: 'HKEX',
      name: 'Hong Kong Stock Exchange',
      country: 'Hong Kong',
      currency: 'HKD',
      timezone: 'Asia/Hong_Kong',
      tradingHours: { open: '09:30', close: '16:00' }
    },
    '.AX': {
      code: 'ASX',
      name: 'Australian Securities Exchange',
      country: 'Australia',
      currency: 'AUD',
      timezone: 'Australia/Sydney',
      tradingHours: { open: '10:00', close: '16:00' }
    },
    '.PA': {
      code: 'EPA',
      name: 'Euronext Paris',
      country: 'France',
      currency: 'EUR',
      timezone: 'Europe/Paris',
      tradingHours: { open: '09:00', close: '17:30' }
    },
    '.DE': {
      code: 'XETRA',
      name: 'XETRA (Frankfurt)',
      country: 'Germany',
      currency: 'EUR',
      timezone: 'Europe/Berlin',
      tradingHours: { open: '09:00', close: '17:30' }
    },
    '.MI': {
      code: 'BIT',
      name: 'Borsa Italiana (Milan)',
      country: 'Italy',
      currency: 'EUR',
      timezone: 'Europe/Rome',
      tradingHours: { open: '09:00', close: '17:30' }
    },
    '.AS': {
      code: 'AMS',
      name: 'Euronext Amsterdam',
      country: 'Netherlands',
      currency: 'EUR',
      timezone: 'Europe/Amsterdam',
      tradingHours: { open: '09:00', close: '17:30' }
    },
    '.BR': {
      code: 'EBR',
      name: 'Euronext Brussels',
      country: 'Belgium',
      currency: 'EUR',
      timezone: 'Europe/Brussels',
      tradingHours: { open: '09:00', close: '17:30' }
    },
    '.SW': {
      code: 'SWX',
      name: 'SIX Swiss Exchange',
      country: 'Switzerland',
      currency: 'CHF',
      timezone: 'Europe/Zurich',
      tradingHours: { open: '09:00', close: '17:30' }
    },
    '.ST': {
      code: 'STO',
      name: 'Nasdaq Stockholm',
      country: 'Sweden',
      currency: 'SEK',
      timezone: 'Europe/Stockholm',
      tradingHours: { open: '09:00', close: '17:30' }
    },
    '.OL': {
      code: 'OSE',
      name: 'Oslo Stock Exchange',
      country: 'Norway',
      currency: 'NOK',
      timezone: 'Europe/Oslo',
      tradingHours: { open: '09:00', close: '16:25' }
    },
    '.CO': {
      code: 'CPH',
      name: 'Nasdaq Copenhagen',
      country: 'Denmark',
      currency: 'DKK',
      timezone: 'Europe/Copenhagen',
      tradingHours: { open: '09:00', close: '17:00' }
    },
    '.SI': {
      code: 'SGX',
      name: 'Singapore Exchange',
      country: 'Singapore',
      currency: 'SGD',
      timezone: 'Asia/Singapore',
      tradingHours: { open: '09:00', close: '17:00' }
    },
    '.KS': {
      code: 'KRX',
      name: 'Korea Exchange',
      country: 'South Korea',
      currency: 'KRW',
      timezone: 'Asia/Seoul',
      tradingHours: { open: '09:00', close: '15:30' }
    },
    '.SS': {
      code: 'SSE',
      name: 'Shanghai Stock Exchange',
      country: 'China',
      currency: 'CNY',
      timezone: 'Asia/Shanghai',
      tradingHours: { open: '09:30', close: '15:00' }
    },
    '.SZ': {
      code: 'SZSE',
      name: 'Shenzhen Stock Exchange',
      country: 'China',
      currency: 'CNY',
      timezone: 'Asia/Shanghai',
      tradingHours: { open: '09:30', close: '15:00' }
    },
    '.NS': {
      code: 'NSE',
      name: 'National Stock Exchange of India',
      country: 'India',
      currency: 'INR',
      timezone: 'Asia/Kolkata',
      tradingHours: { open: '09:15', close: '15:30' }
    },
    '.BO': {
      code: 'BSE',
      name: 'Bombay Stock Exchange',
      country: 'India',
      currency: 'INR',
      timezone: 'Asia/Kolkata',
      tradingHours: { open: '09:15', close: '15:30' }
    }
  };

  /**
   * Get exchange information from symbol
   */
  getExchangeInfo(symbol: string): ExchangeInfo {
    for (const [suffix, exchange] of Object.entries(this.exchangeMap)) {
      if (suffix === '' && !symbol.includes('.')) {
        return exchange; // Default to US markets
      }
      if (suffix !== '' && symbol.endsWith(suffix)) {
        return exchange;
      }
    }
    return this.exchangeMap['']; // Default fallback
  }

  /**
   * Get enhanced quote with currency and exchange information
   */
  async getEnhancedQuote(symbol: string): Promise<EnhancedMarketQuote | null> {
    try {
      const baseQuote = await this.getRealTimeQuote(symbol);
      if (!baseQuote) return null;

      const exchangeInfo = this.getExchangeInfo(symbol);

      return {
        ...baseQuote,
        currency: exchangeInfo.currency,
        exchange: exchangeInfo.name,
      };
    } catch (error) {
      console.error(`Error fetching enhanced quote for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Get multiple enhanced quotes with currency information
   */
  async getMultipleEnhancedQuotes(symbols: string[]): Promise<Record<string, EnhancedMarketQuote | null>> {
    const quotes: Record<string, EnhancedMarketQuote | null> = {};

    // Process in batches to avoid rate limiting
    const batchSize = 5;
    for (let i = 0; i < symbols.length; i += batchSize) {
      const batch = symbols.slice(i, i + batchSize);
      const batchPromises = batch.map(symbol => this.getEnhancedQuote(symbol));
      const batchResults = await Promise.all(batchPromises);

      batch.forEach((symbol, index) => {
        quotes[symbol] = batchResults[index];
      });

      // Add delay between batches to respect rate limits
      if (i + batchSize < symbols.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return quotes;
  }

  /**
   * Get quotes for the same company across multiple exchanges
   */
  async getMultiCurrencyQuote(baseSymbol: string, exchanges: string[] = []): Promise<MultiCurrencyQuote | null> {
    try {
      const symbols = exchanges.length > 0 
        ? exchanges.map(suffix => suffix === '' ? baseSymbol : `${baseSymbol}${suffix}`)
        : [baseSymbol]; // Default to base symbol only

      const quotes = await this.getMultipleEnhancedQuotes(symbols);
      const multiCurrencyQuote: MultiCurrencyQuote = {
        symbol: baseSymbol,
        quotes: {}
      };

      for (const [symbol, quote] of Object.entries(quotes)) {
        if (quote) {
          multiCurrencyQuote.quotes[quote.currency] = {
            price: quote.currentPrice,
            currency: quote.currency,
            exchange: quote.exchange,
            lastUpdated: new Date()
          };
        }
      }

      return Object.keys(multiCurrencyQuote.quotes).length > 0 ? multiCurrencyQuote : null;
    } catch (error) {
      console.error(`Error fetching multi-currency quote for ${baseSymbol}:`, error);
      return null;
    }
  }

  /**
   * Search for symbols with exchange and currency information
   */
  async searchSymbolsWithExchange(query: string): Promise<Array<{
    symbol: string;
    description: string;
    type: string;
    exchange: string;
    currency: string;
    country: string;
  }>> {
    try {
      const baseResults = await this.searchSymbols(query);
      
      return baseResults.map(result => {
        const exchangeInfo = this.getExchangeInfo(result.symbol);
        return {
          ...result,
          exchange: exchangeInfo.name,
          currency: exchangeInfo.currency,
          country: exchangeInfo.country
        };
      });
    } catch (error) {
      console.error('Error searching symbols with exchange info:', error);
      return [];
    }
  }

  /**
   * Get all supported exchanges
   */
  getSupportedExchanges(): ExchangeInfo[] {
    return Object.values(this.exchangeMap);
  }

  /**
   * Check if market is currently open for a given exchange
   */
  isMarketOpen(exchangeCode: string): boolean {
    const exchange = Object.values(this.exchangeMap).find(ex => ex.code === exchangeCode);
    if (!exchange) return false;

    try {
      const now = new Date();
      const marketTime = new Date(now.toLocaleString("en-US", { timeZone: exchange.timezone }));
      const currentTime = marketTime.getHours() * 100 + marketTime.getMinutes();
      
      const openTime = parseInt(exchange.tradingHours.open.replace(':', ''));
      const closeTime = parseInt(exchange.tradingHours.close.replace(':', ''));
      
      // Check if it's a weekday (Monday = 1, Sunday = 0)
      const dayOfWeek = marketTime.getDay();
      const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
      
      return isWeekday && currentTime >= openTime && currentTime <= closeTime;
    } catch (error) {
      console.error(`Error checking market hours for ${exchangeCode}:`, error);
      return false;
    }
  }

  /**
   * Get market status for all exchanges
   */
  getGlobalMarketStatus(): Array<{
    exchange: ExchangeInfo;
    isOpen: boolean;
    localTime: string;
  }> {
    return Object.values(this.exchangeMap).map(exchange => {
      const isOpen = this.isMarketOpen(exchange.code);
      const localTime = new Date().toLocaleString("en-US", { 
        timeZone: exchange.timezone,
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
      });

      return {
        exchange,
        isOpen,
        localTime
      };
    });
  }

  /**
   * Get currency-specific market recommendations
   */
  getCurrencyMarketRecommendations(targetCurrency: string): Array<{
    exchange: ExchangeInfo;
    relevanceScore: number;
    reason: string;
  }> {
    const recommendations = Object.values(this.exchangeMap)
      .map(exchange => {
        let relevanceScore = 0;
        let reason = '';

        // Direct currency match
        if (exchange.currency === targetCurrency) {
          relevanceScore = 100;
          reason = `Native ${targetCurrency} market`;
        }
        // Major markets for major currencies
        else if (targetCurrency === 'USD' && exchange.code === 'NASDAQ') {
          relevanceScore = 90;
          reason = 'Primary USD market';
        }
        else if (targetCurrency === 'EUR' && ['EPA', 'XETRA', 'BIT', 'AMS', 'EBR'].includes(exchange.code)) {
          relevanceScore = 80;
          reason = 'Major EUR market';
        }
        // Regional relevance
        else if (exchange.currency === 'USD' && targetCurrency !== 'USD') {
          relevanceScore = 60;
          reason = 'Global USD market access';
        }
        else {
          relevanceScore = 30;
          reason = 'Alternative market option';
        }

        return {
          exchange,
          relevanceScore,
          reason
        };
      })
      .sort((a, b) => b.relevanceScore - a.relevanceScore);

    return recommendations;
  }
}

// Export singleton instance
export const enhancedMarketDataService = new EnhancedMarketDataService();
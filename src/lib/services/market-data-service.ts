export interface MarketQuote {
  symbol: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
}

export interface HistoricalData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface NewsItem {
  category: string;
  datetime: number;
  headline: string;
  id: number;
  image: string;
  related: string;
  source: string;
  summary: string;
  url: string;
}

export interface CryptoQuote {
  symbol: string;
  name: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  marketCap?: number;
  volume?: number;
}

export interface CryptoSearchResult {
  symbol: string;
  name: string;
  type: 'crypto';
}

export class MarketDataService {
  private readonly finnhubApiKey: string;
  private readonly alphaVantageApiKey: string;
  private readonly baseUrl = 'https://finnhub.io/api/v1';
  private readonly alphaVantageUrl = 'https://www.alphavantage.co/query';

  constructor() {
    this.finnhubApiKey = process.env.FINNHUB_API_KEY || '';
    this.alphaVantageApiKey = process.env.ALPHA_VANTAGE_API_KEY || '';
  }

  /**
   * Get real-time quote for a symbol using FinnHub
   */
  async getRealTimeQuote(symbol: string): Promise<MarketQuote | null> {
    try {
      if (!this.finnhubApiKey) {
        console.warn('FinnHub API key not configured');
        return null;
      }

      console.log(`Fetching quote for ${symbol} from FinnHub...`);
      const response = await fetch(
        `${this.baseUrl}/quote?symbol=${symbol}&token=${this.finnhubApiKey}`,
        {
          headers: {
            'X-Finnhub-Token': this.finnhubApiKey,
          },
        }
      );

      if (!response.ok) {
        console.error(`FinnHub API error for ${symbol}: ${response.status}`);
        throw new Error(`FinnHub API error: ${response.status}`);
      }

      const data = await response.json();
      console.log(`Raw FinnHub data for ${symbol}:`, data);

      // FinnHub returns 0 values for invalid symbols
      if (data.c === 0 && data.h === 0 && data.l === 0) {
        console.warn(`No valid data returned for symbol ${symbol}`);
        return null;
      }

      const quote = {
        symbol,
        currentPrice: data.c,
        change: data.d,
        changePercent: data.dp,
        high: data.h,
        low: data.l,
        open: data.o,
        previousClose: data.pc,
      };

      console.log(`Processed quote for ${symbol}:`, quote);
      return quote;
    } catch (error) {
      console.error(`Error fetching quote for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Get multiple quotes at once
   */
  async getMultipleQuotes(symbols: string[]): Promise<Record<string, MarketQuote | null>> {
    const quotes: Record<string, MarketQuote | null> = {};

    // Process in batches to avoid rate limiting
    const batchSize = 5;
    for (let i = 0; i < symbols.length; i += batchSize) {
      const batch = symbols.slice(i, i + batchSize);
      const batchPromises = batch.map(symbol => this.getRealTimeQuote(symbol));
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
   * Get historical data using Alpha Vantage
   */
  async getHistoricalData(symbol: string, period: 'daily' | 'weekly' | 'monthly' = 'daily'): Promise<HistoricalData[]> {
    try {
      if (!this.alphaVantageApiKey) {
        console.warn('Alpha Vantage API key not configured');
        return [];
      }

      const functionMap = {
        daily: 'TIME_SERIES_DAILY',
        weekly: 'TIME_SERIES_WEEKLY',
        monthly: 'TIME_SERIES_MONTHLY',
      };

      const response = await fetch(
        `${this.alphaVantageUrl}?function=${functionMap[period]}&symbol=${symbol}&apikey=${this.alphaVantageApiKey}`
      );

      if (!response.ok) {
        throw new Error(`Alpha Vantage API error: ${response.status}`);
      }

      const data = await response.json();

      // Check for API errors
      if (data['Error Message']) {
        throw new Error(data['Error Message']);
      }

      if (data['Note']) {
        console.warn('Alpha Vantage rate limit:', data['Note']);
        return [];
      }

      const timeSeriesKey = Object.keys(data).find(key => key.includes('Time Series'));
      if (!timeSeriesKey || !data[timeSeriesKey]) {
        return [];
      }

      const timeSeries = data[timeSeriesKey];
      const historicalData: HistoricalData[] = [];

      Object.entries(timeSeries).forEach(([date, values]: [string, any]) => {
        historicalData.push({
          date,
          open: parseFloat(values['1. open']),
          high: parseFloat(values['2. high']),
          low: parseFloat(values['3. low']),
          close: parseFloat(values['4. close']),
          volume: parseInt(values['5. volume']),
        });
      });

      // Sort by date (most recent first)
      return historicalData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (error) {
      console.error(`Error fetching historical data for ${symbol}:`, error);
      return [];
    }
  }

  /**
   * Get market news
   */
  async getMarketNews(category: string = 'general', limit: number = 10): Promise<NewsItem[]> {
    try {
      if (!this.finnhubApiKey) {
        console.warn('FinnHub API key not configured');
        return [];
      }

      const response = await fetch(
        `${this.baseUrl}/news?category=${category}&token=${this.finnhubApiKey}`,
        {
          headers: {
            'X-Finnhub-Token': this.finnhubApiKey,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`FinnHub API error: ${response.status}`);
      }

      const data = await response.json();
      return data.slice(0, limit);
    } catch (error) {
      console.error('Error fetching market news:', error);
      return [];
    }
  }

  /**
   * Search for symbols with enhanced filtering and sorting
   */
  async searchSymbols(query: string): Promise<Array<{ symbol: string; description: string; type: string }>> {
    try {
      if (!this.finnhubApiKey) {
        console.warn('FinnHub API key not configured');
        return [];
      }

      const response = await fetch(
        `${this.baseUrl}/search?q=${encodeURIComponent(query)}&token=${this.finnhubApiKey}`,
        {
          headers: {
            'X-Finnhub-Token': this.finnhubApiKey,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`FinnHub API error: ${response.status}`);
      }

      const data = await response.json();
      const results = data.result || [];

      // Enhanced filtering and sorting
      return results
        .filter((item: any) => {
          // Filter out penny stocks and non-US exchanges for better UX
          return item.type === 'Common Stock' &&
            item.symbol &&
            !item.symbol.includes('.') && // Remove foreign exchanges
            item.description &&
            item.description.length > 0;
        })
        .sort((a: any, b: any) => {
          const queryLower = query.toLowerCase();

          // Prioritize exact symbol matches
          if (a.symbol.toLowerCase() === queryLower) return -1;
          if (b.symbol.toLowerCase() === queryLower) return 1;

          // Then prioritize symbol starts with query
          if (a.symbol.toLowerCase().startsWith(queryLower) && !b.symbol.toLowerCase().startsWith(queryLower)) return -1;
          if (b.symbol.toLowerCase().startsWith(queryLower) && !a.symbol.toLowerCase().startsWith(queryLower)) return 1;

          // Then prioritize company name starts with query
          if (a.description.toLowerCase().startsWith(queryLower) && !b.description.toLowerCase().startsWith(queryLower)) return -1;
          if (b.description.toLowerCase().startsWith(queryLower) && !a.description.toLowerCase().startsWith(queryLower)) return 1;

          // Finally sort alphabetically by symbol
          return a.symbol.localeCompare(b.symbol);
        })
        .slice(0, 10); // Return top 10 results
    } catch (error) {
      console.error('Error searching symbols:', error);
      return [];
    }
  }

  /**
   * Get company profile information
   */
  async getCompanyProfile(symbol: string): Promise<{ name: string; industry: string; sector: string; country: string } | null> {
    try {
      if (!this.finnhubApiKey) {
        console.warn('FinnHub API key not configured');
        return null;
      }

      const response = await fetch(
        `${this.baseUrl}/stock/profile2?symbol=${symbol}&token=${this.finnhubApiKey}`,
        {
          headers: {
            'X-Finnhub-Token': this.finnhubApiKey,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`FinnHub API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.name) {
        return null;
      }

      return {
        name: data.name,
        industry: data.finnhubIndustry || 'Unknown',
        sector: data.ggroup || 'Unknown',
        country: data.country || 'Unknown',
      };
    } catch (error) {
      console.error(`Error fetching company profile for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Get cryptocurrency quote using Alpha Vantage
   */
  async getCryptoQuote(symbol: string, market: string = 'USD'): Promise<CryptoQuote | null> {
    try {
      if (!this.alphaVantageApiKey) {
        console.warn('Alpha Vantage API key not configured');
        return null;
      }

      console.log(`Fetching crypto quote for ${symbol} from Alpha Vantage...`);
      const response = await fetch(
        `${this.alphaVantageUrl}?function=CURRENCY_EXCHANGE_RATE&from_currency=${symbol}&to_currency=${market}&apikey=${this.alphaVantageApiKey}`
      );

      if (!response.ok) {
        console.error(`Alpha Vantage API error for ${symbol}: ${response.status}`);
        throw new Error(`Alpha Vantage API error: ${response.status}`);
      }

      const data = await response.json();
      console.log(`Raw Alpha Vantage crypto data for ${symbol}:`, data);

      // Check for API errors
      if (data['Error Message']) {
        throw new Error(data['Error Message']);
      }

      if (data['Note']) {
        console.warn('Alpha Vantage rate limit:', data['Note']);
        return null;
      }

      const exchangeRate = data['Realtime Currency Exchange Rate'];
      if (!exchangeRate) {
        console.warn(`No exchange rate data for ${symbol}`);
        return null;
      }

      const currentPrice = parseFloat(exchangeRate['5. Exchange Rate']);
      const previousPrice = parseFloat(exchangeRate['8. Bid Price']) || currentPrice;
      const change = currentPrice - previousPrice;
      const changePercent = previousPrice > 0 ? (change / previousPrice) * 100 : 0;

      const quote: CryptoQuote = {
        symbol,
        name: exchangeRate['2. From_Currency Name'] || symbol,
        currentPrice,
        change,
        changePercent,
      };

      console.log(`Processed crypto quote for ${symbol}:`, quote);
      return quote;
    } catch (error) {
      console.error(`Error fetching crypto quote for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Search for cryptocurrencies
   */
  async searchCrypto(query: string): Promise<CryptoSearchResult[]> {
    // Popular cryptocurrencies list for search suggestions
    const popularCryptos = [
      { symbol: 'BTC', name: 'Bitcoin' },
      { symbol: 'ETH', name: 'Ethereum' },
      { symbol: 'BNB', name: 'Binance Coin' },
      { symbol: 'XRP', name: 'XRP' },
      { symbol: 'ADA', name: 'Cardano' },
      { symbol: 'DOGE', name: 'Dogecoin' },
      { symbol: 'MATIC', name: 'Polygon' },
      { symbol: 'SOL', name: 'Solana' },
      { symbol: 'DOT', name: 'Polkadot' },
      { symbol: 'AVAX', name: 'Avalanche' },
      { symbol: 'SHIB', name: 'Shiba Inu' },
      { symbol: 'TRX', name: 'TRON' },
      { symbol: 'UNI', name: 'Uniswap' },
      { symbol: 'ATOM', name: 'Cosmos' },
      { symbol: 'LTC', name: 'Litecoin' },
      { symbol: 'LINK', name: 'Chainlink' },
      { symbol: 'BCH', name: 'Bitcoin Cash' },
      { symbol: 'XLM', name: 'Stellar' },
      { symbol: 'ALGO', name: 'Algorand' },
      { symbol: 'VET', name: 'VeChain' },
    ];

    const queryLower = query.toLowerCase();

    return popularCryptos
      .filter(crypto =>
        crypto.symbol.toLowerCase().includes(queryLower) ||
        crypto.name.toLowerCase().includes(queryLower)
      )
      .sort((a, b) => {
        // Prioritize exact symbol matches
        if (a.symbol.toLowerCase() === queryLower) return -1;
        if (b.symbol.toLowerCase() === queryLower) return 1;

        // Then prioritize symbol starts with query
        if (a.symbol.toLowerCase().startsWith(queryLower) && !b.symbol.toLowerCase().startsWith(queryLower)) return -1;
        if (b.symbol.toLowerCase().startsWith(queryLower) && !a.symbol.toLowerCase().startsWith(queryLower)) return 1;

        // Then prioritize name starts with query
        if (a.name.toLowerCase().startsWith(queryLower) && !b.name.toLowerCase().startsWith(queryLower)) return -1;
        if (b.name.toLowerCase().startsWith(queryLower) && !a.name.toLowerCase().startsWith(queryLower)) return 1;

        return a.symbol.localeCompare(b.symbol);
      })
      .slice(0, 10)
      .map(crypto => ({
        symbol: crypto.symbol,
        name: crypto.name,
        type: 'crypto' as const
      }));
  }

  /**
   * Get cryptocurrency historical data using Alpha Vantage
   */
  async getCryptoHistoricalData(symbol: string, market: string = 'USD'): Promise<HistoricalData[]> {
    try {
      if (!this.alphaVantageApiKey) {
        console.warn('Alpha Vantage API key not configured');
        return [];
      }

      const response = await fetch(
        `${this.alphaVantageUrl}?function=DIGITAL_CURRENCY_DAILY&symbol=${symbol}&market=${market}&apikey=${this.alphaVantageApiKey}`
      );

      if (!response.ok) {
        throw new Error(`Alpha Vantage API error: ${response.status}`);
      }

      const data = await response.json();

      // Check for API errors
      if (data['Error Message']) {
        throw new Error(data['Error Message']);
      }

      if (data['Note']) {
        console.warn('Alpha Vantage rate limit:', data['Note']);
        return [];
      }

      const timeSeries = data['Time Series (Digital Currency Daily)'];
      if (!timeSeries) {
        return [];
      }

      const historicalData: HistoricalData[] = [];

      Object.entries(timeSeries).forEach(([date, values]: [string, any]) => {
        historicalData.push({
          date,
          open: parseFloat(values[`1a. open (${market})`]),
          high: parseFloat(values[`2a. high (${market})`]),
          low: parseFloat(values[`3a. low (${market})`]),
          close: parseFloat(values[`4a. close (${market})`]),
          volume: parseFloat(values['5. volume']),
        });
      });

      // Sort by date (most recent first)
      return historicalData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (error) {
      console.error(`Error fetching crypto historical data for ${symbol}:`, error);
      return [];
    }
  }
}

// Export the market data service instance
export const marketDataService = new MarketDataService();
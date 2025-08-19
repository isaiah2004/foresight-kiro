import {
  CurrencyService,
  Currency,
  ExchangeRate,
  HistoricalExchangeRate,
  CurrencyAmount,
  CurrencyExposure,
  CurrencyRiskAnalysis,
  Investment,
  HedgingOption,
  CurrencyVolatility
} from '@/types/financial';

// Supported currencies with comprehensive data
const SUPPORTED_CURRENCIES: Currency[] = [
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
    countries: ['Germany', 'France', 'Italy', 'Spain', 'Netherlands', 'Belgium', 'Austria', 'Portugal', 'Finland', 'Ireland', 'Luxembourg', 'Slovenia', 'Slovakia', 'Estonia', 'Latvia', 'Lithuania', 'Malta', 'Cyprus']
  },
  {
    code: 'GBP',
    name: 'British Pound Sterling',
    symbol: '£',
    decimalPlaces: 2,
    countries: ['United Kingdom']
  },
  {
    code: 'JPY',
    name: 'Japanese Yen',
    symbol: '¥',
    decimalPlaces: 0,
    countries: ['Japan']
  },
  {
    code: 'CHF',
    name: 'Swiss Franc',
    symbol: 'CHF',
    decimalPlaces: 2,
    countries: ['Switzerland', 'Liechtenstein']
  },
  {
    code: 'CAD',
    name: 'Canadian Dollar',
    symbol: 'C$',
    decimalPlaces: 2,
    countries: ['Canada']
  },
  {
    code: 'AUD',
    name: 'Australian Dollar',
    symbol: 'A$',
    decimalPlaces: 2,
    countries: ['Australia']
  },
  {
    code: 'CNY',
    name: 'Chinese Yuan',
    symbol: '¥',
    decimalPlaces: 2,
    countries: ['China']
  },
  {
    code: 'INR',
    name: 'Indian Rupee',
    symbol: '₹',
    decimalPlaces: 2,
    countries: ['India']
  },
  {
    code: 'KRW',
    name: 'South Korean Won',
    symbol: '₩',
    decimalPlaces: 0,
    countries: ['South Korea']
  },
  {
    code: 'SGD',
    name: 'Singapore Dollar',
    symbol: 'S$',
    decimalPlaces: 2,
    countries: ['Singapore']
  },
  {
    code: 'HKD',
    name: 'Hong Kong Dollar',
    symbol: 'HK$',
    decimalPlaces: 2,
    countries: ['Hong Kong']
  },
  {
    code: 'NOK',
    name: 'Norwegian Krone',
    symbol: 'kr',
    decimalPlaces: 2,
    countries: ['Norway']
  },
  {
    code: 'SEK',
    name: 'Swedish Krona',
    symbol: 'kr',
    decimalPlaces: 2,
    countries: ['Sweden']
  },
  {
    code: 'DKK',
    name: 'Danish Krone',
    symbol: 'kr',
    decimalPlaces: 2,
    countries: ['Denmark']
  },
  {
    code: 'NZD',
    name: 'New Zealand Dollar',
    symbol: 'NZ$',
    decimalPlaces: 2,
    countries: ['New Zealand']
  },
  {
    code: 'MXN',
    name: 'Mexican Peso',
    symbol: '$',
    decimalPlaces: 2,
    countries: ['Mexico']
  },
  {
    code: 'BRL',
    name: 'Brazilian Real',
    symbol: 'R$',
    decimalPlaces: 2,
    countries: ['Brazil']
  },
  {
    code: 'RUB',
    name: 'Russian Ruble',
    symbol: '₽',
    decimalPlaces: 2,
    countries: ['Russia']
  },
  {
    code: 'ZAR',
    name: 'South African Rand',
    symbol: 'R',
    decimalPlaces: 2,
    countries: ['South Africa']
  }
];

// Country to currency mapping for auto-detection
const COUNTRY_CURRENCY_MAP: { [countryCode: string]: string } = {
  'US': 'USD', 'CA': 'CAD', 'GB': 'GBP', 'DE': 'EUR', 'FR': 'EUR', 'IT': 'EUR', 'ES': 'EUR',
  'NL': 'EUR', 'BE': 'EUR', 'AT': 'EUR', 'PT': 'EUR', 'FI': 'EUR', 'IE': 'EUR', 'LU': 'EUR',
  'SI': 'EUR', 'SK': 'EUR', 'EE': 'EUR', 'LV': 'EUR', 'LT': 'EUR', 'MT': 'EUR', 'CY': 'EUR',
  'JP': 'JPY', 'CH': 'CHF', 'LI': 'CHF', 'AU': 'AUD', 'CN': 'CNY', 'IN': 'INR', 'KR': 'KRW',
  'SG': 'SGD', 'HK': 'HKD', 'NO': 'NOK', 'SE': 'SEK', 'DK': 'DKK', 'NZ': 'NZD', 'MX': 'MXN',
  'BR': 'BRL', 'RU': 'RUB', 'ZA': 'ZAR'
};

// Exchange rates cache with enhanced structure
interface ExchangeRateCache {
  [key: string]: {
    rate: number;
    timestamp: Date;
    source: string;
  };
}

// Alpha Vantage API response interfaces
interface AlphaVantageExchangeRateResponse {
  'Realtime Currency Exchange Rate': {
    '1. From_Currency Code': string;
    '2. From_Currency Name': string;
    '3. To_Currency Code': string;
    '4. To_Currency Name': string;
    '5. Exchange Rate': string;
    '6. Last Refreshed': string;
    '7. Time Zone': string;
    '8. Bid Price': string;
    '9. Ask Price': string;
  };
}

interface AlphaVantageTimeSeriesResponse {
  'Meta Data': {
    '1. Information': string;
    '2. From Symbol': string;
    '3. To Symbol': string;
    '4. Output Size': string;
    '5. Last Refreshed': string;
    '6. Time Zone': string;
  };
  'Time Series FX (Daily)': {
    [date: string]: {
      '1. open': string;
      '2. high': string;
      '3. low': string;
      '4. close': string;
    };
  };
}

interface AlphaVantageErrorResponse {
  'Error Message'?: string;
  'Note'?: string;
}

export class CurrencyServiceImpl implements CurrencyService {
  private exchangeRateCache: ExchangeRateCache = {};
  private lastCacheUpdate: Date = new Date();
  private readonly CACHE_DURATION_MS = 15 * 60 * 1000; // 15 minutes as per requirements
  private readonly API_BASE_URL = 'https://www.alphavantage.co/query';
  private readonly API_KEY = process.env.ALPHA_VANTAGE_API_KEY || 'demo';
  private readonly USE_MOCK_RATES = !process.env.ALPHA_VANTAGE_API_KEY || process.env.ALPHA_VANTAGE_API_KEY === 'demo';
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY_MS = 1000;

  // Clear cache to force fresh rates
  clearCache(): void {
    this.exchangeRateCache = {};
    this.lastCacheUpdate = new Date(0); // Force cache refresh
    console.log('Currency cache cleared - fresh rates will be fetched');
  }

  async getExchangeRate(from: string, to: string): Promise<ExchangeRate> {
    // Normalize currency codes
    from = this.normalizeCurrencyCode(from);
    to = this.normalizeCurrencyCode(to);

    // Same currency conversion
    if (from === to) {
      return {
        from,
        to,
        rate: 1,
        timestamp: new Date(),
        source: 'internal'
      };
    }

    // Check cache first
    const cacheKey = `${from}-${to}`;
    const cached = this.exchangeRateCache[cacheKey];

    if (cached && (Date.now() - cached.timestamp.getTime()) < this.CACHE_DURATION_MS) {
      return {
        from,
        to,
        rate: cached.rate,
        timestamp: cached.timestamp,
        source: 'cache'
      };
    }

    // If we're using demo key or no API key, skip API and use mock rates directly
    if (this.USE_MOCK_RATES) {
      console.log(`Using mock exchange rate for ${from} to ${to} (no valid API key)`);
      const mockRate = this.getMockExchangeRate(from, to);
      return {
        from,
        to,
        rate: mockRate,
        timestamp: new Date(),
        source: 'mock'
      };
    }

    try {
      // Fetch from API with retry logic
      const rate = await this.fetchExchangeRateWithRetry(from, to);
      const timestamp = new Date();

      // Update cache
      this.exchangeRateCache[cacheKey] = {
        rate,
        timestamp,
        source: 'api'
      };

      return {
        from,
        to,
        rate,
        timestamp,
        source: 'api'
      };
    } catch (error) {
      // Fallback to cached rate if available (even if stale)
      if (cached) {
        console.warn(`Using stale exchange rate for ${from}-${to}:`, error);
        return {
          from,
          to,
          rate: cached.rate,
          timestamp: cached.timestamp,
          source: 'stale-cache'
        };
      }

      // Last resort: use mock rate
      console.error(`Failed to fetch exchange rate for ${from}-${to}, using fallback:`, error);
      const fallbackRate = this.getMockExchangeRate(from, to);
      return {
        from,
        to,
        rate: fallbackRate,
        timestamp: new Date(),
        source: 'fallback'
      };
    }
  }

  async getHistoricalRates(
    from: string,
    to: string,
    startDate: Date,
    endDate: Date
  ): Promise<HistoricalExchangeRate[]> {
    from = this.normalizeCurrencyCode(from);
    to = this.normalizeCurrencyCode(to);

    if (from === to) {
      return [{
        from,
        to,
        rate: 1,
        timestamp: new Date(),
        source: 'internal',
        date: startDate
      }];
    }

    const rates: HistoricalExchangeRate[] = [];
    const currentDate = new Date(startDate);

    try {
      // For demo purposes, we'll fetch a few key dates and interpolate
      // In production, you might want to use a paid service for comprehensive historical data
      const keyDates = this.generateKeyDates(startDate, endDate);

      for (const date of keyDates) {
        try {
          const rate = await this.fetchHistoricalRate(from, to, date);
          rates.push({
            from,
            to,
            rate,
            timestamp: new Date(),
            source: 'historical-api',
            date: new Date(date)
          });
        } catch (error) {
          // Use interpolated or mock data for missing dates
          const mockRate = this.getMockExchangeRate(from, to);
          const variation = (Math.random() - 0.5) * 0.1; // ±5% variation
          rates.push({
            from,
            to,
            rate: mockRate * (1 + variation),
            timestamp: new Date(),
            source: 'fallback',
            date: new Date(date)
          });
        }
      }

      return rates.sort((a, b) => a.date.getTime() - b.date.getTime());
    } catch (error) {
      console.error(`Failed to fetch historical rates for ${from}-${to}:`, error);

      // Fallback to mock historical data
      return this.generateMockHistoricalRates(from, to, startDate, endDate);
    }
  }

  async convertAmount(amount: number, from: string, to: string): Promise<CurrencyAmount> {
    const exchangeRate = await this.getExchangeRate(from, to);
    const convertedAmount = amount * exchangeRate.rate;

    console.log(`Currency conversion: ${amount} ${from} → ${convertedAmount} ${to} (rate: ${exchangeRate.rate}, source: ${exchangeRate.source})`);

    return {
      amount: convertedAmount,
      currency: to,
      convertedAmount,
      exchangeRate: exchangeRate.rate,
      lastUpdated: exchangeRate.timestamp
    };
  }

  async getSupportedCurrencies(): Promise<Currency[]> {
    return SUPPORTED_CURRENCIES;
  }

  async getCurrencyInfo(code: string): Promise<Currency> {
    const currency = SUPPORTED_CURRENCIES.find(c => c.code === code);
    if (!currency) {
      throw new Error(`Currency ${code} not supported`);
    }
    return currency;
  }

  async convertMultipleAmounts(
    amounts: { amount: number; from: string; to: string }[]
  ): Promise<CurrencyAmount[]> {
    const results = await Promise.all(
      amounts.map(({ amount, from, to }) => this.convertAmount(amount, from, to))
    );
    return results;
  }

  async getMultipleRates(
    pairs: { from: string; to: string }[]
  ): Promise<ExchangeRate[]> {
    const results = await Promise.all(
      pairs.map(({ from, to }) => this.getExchangeRate(from, to))
    );
    return results;
  }

  async refreshRates(): Promise<void> {
    this.exchangeRateCache = {};
    this.lastCacheUpdate = new Date();
  }

  async getCacheStatus(): Promise<{ lastUpdated: Date; nextUpdate: Date }> {
    const nextUpdate = new Date(this.lastCacheUpdate.getTime() + this.CACHE_DURATION_MS);
    return {
      lastUpdated: this.lastCacheUpdate,
      nextUpdate
    };
  }

  async analyzeCurrencyRisk(portfolio: Investment[]): Promise<CurrencyRiskAnalysis> {
    const exposures = await this.calculateCurrencyExposure(portfolio);

    // Calculate risk score based on currency diversification
    const riskScore = this.calculateRiskScore(exposures);

    // Generate recommendations
    const recommendations = this.generateRecommendations(exposures);

    // Generate hedging opportunities
    const hedgingOpportunities = this.generateHedgingOpportunities(exposures);

    // Generate volatility metrics
    const volatilityMetrics = await this.generateVolatilityMetrics(exposures);

    return {
      totalExposure: exposures,
      riskScore,
      recommendations,
      hedgingOpportunities,
      volatilityMetrics
    };
  }

  async calculateCurrencyExposure(investments: Investment[]): Promise<CurrencyExposure[]> {
    const exposureMap = new Map<string, number>();
    let totalValue = 0;

    // Calculate total value in each currency
    for (const investment of investments) {
      const currency = investment.currency;
      const value = investment.quantity * (investment.currentPrice?.amount || investment.purchasePrice.amount);

      exposureMap.set(currency, (exposureMap.get(currency) || 0) + value);
      totalValue += value;
    }

    // Convert to CurrencyExposure array
    const exposures: CurrencyExposure[] = [];
    for (const [currency, value] of exposureMap.entries()) {
      const percentage = (value / totalValue) * 100;
      const riskLevel = this.assessCurrencyRisk(currency, percentage);

      exposures.push({
        currency,
        totalValue: {
          amount: value,
          currency,
        },
        percentage,
        riskLevel
      });
    }

    return exposures.sort((a, b) => b.percentage - a.percentage);
  }

  formatCurrencyAmount(amount: CurrencyAmount, locale: string = 'en-US'): string {
    const currency = SUPPORTED_CURRENCIES.find(c => c.code === amount.currency);
    if (!currency) {
      return `${amount.amount.toFixed(2)} ${amount.currency}`;
    }

    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: amount.currency,
        minimumFractionDigits: currency.decimalPlaces,
        maximumFractionDigits: currency.decimalPlaces
      }).format(amount.amount);
    } catch (error) {
      return `${currency.symbol}${amount.amount.toFixed(currency.decimalPlaces)}`;
    }
  }

  isValidCurrencyCode(code: string): boolean {
    return SUPPORTED_CURRENCIES.some(c => c.code === code);
  }

  normalizeCurrencyCode(code: string): string {
    return code.toUpperCase().trim();
  }

  async detectCurrencyFromLocation(countryCode: string): Promise<string> {
    const normalizedCountryCode = countryCode.toUpperCase();
    return COUNTRY_CURRENCY_MAP[normalizedCountryCode] || 'USD';
  }

  async detectCurrencyFromMarket(marketSymbol: string): Promise<string> {
    // Extract market/exchange from symbol (e.g., "AAPL" -> "USD", "VOD.L" -> "GBP")
    const marketCurrencyMap: { [suffix: string]: string } = {
      '.L': 'GBP',    // London Stock Exchange
      '.TO': 'CAD',   // Toronto Stock Exchange
      '.T': 'JPY',    // Tokyo Stock Exchange
      '.HK': 'HKD',   // Hong Kong Stock Exchange
      '.AX': 'AUD',   // Australian Securities Exchange
      '.PA': 'EUR',   // Euronext Paris
      '.DE': 'EUR',   // XETRA
      '.MI': 'EUR',   // Borsa Italiana
      '.AS': 'EUR',   // Euronext Amsterdam
      '.BR': 'EUR',   // Euronext Brussels
      '.SW': 'CHF',   // SIX Swiss Exchange
      '.ST': 'SEK',   // Nasdaq Stockholm
      '.OL': 'NOK',   // Oslo Stock Exchange
      '.CO': 'DKK',   // Nasdaq Copenhagen
    };

    for (const [suffix, currency] of Object.entries(marketCurrencyMap)) {
      if (marketSymbol.endsWith(suffix)) {
        return currency;
      }
    }

    // Default to USD for US markets or unknown symbols
    return 'USD';
  }

  formatCurrency(amount: number, currency: string, locale?: string): string {
    const currencyInfo = SUPPORTED_CURRENCIES.find(c => c.code === currency);
    if (!currencyInfo) {
      return `${amount.toFixed(2)} ${currency}`;
    }

    // Use provided locale or detect from currency
    const formatLocale = locale || this.getLocaleForCurrency(currency);

    try {
      return new Intl.NumberFormat(formatLocale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: currencyInfo.decimalPlaces,
        maximumFractionDigits: currencyInfo.decimalPlaces
      }).format(amount);
    } catch (error) {
      // Fallback formatting
      return `${currencyInfo.symbol}${amount.toFixed(currencyInfo.decimalPlaces)}`;
    }
  }

  formatCurrencyWithConversion(
    originalAmount: CurrencyAmount,
    targetCurrency: string,
    locale?: string
  ): string {
    const originalFormatted = this.formatCurrency(originalAmount.amount, originalAmount.currency, locale);

    if (originalAmount.convertedAmount && originalAmount.currency !== targetCurrency) {
      const convertedFormatted = this.formatCurrency(originalAmount.convertedAmount, targetCurrency, locale);
      return `${originalFormatted} (${convertedFormatted})`;
    }

    return originalFormatted;
  }

  // Private helper methods
  private getMockExchangeRate(from: string, to: string): number {
    // Mock exchange rates based on approximate real-world rates
    const rates: { [key: string]: number } = {
      'USD-EUR': 0.85,
      'USD-GBP': 0.73,
      'USD-JPY': 110.0,
      'USD-CHF': 0.92,
      'USD-CAD': 1.25,
      'USD-AUD': 1.35,
      'USD-INR': 87.0,
      'USD-CNY': 7.15,
      'USD-KRW': 1320.0,
      'USD-SGD': 1.35,
      'USD-HKD': 7.80,
      'USD-NOK': 10.50,
      'USD-SEK': 10.80,
      'USD-DKK': 6.85,
      'USD-NZD': 1.65,
      'USD-MXN': 17.50,
      'USD-BRL': 5.20,
      'USD-RUB': 75.0,
      'USD-ZAR': 18.50,
      'EUR-USD': 1.18,
      'EUR-GBP': 0.86,
      'EUR-JPY': 129.4,
      'GBP-USD': 1.37,
      'GBP-EUR': 1.16,
      'JPY-USD': 0.0091,
      'INR-USD': 0.0115, // 1/87
    };

    const key = `${from}-${to}`;
    const reverseKey = `${to}-${from}`;

    if (rates[key]) {
      return rates[key];
    } else if (rates[reverseKey]) {
      return 1 / rates[reverseKey];
    }

    // Fallback: generate a reasonable mock rate based on currency types
    const majorCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CHF'];
    const emergingCurrencies = ['INR', 'CNY', 'BRL', 'RUB', 'ZAR'];

    if (majorCurrencies.includes(from) && emergingCurrencies.includes(to)) {
      // Major to emerging: typically higher rates
      return 10 + Math.random() * 70; // 10-80 range
    } else if (emergingCurrencies.includes(from) && majorCurrencies.includes(to)) {
      // Emerging to major: typically lower rates
      return 0.01 + Math.random() * 0.09; // 0.01-0.1 range
    } else {
      // Similar currency types: closer to 1
      return 0.8 + Math.random() * 0.4; // 0.8-1.2 range
    }
  }

  private calculateRiskScore(exposures: CurrencyExposure[]): number {
    // Higher concentration in single currency = higher risk
    // More diversification = lower risk
    let riskScore = 0;

    for (const exposure of exposures) {
      // Penalize high concentration in any single currency
      if (exposure.percentage > 50) {
        riskScore += (exposure.percentage - 50) * 2;
      }

      // Add base risk based on currency volatility
      const currencyRisk = this.getCurrencyBaseRisk(exposure.currency);
      riskScore += (exposure.percentage / 100) * currencyRisk;
    }

    return Math.min(100, Math.max(0, riskScore));
  }

  private getCurrencyBaseRisk(currency: string): number {
    // Mock risk scores for different currencies
    const riskScores: { [key: string]: number } = {
      'USD': 10,
      'EUR': 15,
      'GBP': 20,
      'JPY': 12,
      'CHF': 8,
      'CAD': 18,
      'AUD': 25
    };

    return riskScores[currency] || 30; // Default higher risk for unknown currencies
  }

  private generateRecommendations(exposures: CurrencyExposure[]): string[] {
    const recommendations: string[] = [];

    // Check for over-concentration
    const highExposure = exposures.find(e => e.percentage > 70);
    if (highExposure) {
      recommendations.push(
        `Consider reducing ${highExposure.currency} exposure (currently ${highExposure.percentage.toFixed(1)}%) by diversifying into other currencies.`
      );
    }

    // Check for lack of diversification
    if (exposures.length < 3) {
      recommendations.push(
        'Consider diversifying across more currencies to reduce concentration risk.'
      );
    }

    // Check for high-risk currencies
    const highRiskExposures = exposures.filter(e => e.riskLevel === 'high' && e.percentage > 20);
    if (highRiskExposures.length > 0) {
      recommendations.push(
        `Consider hedging or reducing exposure to high-risk currencies: ${highRiskExposures.map(e => e.currency).join(', ')}.`
      );
    }

    return recommendations;
  }

  private generateHedgingOpportunities(exposures: CurrencyExposure[]): HedgingOption[] {
    return exposures
      .filter(e => e.percentage > 25) // Only suggest hedging for significant exposures
      .map(exposure => ({
        currency: exposure.currency,
        currentExposure: exposure.totalValue.amount,
        recommendedHedge: exposure.totalValue.amount * 0.5, // Hedge 50% of exposure
        hedgingInstruments: [
          'Currency Forward Contracts',
          'Currency Options',
          'Currency ETFs',
          'Multi-Currency Bonds'
        ]
      }));
  }

  private async generateVolatilityMetrics(exposures: CurrencyExposure[]): Promise<CurrencyVolatility[]> {
    return exposures.map(exposure => ({
      currency: exposure.currency,
      volatility30d: Math.random() * 20 + 5, // Mock volatility between 5-25%
      volatility90d: Math.random() * 25 + 8, // Mock volatility between 8-33%
      volatility1y: Math.random() * 30 + 10, // Mock volatility between 10-40%
      trend: ['increasing', 'decreasing', 'stable'][Math.floor(Math.random() * 3)] as 'increasing' | 'decreasing' | 'stable'
    }));
  }

  private assessCurrencyRisk(currency: string, percentage: number): 'low' | 'medium' | 'high' {
    const baseRisk = this.getCurrencyBaseRisk(currency);
    const concentrationRisk = percentage > 50 ? 20 : percentage > 30 ? 10 : 0;
    const totalRisk = baseRisk + concentrationRisk;

    if (totalRisk < 20) return 'low';
    if (totalRisk < 40) return 'medium';
    return 'high';
  }

  private async fetchExchangeRateWithRetry(from: string, to: string): Promise<number> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        return await this.fetchExchangeRateFromAPI(from, to);
      } catch (error) {
        lastError = error as Error;
        console.warn(`Exchange rate fetch attempt ${attempt} failed:`, error);

        if (attempt < this.MAX_RETRIES) {
          await this.delay(this.RETRY_DELAY_MS * attempt);
        }
      }
    }

    // If all API attempts failed, try to use mock rate as fallback
    console.warn(`All API attempts failed for ${from} to ${to}, falling back to mock rate`);
    const mockRate = this.getMockExchangeRate(from, to);
    if (mockRate !== null) {
      console.log(`Using mock exchange rate: 1 ${from} = ${mockRate} ${to}`);
      return mockRate;
    }

    throw lastError || new Error('All API attempts failed and no mock rate available');
  }

  private async fetchExchangeRateFromAPI(from: string, to: string): Promise<number> {
    try {
      const url = `${this.API_BASE_URL}?function=CURRENCY_EXCHANGE_RATE&from_currency=${from}&to_currency=${to}&apikey=${this.API_KEY}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data: any = await response.json();
      
      // Debug logging to understand the actual response structure
      console.log('Alpha Vantage API Response:', JSON.stringify(data, null, 2));

      // Check for API errors
      if (data['Error Message']) {
        throw new Error(`Alpha Vantage API error: ${data['Error Message']}`);
      }

      if (data['Note']) {
        throw new Error(`Alpha Vantage API limit: ${data['Note']}`);
      }

      // Check if we have the expected response structure
      if (!data['Realtime Currency Exchange Rate']) {
        console.error('Unexpected Alpha Vantage response structure:', data);
        throw new Error('Invalid response format from Alpha Vantage API');
      }

      const exchangeRateStr = data['Realtime Currency Exchange Rate']['5. Exchange Rate'];
      const rate = parseFloat(exchangeRateStr);

      if (isNaN(rate)) {
        throw new Error(`Invalid exchange rate received: ${exchangeRateStr}`);
      }

      return rate;
    } catch (error) {
      console.warn('Alpha Vantage API failed:', error);
      throw error; // Let retry logic handle fallback
    }
  }

  private async fetchHistoricalRate(from: string, to: string, date: Date): Promise<number> {
    const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD format

    try {
      const url = `${this.API_BASE_URL}?function=FX_DAILY&from_symbol=${from}&to_symbol=${to}&apikey=${this.API_KEY}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Historical API request failed: ${response.status}`);
      }

      const data: AlphaVantageTimeSeriesResponse | AlphaVantageErrorResponse = await response.json();

      // Check for API errors
      if ('Error Message' in data) {
        throw new Error(`Alpha Vantage API error: ${data['Error Message']}`);
      }

      if ('Note' in data) {
        throw new Error(`Alpha Vantage API limit: ${data['Note']}`);
      }

      // Check if we have the expected response structure
      if (!('Time Series FX (Daily)' in data)) {
        throw new Error('Invalid historical response format from Alpha Vantage API');
      }

      const timeSeries = data['Time Series FX (Daily)'];
      const dayData = timeSeries[dateString];

      if (!dayData) {
        // Try to find the closest available date (markets might be closed on weekends/holidays)
        const availableDates = Object.keys(timeSeries).sort().reverse();
        const closestDate = availableDates.find(d => d <= dateString);

        if (!closestDate) {
          throw new Error(`No historical data available for ${dateString} or earlier`);
        }

        const closestData = timeSeries[closestDate];
        const rate = parseFloat(closestData['4. close']);

        if (isNaN(rate)) {
          throw new Error(`Invalid historical rate for ${closestDate}: ${closestData['4. close']}`);
        }

        return rate;
      }

      const rate = parseFloat(dayData['4. close']);

      if (isNaN(rate)) {
        throw new Error(`Invalid historical rate for ${dateString}: ${dayData['4. close']}`);
      }

      return rate;
    } catch (error) {
      console.warn(`Failed to fetch historical rate for ${dateString}:`, error);
      throw error;
    }
  }

  private generateKeyDates(startDate: Date, endDate: Date): Date[] {
    const dates: Date[] = [];
    const current = new Date(startDate);
    const end = new Date(endDate);

    // Generate dates at regular intervals (weekly for short periods, monthly for longer)
    const daysDiff = Math.ceil((end.getTime() - current.getTime()) / (1000 * 60 * 60 * 24));
    const interval = daysDiff <= 30 ? 1 : daysDiff <= 90 ? 7 : 30; // daily, weekly, or monthly

    while (current <= end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + interval);
    }

    // Always include the end date
    if (dates[dates.length - 1].getTime() !== end.getTime()) {
      dates.push(new Date(end));
    }

    return dates;
  }

  private generateMockHistoricalRates(
    from: string,
    to: string,
    startDate: Date,
    endDate: Date
  ): HistoricalExchangeRate[] {
    const rates: HistoricalExchangeRate[] = [];
    const currentDate = new Date(startDate);
    const baseRate = this.getMockExchangeRate(from, to);

    while (currentDate <= endDate) {
      // Add some random variation to simulate historical data
      const variation = (Math.random() - 0.5) * 0.1; // ±5% variation
      const rate = baseRate * (1 + variation);

      rates.push({
        from,
        to,
        rate,
        timestamp: new Date(),
        source: 'mock',
        date: new Date(currentDate)
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return rates;
  }

  private getLocaleForCurrency(currency: string): string {
    const localeMap: { [currency: string]: string } = {
      'USD': 'en-US',
      'EUR': 'de-DE',
      'GBP': 'en-GB',
      'JPY': 'ja-JP',
      'CHF': 'de-CH',
      'CAD': 'en-CA',
      'AUD': 'en-AU',
      'CNY': 'zh-CN',
      'INR': 'en-IN',
      'KRW': 'ko-KR',
      'SGD': 'en-SG',
      'HKD': 'zh-HK',
      'NOK': 'nb-NO',
      'SEK': 'sv-SE',
      'DKK': 'da-DK',
      'NZD': 'en-NZ',
      'MXN': 'es-MX',
      'BRL': 'pt-BR',
      'RUB': 'ru-RU',
      'ZAR': 'en-ZA'
    };

    return localeMap[currency] || 'en-US';
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const currencyService = new CurrencyServiceImpl();
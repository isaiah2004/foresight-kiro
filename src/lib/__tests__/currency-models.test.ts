import {
  currencyAmountSchema,
  currencyCodeSchema,
  currencySchema,
  exchangeRateSchema,
  historicalExchangeRateSchema,
  currencyExposureSchema,
  hedgingOptionSchema,
  currencyVolatilitySchema,
  currencyRiskAnalysisSchema,
  exchangeRateSnapshotSchema,
  userPreferencesSchema
} from '@/lib/validations';
import { ZodError } from 'zod';

describe('Currency Data Models and Validation', () => {
  describe('currencyCodeSchema', () => {
    it('should accept valid ISO 4217 currency codes', () => {
      const validCodes = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD'];
      
      validCodes.forEach(code => {
        expect(() => currencyCodeSchema.parse(code)).not.toThrow();
      });
    });

    it('should reject invalid currency codes', () => {
      const invalidCodes = ['XYZ', 'INVALID', '123', '', 'usd', 'eur'];
      
      invalidCodes.forEach(code => {
        expect(() => currencyCodeSchema.parse(code)).toThrow(ZodError);
      });
    });
  });

  describe('currencyAmountSchema', () => {
    it('should accept valid currency amounts', () => {
      const validAmounts = [
        {
          amount: 100.50,
          currency: 'USD'
        },
        {
          amount: 1000,
          currency: 'EUR',
          convertedAmount: 1180,
          exchangeRate: 1.18,
          lastUpdated: new Date()
        },
        {
          amount: 0,
          currency: 'GBP'
        },
        {
          amount: -50.25,
          currency: 'JPY'
        }
      ];

      validAmounts.forEach(amount => {
        expect(() => currencyAmountSchema.parse(amount)).not.toThrow();
      });
    });

    it('should reject invalid currency amounts', () => {
      const invalidAmounts = [
        {
          amount: Infinity,
          currency: 'USD'
        },
        {
          amount: NaN,
          currency: 'EUR'
        },
        {
          amount: 100,
          currency: 'INVALID'
        },
        {
          amount: 100,
          currency: 'USD',
          convertedAmount: 118
          // Missing exchangeRate when convertedAmount is provided
        }
      ];

      invalidAmounts.forEach(amount => {
        expect(() => currencyAmountSchema.parse(amount)).toThrow(ZodError);
      });
    });

    it('should require exchangeRate when convertedAmount is provided', () => {
      const amountWithoutRate = {
        amount: 100,
        currency: 'USD',
        convertedAmount: 85
      };

      expect(() => currencyAmountSchema.parse(amountWithoutRate)).toThrow(ZodError);

      const amountWithRate = {
        amount: 100,
        currency: 'USD',
        convertedAmount: 85,
        exchangeRate: 0.85
      };

      expect(() => currencyAmountSchema.parse(amountWithRate)).not.toThrow();
    });
  });

  describe('currencySchema', () => {
    it('should accept valid currency definitions', () => {
      const validCurrency = {
        code: 'USD',
        name: 'US Dollar',
        symbol: '$',
        decimalPlaces: 2,
        countries: ['United States']
      };

      expect(() => currencySchema.parse(validCurrency)).not.toThrow();
    });

    it('should reject invalid currency definitions', () => {
      const invalidCurrencies = [
        {
          code: 'INVALID',
          name: 'Invalid Currency',
          symbol: '$',
          decimalPlaces: 2,
          countries: ['Test']
        },
        {
          code: 'USD',
          name: '',
          symbol: '$',
          decimalPlaces: 2,
          countries: ['United States']
        },
        {
          code: 'USD',
          name: 'US Dollar',
          symbol: '',
          decimalPlaces: 2,
          countries: ['United States']
        },
        {
          code: 'USD',
          name: 'US Dollar',
          symbol: '$',
          decimalPlaces: 5, // Too many decimal places
          countries: ['United States']
        },
        {
          code: 'USD',
          name: 'US Dollar',
          symbol: '$',
          decimalPlaces: 2,
          countries: [] // Empty countries array
        }
      ];

      invalidCurrencies.forEach(currency => {
        expect(() => currencySchema.parse(currency)).toThrow(ZodError);
      });
    });
  });

  describe('exchangeRateSchema', () => {
    it('should accept valid exchange rates', () => {
      const validRate = {
        from: 'USD',
        to: 'EUR',
        rate: 0.85,
        timestamp: new Date(),
        source: 'api'
      };

      expect(() => exchangeRateSchema.parse(validRate)).not.toThrow();
    });

    it('should reject invalid exchange rates', () => {
      const invalidRates = [
        {
          from: 'USD',
          to: 'USD', // Same currency
          rate: 1.0,
          timestamp: new Date(),
          source: 'api'
        },
        {
          from: 'USD',
          to: 'EUR',
          rate: 0, // Zero rate
          timestamp: new Date(),
          source: 'api'
        },
        {
          from: 'USD',
          to: 'EUR',
          rate: -0.85, // Negative rate
          timestamp: new Date(),
          source: 'api'
        },
        {
          from: 'INVALID',
          to: 'EUR',
          rate: 0.85,
          timestamp: new Date(),
          source: 'api'
        }
      ];

      invalidRates.forEach(rate => {
        expect(() => exchangeRateSchema.parse(rate)).toThrow(ZodError);
      });
    });
  });

  describe('historicalExchangeRateSchema', () => {
    it('should accept valid historical exchange rates', () => {
      const validHistoricalRate = {
        from: 'USD',
        to: 'EUR',
        rate: 0.85,
        timestamp: new Date(),
        source: 'historical-api',
        date: new Date('2023-01-01')
      };

      expect(() => historicalExchangeRateSchema.parse(validHistoricalRate)).not.toThrow();
    });
  });

  describe('currencyExposureSchema', () => {
    it('should accept valid currency exposure', () => {
      const validExposure = {
        currency: 'USD',
        totalValue: {
          amount: 10000,
          currency: 'USD'
        },
        percentage: 65.5,
        riskLevel: 'medium'
      };

      expect(() => currencyExposureSchema.parse(validExposure)).not.toThrow();
    });

    it('should reject invalid currency exposure', () => {
      const invalidExposures = [
        {
          currency: 'USD',
          totalValue: {
            amount: 10000,
            currency: 'USD'
          },
          percentage: 150, // Over 100%
          riskLevel: 'medium'
        },
        {
          currency: 'USD',
          totalValue: {
            amount: 10000,
            currency: 'USD'
          },
          percentage: -10, // Negative percentage
          riskLevel: 'medium'
        },
        {
          currency: 'USD',
          totalValue: {
            amount: 10000,
            currency: 'USD'
          },
          percentage: 65.5,
          riskLevel: 'invalid' // Invalid risk level
        }
      ];

      invalidExposures.forEach(exposure => {
        expect(() => currencyExposureSchema.parse(exposure)).toThrow(ZodError);
      });
    });
  });

  describe('hedgingOptionSchema', () => {
    it('should accept valid hedging options', () => {
      const validHedging = {
        currency: 'EUR',
        currentExposure: 50000,
        recommendedHedge: 25000,
        hedgingInstruments: ['Currency Forward Contracts', 'Currency Options']
      };

      expect(() => hedgingOptionSchema.parse(validHedging)).not.toThrow();
    });

    it('should reject invalid hedging options', () => {
      const invalidHedgingOptions = [
        {
          currency: 'EUR',
          currentExposure: -50000, // Negative exposure
          recommendedHedge: 25000,
          hedgingInstruments: ['Currency Forward Contracts']
        },
        {
          currency: 'EUR',
          currentExposure: 50000,
          recommendedHedge: -25000, // Negative hedge
          hedgingInstruments: ['Currency Forward Contracts']
        },
        {
          currency: 'EUR',
          currentExposure: 50000,
          recommendedHedge: 25000,
          hedgingInstruments: [] // Empty instruments array
        }
      ];

      invalidHedgingOptions.forEach(option => {
        expect(() => hedgingOptionSchema.parse(option)).toThrow(ZodError);
      });
    });
  });

  describe('currencyVolatilitySchema', () => {
    it('should accept valid currency volatility', () => {
      const validVolatility = {
        currency: 'GBP',
        volatility30d: 15.5,
        volatility90d: 18.2,
        volatility1y: 22.8,
        trend: 'increasing'
      };

      expect(() => currencyVolatilitySchema.parse(validVolatility)).not.toThrow();
    });

    it('should reject invalid currency volatility', () => {
      const invalidVolatilities = [
        {
          currency: 'GBP',
          volatility30d: -15.5, // Negative volatility
          volatility90d: 18.2,
          volatility1y: 22.8,
          trend: 'increasing'
        },
        {
          currency: 'GBP',
          volatility30d: 15.5,
          volatility90d: 18.2,
          volatility1y: 22.8,
          trend: 'invalid' // Invalid trend
        }
      ];

      invalidVolatilities.forEach(volatility => {
        expect(() => currencyVolatilitySchema.parse(volatility)).toThrow(ZodError);
      });
    });
  });

  describe('currencyRiskAnalysisSchema', () => {
    it('should accept valid currency risk analysis', () => {
      const validAnalysis = {
        totalExposure: [
          {
            currency: 'USD',
            totalValue: {
              amount: 10000,
              currency: 'USD'
            },
            percentage: 60,
            riskLevel: 'low'
          }
        ],
        riskScore: 25,
        recommendations: ['Diversify into EUR', 'Consider hedging GBP exposure'],
        hedgingOpportunities: [
          {
            currency: 'USD',
            currentExposure: 10000,
            recommendedHedge: 5000,
            hedgingInstruments: ['Currency Forward Contracts']
          }
        ],
        volatilityMetrics: [
          {
            currency: 'USD',
            volatility30d: 12.5,
            volatility90d: 15.8,
            volatility1y: 18.2,
            trend: 'stable'
          }
        ]
      };

      expect(() => currencyRiskAnalysisSchema.parse(validAnalysis)).not.toThrow();
    });

    it('should reject invalid risk scores', () => {
      const invalidAnalysis = {
        totalExposure: [],
        riskScore: 150, // Over 100
        recommendations: [],
        hedgingOpportunities: [],
        volatilityMetrics: []
      };

      expect(() => currencyRiskAnalysisSchema.parse(invalidAnalysis)).toThrow(ZodError);
    });
  });

  describe('exchangeRateSnapshotSchema', () => {
    it('should accept valid exchange rate snapshots', () => {
      const validSnapshot = {
        from: 'USD',
        to: 'EUR',
        rate: 0.85,
        timestamp: '2023-12-01T10:00:00Z'
      };

      expect(() => exchangeRateSnapshotSchema.parse(validSnapshot)).not.toThrow();
    });

    it('should transform timestamp string to Date', () => {
      const snapshot = {
        from: 'USD',
        to: 'EUR',
        rate: 0.85,
        timestamp: '2023-12-01T10:00:00Z'
      };

      const parsed = exchangeRateSnapshotSchema.parse(snapshot);
      expect(parsed.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('userPreferencesSchema', () => {
    it('should accept valid user preferences with multi-currency settings', () => {
      const validPreferences = {
        primaryCurrency: 'USD',
        locale: 'en-US',
        riskTolerance: 'moderate',
        notifications: true,
        showOriginalCurrencies: true,
        autoDetectCurrency: false
      };

      expect(() => userPreferencesSchema.parse(validPreferences)).not.toThrow();
    });

    it('should reject invalid locale formats', () => {
      const invalidPreferences = [
        {
          primaryCurrency: 'USD',
          locale: 'en', // Invalid format
          riskTolerance: 'moderate',
          notifications: true,
          showOriginalCurrencies: true,
          autoDetectCurrency: false
        },
        {
          primaryCurrency: 'USD',
          locale: 'EN-US', // Wrong case
          riskTolerance: 'moderate',
          notifications: true,
          showOriginalCurrencies: true,
          autoDetectCurrency: false
        },
        {
          primaryCurrency: 'USD',
          locale: 'english-us', // Wrong format
          riskTolerance: 'moderate',
          notifications: true,
          showOriginalCurrencies: true,
          autoDetectCurrency: false
        }
      ];

      invalidPreferences.forEach(prefs => {
        expect(() => userPreferencesSchema.parse(prefs)).toThrow(ZodError);
      });
    });

    it('should accept valid locale formats', () => {
      const validLocales = ['en-US', 'de-DE', 'fr-FR', 'ja-JP', 'zh-CN'];
      
      validLocales.forEach(locale => {
        const preferences = {
          primaryCurrency: 'USD',
          locale,
          riskTolerance: 'moderate',
          notifications: true,
          showOriginalCurrencies: true,
          autoDetectCurrency: false
        };

        expect(() => userPreferencesSchema.parse(preferences)).not.toThrow();
      });
    });
  });

  describe('Edge Cases and Business Logic', () => {
    it('should handle zero amounts in currency amounts', () => {
      const zeroAmount = {
        amount: 0,
        currency: 'USD'
      };

      expect(() => currencyAmountSchema.parse(zeroAmount)).not.toThrow();
    });

    it('should handle negative amounts in currency amounts', () => {
      const negativeAmount = {
        amount: -100.50,
        currency: 'USD'
      };

      expect(() => currencyAmountSchema.parse(negativeAmount)).not.toThrow();
    });

    it('should validate currency exposure percentages sum constraints', () => {
      // This would be a business logic validation, not schema validation
      const exposures = [
        {
          currency: 'USD',
          totalValue: { amount: 6000, currency: 'USD' },
          percentage: 60,
          riskLevel: 'low'
        },
        {
          currency: 'EUR',
          totalValue: { amount: 4000, currency: 'EUR' },
          percentage: 40,
          riskLevel: 'medium'
        }
      ];

      // Each individual exposure should be valid
      exposures.forEach(exposure => {
        expect(() => currencyExposureSchema.parse(exposure)).not.toThrow();
      });

      // Business logic: percentages should sum to 100% (this would be validated elsewhere)
      const totalPercentage = exposures.reduce((sum, exp) => sum + exp.percentage, 0);
      expect(totalPercentage).toBe(100);
    });
  });
});
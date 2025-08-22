import { z } from 'zod';

// ISO 4217 currency codes - major currencies
const SUPPORTED_CURRENCIES = [
  'USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'NZD', 'SEK', 'NOK', 'DKK',
  'PLN', 'CZK', 'HUF', 'RON', 'BGN', 'HRK', 'RUB', 'TRY', 'BRL', 'MXN', 'ARS',
  'CLP', 'COP', 'PEN', 'UYU', 'CNY', 'HKD', 'SGD', 'KRW', 'TWD', 'THB', 'MYR',
  'IDR', 'PHP', 'VND', 'INR', 'PKR', 'LKR', 'BDT', 'NPR', 'BTN', 'MVR', 'AFN',
  'IRR', 'IQD', 'JOD', 'KWD', 'LBP', 'OMR', 'QAR', 'SAR', 'SYP', 'AED', 'YER',
  'EGP', 'LYD', 'MAD', 'TND', 'DZD', 'AOA', 'BWP', 'BIF', 'XOF', 'XAF', 'KMF',
  'DJF', 'ERN', 'ETB', 'GMD', 'GHS', 'GNF', 'KES', 'LSL', 'LRD', 'MGA', 'MWK',
  'MUR', 'MZN', 'NAD', 'NGN', 'RWF', 'STD', 'SCR', 'SLL', 'SOS', 'SZL', 'TZS',
  'UGX', 'ZAR', 'ZMW', 'ZWL'
] as const;

// Currency validation schemas
export const currencyCodeSchema = z.enum(SUPPORTED_CURRENCIES, {
  message: 'Invalid currency code. Must be a valid ISO 4217 currency code.'
});

export const currencyAmountSchema = z.object({
  amount: z.number().finite('Amount must be a finite number'),
  currency: currencyCodeSchema,
  convertedAmount: z.number().finite().optional(),
  exchangeRate: z.number().positive().optional(),
  lastUpdated: z.date().optional(),
}).refine((data) => {
  // If convertedAmount is provided, exchangeRate should also be provided
  if (data.convertedAmount !== undefined && data.exchangeRate === undefined) {
    return false;
  }
  return true;
}, {
  message: 'Exchange rate is required when converted amount is provided',
  path: ['exchangeRate'],
});

export const currencySchema = z.object({
  code: currencyCodeSchema,
  name: z.string().min(1, 'Currency name is required'),
  symbol: z.string().min(1, 'Currency symbol is required'),
  decimalPlaces: z.number().int().min(0).max(4, 'Decimal places must be between 0 and 4'),
  countries: z.array(z.string().min(1)).min(1, 'At least one country is required'),
});

export const exchangeRateSchema = z.object({
  from: currencyCodeSchema,
  to: currencyCodeSchema,
  rate: z.number().positive('Exchange rate must be positive'),
  timestamp: z.date(),
  source: z.string().min(1, 'Exchange rate source is required'),
}).refine((data) => {
  return data.from !== data.to;
}, {
  message: 'From and to currencies must be different',
  path: ['to'],
});

export const historicalExchangeRateSchema = exchangeRateSchema.extend({
  date: z.date(),
});

export const currencyExposureSchema = z.object({
  currency: currencyCodeSchema,
  totalValue: currencyAmountSchema,
  percentage: z.number().min(0).max(100, 'Percentage must be between 0 and 100'),
  riskLevel: z.enum(['low', 'medium', 'high']),
});

export const hedgingOptionSchema = z.object({
  currency: currencyCodeSchema,
  currentExposure: z.number().min(0, 'Current exposure cannot be negative'),
  recommendedHedge: z.number().min(0, 'Recommended hedge cannot be negative'),
  hedgingInstruments: z.array(z.string().min(1)).min(1, 'At least one hedging instrument is required'),
});

export const currencyVolatilitySchema = z.object({
  currency: currencyCodeSchema,
  volatility30d: z.number().min(0, 'Volatility cannot be negative'),
  volatility90d: z.number().min(0, 'Volatility cannot be negative'),
  volatility1y: z.number().min(0, 'Volatility cannot be negative'),
  trend: z.enum(['increasing', 'decreasing', 'stable']),
});

export const currencyRiskAnalysisSchema = z.object({
  totalExposure: z.array(currencyExposureSchema),
  riskScore: z.number().min(0).max(100, 'Risk score must be between 0 and 100'),
  recommendations: z.array(z.string().min(1)),
  hedgingOpportunities: z.array(hedgingOptionSchema),
  volatilityMetrics: z.array(currencyVolatilitySchema),
});

export const exchangeRateSnapshotSchema = z.object({
  from: currencyCodeSchema,
  to: currencyCodeSchema,
  rate: z.number().positive('Exchange rate must be positive'),
  timestamp: z.string().transform((str) => new Date(str)),
});

// Base validation schemas
export const userPreferencesSchema = z.object({
  primaryCurrency: currencyCodeSchema,
  locale: z.string().min(1, 'Locale is required').regex(/^[a-z]{2}-[A-Z]{2}$/, 'Locale must be in BCP 47 format (e.g., en-US)'),
  riskTolerance: z.enum(['conservative', 'moderate', 'aggressive']),
  notifications: z.boolean(),
  showOriginalCurrencies: z.boolean(),
  autoDetectCurrency: z.boolean(),
});

export const userSchema = z.object({
  id: z.string().min(1, 'User ID is required'),
  email: z.string().email('Invalid email address'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  preferences: userPreferencesSchema,
});

// Investment validation schemas
export const investmentTypeSchema = z.enum(['stocks', 'bonds', 'mutual_funds', 'etf', 'options', 'real_estate', 'crypto', 'other']);

// Type-specific data schemas
export const stockDataSchema = z.object({
  dividend: currencyAmountSchema.optional(),
  dividendYield: z.number().min(0).max(100).optional(),
  sector: z.string().optional(),
  marketCap: currencyAmountSchema.optional(),
}).optional();

export const optionDataSchema = z.object({
  strikePrice: currencyAmountSchema.refine((data) => data.amount > 0, 'Strike price must be positive'),
  expirationDate: z.string().transform((str) => new Date(str)),
  optionType: z.enum(['call', 'put']),
  premium: currencyAmountSchema.refine((data) => data.amount > 0, 'Premium must be positive'),
  underlyingSymbol: z.string().min(1, 'Underlying symbol is required'),
  impliedVolatility: z.number().min(0).max(1000).optional(),
  delta: z.number().optional(),
  gamma: z.number().optional(),
  theta: z.number().optional(),
  vega: z.number().optional(),
}).optional();

export const bondDataSchema = z
  .object({
    faceValue: currencyAmountSchema.refine(
      (data) => data.amount > 0,
      'Face value must be positive'
    ),
    couponRate: z
      .number()
      .min(0)
      .max(100, 'Coupon rate must be between 0-100%'),
    maturityDate: z.string().transform((str) => new Date(str)),
    yieldToMaturity: z.number().min(0).max(100).optional(),
    creditRating: z.string().optional(),
    duration: z.number().min(0).optional(),
    issuer: z.string().optional(),
    // New optional but commonly used fields
    couponFrequency: z
      .enum(['annual', 'semi_annual', 'quarterly'])
      .optional(),
    dayCountConvention: z
      .enum(['30/360', 'ACT/360', 'ACT/365', 'ACT/ACT'])
      .optional(),
    // Price handling helpers
    priceType: z.enum(['percent_of_par', 'absolute']).optional(),
    cleanPricePercent: z.number().min(0).max(500).optional(),
    // Optional call/put metadata
    callable: z.boolean().optional(),
    puttable: z.boolean().optional(),
    firstCallDate: z.string().transform((s) => new Date(s)).optional(),
    firstPutDate: z.string().transform((s) => new Date(s)).optional(),
  })
  .optional();

export const mutualFundDataSchema = z.object({
  expenseRatio: z.number().min(0).max(10, 'Expense ratio seems too high'),
  nav: currencyAmountSchema.refine((data) => data.amount > 0, 'NAV must be positive'),
  minimumInvestment: currencyAmountSchema.optional(),
  fundFamily: z.string().min(1, 'Fund family is required'),
  category: z.string().optional(),
  turnoverRate: z.number().min(0).max(1000).optional(),
  inceptionDate: z.string().transform((str) => new Date(str)).optional(),
}).optional();

export const etfDataSchema = z.object({
  expenseRatio: z.number().min(0).max(10, 'Expense ratio seems too high'),
  nav: currencyAmountSchema.refine((data) => data.amount > 0, 'NAV must be positive'),
  underlyingIndex: z.string().min(1, 'Underlying index is required'),
  trackingError: z.number().min(0).optional(),
  dividendYield: z.number().min(0).max(100).optional(),
  assetsUnderManagement: currencyAmountSchema.optional(),
}).optional();

export const realEstateDataSchema = z.object({
  propertyType: z.enum(['residential', 'commercial', 'reit', 'land']),
  address: z.string().optional(),
  squareFootage: z.number().min(0).optional(),
  monthlyRent: currencyAmountSchema.optional(),
  propertyTax: currencyAmountSchema.optional(),
  maintenanceCosts: currencyAmountSchema.optional(),
  occupancyRate: z.number().min(0).max(100).optional(),
}).optional();

export const cryptoDataSchema = z.object({
  blockchain: z.string().min(1, 'Blockchain is required'),
  marketCap: currencyAmountSchema.optional(),
  circulatingSupply: z.number().min(0).optional(),
  maxSupply: z.number().min(0).optional(),
  stakingReward: z.number().min(0).max(100).optional(),
}).optional();

export const investmentSchema = z.object({
  id: z.string().optional(),
  userId: z.string().min(1, 'User ID is required'),
  type: investmentTypeSchema,
  name: z.string().min(1, 'Investment name is required'),
  symbol: z.string().optional(),
  quantity: z.number().positive('Quantity must be positive'),
  purchasePrice: currencyAmountSchema.refine((data) => data.amount > 0, 'Purchase price must be positive'),
  currentPrice: currencyAmountSchema.refine((data) => data.amount > 0, 'Current price must be positive').optional(),
  purchaseDate: z.string().transform((str) => new Date(str)),
  description: z.string().optional(),
  currency: currencyCodeSchema,
  exchange: z.string().optional(),
  
  // Type-specific data
  stockData: stockDataSchema,
  optionData: optionDataSchema,
  bondData: bondDataSchema,
  mutualFundData: mutualFundDataSchema,
  etfData: etfDataSchema,
  realEstateData: realEstateDataSchema,
  cryptoData: cryptoDataSchema,
});

export const createInvestmentSchema = investmentSchema.omit({ id: true });
export const updateInvestmentSchema = investmentSchema.partial().required({ id: true });

// Income validation schemas
export const incomeTypeSchema = z.enum(['salary', 'bonus', 'other']);
export const frequencySchema = z.enum(['weekly', 'bi-weekly', 'monthly', 'quarterly', 'annually']);

export const incomeSchema = z.object({
  id: z.string().optional(),
  userId: z.string().min(1, 'User ID is required'),
  type: incomeTypeSchema,
  source: z.string().min(1, 'Income source is required'),
  amount: currencyAmountSchema.refine((data) => data.amount > 0, 'Amount must be positive'),
  frequency: frequencySchema,
  startDate: z.string().transform((str) => new Date(str)),
  endDate: z.string().transform((str) => new Date(str)).optional(),
  isActive: z.boolean(),
}).refine((data) => {
  if (data.endDate && data.startDate) {
    return data.endDate > data.startDate;
  }
  return true;
}, {
  message: 'End date must be after start date',
  path: ['endDate'],
});

export const createIncomeSchema = incomeSchema.omit({ id: true, userId: true });
export const updateIncomeSchema = incomeSchema.partial().required({ id: true });

// Income form schemas (client-side) using string dates and numeric amount + currency
export const createIncomeFormSchema = z.object({
  type: incomeTypeSchema,
  source: z.string().min(1, 'Income source is required'),
  amount: z.number().positive('Amount must be positive'),
  currency: currencyCodeSchema,
  frequency: frequencySchema,
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional(),
  isActive: z.boolean().default(true),
}).refine((data) => {
  if (data.endDate && data.startDate) {
    return new Date(data.endDate) > new Date(data.startDate);
  }
  return true;
}, {
  message: 'End date must be after start date',
  path: ['endDate'],
});

export const updateIncomeFormSchema = createIncomeFormSchema.partial().extend({
  id: z.string().min(1, 'Income ID is required'),
});

// Expense validation schemas
export const expenseCategorySchema = z.enum(['rent', 'groceries', 'utilities', 'entertainment', 'other']);
export const expenseFrequencySchema = z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'annually']);

export const expenseSchema = z.object({
  id: z.string().optional(),
  userId: z.string().min(1, 'User ID is required'),
  category: expenseCategorySchema,
  categoryId: z.string().min(1).optional(),
  tags: z.array(z.string().min(1)).max(20).optional(),
  name: z.string().min(1, 'Expense name is required'),
  amount: currencyAmountSchema.refine((data) => data.amount > 0, 'Amount must be positive'),
  frequency: expenseFrequencySchema,
  isFixed: z.boolean(),
  startDate: z.string().transform((str) => new Date(str)),
  endDate: z.string().transform((str) => new Date(str)).optional(),
}).refine((data) => {
  if (data.endDate && data.startDate) {
    return data.endDate > data.startDate;
  }
  return true;
}, {
  message: 'End date must be after start date',
  path: ['endDate'],
});

export const createExpenseSchema = expenseSchema.omit({ id: true, userId: true });
export const updateExpenseSchema = expenseSchema.partial().required({ id: true });

// Expense form schemas (client-side) using string dates and numeric amount + currency
export const createExpenseFormSchema = z.object({
  category: expenseCategorySchema,
  categoryId: z.string().min(1).optional(),
  tags: z.array(z.string().min(1)).max(20).optional(),
  name: z.string().min(1, 'Expense name is required'),
  amount: z.number().positive('Amount must be positive'),
  currency: currencyCodeSchema,
  frequency: expenseFrequencySchema,
  isFixed: z.boolean(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional(),
}).refine((data) => {
  if (data.endDate && data.startDate) {
    return new Date(data.endDate) > new Date(data.startDate);
  }
  return true;
}, {
  message: 'End date must be after start date',
  path: ['endDate'],
});

export const updateExpenseFormSchema = createExpenseFormSchema.partial().extend({
  id: z.string().min(1, 'Expense ID is required'),
});

// Category validation schemas (new)
export const expenseCategoryTypeSchema = z.enum(['recurring', 'one-time']);
export const expenseCategoryItemSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Category name is required'),
  emoji: z.string().min(1, 'Emoji is required').max(4),
  type: expenseCategoryTypeSchema,
  isSystem: z.boolean().default(false),
});
export const createExpenseCategorySchema = expenseCategoryItemSchema.omit({ id: true }).extend({
  userId: z.string().min(1, 'User ID is required').optional(),
});
export const updateExpenseCategorySchema = expenseCategoryItemSchema.partial().required({ id: true });

// Loan validation schemas
export const loanTypeSchema = z.enum(['home', 'car', 'personal', 'other']);

export const loanSchema = z.object({
  id: z.string().optional(),
  userId: z.string().min(1, 'User ID is required'),
  type: loanTypeSchema,
  name: z.string().min(1, 'Loan name is required'),
  principal: currencyAmountSchema.refine((data) => data.amount > 0, 'Principal must be positive'),
  currentBalance: currencyAmountSchema.refine((data) => data.amount >= 0, 'Current balance cannot be negative'),
  interestRate: z.number().min(0, 'Interest rate cannot be negative').max(100, 'Interest rate cannot exceed 100%'),
  termMonths: z.number().int().positive('Term must be a positive integer'),
  monthlyPayment: currencyAmountSchema.refine((data) => data.amount > 0, 'Monthly payment must be positive'),
  startDate: z.string().transform((str) => new Date(str)),
  nextPaymentDate: z.string().transform((str) => new Date(str)),
}).refine((data) => {
  return data.currentBalance.amount <= data.principal.amount;
}, {
  message: 'Current balance cannot exceed principal',
  path: ['currentBalance'],
}).refine((data) => {
  return data.nextPaymentDate >= data.startDate;
}, {
  message: 'Next payment date must be after start date',
  path: ['nextPaymentDate'],
});

export const createLoanSchema = loanSchema.omit({ id: true });
export const updateLoanSchema = loanSchema.partial().required({ id: true });

// Form schemas with string dates for client-side forms
export const createLoanFormSchema = z.object({
  name: z.string().min(1, 'Loan name is required'),
  type: loanTypeSchema,
  principal: z.number().positive('Principal must be a positive number'),
  currentBalance: z.number().min(0, 'Current balance cannot be negative'),
  interestRate: z.number().min(0, 'Interest rate cannot be negative').max(100, 'Interest rate cannot exceed 100%'),
  termMonths: z.number().int().positive('Term must be a positive integer'),
  monthlyPayment: z.number().positive('Monthly payment must be a positive number'),
  startDate: z.string().min(1, 'Start date is required'),
  nextPaymentDate: z.string().min(1, 'Next payment date is required'),
  currency: currencyCodeSchema,
}).refine((data) => data.currentBalance <= data.principal, {
  message: 'Current balance cannot exceed principal',
  path: ['currentBalance'],
}).refine((data) => new Date(data.nextPaymentDate) >= new Date(data.startDate), {
  message: 'Next payment date must be on or after start date',
  path: ['nextPaymentDate'],
});

export const updateLoanFormSchema = createLoanFormSchema.partial().extend({
  id: z.string().min(1, 'Loan ID is required'),
});

// Goal validation schemas
export const goalTypeSchema = z.enum(['retirement', 'education', 'vacation', 'emergency_fund', 'other']);
export const prioritySchema = z.enum(['low', 'medium', 'high']);

export const goalSchema = z.object({
  id: z.string().optional(),
  userId: z.string().min(1, 'User ID is required'),
  type: goalTypeSchema,
  name: z.string().min(1, 'Goal name is required'),
  targetAmount: currencyAmountSchema.refine((data) => data.amount > 0, 'Target amount must be positive'),
  currentAmount: currencyAmountSchema.refine((data) => data.amount >= 0, 'Current amount cannot be negative'),
  targetDate: z.string().transform((str) => new Date(str)).refine((date) => date > new Date(), 'Target date must be in the future'),
  monthlyContribution: currencyAmountSchema.refine((data) => data.amount >= 0, 'Monthly contribution cannot be negative'),
  priority: prioritySchema,
  isActive: z.boolean(),
}).refine((data) => {
  return data.currentAmount.amount <= data.targetAmount.amount;
}, {
  message: 'Current amount cannot exceed target amount',
  path: ['currentAmount'],
});

export const createGoalSchema = goalSchema.omit({ id: true });
export const updateGoalSchema = goalSchema.partial().required({ id: true });

// Financial snapshot validation schema
export const financialSnapshotSchema = z.object({
  id: z.string().optional(),
  userId: z.string().min(1, 'User ID is required'),
  date: z.string().transform((str) => new Date(str)),
  netWorth: currencyAmountSchema,
  totalIncome: currencyAmountSchema.refine((data) => data.amount >= 0, 'Total income cannot be negative'),
  totalExpenses: currencyAmountSchema.refine((data) => data.amount >= 0, 'Total expenses cannot be negative'),
  totalDebt: currencyAmountSchema.refine((data) => data.amount >= 0, 'Total debt cannot be negative'),
  savingsRate: z.number().min(0).max(100, 'Savings rate must be between 0 and 100'),
  financialHealthScore: z.number().min(0).max(100, 'Financial health score must be between 0 and 100'),
  currencyExposure: z.array(currencyExposureSchema),
  exchangeRatesUsed: z.array(exchangeRateSnapshotSchema),
});

// Export type inference helpers
export type CurrencyAmount = z.infer<typeof currencyAmountSchema>;
export type Currency = z.infer<typeof currencySchema>;
export type ExchangeRate = z.infer<typeof exchangeRateSchema>;
export type HistoricalExchangeRate = z.infer<typeof historicalExchangeRateSchema>;
export type CurrencyExposure = z.infer<typeof currencyExposureSchema>;
export type HedgingOption = z.infer<typeof hedgingOptionSchema>;
export type CurrencyVolatility = z.infer<typeof currencyVolatilitySchema>;
export type CurrencyRiskAnalysis = z.infer<typeof currencyRiskAnalysisSchema>;
export type ExchangeRateSnapshot = z.infer<typeof exchangeRateSnapshotSchema>;
export type UserPreferences = z.infer<typeof userPreferencesSchema>;
export type User = z.infer<typeof userSchema>;
export type Investment = z.infer<typeof investmentSchema>;
export type CreateInvestment = z.infer<typeof createInvestmentSchema>;
export type UpdateInvestment = z.infer<typeof updateInvestmentSchema>;
export type Income = z.infer<typeof incomeSchema>;
export type CreateIncome = z.infer<typeof createIncomeSchema>;
export type UpdateIncome = z.infer<typeof updateIncomeSchema>;
export type Expense = z.infer<typeof expenseSchema>;
export type CreateExpense = z.infer<typeof createExpenseSchema>;
export type UpdateExpense = z.infer<typeof updateExpenseSchema>;
export type Loan = z.infer<typeof loanSchema>;
export type CreateLoan = z.infer<typeof createLoanSchema>;
export type UpdateLoan = z.infer<typeof updateLoanSchema>;
export type CreateLoanForm = z.infer<typeof createLoanFormSchema>;
export type UpdateLoanForm = z.infer<typeof updateLoanFormSchema>;
export type Goal = z.infer<typeof goalSchema>;
export type CreateGoal = z.infer<typeof createGoalSchema>;
export type UpdateGoal = z.infer<typeof updateGoalSchema>;
export type FinancialSnapshot = z.infer<typeof financialSnapshotSchema>;
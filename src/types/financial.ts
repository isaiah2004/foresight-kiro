import { Timestamp } from 'firebase/firestore';

// Currency-related interfaces
export interface CurrencyAmount {
  amount: number;
  currency: string; // ISO 4217 currency code (USD, EUR, GBP, etc.)
  convertedAmount?: number; // Amount in user's primary currency
  exchangeRate?: number;
  lastUpdated?: Date;
}

export interface Currency {
  code: string; // ISO 4217 currency code (USD, EUR, GBP, etc.)
  name: string;
  symbol: string;
  decimalPlaces: number;
  countries: string[];
}

export interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
  timestamp: Date;
  source: string;
}

export interface HistoricalExchangeRate extends ExchangeRate {
  date: Date;
}

export interface CurrencyExposure {
  currency: string;
  totalValue: CurrencyAmount;
  percentage: number;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface CurrencyRiskAnalysis {
  totalExposure: CurrencyExposure[];
  riskScore: number; // 0-100, higher = more risk
  recommendations: string[];
  hedgingOpportunities: HedgingOption[];
  volatilityMetrics: CurrencyVolatility[];
}

export interface HedgingOption {
  currency: string;
  currentExposure: number;
  recommendedHedge: number;
  hedgingInstruments: string[];
}

export interface CurrencyVolatility {
  currency: string;
  volatility30d: number;
  volatility90d: number;
  volatility1y: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface ExchangeRateSnapshot {
  from: string;
  to: string;
  rate: number;
  timestamp: Timestamp;
}

// Base interface for all financial documents
export interface BaseDocument {
  id: string;
  userId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// User preferences and profile
export interface UserPreferences {
  primaryCurrency: string; // ISO 4217 currency code
  locale: string; // BCP 47 language tag (en-US, de-DE, etc.)
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  notifications: boolean;
  showOriginalCurrencies: boolean; // Whether to show original currencies alongside converted amounts
  autoDetectCurrency: boolean; // Auto-detect currency based on location/market
}

export interface UserDocument extends BaseDocument {
  email: string;
  firstName: string;
  lastName: string;
  preferences: UserPreferences;
}

// Investment types and interfaces
export type InvestmentType = 'stocks' | 'bonds' | 'mutual_funds' | 'etf' | 'options' | 'real_estate' | 'crypto' | 'other';

// Type-specific data interfaces
export interface StockData {
  dividend?: CurrencyAmount;
  dividendYield?: number;
  sector?: string;
  marketCap?: CurrencyAmount;
}

export interface OptionData {
  strikePrice: CurrencyAmount;
  expirationDate: Timestamp;
  optionType: 'call' | 'put';
  premium: CurrencyAmount;
  underlyingSymbol: string;
  impliedVolatility?: number;
  delta?: number;
  gamma?: number;
  theta?: number;
  vega?: number;
}

export interface BondData {
  faceValue: CurrencyAmount;
  couponRate: number;
  maturityDate: Timestamp;
  yieldToMaturity?: number;
  creditRating?: string;
  duration?: number;
  issuer?: string;
  // Extended fields for richer bond modeling
  couponFrequency?: 'annual' | 'semi_annual' | 'quarterly';
  dayCountConvention?: '30/360' | 'ACT/360' | 'ACT/365' | 'ACT/ACT';
  priceType?: 'percent_of_par' | 'absolute';
  cleanPricePercent?: number; // e.g., 98.5 means 98.5% of par
  callable?: boolean;
  puttable?: boolean;
  firstCallDate?: Timestamp;
  firstPutDate?: Timestamp;
}

export interface MutualFundData {
  expenseRatio: number;
  nav: CurrencyAmount;
  minimumInvestment?: CurrencyAmount;
  fundFamily: string;
  category?: string;
  turnoverRate?: number;
  inceptionDate?: Timestamp;
}

export interface ETFData {
  expenseRatio: number;
  nav: CurrencyAmount;
  trackingError?: number;
  underlyingIndex: string;
  dividendYield?: number;
  assetsUnderManagement?: CurrencyAmount;
}

export interface RealEstateData {
  propertyType: 'residential' | 'commercial' | 'reit' | 'land';
  address?: string;
  squareFootage?: number;
  monthlyRent?: CurrencyAmount;
  propertyTax?: CurrencyAmount;
  maintenanceCosts?: CurrencyAmount;
  occupancyRate?: number;
}

export interface CryptoData {
  blockchain: string;
  marketCap?: CurrencyAmount;
  circulatingSupply?: number;
  maxSupply?: number;
  stakingReward?: number;
}

export interface Investment {
  id: string;
  userId: string;
  type: InvestmentType;
  name: string;
  symbol?: string;
  quantity: number;
  purchasePrice: CurrencyAmount;
  currentPrice?: CurrencyAmount;
  purchaseDate: Timestamp;
  description?: string;
  currency: string; // Native currency of the investment
  exchange?: string; // Stock exchange (NYSE, NASDAQ, LSE, etc.)
  
  // Type-specific data
  stockData?: StockData;
  optionData?: OptionData;
  bondData?: BondData;
  mutualFundData?: MutualFundData;
  etfData?: ETFData;
  realEstateData?: RealEstateData;
  cryptoData?: CryptoData;
}

export interface InvestmentDocument extends Investment, BaseDocument {
}

export interface PortfolioSummary {
  totalValue: CurrencyAmount;
  totalGainLoss: CurrencyAmount;
  gainLossPercentage: number;
  diversificationScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  currencyExposure: CurrencyExposure[];
}

// Income types and interfaces
export type IncomeType = 'salary' | 'bonus' | 'other';
export type Frequency = 'weekly' | 'bi-weekly' | 'monthly' | 'quarterly' | 'annually';

export interface Income {
  id: string;
  userId: string;
  type: IncomeType;
  source: string;
  amount: CurrencyAmount;
  frequency: Frequency;
  startDate: Timestamp;
  endDate?: Timestamp;
  isActive: boolean;
}

export interface IncomeDocument extends Income, BaseDocument {
  startDate: Timestamp;
  endDate?: Timestamp;
}

// Expense types and interfaces
export type ExpenseCategory = 'rent' | 'groceries' | 'utilities' | 'entertainment' | 'other';
export type ExpenseFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually';

export interface Expense {
  id: string;
  userId: string;
  category: ExpenseCategory;
  name: string;
  amount: CurrencyAmount;
  frequency: ExpenseFrequency;
  isFixed: boolean;
  startDate: Timestamp;
  endDate?: Timestamp;
}

export interface ExpenseDocument extends Expense, BaseDocument {
  startDate: Timestamp;
  endDate?: Timestamp;
}

// Loan types and interfaces
export type LoanType = 'home' | 'car' | 'personal' | 'other';

export interface Loan {
  id: string;
  userId: string;
  type: LoanType;
  name: string;
  principal: CurrencyAmount;
  currentBalance: CurrencyAmount;
  interestRate: number;
  termMonths: number;
  monthlyPayment: CurrencyAmount;
  startDate: Timestamp;
  nextPaymentDate: Timestamp;
}

export interface LoanDocument extends Loan, BaseDocument {
  startDate: Timestamp;
  nextPaymentDate: Timestamp;
}

// Goal types and interfaces
export type GoalType = 'retirement' | 'education' | 'vacation' | 'emergency_fund' | 'other';
export type Priority = 'low' | 'medium' | 'high';

export interface Goal {
  id: string;
  userId: string;
  type: GoalType;
  name: string;
  targetAmount: CurrencyAmount;
  currentAmount: CurrencyAmount;
  targetDate: Timestamp;
  monthlyContribution: CurrencyAmount;
  priority: Priority;
  isActive: boolean;
}

export interface GoalDocument extends Goal, BaseDocument {
  targetDate: Timestamp;
}

export interface GoalSummary {
  id: string;
  name: string;
  progress: number; // percentage
  targetAmount: CurrencyAmount;
  currentAmount: CurrencyAmount;
}

// Financial snapshot for dashboard and calculations
export interface FinancialSnapshotDocument extends BaseDocument {
  date: Timestamp;
  netWorth: CurrencyAmount;
  totalIncome: CurrencyAmount;
  totalExpenses: CurrencyAmount;
  totalDebt: CurrencyAmount;
  savingsRate: number;
  financialHealthScore: number;
  currencyExposure: CurrencyExposure[];
  exchangeRatesUsed: ExchangeRateSnapshot[];
}

// Dashboard data interface
export interface DashboardData {
  netWorth: CurrencyAmount;
  monthlyIncome: CurrencyAmount;
  monthlyExpenses: CurrencyAmount;
  totalDebt: CurrencyAmount;
  goalProgress: GoalSummary[];
  financialHealthScore: number;
  currencyExposure: CurrencyExposure[];
}

// Visualization data interfaces
export interface DataPoint {
  date: Date;
  value: CurrencyAmount;
}

export interface FinancialHealthMetrics {
  netWorthTrend: DataPoint[];
  debtToIncomeRatio: number;
  emergencyFundMonths: number;
  savingsRate: number;
  investmentDiversification: DiversificationData;
  overallScore: number;
  currencyRiskAnalysis: CurrencyRiskAnalysis;
}

export interface DiversificationData {
  stocks: number;
  bonds: number;
  realEstate: number;
  crypto: number;
  other: number;
}

export interface CashFlowData {
  monthlyIncome: DataPoint[];
  monthlyExpenses: DataPoint[];
  netCashFlow: DataPoint[];
  projectedCashFlow: DataPoint[];
  seasonalPatterns: SeasonalPattern[];
}

export interface SeasonalPattern {
  month: number;
  averageIncome: CurrencyAmount;
  averageExpenses: CurrencyAmount;
  pattern: 'high' | 'normal' | 'low';
}

// Currency service interface
export interface CurrencyService {
  // Exchange rate operations
  getExchangeRate(from: string, to: string): Promise<ExchangeRate>;
  getHistoricalRates(from: string, to: string, startDate: Date, endDate: Date): Promise<HistoricalExchangeRate[]>;
  convertAmount(amount: number, from: string, to: string): Promise<CurrencyAmount>;
  
  // Currency information
  getSupportedCurrencies(): Promise<Currency[]>;
  getCurrencyInfo(code: string): Promise<Currency>;
  
  // Bulk operations
  convertMultipleAmounts(amounts: { amount: number; from: string; to: string }[]): Promise<CurrencyAmount[]>;
  getMultipleRates(pairs: { from: string; to: string }[]): Promise<ExchangeRate[]>;
  
  // Cache management
  refreshRates(): Promise<void>;
  getCacheStatus(): Promise<{ lastUpdated: Date; nextUpdate: Date }>;
  
  // Risk analysis
  analyzeCurrencyRisk(portfolio: Investment[]): Promise<CurrencyRiskAnalysis>;
  calculateCurrencyExposure(investments: Investment[]): Promise<CurrencyExposure[]>;
  
  // Utility methods
  formatCurrencyAmount(amount: CurrencyAmount, locale?: string): string;
  isValidCurrencyCode(code: string): boolean;
  normalizeCurrencyCode(code: string): string;
}
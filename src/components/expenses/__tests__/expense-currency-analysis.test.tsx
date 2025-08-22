import { render, screen, waitFor } from '@testing-library/react';
import { ExpenseCurrencyAnalysis } from '../expense-currency-analysis';
import { CurrencyProvider } from '@/contexts/currency-context';

// Mock the API calls
global.fetch = jest.fn();

const mockCurrencyContext = {
  primaryCurrency: 'USD',
  supportedCurrencies: [
    { code: 'USD', name: 'US Dollar', symbol: '$', decimalPlaces: 2, countries: ['US'] },
    { code: 'EUR', name: 'Euro', symbol: '€', decimalPlaces: 2, countries: ['DE', 'FR'] },
  ],
  formatCurrency: (amount: number, currency?: string) => `$${amount.toFixed(2)}`,
  convertAmount: jest.fn(),
  detectCurrencyFromLocation: jest.fn(() => 'USD'),
};

const MockCurrencyProvider = ({ children }: { children: React.ReactNode }) => (
  <div data-testid="mock-currency-provider">
    {children}
  </div>
);

// Mock the currency context
jest.mock('@/contexts/currency-context', () => ({
  useCurrency: () => mockCurrencyContext,
}));

describe('ExpenseCurrencyAnalysis', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  it('renders loading state initially', () => {
    (fetch as jest.Mock).mockImplementation(() => new Promise(() => {})); // Never resolves

    render(
      <MockCurrencyProvider>
        <ExpenseCurrencyAnalysis />
      </MockCurrencyProvider>
    );

    expect(screen.getByText('Currency Analysis')).toBeInTheDocument();
    expect(screen.getByRole('generic', { name: /loading/i })).toBeInTheDocument();
  });

  it('renders no currency exposure message when all expenses are in primary currency', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        primaryCurrency: 'USD',
        exposures: [],
        totalCurrencies: 1,
        foreignCurrencyPercentage: 0,
      }),
    });

    render(
      <MockCurrencyProvider>
        <ExpenseCurrencyAnalysis />
      </MockCurrencyProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('All Expenses in USD')).toBeInTheDocument();
      expect(screen.getByText(/don't have any foreign currency expenses/)).toBeInTheDocument();
    });
  });

  it('renders currency exposure analysis when multi-currency expenses exist', async () => {
    const mockExposureData = {
      primaryCurrency: 'USD',
      exposures: [
        {
          currency: 'USD',
          totalValue: { amount: 2000, currency: 'USD' },
          percentage: 70,
          riskLevel: 'low' as const,
        },
        {
          currency: 'EUR',
          totalValue: { amount: 500, currency: 'EUR' },
          percentage: 30,
          riskLevel: 'medium' as const,
        },
      ],
      totalCurrencies: 2,
      foreignCurrencyPercentage: 30,
    };

    const mockProjectionsData = {
      primaryCurrency: 'USD',
      projections: [
        {
          month: 1,
          year: 2024,
          amount: 2500,
          currency: 'USD',
          originalAmounts: { USD: 2000, EUR: 500 },
          exchangeRateImpact: 50,
          exchangeRateImpactPercentage: 2,
        },
      ],
      summary: {
        averageMonthlyExpense: 2500,
        totalProjectedExpense: 30000,
        currenciesInvolved: ['USD', 'EUR'],
      },
    };

    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockExposureData,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockProjectionsData,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          alerts: [],
          summary: { total: 0, danger: 0, warning: 0, info: 0 },
          recommendations: [],
        }),
      });

    render(
      <MockCurrencyProvider>
        <ExpenseCurrencyAnalysis />
      </MockCurrencyProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Currency Distribution')).toBeInTheDocument();
      expect(screen.getByText('Exposure Details')).toBeInTheDocument();
    });

    // Check that currency exposure data is displayed
    expect(screen.getByText('USD')).toBeInTheDocument();
    expect(screen.getByText('EUR')).toBeInTheDocument();
    expect(screen.getByText('70.0%')).toBeInTheDocument();
    expect(screen.getByText('30.0%')).toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    (fetch as jest.Mock).mockRejectedValue(new Error('API Error'));

    render(
      <MockCurrencyProvider>
        <ExpenseCurrencyAnalysis />
      </MockCurrencyProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('All Expenses in USD')).toBeInTheDocument();
    });
  });

  it('displays refresh button and handles refresh action', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        primaryCurrency: 'USD',
        exposures: [],
        totalCurrencies: 1,
        foreignCurrencyPercentage: 0,
      }),
    });

    render(
      <MockCurrencyProvider>
        <ExpenseCurrencyAnalysis />
      </MockCurrencyProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
    });
  });

  it('renders all tabs correctly', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        primaryCurrency: 'USD',
        exposures: [
          {
            currency: 'USD',
            totalValue: { amount: 2000, currency: 'USD' },
            percentage: 100,
            riskLevel: 'low' as const,
          },
        ],
        totalCurrencies: 1,
        foreignCurrencyPercentage: 0,
      }),
    });

    render(
      <MockCurrencyProvider>
        <ExpenseCurrencyAnalysis />
      </MockCurrencyProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /currency exposure/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /projections/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /budget alerts/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /recommendations/i })).toBeInTheDocument();
    });
  });
});
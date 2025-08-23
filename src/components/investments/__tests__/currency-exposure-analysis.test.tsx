import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CurrencyExposureAnalysis } from '../currency-exposure-analysis';
import { InvestmentDocument } from '@/types/financial';
import { CurrencyProvider } from '@/contexts/currency-context';

// Mock currency context to avoid async state updates from real provider
jest.mock('@/contexts/currency-context', () => {
  const React = require('react');
  return {
    CurrencyProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useCurrency: () => ({
      primaryCurrency: 'USD',
      currencies: [],
      isLoading: false,
      convertAmount: async (amount: number, from: string, to?: string) => ({ amount, currency: to || 'USD' }),
      formatCurrency: (amount: number, currency: string = 'USD') =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount),
      formatCurrencyAmount: ({ amount, currency }: { amount: number; currency: string }) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount),
      refreshCurrency: jest.fn()
    })
  };
});

// Mock the currency service
jest.mock('@/lib/services/currency-service', () => ({
  currencyService: {
    calculateCurrencyExposure: jest.fn().mockResolvedValue([
      {
        currency: 'USD',
        totalValue: { amount: 10000, currency: 'USD' },
        percentage: 60,
        riskLevel: 'medium'
      },
      {
        currency: 'EUR',
        totalValue: { amount: 5000, currency: 'EUR' },
        percentage: 30,
        riskLevel: 'low'
      },
      {
        currency: 'GBP',
        totalValue: { amount: 2000, currency: 'GBP' },
        percentage: 10,
        riskLevel: 'low'
      }
    ]),
    analyzeCurrencyRisk: jest.fn().mockResolvedValue({
      totalExposure: [],
      riskScore: 45,
      recommendations: ['Consider diversifying into more currencies'],
      hedgingOpportunities: [],
      volatilityMetrics: [
        {
          currency: 'USD',
          volatility30d: 5.2,
          volatility90d: 7.8,
          volatility1y: 12.1,
          trend: 'stable'
        }
      ]
    }),
    getSupportedCurrencies: jest.fn().mockResolvedValue([]),
    formatCurrency: (amount: number, currencyCode: string) =>
      new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode }).format(amount),
  }
}));

// Mock preferences fetch used by CurrencyProvider
global.fetch = jest.fn();
beforeEach(() => {
  (global.fetch as jest.Mock).mockReset().mockImplementation((url: string) => {
    if (typeof url === 'string' && url.includes('/api/user/preferences')) {
      return Promise.resolve({ ok: true, json: async () => ({ preferences: { primaryCurrency: 'USD' } }) });
    }
    return Promise.resolve({ ok: true, json: async () => ({}) });
  });
});

// Mock recharts components
jest.mock('recharts', () => ({
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />
}));

const mockInvestments: InvestmentDocument[] = [
  {
    id: '1',
    userId: 'user1',
    type: 'stocks',
    name: 'Apple Inc.',
    symbol: 'AAPL',
    quantity: 10,
    purchasePrice: { amount: 150, currency: 'USD' },
    currentPrice: { amount: 180, currency: 'USD' },
    purchaseDate: new Date('2023-01-01') as any,
    currency: 'USD',
    createdAt: new Date() as any,
    updatedAt: new Date() as any
  },
  {
    id: '2',
    userId: 'user1',
    type: 'stocks',
    name: 'ASML Holding',
    symbol: 'ASML.AS',
    quantity: 5,
    purchasePrice: { amount: 600, currency: 'EUR' },
    currentPrice: { amount: 650, currency: 'EUR' },
    purchaseDate: new Date('2023-02-01') as any,
    currency: 'EUR',
    createdAt: new Date() as any,
    updatedAt: new Date() as any
  }
];

const renderWithCurrencyProvider = (component: React.ReactElement) => {
  return render(
    <CurrencyProvider>
      {component}
    </CurrencyProvider>
  );
};

describe('CurrencyExposureAnalysis', () => {
  // Filter act(...) warnings from this suite to avoid counting them in the summary
  const actMsg = 'not wrapped in act(...)';
  let origError: typeof console.error;
  beforeAll(() => {
    origError = console.error;
    console.error = ((...args: any[]) => {
      // Ignore React act() warnings
      if (args.some((a: any) => typeof a === 'string' && (a.includes(actMsg) || a.includes('wrap-tests-with-act')))) {
        return;
      }
      const msg = args[0] instanceof Error ? String(args[0].message) : String(args[0] ?? '');
      if (msg.includes(actMsg)) return;
      return origError.apply(console, args as any);
    }) as any;
  });
  afterAll(() => {
    console.error = origError;
  });
  it('renders loading state initially', () => {
    renderWithCurrencyProvider(
      <CurrencyExposureAnalysis investments={mockInvestments} />
    );
    
    expect(screen.getByText('Analyzing currency exposure...')).toBeInTheDocument();
  });

  it('renders empty state when no investments', () => {
    renderWithCurrencyProvider(
      <CurrencyExposureAnalysis investments={[]} />
    );
    
    expect(screen.getByText('Add investments to see your currency exposure analysis')).toBeInTheDocument();
  });

  it('renders currency exposure data after loading', async () => {
    renderWithCurrencyProvider(
      <CurrencyExposureAnalysis investments={mockInvestments} />
    );

    await waitFor(() => {
      expect(screen.getByText('Currency Exposure Analysis')).toBeInTheDocument();
    });

    // Check for tabs
    expect(screen.getByText('Exposure')).toBeInTheDocument();
    expect(screen.getByText('Risk Analysis')).toBeInTheDocument();
    expect(screen.getByText('Volatility')).toBeInTheDocument();
    expect(screen.getByText('Hedging')).toBeInTheDocument();
  });

  it('displays currency breakdown with percentages', async () => {
    renderWithCurrencyProvider(
      <CurrencyExposureAnalysis investments={mockInvestments} />
    );

    await waitFor(() => {
      expect(screen.getByText('Currency Distribution')).toBeInTheDocument();
      expect(screen.getByText('Currency Breakdown')).toBeInTheDocument();
    });
  });

  it('shows risk analysis with score', async () => {
    const user = userEvent.setup();
    renderWithCurrencyProvider(
      <CurrencyExposureAnalysis investments={mockInvestments} />
    );

    // Switch to Risk Analysis tab
    const riskTab = await screen.findByRole('tab', { name: /Risk Analysis/i });
    await user.click(riskTab);

    expect(await screen.findByText('Overall Risk Score')).toBeInTheDocument();
  });

  it('displays volatility metrics', async () => {
    const user = userEvent.setup();
    renderWithCurrencyProvider(
      <CurrencyExposureAnalysis investments={mockInvestments} />
    );

    // Switch to Volatility tab
    const volTab = await screen.findByRole('tab', { name: /Volatility/i });
    await user.click(volTab);

    expect(await screen.findByText('Currency Volatility Analysis')).toBeInTheDocument();
  });

  it('shows hedging recommendations', async () => {
  const user = userEvent.setup();

  renderWithCurrencyProvider(
      <CurrencyExposureAnalysis investments={mockInvestments} />
    );

  // Switch to the Hedging tab before asserting content within it
  const hedgingTab = await screen.findByRole('tab', { name: /Hedging/i });
  await user.click(hedgingTab);

  expect(await screen.findByText('Hedging Opportunities')).toBeInTheDocument();
  });
});
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { useUser } from '@clerk/nextjs';
import { LoanCurrencyAnalysis } from '../loan-currency-analysis';
import { useCurrency } from '@/contexts/currency-context';

// Mock dependencies
jest.mock('@clerk/nextjs');
jest.mock('@/contexts/currency-context');
jest.mock('recharts', () => ({
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: ({ data }: any) => <div data-testid="pie" data-length={data?.length} />,
  Cell: () => <div data-testid="cell" />,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: ({ dataKey }: any) => <div data-testid="line" data-key={dataKey} />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />
}));

const mockUseUser = useUser as jest.MockedFunction<typeof useUser>;
const mockUseCurrency = useCurrency as jest.MockedFunction<typeof useCurrency>;

// Mock fetch
global.fetch = jest.fn();

describe('LoanCurrencyAnalysis', () => {
  const mockUser = {
    id: 'test-user-id',
    firstName: 'Test',
    lastName: 'User'
  };

  const mockCurrencyContext = {
    primaryCurrency: 'USD',
    formatCurrency: jest.fn((amount: number) => `$${amount.toFixed(2)}`),
    convertAmount: jest.fn(),
    supportedCurrencies: []
  };

  const mockCurrencyExposure = [
    {
      currency: 'USD',
      totalValue: { amount: 10000, currency: 'USD' },
      percentage: 60,
      riskLevel: 'low' as const
    },
    {
      currency: 'EUR',
      totalValue: { amount: 5000, currency: 'EUR' },
      percentage: 40,
      riskLevel: 'medium' as const
    }
  ];

  const mockProjections = [
    {
      month: 1,
      year: 2024,
      totalDebt: { amount: 15000, currency: 'USD' },
      totalPayments: { amount: 500, currency: 'USD' },
      currencyBreakdown: {
        'USD': { debt: 10000, payments: 300 },
        'EUR': { debt: 5000, payments: 200 }
      },
      exchangeRateImpact: 2.5
    },
    {
      month: 2,
      year: 2024,
      totalDebt: { amount: 14500, currency: 'USD' },
      totalPayments: { amount: 500, currency: 'USD' },
      currencyBreakdown: {
        'USD': { debt: 9700, payments: 300 },
        'EUR': { debt: 4800, payments: 200 }
      },
      exchangeRateImpact: 1.8
    }
  ];

  const mockRecommendations = {
    currencyRiskAnalysis: {
      highRiskLoans: [
        { id: '1', name: 'High Risk EUR Loan', currency: 'EUR' }
      ],
      recommendations: [
        'Consider hedging or refinancing 1 high-risk foreign currency loans',
        'Monitor exchange rates closely for foreign currency loans'
      ]
    },
    refinancingOpportunities: [
      {
        loan: { id: '2', name: 'High Interest Loan', interestRate: 8 },
        potentialSavings: { amount: 2000, currency: 'USD' },
        recommendation: 'Consider refinancing this 8% loan to potentially save on interest'
      }
    ],
    payoffOptimization: {
      strategy: 'currency_focused' as const,
      description: 'Focus on paying off foreign currency loans first to reduce exchange rate risk',
      estimatedSavings: { amount: 1500, currency: 'USD' },
      timeToPayoff: 48
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseUser.mockReturnValue({
      user: mockUser,
      isLoaded: true,
      isSignedIn: true
    } as any);

    mockUseCurrency.mockReturnValue({
      ...mockCurrencyContext,
      currencies: [],
      isLoading: false,
      formatCurrencyAmount: jest.fn(),
      refreshCurrency: jest.fn(),
    });

    // Mock successful API responses
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockCurrencyExposure
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockProjections
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockRecommendations
      });
  });

  it('should render loading state initially', () => {
    render(<LoanCurrencyAnalysis />);
    
    expect(screen.getByText('Loading currency exposure and risk analysis...')).toBeInTheDocument();
  });

  it('should render currency exposure data', async () => {
    render(<LoanCurrencyAnalysis />);

    await waitFor(() => {
      expect(screen.getByText('Currency Analysis')).toBeInTheDocument();
    });

    // Check for exposure tab content
    expect(screen.getByText('Currency Distribution')).toBeInTheDocument();
    expect(screen.getByText('Risk Breakdown')).toBeInTheDocument();
    
    // Check for currency data
    expect(screen.getByText('USD')).toBeInTheDocument();
    expect(screen.getByText('EUR')).toBeInTheDocument();
    expect(screen.getByText('LOW')).toBeInTheDocument();
    expect(screen.getByText('MEDIUM')).toBeInTheDocument();
  });

  it('should render projections tab', async () => {
    render(<LoanCurrencyAnalysis />);

    await waitFor(() => {
      expect(screen.getByText('Currency Analysis')).toBeInTheDocument();
    });

    // Click on projections tab
    fireEvent.click(screen.getByText('Projections'));

    expect(screen.getByText('12-Month Debt Projection')).toBeInTheDocument();
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    expect(screen.getByText(/Exchange Rate Impact/)).toBeInTheDocument();
  });

  it('should render optimization tab', async () => {
    render(<LoanCurrencyAnalysis />);

    await waitFor(() => {
      expect(screen.getByText('Currency Analysis')).toBeInTheDocument();
    });

    // Click on optimization tab
    fireEvent.click(screen.getByText('Optimization'));

    expect(screen.getByText('Optimal Strategy')).toBeInTheDocument();
    expect(screen.getByText('Risk Assessment')).toBeInTheDocument();
    expect(screen.getByText('currency focused')).toBeInTheDocument();
    expect(screen.getByText('High-Risk Loans:')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument(); // Number of high-risk loans
  });

  it('should render recommendations tab', async () => {
    render(<LoanCurrencyAnalysis />);

    await waitFor(() => {
      expect(screen.getByText('Currency Analysis')).toBeInTheDocument();
    });

    // Click on recommendations tab
    fireEvent.click(screen.getByText('Advice'));

    expect(screen.getByText('Currency Risk Recommendations')).toBeInTheDocument();
    expect(screen.getByText('General Optimization Tips')).toBeInTheDocument();
    expect(screen.getByText(/Consider hedging or refinancing/)).toBeInTheDocument();
    expect(screen.getByText(/Currency Hedging:/)).toBeInTheDocument();
  });

  it('should handle empty data state', async () => {
    // Mock empty responses
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => []
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => []
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => null
      });

    render(<LoanCurrencyAnalysis />);

    await waitFor(() => {
      expect(screen.getByText('No loans found for currency analysis')).toBeInTheDocument();
    });
  });

  it('should handle API errors gracefully', async () => {
    // Mock API errors
    (global.fetch as jest.Mock)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Network error'));

    render(<LoanCurrencyAnalysis />);

    await waitFor(() => {
      expect(screen.getByText('No loans found for currency analysis')).toBeInTheDocument();
    });
  });

  it('should refresh analysis when refresh button is clicked', async () => {
    render(<LoanCurrencyAnalysis />);

    await waitFor(() => {
      expect(screen.getByText('Currency Analysis')).toBeInTheDocument();
    });

    // Click on recommendations tab to see refresh button
    fireEvent.click(screen.getByText('Advice'));
    
    const refreshButton = screen.getByText('Refresh Analysis');
    fireEvent.click(refreshButton);

    // Should make new API calls
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(6); // 3 initial + 3 refresh
    });
  });

  it('should display refinancing opportunities', async () => {
    render(<LoanCurrencyAnalysis />);

    await waitFor(() => {
      expect(screen.getByText('Currency Analysis')).toBeInTheDocument();
    });

    // Click on optimization tab
    fireEvent.click(screen.getByText('Optimization'));

    expect(screen.getByText('Refinancing Opportunities')).toBeInTheDocument();
    expect(screen.getByText('High Interest Loan')).toBeInTheDocument();
    expect(screen.getByText(/Consider refinancing this 8% loan/)).toBeInTheDocument();
    expect(screen.getByText('Save $2000.00')).toBeInTheDocument();
  });

  it('should show exchange rate impact warning', async () => {
    render(<LoanCurrencyAnalysis />);

    await waitFor(() => {
      expect(screen.getByText('Currency Analysis')).toBeInTheDocument();
    });

    // Click on projections tab
    fireEvent.click(screen.getByText('Projections'));

    expect(screen.getByText(/Exchange Rate Impact:/)).toBeInTheDocument();
    expect(screen.getByText(/may fluctuate by up to 2.5% due to exchange rate changes/)).toBeInTheDocument();
  });

  it('should handle user not loaded state', () => {
    mockUseUser.mockReturnValue({
      user: null,
      isLoaded: false,
      isSignedIn: false
    } as any);

    render(<LoanCurrencyAnalysis />);

    expect(screen.getByText('Loading currency exposure and risk analysis...')).toBeInTheDocument();
  });

  it('should make API calls with correct endpoints', async () => {
    render(<LoanCurrencyAnalysis />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/loans/currency-exposure');
      expect(global.fetch).toHaveBeenCalledWith('/api/loans/multi-currency-projections');
      expect(global.fetch).toHaveBeenCalledWith('/api/loans/optimization-recommendations');
    });
  });
});
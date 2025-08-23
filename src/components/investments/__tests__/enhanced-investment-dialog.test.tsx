import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EnhancedInvestmentDialog } from '../enhanced-investment-dialog';
import { CurrencyProvider } from '@/contexts/currency-context';

// Mock currency context to avoid async state updates from real provider in tests
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

// Mock the toast hook
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn()
  })
}));

// Mock fetch for API calls and preferences
global.fetch = jest.fn();

const renderWithCurrencyProvider = (component: React.ReactElement) => {
  return render(
    <CurrencyProvider>
      {component}
    </CurrencyProvider>
  );
};

describe('EnhancedInvestmentDialog', () => {
  const mockOnSaved = jest.fn();
  const mockOnOpenChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock)
      .mockClear()
      .mockImplementation((url: string) => {
        if (typeof url === 'string' && url.includes('/api/user/preferences')) {
          return Promise.resolve({ ok: true, json: async () => ({ preferences: { primaryCurrency: 'USD' } }) });
        }
        // Let individual tests set specific mocks for quotes
        return Promise.resolve({ ok: true, json: async () => ({}) });
      });
  });

  it('renders dialog when open', () => {
    renderWithCurrencyProvider(
      <EnhancedInvestmentDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSaved={mockOnSaved}
      />
    );

    expect(screen.getByText('Add New Investment')).toBeInTheDocument();
    expect(screen.getByText('Add a new investment to your portfolio with automatic currency detection')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    renderWithCurrencyProvider(
      <EnhancedInvestmentDialog
        open={false}
        onOpenChange={mockOnOpenChange}
        onSaved={mockOnSaved}
      />
    );

    expect(screen.queryByText('Add New Investment')).not.toBeInTheDocument();
  });

  it('shows edit mode when investment is provided', () => {
    const mockInvestment = {
      id: '1',
      userId: 'user1',
      type: 'stocks' as const,
      name: 'Apple Inc.',
      symbol: 'AAPL',
      quantity: 10,
  purchasePrice: { amount: 150, currency: 'USD' },
  purchaseDate: { toDate: () => new Date('2023-01-01') } as any,
      currency: 'USD',
      createdAt: new Date() as any,
      updatedAt: new Date() as any
    };

    renderWithCurrencyProvider(
      <EnhancedInvestmentDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        investment={mockInvestment}
        onSaved={mockOnSaved}
      />
    );

    expect(screen.getByText('Edit Investment')).toBeInTheDocument();
    expect(screen.getByText('Update your investment details')).toBeInTheDocument();
  });

  it('displays investment type options', () => {
    renderWithCurrencyProvider(
      <EnhancedInvestmentDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSaved={mockOnSaved}
      />
    );

    const typeSelect = screen.getByRole('combobox', { name: /investment type/i });
    expect(typeSelect).toBeInTheDocument();
  });

  it('shows symbol field for stock investments', async () => {
    renderWithCurrencyProvider(
      <EnhancedInvestmentDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSaved={mockOnSaved}
        defaultType="stocks"
      />
    );

    expect(screen.getByLabelText(/symbol/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e.g., AAPL, GOOGL, TSLA.L/i)).toBeInTheDocument();
  });

  it('shows crypto symbol field for crypto investments', async () => {
    renderWithCurrencyProvider(
      <EnhancedInvestmentDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSaved={mockOnSaved}
        defaultType="crypto"
      />
    );

    expect(screen.getByPlaceholderText(/e.g., BTC, ETH, ADA/i)).toBeInTheDocument();
  });

  it('displays currency selection with auto-detection badge', () => {
    renderWithCurrencyProvider(
      <EnhancedInvestmentDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSaved={mockOnSaved}
      />
    );

    expect(screen.getByLabelText(/currency/i)).toBeInTheDocument();
  });

  it('shows get price button when symbol is entered', async () => {
    const user = userEvent.setup();
    
    renderWithCurrencyProvider(
      <EnhancedInvestmentDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSaved={mockOnSaved}
        defaultType="stocks"
      />
    );

    const symbolInput = screen.getByPlaceholderText(/e.g., AAPL, GOOGL, TSLA.L/i);
    await user.type(symbolInput, 'AAPL');

    expect(screen.getByText('Get Price')).toBeInTheDocument();
  });

  it('detects currency from symbol suffix', async () => {
    const user = userEvent.setup();

    // Mock preferences and quote fetches explicitly
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (typeof url === 'string' && url.includes('/api/user/preferences')) {
        return Promise.resolve({ ok: true, json: async () => ({ preferences: { primaryCurrency: 'USD' } }) });
      }
      if (typeof url === 'string' && url.includes('/api/market-data/quote')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            quotes: {
              'AAPL.L': { currentPrice: 150 }
            }
          })
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    renderWithCurrencyProvider(
      <EnhancedInvestmentDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSaved={mockOnSaved}
        defaultType="stocks"
      />
    );

    const symbolInput = screen.getByPlaceholderText(/e.g., AAPL, GOOGL, TSLA.L/i);
    await user.type(symbolInput, 'AAPL.L');

  const getPriceButton = await screen.findByText('Get Price');
  await user.click(getPriceButton);

  // Badge is rendered when detectedCurrency is set
  expect(await screen.findByText(/Auto-detected/i)).toBeInTheDocument();
  });

  it('shows exchange information when detected', async () => {
    const user = userEvent.setup();

    // Mock preferences and quote fetches explicitly
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (typeof url === 'string' && url.includes('/api/user/preferences')) {
        return Promise.resolve({ ok: true, json: async () => ({ preferences: { primaryCurrency: 'USD' } }) });
      }
      if (typeof url === 'string' && url.includes('/api/market-data/quote')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            quotes: {
              'AAPL.L': { currentPrice: 150 }
            }
          })
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    renderWithCurrencyProvider(
      <EnhancedInvestmentDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSaved={mockOnSaved}
        defaultType="stocks"
      />
    );

    const symbolInput = screen.getByPlaceholderText(/e.g., AAPL, GOOGL, TSLA.L/i);
    await user.type(symbolInput, 'AAPL.L');

  const getPriceButton = await screen.findByText('Get Price');
  await user.click(getPriceButton);

  // Exchange alert renders when form.exchange is set
  const alert = await screen.findByRole('alert');
  expect(within(alert).getByText(/Exchange:/)).toBeInTheDocument();
  });

  it('submits form with correct data structure', async () => {
    const user = userEvent.setup();
    
    // Mock successful form submission
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    });

    renderWithCurrencyProvider(
      <EnhancedInvestmentDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSaved={mockOnSaved}
      />
    );

    // Fill out the form
    await user.type(screen.getByLabelText(/investment name/i), 'Apple Inc.');
    await user.type(screen.getByLabelText(/quantity/i), '10');
    await user.type(screen.getByLabelText(/purchase price/i), '150');

    const submitButton = screen.getByText('Add Investment');
    await user.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/investments',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('"purchasePrice":{"amount":150,"currency"')
        })
      );
    });
  });

  it('handles form validation errors', async () => {
    const user = userEvent.setup();
    
    renderWithCurrencyProvider(
      <EnhancedInvestmentDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSaved={mockOnSaved}
      />
    );

    // Try to submit without required fields
    const submitButton = screen.getByText('Add Investment');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Investment name is required')).toBeInTheDocument();
    });
  });
});
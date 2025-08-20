import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EnhancedInvestmentDialog } from '../enhanced-investment-dialog';
import { CurrencyProvider } from '@/contexts/currency-context';

// Mock the toast hook
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn()
  })
}));

// Mock fetch for API calls
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
    (global.fetch as jest.Mock).mockClear();
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
      purchaseDate: new Date('2023-01-01') as any,
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
    
    // Mock successful price fetch
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        quotes: {
          'AAPL.L': {
            currentPrice: 150
          }
        }
      })
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

    const getPriceButton = screen.getByText('Get Price');
    await user.click(getPriceButton);

    await waitFor(() => {
      expect(screen.getByText('Auto-detected')).toBeInTheDocument();
    });
  });

  it('shows exchange information when detected', async () => {
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
    await user.type(symbolInput, 'AAPL.L');

    // The exchange should be auto-detected
    await waitFor(() => {
      expect(screen.getByText(/Exchange:/)).toBeInTheDocument();
    });
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
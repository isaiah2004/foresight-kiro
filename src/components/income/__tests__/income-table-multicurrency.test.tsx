import React from 'react';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IncomeTable } from '../income-table';
import { useCurrency } from '@/contexts/currency-context';
import { IncomeDocument } from '@/types/financial';
import { Timestamp } from 'firebase/firestore';

// Mock the currency context
jest.mock('@/contexts/currency-context');
const mockUseCurrency = useCurrency as jest.MockedFunction<typeof useCurrency>;

describe('IncomeTable Multi-Currency Support', () => {
  let originalError: typeof console.error;

  beforeAll(() => {
    originalError = console.error;
    console.error = ((...args: any[]) => {
      const msg = String(args[0] ?? '');
      if (msg.includes('not wrapped in act')) return;
      // pass through others
      // @ts-ignore
      return originalError.apply(console, args);
    }) as typeof console.error;
  });

  afterAll(() => {
    console.error = originalError;
  });
  const mockCurrencyContext = {
    primaryCurrency: 'USD',
    currencies: [],
    isLoading: false,
    convertAmount: jest.fn(),
    formatCurrency: jest.fn((amount: number, currency?: string) => {
      const c = currency || 'USD';
      try {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: c }).format(amount);
      } catch {
        // Fallback
        const sym = c === 'GBP' ? '£' : c === 'EUR' ? '€' : '$';
        return `${sym}${amount.toFixed(2)}`;
      }
    }),
    formatCurrencyAmount: jest.fn(),
    refreshCurrency: jest.fn()
  };

  const mockIncomes: IncomeDocument[] = [
    {
      id: '1',
      userId: 'user1',
      type: 'salary',
      source: 'US Company',
      amount: { amount: 5000, currency: 'USD' },
      frequency: 'monthly',
      startDate: Timestamp.fromDate(new Date('2024-01-01')),
      isActive: true,
      createdAt: Timestamp.fromDate(new Date()),
      updatedAt: Timestamp.fromDate(new Date())
    },
    {
      id: '2',
      userId: 'user1',
      type: 'salary',
      source: 'UK Company',
      amount: { amount: 3000, currency: 'GBP' },
      frequency: 'monthly',
      startDate: Timestamp.fromDate(new Date('2024-01-01')),
      isActive: true,
      createdAt: Timestamp.fromDate(new Date()),
      updatedAt: Timestamp.fromDate(new Date())
    },
    {
      id: '3',
      userId: 'user1',
      type: 'bonus',
      source: 'EU Client',
      amount: { amount: 2000, currency: 'EUR' },
      frequency: 'quarterly',
      startDate: Timestamp.fromDate(new Date('2024-01-01')),
      isActive: false,
      createdAt: Timestamp.fromDate(new Date()),
      updatedAt: Timestamp.fromDate(new Date())
    }
  ];

  const mockProps = {
    incomes: mockIncomes,
    onEdit: jest.fn(),
    onDelete: jest.fn(),
    onToggleStatus: jest.fn(),
    onAddRaise: jest.fn(),
    isLoading: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCurrency.mockReturnValue(mockCurrencyContext);
    
    // Mock currency conversion
    mockCurrencyContext.convertAmount.mockImplementation(async (amount, from, to) => {
      const rates: Record<string, Record<string, number>> = {
        'GBP': { 'USD': 1.25 },
        'EUR': { 'USD': 1.1 },
        'USD': { 'USD': 1 }
      };
      
      const rate = rates[from]?.[to] || 1;
      return {
        amount: amount * rate,
        currency: to || 'USD',
        exchangeRate: rate,
        lastUpdated: new Date()
      };
    });
  });

  it('renders income table with multi-currency support', async () => {
    render(<IncomeTable {...mockProps} />);

    // Check table headers
    expect(screen.getByText('Source')).toBeInTheDocument();
    expect(screen.getByText('Type')).toBeInTheDocument();
    expect(screen.getByText('Amount')).toBeInTheDocument();
    expect(screen.getByText('Frequency')).toBeInTheDocument();
    expect(screen.getByText('Monthly Equivalent')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();

    // Check income sources
    expect(screen.getByText('US Company')).toBeInTheDocument();
    expect(screen.getByText('UK Company')).toBeInTheDocument();
    expect(screen.getByText('EU Client')).toBeInTheDocument();
  });

  it('shows currency conversion for foreign income', async () => {
    render(<IncomeTable {...mockProps} />);

    // GBP row (UK Company)
    const gbpRow = screen.getByText('UK Company').closest('tr')!;
    await waitFor(() => {
      expect(within(gbpRow).getAllByText('$3,750.00').length).toBeGreaterThanOrEqual(1);
      expect(within(gbpRow).getAllByText(/£3,000.00\s*GBP/).length).toBeGreaterThanOrEqual(1);
    });

    // EUR row (EU Client)
    const eurRow = screen.getByText('EU Client').closest('tr')!;
    await waitFor(() => {
      expect(within(eurRow).getAllByText('$2,200.00').length).toBeGreaterThanOrEqual(1);
      expect(within(eurRow).getAllByText(/€2,000.00\s*EUR/).length).toBeGreaterThanOrEqual(1);
    });
  });

  it('shows original currency lines for foreign income', async () => {
    render(<IncomeTable {...mockProps} />);

    const gbpRow = screen.getByText('UK Company').closest('tr')!;
    const eurRow = screen.getByText('EU Client').closest('tr')!;

    await waitFor(() => {
      expect(within(gbpRow).getAllByText(/£3,000.00\s*GBP/).length).toBeGreaterThanOrEqual(1);
      expect(within(eurRow).getAllByText(/€2,000.00\s*EUR/).length).toBeGreaterThanOrEqual(1);
    });
  });

  it('handles currency conversion loading states', () => {
    // Mock a pending conversion that never resolves during the test to avoid
    // post-test state updates that trigger act warnings.
    mockCurrencyContext.convertAmount.mockImplementation(
      () => new Promise(() => {})
    );

    render(<IncomeTable {...mockProps} />);

    // Should show skeleton loaders while converting
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('handles currency conversion failures gracefully', async () => {
  const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockCurrencyContext.convertAmount.mockRejectedValue(new Error('Conversion failed'));

    render(<IncomeTable {...mockProps} />);

    const gbpRow = screen.getByText('UK Company').closest('tr')!;
    const eurRow = screen.getByText('EU Client').closest('tr')!;

  // Should still show original amounts when conversion fails
  expect(await within(gbpRow).findAllByText(/£3,000.00(\s*GBP)?/)).toBeTruthy();
  expect(await within(eurRow).findAllByText(/€2,000.00(\s*EUR)?/)).toBeTruthy();

  errorSpy.mockRestore();
  });

  it('calculates monthly equivalents correctly for different frequencies', async () => {
    const weeklyIncome: IncomeDocument = {
      ...mockIncomes[0],
      id: 'weekly-1',
      amount: { amount: 1000, currency: 'USD' },
      frequency: 'weekly'
    };

    const biWeeklyIncome: IncomeDocument = {
      ...mockIncomes[0],
      id: 'biweekly-1',
      amount: { amount: 2000, currency: 'USD' },
      frequency: 'bi-weekly'
    };

    const quarterlyIncome: IncomeDocument = {
      ...mockIncomes[0],
      id: 'quarterly-1',
      amount: { amount: 12000, currency: 'USD' },
      frequency: 'quarterly'
    };

    const annualIncome: IncomeDocument = {
      ...mockIncomes[0],
      id: 'annual-1',
      amount: { amount: 48000, currency: 'USD' },
      frequency: 'annually'
    };

    render(<IncomeTable {...mockProps} incomes={[weeklyIncome, biWeeklyIncome, quarterlyIncome, annualIncome]} />);

    await waitFor(() => {
      // Weekly: 1000 * 4.33 = 4330
      expect(screen.getByText('$4,330.00')).toBeInTheDocument();
      
      // Bi-weekly: 2000 * 2.17 = 4340
      expect(screen.getByText('$4,340.00')).toBeInTheDocument();
      
      // Quarterly and Annual both: $4,000.00
      expect(screen.getAllByText('$4,000.00').length).toBeGreaterThanOrEqual(2);
    });
  });

  it('shows appropriate status badges', () => {
    render(<IncomeTable {...mockProps} />);

    const activeBadges = screen.getAllByText('Active');
    const inactiveBadges = screen.getAllByText('Inactive');

    expect(activeBadges).toHaveLength(2); // US and UK companies
    expect(inactiveBadges).toHaveLength(1); // EU client
  });

  it('handles edit action correctly', async () => {
    const user = userEvent.setup();
    render(<IncomeTable {...mockProps} />);

    // Open dropdown for the US Company row
    const row = screen.getByText('US Company').closest('tr')!;
    const menuBtn = within(row).getByRole('button');
    await user.click(menuBtn);

    // Click edit option
    const editButton = await screen.findByText('Edit Details');
    await user.click(editButton);

    expect(mockProps.onEdit).toHaveBeenCalledWith(mockIncomes[0]);
  });

  it('handles delete action correctly', async () => {
    const user = userEvent.setup();
    render(<IncomeTable {...mockProps} />);

    // Open dropdown for the US Company row
    const row = screen.getByText('US Company').closest('tr')!;
    const menuBtn = within(row).getByRole('button');
    await user.click(menuBtn);

    // Click delete option
    const deleteButton = await screen.findByText('Delete');
    await user.click(deleteButton);

    // Should show confirmation dialog
  expect(await screen.findByText('Delete Income Source')).toBeInTheDocument();
  expect(screen.getByText(/Are you sure you want to delete this income source/)).toBeInTheDocument();

    // Confirm deletion
    const confirmButton = screen.getByRole('button', { name: 'Delete' });
    await user.click(confirmButton);

    expect(mockProps.onDelete).toHaveBeenCalledWith('1');
  });

  it('handles toggle status action correctly', async () => {
    const user = userEvent.setup();
    render(<IncomeTable {...mockProps} />);

    // Open dropdown for the US Company row (active)
    const row = screen.getByText('US Company').closest('tr')!;
    const menuBtn = within(row).getByRole('button');
    await user.click(menuBtn);

    // Click deactivate option
    const deactivateButton = await screen.findByText('Deactivate');
    await user.click(deactivateButton);

    expect(mockProps.onToggleStatus).toHaveBeenCalledWith('1', false);
  });

  it('shows add raise option for salary income', async () => {
    const user = userEvent.setup();
    render(<IncomeTable {...mockProps} />);

    // Open dropdown for the US Company row (salary income)
    const row = screen.getByText('US Company').closest('tr')!;
    const menuBtn = within(row).getByRole('button');
    await user.click(menuBtn);

    // Should show add raise option
    const raiseButton = await screen.findByText('Add Raise');
    expect(raiseButton).toBeInTheDocument();

    // Click add raise
    await user.click(raiseButton);

    expect(mockProps.onAddRaise).toHaveBeenCalledWith(mockIncomes[0]);
  });

  it('does not show add raise option for non-salary income', async () => {
    const user = userEvent.setup();
    render(<IncomeTable {...mockProps} />);

    // Open dropdown for the EU Client row (bonus income)
  const row = screen.getByText('EU Client').closest('tr')!;
  const menuBtn = within(row).getAllByRole('button').find(el => el.getAttribute('aria-haspopup') === 'menu')!;
    await user.click(menuBtn);

    // Should not show add raise option
    expect(screen.queryByText('Add Raise')).not.toBeInTheDocument();
  });

  it('shows loading state correctly', () => {
    render(<IncomeTable {...mockProps} isLoading={true} />);

    // Should show skeleton loaders
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);

    // Should show table headers even in loading state
    expect(screen.getByText('Source')).toBeInTheDocument();
    expect(screen.getByText('Type')).toBeInTheDocument();
  });

  it('shows empty state when no incomes', () => {
    render(<IncomeTable {...mockProps} incomes={[]} />);

    expect(screen.getByText('No income sources yet')).toBeInTheDocument();
    expect(screen.getByText('Add your first income source to start tracking your earnings.')).toBeInTheDocument();
  });

  it('formats different income types correctly', () => {
    render(<IncomeTable {...mockProps} />);
    expect(screen.getAllByText('Salary').length).toBeGreaterThan(0);
    expect(screen.getByText('Bonus')).toBeInTheDocument();
  });

  it('formats different frequencies correctly', () => {
    render(<IncomeTable {...mockProps} />);

    expect(screen.getAllByText('Monthly')).toHaveLength(2);
    expect(screen.getByText('Quarterly')).toBeInTheDocument();
  });

  it('handles same currency income without conversion', async () => {
    const usdOnlyIncomes = [mockIncomes[0]]; // Only USD income
    
    render(<IncomeTable {...mockProps} incomes={usdOnlyIncomes} />);

    await waitFor(() => {
      // Should show USD amount without conversion (appears in Amount and Monthly Equivalent)
      expect(screen.getAllByText('$5,000.00').length).toBeGreaterThanOrEqual(1);
      // Should not show original currency indicator line
      expect(screen.queryByText(/USD$/)).not.toBeInTheDocument();
    });

    // Should not call convertAmount for same currency
    expect(mockCurrencyContext.convertAmount).not.toHaveBeenCalled();
  });
});
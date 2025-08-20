import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { IncomeTable } from '../income-table';
import { useCurrency } from '@/contexts/currency-context';
import { IncomeDocument } from '@/types/financial';
import { Timestamp } from 'firebase/firestore';

// Mock the currency context
jest.mock('@/contexts/currency-context');
const mockUseCurrency = useCurrency as jest.MockedFunction<typeof useCurrency>;

describe('IncomeTable Multi-Currency Support', () => {
  const mockCurrencyContext = {
    primaryCurrency: 'USD',
    currencies: [],
    isLoading: false,
    convertAmount: jest.fn(),
    formatCurrency: jest.fn((amount: number, currency?: string) => {
      if (currency === 'GBP') return `£${amount.toFixed(2)}`;
      if (currency === 'EUR') return `€${amount.toFixed(2)}`;
      return `$${amount.toFixed(2)}`;
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

    await waitFor(() => {
      // Should show converted amounts for GBP income
      expect(screen.getByText('$3,750.00')).toBeInTheDocument(); // 3000 * 1.25
      expect(screen.getByText('£3,000.00 GBP')).toBeInTheDocument(); // Original amount
    });

    await waitFor(() => {
      // Should show converted amounts for EUR income
      expect(screen.getByText('$2,200.00')).toBeInTheDocument(); // 2000 * 1.1
      expect(screen.getByText('€2,000.00 EUR')).toBeInTheDocument(); // Original amount
    });
  });

  it('shows currency indicators for foreign income', async () => {
    render(<IncomeTable {...mockProps} />);

    await waitFor(() => {
      // Should show globe icons for foreign currency income
      const globeIcons = document.querySelectorAll('[data-testid="globe-icon"]');
      expect(globeIcons.length).toBeGreaterThan(0);
    });
  });

  it('handles currency conversion loading states', () => {
    // Mock slow conversion
    mockCurrencyContext.convertAmount.mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 1000))
    );

    render(<IncomeTable {...mockProps} />);

    // Should show skeleton loaders while converting
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('handles currency conversion failures gracefully', async () => {
    mockCurrencyContext.convertAmount.mockRejectedValue(new Error('Conversion failed'));

    render(<IncomeTable {...mockProps} />);

    await waitFor(() => {
      // Should still show original amounts when conversion fails
      expect(screen.getByText('£3,000.00')).toBeInTheDocument();
      expect(screen.getByText('€2,000.00')).toBeInTheDocument();
    });
  });

  it('calculates monthly equivalents correctly for different frequencies', async () => {
    const weeklyIncome: IncomeDocument = {
      ...mockIncomes[0],
      amount: { amount: 1000, currency: 'USD' },
      frequency: 'weekly'
    };

    const biWeeklyIncome: IncomeDocument = {
      ...mockIncomes[0],
      amount: { amount: 2000, currency: 'USD' },
      frequency: 'bi-weekly'
    };

    const quarterlyIncome: IncomeDocument = {
      ...mockIncomes[0],
      amount: { amount: 12000, currency: 'USD' },
      frequency: 'quarterly'
    };

    const annualIncome: IncomeDocument = {
      ...mockIncomes[0],
      amount: { amount: 48000, currency: 'USD' },
      frequency: 'annually'
    };

    render(<IncomeTable {...mockProps} incomes={[weeklyIncome, biWeeklyIncome, quarterlyIncome, annualIncome]} />);

    await waitFor(() => {
      // Weekly: 1000 * 4.33 = 4330
      expect(screen.getByText('$4,330.00')).toBeInTheDocument();
      
      // Bi-weekly: 2000 * 2.17 = 4340
      expect(screen.getByText('$4,340.00')).toBeInTheDocument();
      
      // Quarterly: 12000 / 3 = 4000
      expect(screen.getByText('$4,000.00')).toBeInTheDocument();
      
      // Annual: 48000 / 12 = 4000
      expect(screen.getByText('$4,000.00')).toBeInTheDocument();
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
    render(<IncomeTable {...mockProps} />);

    // Click on first dropdown menu
    const dropdownTriggers = screen.getAllByRole('button', { name: '' });
    fireEvent.click(dropdownTriggers[0]);

    // Click edit option
    const editButton = screen.getByText('Edit Details');
    fireEvent.click(editButton);

    expect(mockProps.onEdit).toHaveBeenCalledWith(mockIncomes[0]);
  });

  it('handles delete action correctly', async () => {
    render(<IncomeTable {...mockProps} />);

    // Click on first dropdown menu
    const dropdownTriggers = screen.getAllByRole('button', { name: '' });
    fireEvent.click(dropdownTriggers[0]);

    // Click delete option
    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);

    // Should show confirmation dialog
    expect(screen.getByText('Delete Income Source')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to delete this income source?')).toBeInTheDocument();

    // Confirm deletion
    const confirmButton = screen.getByRole('button', { name: 'Delete' });
    fireEvent.click(confirmButton);

    expect(mockProps.onDelete).toHaveBeenCalledWith('1');
  });

  it('handles toggle status action correctly', async () => {
    render(<IncomeTable {...mockProps} />);

    // Click on first dropdown menu (active income)
    const dropdownTriggers = screen.getAllByRole('button', { name: '' });
    fireEvent.click(dropdownTriggers[0]);

    // Click deactivate option
    const deactivateButton = screen.getByText('Deactivate');
    fireEvent.click(deactivateButton);

    expect(mockProps.onToggleStatus).toHaveBeenCalledWith('1', false);
  });

  it('shows add raise option for salary income', async () => {
    render(<IncomeTable {...mockProps} />);

    // Click on first dropdown menu (salary income)
    const dropdownTriggers = screen.getAllByRole('button', { name: '' });
    fireEvent.click(dropdownTriggers[0]);

    // Should show add raise option
    expect(screen.getByText('Add Raise')).toBeInTheDocument();

    // Click add raise
    const raiseButton = screen.getByText('Add Raise');
    fireEvent.click(raiseButton);

    expect(mockProps.onAddRaise).toHaveBeenCalledWith(mockIncomes[0]);
  });

  it('does not show add raise option for non-salary income', async () => {
    render(<IncomeTable {...mockProps} />);

    // Click on third dropdown menu (bonus income)
    const dropdownTriggers = screen.getAllByRole('button', { name: '' });
    fireEvent.click(dropdownTriggers[2]);

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

    expect(screen.getByText('Salary')).toBeInTheDocument();
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
      // Should show USD amount without conversion
      expect(screen.getByText('$5,000.00')).toBeInTheDocument();
      // Should not show original currency indicator
      expect(screen.queryByText('USD')).not.toBeInTheDocument();
    });

    // Should not call convertAmount for same currency
    expect(mockCurrencyContext.convertAmount).not.toHaveBeenCalled();
  });
});
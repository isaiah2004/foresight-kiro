import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExpenseTable } from '../expense-table';
import { Expense } from '@/types/financial';
import { Timestamp } from 'firebase/firestore';

// Mock fetch
global.fetch = jest.fn();

const mockExpenses: Expense[] = [
  {
    id: '1',
    userId: 'user1',
    category: 'rent',
    name: 'Monthly Rent',
    amount: { amount: 1200, currency: 'USD' },
    frequency: 'monthly',
    isFixed: true,
    startDate: Timestamp.fromDate(new Date('2024-01-01')),
  },
  {
    id: '2',
    userId: 'user1',
    category: 'groceries',
    name: 'Weekly Groceries',
    amount: { amount: 100, currency: 'USD' },
    frequency: 'weekly',
    isFixed: false,
    startDate: Timestamp.fromDate(new Date('2024-01-01')),
  },
];

describe('ExpenseTable', () => {
  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });
  });

  it('renders expense data correctly', () => {
    render(
      <ExpenseTable
        expenses={mockExpenses}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('Monthly Rent')).toBeInTheDocument();
    expect(screen.getByText('Weekly Groceries')).toBeInTheDocument();
    expect(screen.getByText('Rent/Mortgage')).toBeInTheDocument();
    expect(screen.getByText('Groceries')).toBeInTheDocument();
  });

  it('displays empty state when no expenses', () => {
    render(
      <ExpenseTable
        expenses={[]}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('No expenses')).toBeInTheDocument();
    expect(screen.getByText('Get started by adding your first expense.')).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', async () => {
    render(
      <ExpenseTable
        expenses={mockExpenses}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    // Click the first dropdown menu
    const dropdownButtons = screen.getAllByRole('button');
    const firstDropdown = dropdownButtons.find(button => 
      button.querySelector('svg')?.classList.contains('lucide-more-horizontal')
    );
    
    if (firstDropdown) {
      fireEvent.click(firstDropdown);
      
      await waitFor(() => {
        const editButton = screen.getByText('Edit');
        fireEvent.click(editButton);
      });

      expect(mockOnEdit).toHaveBeenCalledWith(mockExpenses[0]);
    }
  });

  it('handles delete confirmation flow', async () => {
    render(
      <ExpenseTable
        expenses={mockExpenses}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    // Click the first dropdown menu
    const dropdownButtons = screen.getAllByRole('button');
    const firstDropdown = dropdownButtons.find(button => 
      button.querySelector('svg')?.classList.contains('lucide-more-horizontal')
    );
    
    if (firstDropdown) {
      fireEvent.click(firstDropdown);
      
      await waitFor(() => {
        const deleteButton = screen.getByText('Delete');
        fireEvent.click(deleteButton);
      });

      // Should show confirmation dialog
      expect(screen.getByText('Delete Expense')).toBeInTheDocument();
      expect(screen.getByText('Are you sure you want to delete this expense? This action cannot be undone.')).toBeInTheDocument();

      // Click confirm delete
      const confirmButton = screen.getByRole('button', { name: 'Delete' });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/expenses/1', {
          method: 'DELETE',
        });
        expect(mockOnDelete).toHaveBeenCalledWith('1');
      });
    }
  });

  it('renders in compact mode correctly', () => {
    render(
      <ExpenseTable
        expenses={mockExpenses}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        compact={true}
      />
    );

    // In compact mode, some column headers should not be visible
    expect(screen.queryByRole('columnheader', { name: 'Frequency' })).not.toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: 'Monthly' })).not.toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: 'Type' })).not.toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: 'Start Date' })).not.toBeInTheDocument();
  });

  it('formats currency correctly', () => {
    render(
      <ExpenseTable
        expenses={mockExpenses}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getAllByText('$1,200.00')).toHaveLength(2); // Amount and monthly columns
    expect(screen.getByText('$100.00')).toBeInTheDocument();
  });

  it('calculates monthly amounts correctly', () => {
    render(
      <ExpenseTable
        expenses={mockExpenses}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    // Monthly rent should show as $1,200.00 in both amount and monthly columns
    expect(screen.getAllByText('$1,200.00')).toHaveLength(2);
    
    // Weekly groceries should show monthly equivalent (~$433.33)
    expect(screen.getByText('$433.33')).toBeInTheDocument();
  });
});
'use client';

import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { MoreHorizontal, Edit, Trash2, Calendar, DollarSign, Globe } from 'lucide-react';
import { format } from 'date-fns';
import { Expense, ExpenseCategory, ExpenseFrequency } from '@/types/financial';
import { cn } from '@/lib/utils';
import { useCurrency } from '@/contexts/currency-context';

interface ExpenseTableProps {
  expenses: Expense[];
  onEdit: (expense: Expense) => void;
  onDelete: (expenseId: string) => void;
  compact?: boolean;
}

interface ExpenseRowData {
  expense: Expense;
  convertedAmount: number;
  convertedMonthlyAmount: number;
  loading: boolean;
}

const categoryLabels: Record<ExpenseCategory, string> = {
  rent: 'Rent/Mortgage',
  groceries: 'Groceries',
  utilities: 'Utilities',
  entertainment: 'Entertainment',
  other: 'Other',
};

const frequencyLabels: Record<ExpenseFrequency, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  annually: 'Annually',
};

const categoryColors: Record<ExpenseCategory, string> = {
  rent: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  groceries: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  utilities: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  entertainment: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  other: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
};

function ExpenseRow({ expense, onEdit, onDelete, compact }: {
  expense: Expense;
  onEdit: (expense: Expense) => void;
  onDelete: (expenseId: string) => void;
  compact?: boolean;
}) {
  const [rowData, setRowData] = useState<ExpenseRowData>({
    expense,
    convertedAmount: expense.amount.amount,
    convertedMonthlyAmount: 0,
    loading: true
  });
  const { formatCurrency, primaryCurrency, convertAmount } = useCurrency();

  useEffect(() => {
    const calculateConvertedAmounts = async () => {
      try {
        const expenseCurrency = expense.amount.currency;
        const originalAmount = expense.amount.amount;
        const monthlyAmount = convertToMonthlyAmount(originalAmount, expense.frequency);

        let convertedAmount = originalAmount;
        let convertedMonthlyAmount = monthlyAmount;

        // Convert to primary currency if different
        if (expenseCurrency !== primaryCurrency) {
          try {
            const convertedAmountResult = await convertAmount(originalAmount, expenseCurrency, primaryCurrency);
            const convertedMonthlyResult = await convertAmount(monthlyAmount, expenseCurrency, primaryCurrency);
            
            convertedAmount = convertedAmountResult.amount;
            convertedMonthlyAmount = convertedMonthlyResult.amount;
          } catch (error) {
            console.warn(`Failed to convert ${expenseCurrency} to ${primaryCurrency}:`, error);
            // Keep original amounts as fallback
          }
        } else {
          convertedMonthlyAmount = monthlyAmount;
        }

        setRowData({
          expense,
          convertedAmount,
          convertedMonthlyAmount,
          loading: false
        });
      } catch (error) {
        console.error('Error calculating converted amounts:', error);
        setRowData(prev => ({ ...prev, loading: false }));
      }
    };

    calculateConvertedAmounts();
  }, [expense, primaryCurrency, convertAmount]);

  const convertToMonthlyAmount = (amount: number, frequency: ExpenseFrequency): number => {
    switch (frequency) {
      case 'daily':
        return amount * 30.44;
      case 'weekly':
        return amount * 52 / 12;
      case 'monthly':
        return amount;
      case 'quarterly':
        return amount / 3;
      case 'annually':
        return amount / 12;
      default:
        return 0;
    }
  };

  const originalCurrency = expense.amount.currency;
  const showCurrencyIndicator = originalCurrency !== primaryCurrency;

  if (rowData.loading) {
    return (
      <TableRow>
        <TableCell colSpan={compact ? 4 : 7} className="text-center py-4">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span className="ml-2 text-sm text-muted-foreground">Converting currency...</span>
          </div>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow>
      <TableCell className="font-medium">
        <div>
          <div className="font-medium">{expense.name}</div>
          {compact && (
            <div className="text-xs text-muted-foreground">
              {formatCurrency(rowData.convertedMonthlyAmount)}/month
              {showCurrencyIndicator && (
                <span className="ml-1 text-xs text-muted-foreground">
                  ({formatCurrency(convertToMonthlyAmount(expense.amount.amount, expense.frequency), originalCurrency)})
                </span>
              )}
            </div>
          )}
        </div>
      </TableCell>
      <TableCell>
        <Badge className={cn('text-xs', categoryColors[expense.category])}>
          {categoryLabels[expense.category]}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="font-medium">
          {formatCurrency(rowData.convertedAmount)}
        </div>
        {showCurrencyIndicator && (
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Globe className="h-3 w-3" />
            {formatCurrency(expense.amount.amount, originalCurrency)}
          </div>
        )}
        {compact && (
          <div className="text-xs text-muted-foreground">
            {frequencyLabels[expense.frequency]}
          </div>
        )}
      </TableCell>
      {!compact && (
        <TableCell>
          <Badge variant="outline">
            {frequencyLabels[expense.frequency]}
          </Badge>
        </TableCell>
      )}
      {!compact && (
        <TableCell>
          <div className="font-medium">
            {formatCurrency(rowData.convertedMonthlyAmount)}
          </div>
          {showCurrencyIndicator && (
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Globe className="h-3 w-3" />
              {formatCurrency(convertToMonthlyAmount(expense.amount.amount, expense.frequency), originalCurrency)}
            </div>
          )}
        </TableCell>
      )}
      {!compact && (
        <TableCell>
          <Badge variant={expense.isFixed ? 'default' : 'secondary'}>
            {expense.isFixed ? 'Fixed' : 'Variable'}
          </Badge>
        </TableCell>
      )}
      {!compact && (
        <TableCell>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {format(expense.startDate.toDate(), 'MMM dd, yyyy')}
          </div>
        </TableCell>
      )}
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(expense)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(expense.id)}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

export function ExpenseTable({ expenses, onEdit, onDelete, compact = false }: ExpenseTableProps) {
  const [deleteExpenseId, setDeleteExpenseId] = useState<string | null>(null);

  const handleDelete = async (expenseId: string) => {
    try {
      const response = await fetch(`/api/expenses/${expenseId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete expense');
      }

      onDelete(expenseId);
    } catch (error) {
      console.error('Error deleting expense:', error);
    } finally {
      setDeleteExpenseId(null);
    }
  };

  const handleDeleteExpense = (expenseId: string) => {
    setDeleteExpenseId(expenseId);
  };

  if (expenses.length === 0) {
    return (
      <div className="text-center py-8">
        <DollarSign className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-2 text-sm font-semibold text-muted-foreground">No expenses</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Get started by adding your first expense.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Amount</TableHead>
              {!compact && <TableHead>Frequency</TableHead>}
              {!compact && <TableHead>Monthly</TableHead>}
              {!compact && <TableHead>Type</TableHead>}
              {!compact && <TableHead>Start Date</TableHead>}
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((expense) => (
              <ExpenseRow
                key={expense.id}
                expense={expense}
                onEdit={onEdit}
                onDelete={handleDeleteExpense}
                compact={compact}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteExpenseId} onOpenChange={() => setDeleteExpenseId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Expense</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this expense? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteExpenseId && handleDelete(deleteExpenseId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
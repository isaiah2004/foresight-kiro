'use client';

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { MoreHorizontal, Edit, Trash2, Calendar, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { Expense, ExpenseCategory, ExpenseFrequency } from '@/types/financial';
import { cn } from '@/lib/utils';

interface ExpenseTableProps {
  expenses: Expense[];
  onEdit: (expense: Expense) => void;
  onDelete: (expenseId: string) => void;
  compact?: boolean;
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

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
              <TableRow key={expense.id}>
                <TableCell className="font-medium">
                  <div>
                    <div className="font-medium">{expense.name}</div>
                    {compact && (
                      <div className="text-xs text-muted-foreground">
                        {formatCurrency(convertToMonthlyAmount(expense.amount.amount, expense.frequency))}/month
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
                    {formatCurrency(expense.amount.amount)}
                  </div>
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
                      {formatCurrency(convertToMonthlyAmount(expense.amount.amount, expense.frequency))}
                    </div>
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
                        onClick={() => setDeleteExpenseId(expense.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
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
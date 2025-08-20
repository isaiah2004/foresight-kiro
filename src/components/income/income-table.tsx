'use client';

import { useState, useEffect } from 'react';
import { MoreHorizontal, Edit, Trash2, DollarSign, TrendingUp, PauseCircle, PlayCircle, Globe } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { IncomeDocument, CurrencyAmount } from '@/types/financial';
import { useCurrency } from '@/contexts/currency-context';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface IncomeTableProps {
  incomes: IncomeDocument[];
  onEdit: (income: IncomeDocument) => void;
  onDelete: (incomeId: string) => void;
  onToggleStatus?: (incomeId: string, isActive: boolean) => void;
  onAddRaise?: (income: IncomeDocument) => void;
  isLoading?: boolean;
}

// Component for individual income row with currency conversion
function IncomeRow({ 
  income, 
  onEdit, 
  onDelete, 
  onToggleStatus, 
  onAddRaise 
}: {
  income: IncomeDocument;
  onEdit: (income: IncomeDocument) => void;
  onDelete: (incomeId: string) => void;
  onToggleStatus?: (incomeId: string, isActive: boolean) => void;
  onAddRaise?: (income: IncomeDocument) => void;
}) {
  const { formatCurrency, convertAmount, primaryCurrency } = useCurrency();
  const [convertedAmount, setConvertedAmount] = useState<CurrencyAmount | null>(null);
  const [convertedMonthly, setConvertedMonthly] = useState<CurrencyAmount | null>(null);
  const [isConverting, setIsConverting] = useState(false);

  const convertToMonthly = (amount: number, frequency: string): number => {
    switch (frequency) {
      case 'weekly':
        return amount * 4.33;
      case 'bi-weekly':
        return amount * 2.17;
      case 'monthly':
        return amount;
      case 'quarterly':
        return amount / 3;
      case 'annually':
        return amount / 12;
      default:
        return amount;
    }
  };

  useEffect(() => {
    const performConversion = async () => {
      if (income.amount.currency === primaryCurrency) {
        // No conversion needed
        setConvertedAmount({
          amount: income.amount.amount,
          currency: primaryCurrency
        });
        setConvertedMonthly({
          amount: convertToMonthly(income.amount.amount, income.frequency),
          currency: primaryCurrency
        });
        return;
      }

      setIsConverting(true);
      try {
        // Convert original amount
        const converted = await convertAmount(income.amount.amount, income.amount.currency, primaryCurrency);
        setConvertedAmount(converted);

        // Convert monthly equivalent
        const monthlyAmount = convertToMonthly(income.amount.amount, income.frequency);
        const convertedMonthlyAmount = await convertAmount(monthlyAmount, income.amount.currency, primaryCurrency);
        setConvertedMonthly(convertedMonthlyAmount);
      } catch (error) {
        console.error('Currency conversion failed:', error);
        // Fallback to original amounts
        setConvertedAmount({
          amount: income.amount.amount,
          currency: income.amount.currency
        });
        setConvertedMonthly({
          amount: convertToMonthly(income.amount.amount, income.frequency),
          currency: income.amount.currency
        });
      } finally {
        setIsConverting(false);
      }
    };

    performConversion();
  }, [income, convertAmount, primaryCurrency]);

  const originalCurrency = income.amount.currency;
  const showCurrencyIndicator = originalCurrency !== primaryCurrency;

  return (
    <TableRow key={income.id}>
      <TableCell className="font-medium">
        <div className="flex items-center gap-2">
          {income.source}
          {showCurrencyIndicator && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Globe className="h-3 w-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Foreign currency income ({originalCurrency})</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="secondary">
          {incomeTypeLabels[income.type]}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="space-y-1">
          {isConverting ? (
            <Skeleton className="h-4 w-20" />
          ) : convertedAmount ? (
            <>
              <div className="font-medium">
                {formatCurrency(convertedAmount.amount, convertedAmount.currency)}
              </div>
              {showCurrencyIndicator && (
                <div className="text-xs text-muted-foreground">
                  {formatCurrency(income.amount.amount, originalCurrency)} {originalCurrency}
                </div>
              )}
            </>
          ) : (
            formatCurrency(income.amount.amount, income.amount.currency)
          )}
        </div>
      </TableCell>
      <TableCell>{frequencyLabels[income.frequency]}</TableCell>
      <TableCell>
        <div className="space-y-1">
          {isConverting ? (
            <Skeleton className="h-4 w-24" />
          ) : convertedMonthly ? (
            <>
              <div className="font-medium">
                {formatCurrency(convertedMonthly.amount, convertedMonthly.currency)}
              </div>
              {showCurrencyIndicator && (
                <div className="text-xs text-muted-foreground">
                  {formatCurrency(convertToMonthly(income.amount.amount, income.frequency), originalCurrency)} {originalCurrency}
                </div>
              )}
            </>
          ) : (
            formatCurrency(convertToMonthly(income.amount.amount, income.frequency), income.amount.currency)
          )}
        </div>
      </TableCell>
      <TableCell>
        <Badge variant={income.isActive ? 'default' : 'secondary'}>
          {income.isActive ? 'Active' : 'Inactive'}
        </Badge>
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(income)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Details
            </DropdownMenuItem>
            {onAddRaise && income.type === 'salary' && (
              <DropdownMenuItem onClick={() => onAddRaise(income)}>
                <TrendingUp className="mr-2 h-4 w-4" />
                Add Raise
              </DropdownMenuItem>
            )}
            {onToggleStatus && (
              <DropdownMenuItem 
                onClick={() => onToggleStatus(income.id, !income.isActive)}
              >
                {income.isActive ? (
                  <>
                    <PauseCircle className="mr-2 h-4 w-4" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <PlayCircle className="mr-2 h-4 w-4" />
                    Reactivate
                  </>
                )}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={() => onDelete(income.id)}
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

const incomeTypeLabels = {
  salary: 'Salary',
  bonus: 'Bonus',
  other: 'Other',
};

const frequencyLabels = {
  weekly: 'Weekly',
  'bi-weekly': 'Bi-weekly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  annually: 'Annually',
};

export function IncomeTable({ incomes, onEdit, onDelete, onToggleStatus, onAddRaise, isLoading }: IncomeTableProps) {
  const [deleteIncomeId, setDeleteIncomeId] = useState<string | null>(null);

  const handleDelete = () => {
    if (deleteIncomeId) {
      onDelete(deleteIncomeId);
      setDeleteIncomeId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Source</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Frequency</TableHead>
              <TableHead>Monthly Equivalent</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-8 w-8 rounded" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (incomes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No income sources yet</h3>
        <p className="text-muted-foreground mb-4">
          Add your first income source to start tracking your earnings.
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
              <TableHead>Source</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Frequency</TableHead>
              <TableHead>Monthly Equivalent</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {incomes.map((income) => (
              <IncomeRow
                key={income.id}
                income={income}
                onEdit={onEdit}
                onDelete={setDeleteIncomeId}
                onToggleStatus={onToggleStatus}
                onAddRaise={onAddRaise}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteIncomeId} onOpenChange={() => setDeleteIncomeId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Income Source</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this income source? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
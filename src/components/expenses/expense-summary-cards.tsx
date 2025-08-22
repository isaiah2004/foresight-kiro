'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, DollarSign, PieChart, AlertTriangle, Globe } from 'lucide-react';
import { ExpenseCategory, CurrencyAmount } from '@/types/financial';
import { useCurrency } from '@/contexts/currency-context';

interface ExpenseAnalysisData {
  totalMonthly: CurrencyAmount;
  fixedExpenses: CurrencyAmount;
  variableExpenses: CurrencyAmount;
  categoryBreakdown: Record<ExpenseCategory, CurrencyAmount>;
  suggestions: string[];
  currencyExposure?: {
    totalCurrencies: number;
    foreignCurrencyPercentage: number;
  };
}

interface ExpenseSummaryCardsProps {
  analysis: ExpenseAnalysisData;
}

export function ExpenseSummaryCards({ analysis }: ExpenseSummaryCardsProps) {
  const { formatCurrency } = useCurrency();

  const fixedPercentage = analysis.totalMonthly.amount > 0 
    ? (analysis.fixedExpenses.amount / analysis.totalMonthly.amount) * 100 
    : 0;

  const variablePercentage = analysis.totalMonthly.amount > 0 
    ? (analysis.variableExpenses.amount / analysis.totalMonthly.amount) * 100 
    : 0;

  // Find highest spending category
  const highestCategory = Object.entries(analysis.categoryBreakdown)
    .reduce((a, b) => a[1].amount > b[1].amount ? a : b);

  const categoryLabels: Record<ExpenseCategory, string> = {
    rent: 'Rent/Mortgage',
    groceries: 'Groceries',
    utilities: 'Utilities',
    entertainment: 'Entertainment',
    other: 'Other',
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Monthly</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(analysis.totalMonthly.amount)}</div>
          <p className="text-xs text-muted-foreground">
            {formatCurrency(analysis.totalMonthly.amount * 12)} annually
          </p>
          {analysis.currencyExposure && analysis.currencyExposure.totalCurrencies > 1 && (
            <div className="flex items-center mt-2 text-blue-600">
              <Globe className="h-3 w-3 mr-1" />
              <span className="text-xs">{analysis.currencyExposure.totalCurrencies} currencies</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Fixed Expenses</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(analysis.fixedExpenses.amount)}</div>
          <div className="flex items-center space-x-2 mt-2">
            <Progress value={fixedPercentage} className="flex-1" />
            <span className="text-xs text-muted-foreground">
              {fixedPercentage.toFixed(0)}%
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Variable Expenses</CardTitle>
          <TrendingDown className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(analysis.variableExpenses.amount)}</div>
          <div className="flex items-center space-x-2 mt-2">
            <Progress value={variablePercentage} className="flex-1" />
            <span className="text-xs text-muted-foreground">
              {variablePercentage.toFixed(0)}%
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Top Category</CardTitle>
          <PieChart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(highestCategory[1].amount)}</div>
          <p className="text-xs text-muted-foreground">
            {categoryLabels[highestCategory[0] as ExpenseCategory]}
          </p>
          {analysis.suggestions.length > 0 && (
            <div className="flex items-center mt-2 text-amber-600">
              <AlertTriangle className="h-3 w-3 mr-1" />
              <span className="text-xs">Has suggestions</span>
            </div>
          )}
          {analysis.currencyExposure && analysis.currencyExposure.foreignCurrencyPercentage > 0 && (
            <div className="flex items-center mt-1 text-blue-600">
              <Globe className="h-3 w-3 mr-1" />
              <span className="text-xs">{analysis.currencyExposure.foreignCurrencyPercentage.toFixed(1)}% foreign</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
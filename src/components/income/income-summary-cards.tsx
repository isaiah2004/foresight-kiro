'use client';

import { DollarSign, TrendingUp, Calendar, PieChart, Globe } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCurrency } from '@/contexts/currency-context';

interface IncomeSummaryData {
  monthlyIncome: number;
  annualIncome: number;
  breakdown: { type: string; amount: number; percentage: number; currency?: string }[];
  currencyBreakdown?: { currency: string; amount: number; percentage: number }[];
  foreignIncomePercentage?: number;
}

interface IncomeSummaryCardsProps {
  data: IncomeSummaryData;
  isLoading?: boolean;
}

const incomeTypeLabels = {
  salary: 'Salary',
  bonus: 'Bonus',
  other: 'Other',
};

export function IncomeSummaryCards({ data, isLoading }: IncomeSummaryCardsProps) {
  const { formatCurrency } = useCurrency();
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                <div className="h-4 bg-muted animate-pulse rounded" />
              </CardTitle>
              <div className="h-4 w-4 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted animate-pulse rounded mb-2" />
              <div className="h-3 bg-muted animate-pulse rounded w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const primaryIncomeType = data.breakdown.length > 0 
    ? data.breakdown.reduce((prev, current) => 
        prev.amount > current.amount ? prev : current
      )
    : null;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Monthly Income</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(data.monthlyIncome)}</div>
          <p className="text-xs text-muted-foreground">
            Total monthly earnings
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Annual Projection</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(data.annualIncome)}</div>
          <p className="text-xs text-muted-foreground">
            Based on current income sources
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Primary Source</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {primaryIncomeType ? incomeTypeLabels[primaryIncomeType.type as keyof typeof incomeTypeLabels] : 'N/A'}
          </div>
          <p className="text-xs text-muted-foreground">
            {primaryIncomeType 
              ? `${formatCurrency(primaryIncomeType.amount)}/month (${primaryIncomeType.percentage.toFixed(1)}%)`
              : 'No income sources'
            }
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Currency Exposure</CardTitle>
          <Globe className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.currencyBreakdown && data.currencyBreakdown.length > 1 ? (
              <>
                <div className="text-2xl font-bold">
                  {data.currencyBreakdown.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Currencies
                </p>
                <div className="flex flex-wrap gap-1">
                  {data.currencyBreakdown.slice(0, 3).map((curr) => (
                    <Badge key={curr.currency} variant="secondary" className="text-xs">
                      {curr.currency} {curr.percentage.toFixed(0)}%
                    </Badge>
                  ))}
                  {data.currencyBreakdown.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{data.currencyBreakdown.length - 3}
                    </Badge>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">{formatCurrency(0).replace(/[\d.,]/g, '').trim()}</div>
                <p className="text-xs text-muted-foreground">
                  Single currency
                </p>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
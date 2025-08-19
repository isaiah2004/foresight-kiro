"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CurrencyDisplay } from "@/components/currency/currency-display";
import { useCurrency } from "@/contexts/currency-context";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard, 
  Target,
  PieChart,
  Wallet,
  AlertTriangle
} from "lucide-react";
import { 
  DashboardMetrics, 
  formatPercentage, 
  getFinancialHealthStatus 
} from "@/lib/dashboard-calculations";

interface DashboardCardsProps {
  metrics: DashboardMetrics;
  isLoading?: boolean;
}

export function DashboardCards({ metrics, isLoading }: DashboardCardsProps) {
  const { primaryCurrency, formatCurrency } = useCurrency();
  
  // Show skeleton if loading
  if (isLoading) {
    return <DashboardCardsSkeleton />;
  }
  const healthStatus = getFinancialHealthStatus(metrics.financialHealthScore);
  const isPositiveNetWorth = metrics.netWorth >= 0;
  const isPositiveCashFlow = metrics.monthlyIncome > metrics.monthlyExpenses;

  

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Net Worth Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Net Worth</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            <CurrencyDisplay 
              amount={metrics.netWorth} 
              currency={primaryCurrency} 
              variant="large"
              showOriginal={false}
            />
          </div>
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            {isPositiveNetWorth ? (
              <TrendingUp className="h-3 w-3 text-green-600 dark:text-green-400" data-testid="trending-up" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-600 dark:text-red-400" data-testid="trending-down" />
            )}
            <span>
              {isPositiveNetWorth ? "Positive" : "Negative"} net worth
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Cash Flow Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Monthly Cash Flow</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            <CurrencyDisplay 
              amount={metrics.monthlyIncome - metrics.monthlyExpenses} 
              currency={primaryCurrency} 
              variant="large"
              showOriginal={false}
            />
          </div>
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            {isPositiveCashFlow ? (
              <TrendingUp className="h-3 w-3 text-green-600 dark:text-green-400" data-testid="trending-up" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-600 dark:text-red-400" data-testid="trending-down" />
            )}
            <span>
              Income: <CurrencyDisplay amount={metrics.monthlyIncome} currency={primaryCurrency} variant="small" showOriginal={false} /> | 
              Expenses: <CurrencyDisplay amount={metrics.monthlyExpenses} currency={primaryCurrency} variant="small" showOriginal={false} />
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Portfolio Value Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
          <PieChart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            <CurrencyDisplay 
              amount={metrics.portfolioValue} 
              currency={primaryCurrency} 
              variant="large"
              showOriginal={false}
            />
          </div>
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <span>
              Savings Rate: {formatPercentage(metrics.savingsRate)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Total Debt Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Debt</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            <CurrencyDisplay 
              amount={metrics.totalDebt} 
              currency={primaryCurrency} 
              variant="large"
              showOriginal={false}
            />
          </div>
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            {metrics.debtToIncomeRatio > 36 && (
              <AlertTriangle className="h-3 w-3 text-yellow-600 dark:text-yellow-400" />
            )}
            <span>
              Debt-to-Income: {formatPercentage(metrics.debtToIncomeRatio)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Financial Health Score Card - Full Width */}
      <Card className="md:col-span-2 lg:col-span-4">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>Financial Health Score</span>
          </CardTitle>
          <CardDescription>
            Overall assessment of your financial well-being
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="text-3xl font-bold">
              {metrics.financialHealthScore}/100
            </div>
            <Badge 
              variant={healthStatus.status === 'excellent' || healthStatus.status === 'good' ? 'default' : 'secondary'}
              className={`${healthStatus.color} dark:text-current`}
            >
              {healthStatus.status.toUpperCase()}
            </Badge>
          </div>
          <Progress 
            value={metrics.financialHealthScore} 
            className="mb-2"
          />
          <p className="text-sm text-muted-foreground">
            {healthStatus.description}
          </p>
        </CardContent>
      </Card>

      {/* Goals Progress Card - Full Width */}
      {metrics.goalProgress.length > 0 && (
        <Card className="md:col-span-2 lg:col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>Goal Progress</span>
            </CardTitle>
            <CardDescription>
              Track your progress toward financial goals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.goalProgress.slice(0, 3).map((goal) => (
                <div key={goal.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{goal.name}</span>
                    <span className="text-sm text-muted-foreground">
                      <CurrencyDisplay amount={goal.currentAmount} currency={primaryCurrency} variant="small" showOriginal={false} /> / <CurrencyDisplay amount={goal.targetAmount} currency={primaryCurrency} variant="small" showOriginal={false} />
                    </span>
                  </div>
                  <Progress value={goal.progress} className="h-2" />
                  <div className="text-xs text-muted-foreground">
                    {formatPercentage(goal.progress)} complete
                  </div>
                </div>
              ))}
              {metrics.goalProgress.length > 3 && (
                <p className="text-sm text-muted-foreground">
                  +{metrics.goalProgress.length - 3} more goals
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

import { Skeleton } from "@/components/ui/skeleton";

function DashboardCardsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-24 mb-2" />
            <Skeleton className="h-3 w-32" />
          </CardContent>
        </Card>
      ))}
      
      {/* Financial Health Score Skeleton */}
      <Card className="md:col-span-2 lg:col-span-4">
        <CardHeader>
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-6 w-16" />
          </div>
          <Skeleton className="h-2 w-full mb-2" />
          <Skeleton className="h-4 w-48" />
        </CardContent>
      </Card>

      {/* Goal Progress Skeleton */}
      <Card className="md:col-span-2 lg:col-span-4">
        <CardHeader>
          <Skeleton className="h-6 w-40 mb-2" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-2 w-full" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
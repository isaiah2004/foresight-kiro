"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  AlertTriangle,
  Calendar,
  ShoppingCart,
  Activity,
} from "lucide-react";
import {
  DashboardMetrics,
  formatPercentage,
  getFinancialHealthStatus,
} from "@/lib/dashboard-calculations";

interface DashboardCardsProps {
  metrics: DashboardMetrics;
  isLoading?: boolean;
}

interface EnhancedDashboardMetrics extends DashboardMetrics {
  thisMonthSpending: number;
  remainingBudget: number;
  monthlyBudget: number;
  financialHealthAssessment: {
    score: number;
    factors: { name: string; score: number; impact: 'positive' | 'negative' | 'neutral' }[];
    recommendations: string[];
  };
}

export function DashboardCards({ metrics, isLoading }: DashboardCardsProps) {
  const { primaryCurrency, formatCurrency } = useCurrency();

  // Show skeleton if loading
  if (isLoading) {
    return <DashboardCardsSkeleton />;
  }
  
  // Create enhanced metrics with additional calculated values
  const enhancedMetrics: EnhancedDashboardMetrics = {
    ...metrics,
    thisMonthSpending: metrics.monthlyExpenses, // This would come from current month data
    remainingBudget: Math.max(0, (metrics.monthlyIncome * 0.8) - metrics.monthlyExpenses), // Assuming 80% budget rule
    monthlyBudget: metrics.monthlyIncome * 0.8, // 80% of income as budget
    financialHealthAssessment: {
      score: metrics.financialHealthScore,
      factors: [
        { 
          name: "Savings Rate", 
          score: metrics.savingsRate, 
          impact: metrics.savingsRate > 20 ? 'positive' : metrics.savingsRate > 10 ? 'neutral' : 'negative' 
        },
        { 
          name: "Debt-to-Income", 
          score: 100 - metrics.debtToIncomeRatio, 
          impact: metrics.debtToIncomeRatio < 20 ? 'positive' : metrics.debtToIncomeRatio < 36 ? 'neutral' : 'negative' 
        },
        { 
          name: "Emergency Fund", 
          score: Math.min(100, (metrics.portfolioValue / (metrics.monthlyExpenses * 3)) * 100), 
          impact: metrics.portfolioValue > (metrics.monthlyExpenses * 6) ? 'positive' : metrics.portfolioValue > (metrics.monthlyExpenses * 3) ? 'neutral' : 'negative' 
        },
      ],
      recommendations: [
        ...(metrics.savingsRate < 10 ? ["Increase your savings rate to at least 10%"] : []),
        ...(metrics.debtToIncomeRatio > 36 ? ["Consider paying down high-interest debt"] : []),
        ...(metrics.portfolioValue < (metrics.monthlyExpenses * 3) ? ["Build an emergency fund covering 3-6 months of expenses"] : []),
      ],
    },
  };

  const healthStatus = getFinancialHealthStatus(enhancedMetrics.financialHealthScore);
  const isPositiveNetWorth = enhancedMetrics.netWorth >= 0;
  const isPositiveCashFlow = enhancedMetrics.monthlyIncome > enhancedMetrics.monthlyExpenses;
  const budgetUtilization = enhancedMetrics.monthlyBudget > 0 ? (enhancedMetrics.thisMonthSpending / enhancedMetrics.monthlyBudget) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Main Financial Cards */}
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
                amount={enhancedMetrics.netWorth}
                currency={primaryCurrency}
                variant="large"
                showOriginal={false}
              />
            </div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              {isPositiveNetWorth ? (
                <TrendingUp
                  className="h-3 w-3 text-green-600 dark:text-green-400"
                  data-testid="trending-up"
                />
              ) : (
                <TrendingDown
                  className="h-3 w-3 text-red-600 dark:text-red-400"
                  data-testid="trending-down"
                />
              )}
              <span>
                {isPositiveNetWorth ? "Positive" : "Negative"} net worth
              </span>
            </div>
          </CardContent>
        </Card>

        {/* This Month's Spending Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month's Spending</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <CurrencyDisplay
                amount={enhancedMetrics.thisMonthSpending}
                currency={primaryCurrency}
                variant="large"
                showOriginal={false}
              />
            </div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <div className="flex items-center space-x-1">
                {budgetUtilization > 100 ? (
                  <AlertTriangle className="h-3 w-3 text-red-600 dark:text-red-400" />
                ) : budgetUtilization > 80 ? (
                  <TrendingUp className="h-3 w-3 text-yellow-600 dark:text-yellow-400" />
                ) : (
                  <TrendingUp className="h-3 w-3 text-green-600 dark:text-green-400" />
                )}
                <span>{budgetUtilization.toFixed(0)}% of budget used</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Remaining Budget Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remaining Budget</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <CurrencyDisplay
                amount={enhancedMetrics.remainingBudget}
                currency={primaryCurrency}
                variant="large"
                showOriginal={false}
              />
            </div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>
                Budget: <CurrencyDisplay
                  amount={enhancedMetrics.monthlyBudget}
                  currency={primaryCurrency}
                  variant="small"
                  showOriginal={false}
                />
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
                amount={enhancedMetrics.monthlyIncome - enhancedMetrics.monthlyExpenses}
                currency={primaryCurrency}
                variant="large"
                showOriginal={false}
              />
            </div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              {isPositiveCashFlow ? (
                <TrendingUp
                  className="h-3 w-3 text-green-600 dark:text-green-400"
                  data-testid="trending-up"
                />
              ) : (
                <TrendingDown
                  className="h-3 w-3 text-red-600 dark:text-red-400"
                  data-testid="trending-down"
                />
              )}
              <span>
                Savings Rate: {formatPercentage(enhancedMetrics.savingsRate)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Financial Health Assessment Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Financial Health Assessment</span>
          </CardTitle>
          <CardDescription>
            Comprehensive analysis of your financial well-being with actionable insights
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div className="text-3xl font-bold">
              {enhancedMetrics.financialHealthAssessment.score}/100
            </div>
            <Badge
              variant={
                healthStatus.status === "excellent" ||
                healthStatus.status === "good"
                  ? "default"
                  : "secondary"
              }
              className={`${healthStatus.color} dark:text-current`}
            >
              {healthStatus.status.toUpperCase()}
            </Badge>
          </div>
          <Progress value={enhancedMetrics.financialHealthAssessment.score} className="mb-4" />
          
          {/* Health Factors */}
          <div className="grid gap-3 md:grid-cols-3">
            {enhancedMetrics.financialHealthAssessment.factors.map((factor, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">{factor.name}</p>
                  <p className="text-xs text-muted-foreground">{factor.score.toFixed(0)}%</p>
                </div>
                <div className={`p-1 rounded-full ${
                  factor.impact === 'positive' ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400' :
                  factor.impact === 'negative' ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400' :
                  'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400'
                }`}>
                  {factor.impact === 'positive' ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : factor.impact === 'negative' ? (
                    <TrendingDown className="h-3 w-3" />
                  ) : (
                    <Activity className="h-3 w-3" />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Recommendations */}
          {enhancedMetrics.financialHealthAssessment.recommendations.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <h4 className="text-sm font-medium mb-2">Recommendations:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                {enhancedMetrics.financialHealthAssessment.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <Target className="h-3 w-3 mt-0.5 text-blue-600" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Goals Progress Card */}
      {enhancedMetrics.goalProgress.length > 0 && (
        <Card>
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
              {enhancedMetrics.goalProgress.slice(0, 3).map((goal) => (
                <div key={goal.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{goal.name}</span>
                    <span className="text-sm text-muted-foreground">
                      <CurrencyDisplay
                        amount={goal.currentAmount}
                        currency={primaryCurrency}
                        variant="small"
                        showOriginal={false}
                      />{" "}
                      /{" "}
                      <CurrencyDisplay
                        amount={goal.targetAmount}
                        currency={primaryCurrency}
                        variant="small"
                        showOriginal={false}
                      />
                    </span>
                  </div>
                  <Progress value={goal.progress} className="h-2" />
                  <div className="text-xs text-muted-foreground">
                    {formatPercentage(goal.progress)} complete
                  </div>
                </div>
              ))}
              {enhancedMetrics.goalProgress.length > 3 && (
                <p className="text-sm text-muted-foreground">
                  +{enhancedMetrics.goalProgress.length - 3} more goals
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

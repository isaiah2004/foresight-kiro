'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, PieChart, BarChart3 } from 'lucide-react';
import { ExpenseCategory, CurrencyAmount } from '@/types/financial';
import { useCurrency } from '@/contexts/currency-context';

interface ExpenseAnalysisData {
  totalMonthly: CurrencyAmount;
  fixedExpenses: CurrencyAmount;
  variableExpenses: CurrencyAmount;
  categoryBreakdown: Record<ExpenseCategory, CurrencyAmount>;
  suggestions: string[];
}

interface ExpenseAnalysisProps {
  analysis: ExpenseAnalysisData;
}

const categoryLabels: Record<ExpenseCategory, string> = {
  rent: 'Rent/Mortgage',
  groceries: 'Groceries',
  utilities: 'Utilities',
  entertainment: 'Entertainment',
  other: 'Other',
};

const categoryIcons: Record<ExpenseCategory, React.ReactNode> = {
  rent: <TrendingUp className="h-4 w-4" />,
  groceries: <PieChart className="h-4 w-4" />,
  utilities: <BarChart3 className="h-4 w-4" />,
  entertainment: <TrendingDown className="h-4 w-4" />,
  other: <PieChart className="h-4 w-4" />,
};

export function ExpenseAnalysis({ analysis }: ExpenseAnalysisProps) {
  const { formatCurrency } = useCurrency();

  const getHealthScore = () => {
    let score = 100;
    
    // Deduct points for high entertainment spending (>15%)
    const entertainmentPercentage = analysis.totalMonthly.amount > 0 
      ? (analysis.categoryBreakdown.entertainment.amount / analysis.totalMonthly.amount) * 100 
      : 0;
    if (entertainmentPercentage > 15) score -= 20;
    
    // Deduct points if variable expenses exceed fixed expenses
    if (analysis.variableExpenses.amount > analysis.fixedExpenses.amount) score -= 15;
    
    // Deduct points for unbalanced spending (one category >50%)
    const categoryAmounts = Object.values(analysis.categoryBreakdown).map(ca => ca.amount);
    const highestCategoryPercentage = Math.max(...categoryAmounts) / analysis.totalMonthly.amount * 100;
    if (highestCategoryPercentage > 50) score -= 25;
    
    return Math.max(0, score);
  };

  const healthScore = getHealthScore();
  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Improvement';
  };

  return (
    <div className="space-y-6">
      {/* Overall Health Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Spending Health Score
          </CardTitle>
          <CardDescription>
            Overall assessment of your spending patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className={`text-3xl font-bold ${getHealthColor(healthScore)}`}>
                {healthScore}/100
              </div>
              <div className="text-sm text-muted-foreground">
                {getHealthLabel(healthScore)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Total Monthly</div>
              <div className="text-xl font-semibold">
                {formatCurrency(analysis.totalMonthly.amount)}
              </div>
            </div>
          </div>
          <Progress value={healthScore} className="h-2" />
        </CardContent>
      </Card>

      {/* Fixed vs Variable Breakdown */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              Fixed Expenses
            </CardTitle>
            <CardDescription>
              Regular, predictable expenses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">
              {formatCurrency(analysis.fixedExpenses.amount)}
            </div>
            <div className="flex items-center justify-between">
              <Progress 
                value={analysis.totalMonthly.amount > 0 ? (analysis.fixedExpenses.amount / analysis.totalMonthly.amount) * 100 : 0} 
                className="flex-1 mr-2" 
              />
              <span className="text-sm text-muted-foreground">
                {analysis.totalMonthly.amount > 0 
                  ? ((analysis.fixedExpenses.amount / analysis.totalMonthly.amount) * 100).toFixed(0)
                  : 0}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Ideally should be 50-70% of total expenses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-green-500" />
              Variable Expenses
            </CardTitle>
            <CardDescription>
              Flexible, discretionary spending
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">
              {formatCurrency(analysis.variableExpenses.amount)}
            </div>
            <div className="flex items-center justify-between">
              <Progress 
                value={analysis.totalMonthly.amount > 0 ? (analysis.variableExpenses.amount / analysis.totalMonthly.amount) * 100 : 0} 
                className="flex-1 mr-2" 
              />
              <span className="text-sm text-muted-foreground">
                {analysis.totalMonthly.amount > 0 
                  ? ((analysis.variableExpenses.amount / analysis.totalMonthly.amount) * 100).toFixed(0)
                  : 0}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              This is where you have the most control
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Category Breakdown
          </CardTitle>
          <CardDescription>
            Monthly spending by category
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(analysis.categoryBreakdown)
              .filter(([_, currencyAmount]) => currencyAmount.amount > 0)
              .sort(([, a], [, b]) => b.amount - a.amount)
              .map(([category, currencyAmount]) => {
                const amount = currencyAmount.amount;
                const percentage = analysis.totalMonthly.amount > 0 ? (amount / analysis.totalMonthly.amount) * 100 : 0;
                const isHigh = percentage > 30;
                
                return (
                  <div key={category} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {categoryIcons[category as ExpenseCategory]}
                        <span className="font-medium">
                          {categoryLabels[category as ExpenseCategory]}
                        </span>
                        {isHigh && (
                          <Badge variant="outline" className="text-amber-600 border-amber-600">
                            High
                          </Badge>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{formatCurrency(amount)}</div>
                        <div className="text-xs text-muted-foreground">
                          {percentage.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>

      {/* Suggestions */}
      {analysis.suggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Optimization Suggestions
            </CardTitle>
            <CardDescription>
              Recommendations to improve your spending habits
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysis.suggestions.map((suggestion, index) => (
                <Alert key={index}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{suggestion}</AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Quick Tips
          </CardTitle>
          <CardDescription>
            General advice for better expense management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">Track every expense</p>
                <p className="text-xs text-muted-foreground">
                  Small purchases add up quickly over time
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">Review monthly</p>
                <p className="text-xs text-muted-foreground">
                  Regular reviews help identify spending patterns
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">Set category budgets</p>
                <p className="text-xs text-muted-foreground">
                  Limits help control discretionary spending
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  LineChart,
  Line
} from 'recharts';
import { 
  Globe, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Info, 
  RefreshCw,
  DollarSign,
  Calendar
} from 'lucide-react';
import { useCurrency } from '@/contexts/currency-context';
import { CurrencyExposure } from '@/types/financial';

interface ExpenseCurrencyExposure {
  primaryCurrency: string;
  exposures: CurrencyExposure[];
  totalCurrencies: number;
  foreignCurrencyPercentage: number;
}

interface ExpenseProjection {
  month: number;
  year: number;
  amount: number;
  currency: string;
  originalAmounts: Record<string, number>;
  exchangeRateImpact: number;
  exchangeRateImpactPercentage: number;
}

interface BudgetAlert {
  category: string;
  currentAmount: { amount: number; currency: string };
  budgetLimit: { amount: number; currency: string };
  percentageUsed: number;
  alertLevel: 'info' | 'warning' | 'danger';
  message: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export function ExpenseCurrencyAnalysis() {
  const [loading, setLoading] = useState(true);
  const [currencyExposure, setCurrencyExposure] = useState<ExpenseCurrencyExposure | null>(null);
  const [projections, setProjections] = useState<{
    primaryCurrency: string;
    projections: ExpenseProjection[];
    summary: any;
  } | null>(null);
  const [budgetAlerts, setBudgetAlerts] = useState<{
    alerts: BudgetAlert[];
    summary: any;
    recommendations: string[];
  } | null>(null);
  const { formatCurrency, primaryCurrency } = useCurrency();

  const fetchCurrencyExposure = useCallback(async () => {
    try {
      const response = await fetch('/api/expenses/currency-exposure');
      if (response.ok) {
        const data = await response.json();
        setCurrencyExposure(data);
      }
    } catch (error) {
      if (process.env.NODE_ENV !== 'test') {
        console.error('Error fetching currency exposure:', error);
      }
    }
  }, []);

  const fetchProjections = useCallback(async () => {
    try {
      const response = await fetch('/api/expenses/multi-currency-projections');
      if (response.ok) {
        const data = await response.json();
        setProjections(data);
      }
    } catch (error) {
      if (process.env.NODE_ENV !== 'test') {
        console.error('Error fetching projections:', error);
      }
    }
  }, []);

  const fetchBudgetAlerts = useCallback(async () => {
    // Sample budget limits - in a real app, this would come from user settings
    const sampleBudgetLimits = {
      rent: { amount: 2000, currency: primaryCurrency },
      groceries: { amount: 500, currency: primaryCurrency },
      utilities: { amount: 200, currency: primaryCurrency },
      entertainment: { amount: 300, currency: primaryCurrency },
      other: { amount: 400, currency: primaryCurrency }
    };

    try {
      const response = await fetch('/api/expenses/budget-alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ budgetLimits: sampleBudgetLimits }),
      });
      if (response.ok) {
        const data = await response.json();
        setBudgetAlerts(data);
      }
    } catch (error) {
      if (process.env.NODE_ENV !== 'test') {
        console.error('Error fetching budget alerts:', error);
      }
    }
  }, [primaryCurrency]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([
        fetchCurrencyExposure(),
        fetchProjections(),
        fetchBudgetAlerts()
      ]);
      setLoading(false);
    };

    fetchData();
  }, [primaryCurrency, fetchCurrencyExposure, fetchProjections, fetchBudgetAlerts]);

  const handleRefresh = async () => {
    setLoading(true);
    await Promise.all([
      fetchCurrencyExposure(),
      fetchProjections(),
      fetchBudgetAlerts()
    ]);
    setLoading(false);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Currency Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8" data-testid="loading">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!currencyExposure || currencyExposure.exposures.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Currency Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">All Expenses in {primaryCurrency}</h3>
            <p className="text-muted-foreground">
              You don&apos;t have any foreign currency expenses. Currency analysis will appear here when you add expenses in different currencies.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const pieChartData = currencyExposure.exposures.map((exposure, index) => ({
    name: exposure.currency,
    value: exposure.percentage,
    amount: exposure.totalValue.amount,
    color: COLORS[index % COLORS.length]
  }));

  const projectionChartData = projections?.projections.map(p => ({
    month: `${p.month}/${p.year}`,
    amount: p.amount,
    exchangeRateImpact: p.exchangeRateImpact,
    impactPercentage: p.exchangeRateImpactPercentage
  })) || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Expense Currency Analysis
            </CardTitle>
            <CardDescription>
              Analyze your expense distribution across currencies and exchange rate impact
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="exposure" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="exposure">Currency Exposure</TabsTrigger>
            <TabsTrigger value="projections">Projections</TabsTrigger>
            <TabsTrigger value="budget">Budget Alerts</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          </TabsList>

          <TabsContent value="exposure" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Currency Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [`${value.toFixed(1)}%`, 'Percentage']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Exposure Details</h3>
                {currencyExposure.exposures.map((exposure, index) => (
                  <div key={exposure.currency} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <div>
                        <p className="font-medium">{exposure.currency}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(exposure.totalValue.amount, exposure.currency)} monthly
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{exposure.percentage.toFixed(1)}%</p>
                      <Badge variant={
                        exposure.riskLevel === 'high' ? 'destructive' :
                        exposure.riskLevel === 'medium' ? 'secondary' : 'default'
                      }>
                        {exposure.riskLevel} risk
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Currency Exposure Summary</AlertTitle>
              <AlertDescription>
                You have expenses in {currencyExposure.totalCurrencies} different currencies. 
                Foreign currency expenses represent {currencyExposure.foreignCurrencyPercentage.toFixed(1)}% of your total expenses.
              </AlertDescription>
            </Alert>
          </TabsContent>

          <TabsContent value="projections" className="space-y-4">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">12-Month Expense Projections</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={projectionChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        formatCurrency(value, primaryCurrency),
                        name === 'amount' ? 'Total Expenses' : 'Exchange Rate Impact'
                      ]}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="amount" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      name="Total Expenses"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="exchangeRateImpact" 
                      stroke="#82ca9d" 
                      strokeWidth={2}
                      name="Exchange Rate Impact"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {projections && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm font-medium">Average Monthly</p>
                      </div>
                      <p className="text-2xl font-bold">
                        {formatCurrency(projections.summary.averageMonthlyExpense, primaryCurrency)}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm font-medium">12-Month Total</p>
                      </div>
                      <p className="text-2xl font-bold">
                        {formatCurrency(projections.summary.totalProjectedExpense, primaryCurrency)}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm font-medium">Currencies</p>
                      </div>
                      <p className="text-2xl font-bold">{projections.summary.currenciesInvolved.length}</p>
                      <p className="text-xs text-muted-foreground">
                        {projections.summary.currenciesInvolved.join(', ')}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="budget" className="space-y-4">
            {budgetAlerts && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                        <p className="text-sm font-medium">Over Budget</p>
                      </div>
                      <p className="text-2xl font-bold text-destructive">{budgetAlerts.summary.danger}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-yellow-500" />
                        <p className="text-sm font-medium">Warning</p>
                      </div>
                      <p className="text-2xl font-bold text-yellow-500">{budgetAlerts.summary.warning}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2">
                        <Info className="h-4 w-4 text-green-500" />
                        <p className="text-sm font-medium">On Track</p>
                      </div>
                      <p className="text-2xl font-bold text-green-500">{budgetAlerts.summary.info}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm font-medium">Total Categories</p>
                      </div>
                      <p className="text-2xl font-bold">{budgetAlerts.summary.total}</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">Budget Status by Category</h3>
                  {budgetAlerts.alerts.map((alert) => (
                    <div key={alert.category} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium capitalize">{alert.category}</h4>
                        <Badge variant={
                          alert.alertLevel === 'danger' ? 'destructive' :
                          alert.alertLevel === 'warning' ? 'secondary' : 'default'
                        }>
                          {alert.percentageUsed.toFixed(1)}% used
                        </Badge>
                      </div>
                      <Progress value={Math.min(alert.percentageUsed, 100)} className="mb-2" />
                      <div className="flex justify-between text-sm text-muted-foreground mb-2">
                        <span>
                          Spent: {formatCurrency(alert.currentAmount.amount, alert.currentAmount.currency)}
                        </span>
                        <span>
                          Budget: {formatCurrency(alert.budgetLimit.amount, alert.budgetLimit.currency)}
                        </span>
                      </div>
                      <p className="text-sm">{alert.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-4">
            {budgetAlerts && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Personalized Recommendations</h3>
                {budgetAlerts.recommendations.map((recommendation, index) => (
                  <Alert key={index}>
                    <Info className="h-4 w-4" />
                    <AlertDescription>{recommendation}</AlertDescription>
                  </Alert>
                ))}

                {currencyExposure.foreignCurrencyPercentage > 20 && (
                  <Alert>
                    <Globe className="h-4 w-4" />
                    <AlertTitle>Currency Risk Management</AlertTitle>
                    <AlertDescription>
                      With {currencyExposure.foreignCurrencyPercentage.toFixed(1)}% of expenses in foreign currencies, 
                      consider monitoring exchange rate trends and potentially hedging significant exposures.
                    </AlertDescription>
                  </Alert>
                )}

                <Alert>
                  <TrendingUp className="h-4 w-4" />
                  <AlertTitle>Multi-Currency Budgeting Tips</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc list-inside space-y-1 mt-2">
                      <li>Set budget limits in the currency you actually spend to avoid exchange rate confusion</li>
                      <li>Review and adjust budgets quarterly to account for exchange rate changes</li>
                      <li>Consider using local bank accounts for significant foreign currency expenses</li>
                      <li>Track exchange rate trends for your major expense currencies</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
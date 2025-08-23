'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  DollarSign, 
  BarChart3,
  Target,
  Shield,
  Lightbulb
} from 'lucide-react';
import { CurrencyExposure, CurrencyAmount } from '@/types/financial';
import { useCurrency } from '@/contexts/currency-context';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface LoanCurrencyAnalysisProps {
  className?: string;
}

interface MultiCurrencyProjection {
  month: number;
  year: number;
  totalDebt: CurrencyAmount;
  totalPayments: CurrencyAmount;
  currencyBreakdown: { [currency: string]: { debt: number; payments: number } };
  exchangeRateImpact: number;
}

interface OptimizationRecommendations {
  currencyRiskAnalysis: {
    highRiskLoans: any[];
    recommendations: string[];
  };
  refinancingOpportunities: {
    loan: any;
    potentialSavings: CurrencyAmount;
    recommendation: string;
  }[];
  payoffOptimization: {
    strategy: 'avalanche' | 'snowball' | 'currency_focused';
    description: string;
    estimatedSavings: CurrencyAmount;
    timeToPayoff: number;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export function LoanCurrencyAnalysis({ className }: LoanCurrencyAnalysisProps) {
  const { user } = useUser();
  const { formatCurrency, primaryCurrency } = useCurrency();
  const [currencyExposure, setCurrencyExposure] = useState<CurrencyExposure[]>([]);
  const [projections, setProjections] = useState<MultiCurrencyProjection[]>([]);
  const [recommendations, setRecommendations] = useState<OptimizationRecommendations | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchCurrencyAnalysis();
    }
  }, [user]);

  const fetchCurrencyAnalysis = async () => {
    setIsLoading(true);
    try {
      const [exposureRes, projectionsRes, recommendationsRes] = await Promise.all([
        fetch('/api/loans/currency-exposure'),
        fetch('/api/loans/multi-currency-projections'),
        fetch('/api/loans/optimization-recommendations')
      ]);

      if (exposureRes.ok) {
        const exposureData = await exposureRes.json();
        setCurrencyExposure(Array.isArray(exposureData) ? exposureData : []);
      }

      if (projectionsRes.ok) {
        const projectionsData = await projectionsRes.json();
        setProjections(Array.isArray(projectionsData) ? projectionsData : []);
      }

      if (recommendationsRes.ok) {
        const recommendationsData = await recommendationsRes.json();
        setRecommendations(recommendationsData);
      }
    } catch (error) {
      if (process.env.NODE_ENV !== 'test') {
        console.error('Error fetching currency analysis:', error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return <Shield className="h-4 w-4" />;
      case 'medium': return <TrendingUp className="h-4 w-4" />;
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      default: return <DollarSign className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Currency Analysis</CardTitle>
          <CardDescription>Loading currency exposure and risk analysis...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (currencyExposure.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Currency Analysis</CardTitle>
          <CardDescription>Multi-currency loan analysis and risk assessment</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No loans found for currency analysis</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const pieChartData = currencyExposure.map((exposure, index) => ({
    name: exposure.currency,
    value: exposure.percentage,
    amount: exposure.totalValue.amount,
    color: COLORS[index % COLORS.length]
  }));

  const projectionChartData = projections.map(proj => ({
    month: `${proj.month}/${proj.year}`,
    debt: proj.totalDebt.amount,
    payments: proj.totalPayments.amount,
    exchangeImpact: proj.exchangeRateImpact
  }));

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Currency Analysis
        </CardTitle>
        <CardDescription>
          Multi-currency loan analysis, risk assessment, and optimization recommendations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="exposure" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="exposure">Exposure</TabsTrigger>
            <TabsTrigger value="projections">Projections</TabsTrigger>
            <TabsTrigger value="optimization">Optimization</TabsTrigger>
            <TabsTrigger value="recommendations">Advice</TabsTrigger>
          </TabsList>

          <TabsContent value="exposure" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="text-sm font-medium mb-3">Currency Distribution</h4>
                <ResponsiveContainer width="100%" height={200}>
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
                    <Tooltip formatter={(value: number) => [`${value.toFixed(1)}%`, 'Exposure']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-medium">Risk Breakdown</h4>
                {currencyExposure.map((exposure) => (
                  <div key={exposure.currency} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {getRiskIcon(exposure.riskLevel)}
                        <span className="font-medium">{exposure.currency}</span>
                      </div>
                      <Badge className={getRiskColor(exposure.riskLevel)}>
                        {exposure.riskLevel.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(exposure.totalValue.amount)}</div>
                      <div className="text-sm text-muted-foreground">{exposure.percentage.toFixed(1)}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="projections" className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-3">12-Month Debt Projection</h4>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={projectionChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      formatCurrency(value), 
                      name === 'debt' ? 'Total Debt' : name === 'payments' ? 'Monthly Payments' : 'Exchange Impact %'
                    ]}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="debt" stroke="#8884d8" name="debt" />
                  <Line type="monotone" dataKey="payments" stroke="#82ca9d" name="payments" />
                  <Line type="monotone" dataKey="exchangeImpact" stroke="#ffc658" name="exchangeImpact" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {projections.length > 0 && (
              <Alert>
                <TrendingUp className="h-4 w-4" />
                <AlertDescription>
                  <strong>Exchange Rate Impact:</strong> Your foreign currency loans may fluctuate by up to{' '}
                  {Math.max(...projections.map(p => Math.abs(p.exchangeRateImpact))).toFixed(1)}% due to exchange rate changes.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="optimization" className="space-y-4">
            {recommendations && (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Optimal Strategy
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <Badge variant="outline" className="capitalize">
                          {recommendations.payoffOptimization.strategy.replace('_', ' ')}
                        </Badge>
                        <p className="text-sm text-muted-foreground">
                          {recommendations.payoffOptimization.description}
                        </p>
                        <div className="flex justify-between items-center pt-2">
                          <span className="text-sm">Potential Savings:</span>
                          <span className="font-medium text-green-600">
                            {formatCurrency(recommendations.payoffOptimization.estimatedSavings.amount)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Time to Payoff:</span>
                          <span className="font-medium">
                            {recommendations.payoffOptimization.timeToPayoff} months
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Risk Assessment
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">High-Risk Loans:</span>
                          <span className="font-medium text-red-600">
                            {recommendations.currencyRiskAnalysis.highRiskLoans.length}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Refinancing Opportunities:</span>
                          <span className="font-medium text-blue-600">
                            {recommendations.refinancingOpportunities.length}
                          </span>
                        </div>
                        {recommendations.refinancingOpportunities.length > 0 && (
                          <div className="flex justify-between items-center pt-2 border-t">
                            <span className="text-sm">Potential Refinancing Savings:</span>
                            <span className="font-medium text-green-600">
                              {formatCurrency(
                                recommendations.refinancingOpportunities.reduce(
                                  (sum, opp) => sum + opp.potentialSavings.amount, 0
                                )
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {recommendations.refinancingOpportunities.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-3">Refinancing Opportunities</h4>
                    <div className="space-y-2">
                      {recommendations.refinancingOpportunities.map((opportunity, index) => (
                        <Alert key={index} className="border-blue-200 bg-blue-50">
                          <Lightbulb className="h-4 w-4" />
                          <AlertDescription>
                            <div className="flex justify-between items-start">
                              <div>
                                <strong>{opportunity.loan.name}</strong>
                                <p className="text-sm mt-1">{opportunity.recommendation}</p>
                              </div>
                              <Badge variant="outline" className="text-green-600 border-green-200">
                                Save {formatCurrency(opportunity.potentialSavings.amount)}
                              </Badge>
                            </div>
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-4">
            {recommendations && recommendations.currencyRiskAnalysis.recommendations.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Currency Risk Recommendations
                </h4>
                {recommendations.currencyRiskAnalysis.recommendations.map((recommendation, index) => (
                  <Alert key={index}>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{recommendation}</AlertDescription>
                  </Alert>
                ))}
              </div>
            )}

            <div className="space-y-3">
              <h4 className="text-sm font-medium">General Optimization Tips</h4>
              <div className="grid gap-3">
                <Alert className="border-green-200 bg-green-50">
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Currency Hedging:</strong> Consider natural hedging by earning income in the same currency as your loans, or use financial instruments to reduce exchange rate risk.
                  </AlertDescription>
                </Alert>
                
                <Alert className="border-blue-200 bg-blue-50">
                  <TrendingUp className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Payment Timing:</strong> Make extra payments on foreign currency loans when exchange rates are favorable to your primary currency.
                  </AlertDescription>
                </Alert>
                
                <Alert className="border-purple-200 bg-purple-50">
                  <Target className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Diversification:</strong> Avoid concentrating too much debt in volatile currencies. Aim for a balanced currency exposure across your loan portfolio.
                  </AlertDescription>
                </Alert>
              </div>
            </div>

            <Button onClick={fetchCurrencyAnalysis} variant="outline" className="w-full">
              Refresh Analysis
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
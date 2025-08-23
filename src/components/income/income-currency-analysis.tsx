'use client';

import { useState, useEffect } from 'react';
import { Globe, TrendingUp, TrendingDown, AlertTriangle, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrency } from '@/contexts/currency-context';
import { CurrencyExposure, CurrencyAmount } from '@/types/financial';

interface IncomeCurrencyAnalysisProps {
  userId: string;
}

interface CurrencyAnalysisData {
  currencyExposure: CurrencyExposure[];
  exchangeRateImpact: {
    totalForeignIncome: CurrencyAmount;
    currencyRisks: Array<{
      currency: string;
      monthlyAmount: CurrencyAmount;
      volatility30d?: number;
      potentialImpact: {
        best: number;
        worst: number;
      };
    }>;
    recommendations: string[];
  };
  taxImplications: {
    domesticIncome: CurrencyAmount;
    foreignIncome: CurrencyAmount;
    taxConsiderations: Array<{
      currency: string;
      monthlyAmount: CurrencyAmount;
      considerations: string[];
    }>;
    generalRecommendations: string[];
  };
}

export function IncomeCurrencyAnalysis({ userId }: IncomeCurrencyAnalysisProps) {
  const [data, setData] = useState<CurrencyAnalysisData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { formatCurrency, primaryCurrency } = useCurrency();

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [exposureRes, impactRes, taxRes] = await Promise.all([
          fetch(`/api/income/currency-exposure`),
          fetch(`/api/income/exchange-rate-impact`),
          fetch(`/api/income/tax-implications`)
        ]);

        if (!exposureRes.ok || !impactRes.ok || !taxRes.ok) {
          throw new Error('Failed to fetch currency analysis data');
        }

        const [currencyExposure, exchangeRateImpact, taxImplications] = await Promise.all([
          exposureRes.json(),
          impactRes.json(),
          taxRes.json()
        ]);

        setData({
          currencyExposure,
          exchangeRateImpact,
          taxImplications
        });
      } catch (err) {
        if (process.env.NODE_ENV !== 'test') {
          console.error('Error fetching currency analysis:', err);
        }
        setError('Failed to load currency analysis');
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchAnalysis();
    }
  }, [userId]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-2 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !data) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {error || 'Unable to load currency analysis'}
        </AlertDescription>
      </Alert>
    );
  }

  const hasForeignIncome = data.currencyExposure.some(exp => exp.currency !== primaryCurrency);

  if (!hasForeignIncome) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Currency Analysis
          </CardTitle>
          <CardDescription>
            Multi-currency income analysis and risk assessment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">All Income in {primaryCurrency}</h3>
            <p className="text-muted-foreground">
              You don&apos;t have any foreign currency income sources. Currency analysis will appear here when you add income in different currencies.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Currency Analysis
          </CardTitle>
          <CardDescription>
            Multi-currency income analysis and risk assessment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="exposure" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="exposure">Currency Exposure</TabsTrigger>
              <TabsTrigger value="impact">Exchange Rate Impact</TabsTrigger>
              <TabsTrigger value="tax">Tax Implications</TabsTrigger>
            </TabsList>

            <TabsContent value="exposure" className="space-y-4">
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Income by Currency</h4>
                {data.currencyExposure.map((exposure) => (
                  <div key={exposure.currency} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{exposure.currency}</span>
                        <Badge variant={
                          exposure.riskLevel === 'high' ? 'destructive' :
                          exposure.riskLevel === 'medium' ? 'default' : 'secondary'
                        }>
                          {exposure.riskLevel} risk
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {formatCurrency(exposure.totalValue.amount, exposure.totalValue.currency)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {exposure.percentage.toFixed(1)}% of total
                        </div>
                      </div>
                    </div>
                    <Progress value={exposure.percentage} className="h-2" />
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="impact" className="space-y-4">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Total Foreign Income</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {formatCurrency(data.exchangeRateImpact.totalForeignIncome.amount, data.exchangeRateImpact.totalForeignIncome.currency)}
                      </div>
                      <p className="text-xs text-muted-foreground">Monthly equivalent</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Currency Risk Analysis</h4>
                  {data.exchangeRateImpact.currencyRisks.map((risk) => (
                    <Card key={risk.currency}>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{risk.currency}</span>
                          <span className="text-sm text-muted-foreground">
                            {risk.volatility30d?.toFixed(1)}% volatility
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Current</p>
                            <p className="font-medium">
                              {formatCurrency(risk.monthlyAmount.convertedAmount || risk.monthlyAmount.amount, primaryCurrency)}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground flex items-center gap-1">
                              <TrendingUp className="h-3 w-3 text-green-500" />
                              Best Case
                            </p>
                            <p className="font-medium text-green-600">
                              {formatCurrency(risk.potentialImpact.best, primaryCurrency)}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground flex items-center gap-1">
                              <TrendingDown className="h-3 w-3 text-red-500" />
                              Worst Case
                            </p>
                            <p className="font-medium text-red-600">
                              {formatCurrency(risk.potentialImpact.worst, primaryCurrency)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {data.exchangeRateImpact.recommendations.length > 0 && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-1">
                        <p className="font-medium">Recommendations:</p>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          {data.exchangeRateImpact.recommendations.map((rec, index) => (
                            <li key={index}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </TabsContent>

            <TabsContent value="tax" className="space-y-4">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Domestic Income</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {formatCurrency(data.taxImplications.domesticIncome.amount, data.taxImplications.domesticIncome.currency)}
                      </div>
                      <p className="text-xs text-muted-foreground">Monthly in {primaryCurrency}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Foreign Income</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {formatCurrency(data.taxImplications.foreignIncome.amount, data.taxImplications.foreignIncome.currency)}
                      </div>
                      <p className="text-xs text-muted-foreground">Monthly in {primaryCurrency}</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Tax Considerations by Currency</h4>
                  {data.taxImplications.taxConsiderations.map((consideration) => (
                    <Card key={consideration.currency}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">{consideration.currency} Income</CardTitle>
                        <CardDescription>
                          {formatCurrency(consideration.monthlyAmount.convertedAmount || consideration.monthlyAmount.amount, primaryCurrency)} monthly
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                          {consideration.considerations.map((item, index) => (
                            <li key={index}>{item}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {data.taxImplications.generalRecommendations.length > 0 && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-1">
                        <p className="font-medium">General Tax Recommendations:</p>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          {data.taxImplications.generalRecommendations.map((rec, index) => (
                            <li key={index}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
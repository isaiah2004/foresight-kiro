"use client";

import { useState, useEffect } from 'react';
import { InvestmentDocument, CurrencyExposure, CurrencyRiskAnalysis } from '@/types/financial';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Legend 
} from 'recharts';
import { 
  AlertTriangle, 
  Shield, 
  TrendingUp, 
  TrendingDown, 
  Globe, 
  DollarSign,
  Info
} from 'lucide-react';
import { useCurrency } from '@/contexts/currency-context';
import { currencyService } from '@/lib/services/currency-service';

interface CurrencyExposureAnalysisProps {
  investments: InvestmentDocument[];
}

const CURRENCY_COLORS = {
  USD: '#3b82f6', // Blue
  EUR: '#10b981', // Green
  GBP: '#f59e0b', // Yellow
  JPY: '#ef4444', // Red
  CAD: '#8b5cf6', // Purple
  AUD: '#06b6d4', // Cyan
  CHF: '#84cc16', // Lime
  CNY: '#f97316', // Orange
  INR: '#ec4899', // Pink
  KRW: '#6366f1', // Indigo
  SGD: '#14b8a6', // Teal
  HKD: '#a855f7', // Violet
  default: '#6b7280' // Gray
};

export function CurrencyExposureAnalysis({ investments }: CurrencyExposureAnalysisProps) {
  const { formatCurrency, primaryCurrency } = useCurrency();
  const [exposureData, setExposureData] = useState<CurrencyExposure[]>([]);
  const [riskAnalysis, setRiskAnalysis] = useState<CurrencyRiskAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const analyzeExposure = async () => {
      try {
        setLoading(true);
        
        // Calculate currency exposure
        const exposure = await currencyService.calculateCurrencyExposure(investments);
        setExposureData(exposure);
        
        // Perform risk analysis
        const analysis = await currencyService.analyzeCurrencyRisk(investments);
        setRiskAnalysis(analysis);
      } catch (error) {
        console.error('Error analyzing currency exposure:', error);
      } finally {
        setLoading(false);
      }
    };

    if (investments.length > 0) {
      analyzeExposure();
    } else {
      setExposureData([]);
      setRiskAnalysis(null);
      setLoading(false);
    }
  }, [investments]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Currency Exposure Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2 text-muted-foreground">Analyzing currency exposure...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (investments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Currency Exposure Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              Add investments to see your currency exposure analysis
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low':
        return <Shield className="h-4 w-4" />;
      case 'medium':
        return <Info className="h-4 w-4" />;
      case 'high':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getOverallRiskLevel = (score: number) => {
    if (score < 30) return 'low';
    if (score < 60) return 'medium';
    return 'high';
  };

  const pieChartData = exposureData.map(exposure => ({
    name: exposure.currency,
    value: exposure.percentage,
    amount: exposure.totalValue.amount,
    color: CURRENCY_COLORS[exposure.currency as keyof typeof CURRENCY_COLORS] || CURRENCY_COLORS.default
  }));

  const volatilityData = riskAnalysis?.volatilityMetrics.map(metric => ({
    currency: metric.currency,
    '30 Days': metric.volatility30d,
    '90 Days': metric.volatility90d,
    '1 Year': metric.volatility1y,
    trend: metric.trend
  })) || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Currency Exposure Analysis
        </CardTitle>
        <CardDescription>
          Analyze your portfolio&apos;s currency distribution and foreign exchange risk
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="exposure" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="exposure">Exposure</TabsTrigger>
            <TabsTrigger value="risk">Risk Analysis</TabsTrigger>
            <TabsTrigger value="volatility">Volatility</TabsTrigger>
            <TabsTrigger value="hedging">Hedging</TabsTrigger>
          </TabsList>

          <TabsContent value="exposure" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Currency Distribution Chart */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Currency Distribution</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name} ${value.toFixed(1)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number, name: string, props: any) => [
                          `${value.toFixed(1)}%`,
                          `${formatCurrency(props.payload.amount)}`
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Currency Breakdown */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Currency Breakdown</h3>
                <div className="space-y-3">
                  {exposureData.map((exposure) => (
                    <div key={exposure.currency} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ 
                              backgroundColor: CURRENCY_COLORS[exposure.currency as keyof typeof CURRENCY_COLORS] || CURRENCY_COLORS.default 
                            }}
                          />
                          <span className="font-medium">{exposure.currency}</span>
                          <Badge className={getRiskLevelColor(exposure.riskLevel)}>
                            {getRiskIcon(exposure.riskLevel)}
                            <span className="ml-1">{exposure.riskLevel.toUpperCase()}</span>
                          </Badge>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            {formatCurrency(exposure.totalValue.amount)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {exposure.percentage.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                      <Progress value={exposure.percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="risk" className="space-y-4">
            {riskAnalysis && (
              <>
                {/* Overall Risk Score */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Overall Risk Score</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2">
                        <div className="text-2xl font-bold">
                          {Math.round(riskAnalysis.riskScore)}
                        </div>
                        <Badge className={getRiskLevelColor(getOverallRiskLevel(riskAnalysis.riskScore))}>
                          {getRiskIcon(getOverallRiskLevel(riskAnalysis.riskScore))}
                          <span className="ml-1">
                            {getOverallRiskLevel(riskAnalysis.riskScore).toUpperCase()}
                          </span>
                        </Badge>
                      </div>
                      <Progress value={riskAnalysis.riskScore} className="mt-2" />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Primary Currency</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-muted-foreground" />
                        <span className="text-lg font-semibold">{primaryCurrency}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Your base currency for calculations
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Currencies</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {exposureData.length}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Different currencies in portfolio
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Risk Recommendations */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">Risk Assessment & Recommendations</h3>
                  {riskAnalysis.recommendations.map((recommendation, index) => (
                    <Alert key={index}>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Recommendation {index + 1}</AlertTitle>
                      <AlertDescription>{recommendation}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="volatility" className="space-y-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Currency Volatility Analysis</h3>
              
              {volatilityData.length > 0 && (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={volatilityData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="currency" />
                      <YAxis />
                      <Tooltip formatter={(value: number) => [`${value.toFixed(1)}%`, 'Volatility']} />
                      <Legend />
                      <Bar dataKey="30 Days" fill="#3b82f6" />
                      <Bar dataKey="90 Days" fill="#10b981" />
                      <Bar dataKey="1 Year" fill="#f59e0b" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {riskAnalysis?.volatilityMetrics.map((metric) => (
                  <Card key={metric.currency}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        {metric.currency}
                        {metric.trend === 'increasing' && <TrendingUp className="h-4 w-4 text-red-500" />}
                        {metric.trend === 'decreasing' && <TrendingDown className="h-4 w-4 text-green-500" />}
                        {metric.trend === 'stable' && <div className="h-4 w-4 rounded-full bg-gray-400" />}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>30 Days:</span>
                        <span>{metric.volatility30d.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>90 Days:</span>
                        <span>{metric.volatility90d.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>1 Year:</span>
                        <span>{metric.volatility1y.toFixed(1)}%</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        Trend: {metric.trend}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="hedging" className="space-y-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Hedging Opportunities</h3>
              
              {riskAnalysis?.hedgingOpportunities.length === 0 ? (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>No Hedging Needed</AlertTitle>
                  <AlertDescription>
                    Your current currency exposure levels don&apos;t require immediate hedging strategies.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  {riskAnalysis?.hedgingOpportunities.map((opportunity, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <CardTitle className="text-base">
                          {opportunity.currency} Hedging Strategy
                        </CardTitle>
                        <CardDescription>
                          Current exposure: {formatCurrency(opportunity.currentExposure)}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Recommended hedge amount:</span>
                          <span className="font-semibold">
                            {formatCurrency(opportunity.recommendedHedge)}
                          </span>
                        </div>
                        
                        <div className="space-y-2">
                          <span className="text-sm font-medium">Available hedging instruments:</span>
                          <div className="flex flex-wrap gap-2">
                            {opportunity.hedgingInstruments.map((instrument, idx) => (
                              <Badge key={idx} variant="secondary">
                                {instrument}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <Alert>
                          <Shield className="h-4 w-4" />
                          <AlertTitle>Hedging Benefits</AlertTitle>
                          <AlertDescription>
                            Hedging {((opportunity.recommendedHedge / opportunity.currentExposure) * 100).toFixed(0)}% 
                            of your {opportunity.currency} exposure can help reduce foreign exchange risk 
                            while maintaining upside potential.
                          </AlertDescription>
                        </Alert>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, AlertTriangle, CheckCircle, Target } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface DebtToIncomeData {
  debtToIncomeRatio: number;
  monthlyIncome: number;
  totalMonthlyPayments: number;
  totalDebt: number;
  riskLevel: 'low' | 'medium' | 'high';
  recommendation: string;
}

interface DebtToIncomeCardProps {
  data: DebtToIncomeData | null;
}

export function DebtToIncomeCard({ data }: DebtToIncomeCardProps) {
  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Debt-to-Income Ratio</CardTitle>
          <CardDescription>Loading financial health metrics...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-2 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Handle case where income is 0 or unavailable
  const hasValidIncome = data.monthlyIncome > 0;
  const displayRatio = hasValidIncome ? data.debtToIncomeRatio : 0;

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'low': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'medium': return <Target className="h-4 w-4 text-yellow-600" />;
      case 'high': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return null;
    }
  };

  const getProgressColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'high': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getRiskThresholds = () => {
    return [
      { label: 'Excellent', max: 20, color: 'text-green-600' },
      { label: 'Good', max: 36, color: 'text-yellow-600' },
      { label: 'High Risk', max: 100, color: 'text-red-600' },
    ];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TrendingUp className="h-5 w-5" />
          <span>Debt-to-Income Ratio</span>
        </CardTitle>
        <CardDescription>
          Your monthly debt payments as a percentage of income
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Ratio Display */}
        <div className="text-center space-y-2">
          <div className="text-4xl font-bold">
            {hasValidIncome ? `${displayRatio.toFixed(1)}%` : 'N/A'}
          </div>
          <div className="flex items-center justify-center space-x-2">
            {getRiskIcon(data.riskLevel)}
            <Badge 
              variant="outline" 
              className={getRiskLevelColor(data.riskLevel)}
            >
              {data.riskLevel.toUpperCase()} RISK
            </Badge>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Debt Ratio</span>
            <span>{hasValidIncome ? `${displayRatio.toFixed(1)}%` : 'N/A'}</span>
          </div>
          <Progress 
            value={hasValidIncome ? Math.min(displayRatio, 100) : 0} 
            className="h-3"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0%</span>
            <span>20% (Good)</span>
            <span>36% (Max)</span>
            <span>50%+</span>
          </div>
        </div>

        {/* Breakdown */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Monthly Income</span>
            <span className="font-semibold text-green-600">
              {formatCurrency(data.monthlyIncome)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Monthly Debt Payments</span>
            <span className="font-semibold text-red-600">
              {formatCurrency(data.totalMonthlyPayments)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Total Debt</span>
            <span className="font-semibold">
              {formatCurrency(data.totalDebt)}
            </span>
          </div>
        </div>

        {/* Risk Level Explanation */}
        <Alert className={data.riskLevel === 'high' ? 'border-red-200 bg-red-50' : 
                         data.riskLevel === 'medium' ? 'border-yellow-200 bg-yellow-50' : 
                         'border-green-200 bg-green-50'}>
          <AlertDescription className="text-sm">
            {data.recommendation}
          </AlertDescription>
        </Alert>

        {/* Guidelines */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Industry Guidelines</h4>
          <div className="space-y-1 text-xs">
            {getRiskThresholds().map((threshold, index) => (
              <div key={index} className="flex justify-between">
                <span className={threshold.color}>{threshold.label}</span>
                <span className={threshold.color}>
                  {index === 0 ? '≤' : index === 1 ? '≤' : '>'}{threshold.max === 100 ? '36' : threshold.max}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Educational Tip */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <h4 className="text-sm font-semibold text-blue-900 mb-1">💡 Tip</h4>
          <p className="text-xs text-blue-800">
            Lenders typically prefer a debt-to-income ratio below 36%. 
            Consider paying down high-interest debt first to improve your ratio.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
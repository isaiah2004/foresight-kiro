'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Plus, TrendingDown, AlertTriangle, Calculator, Target } from 'lucide-react';
import { Loan } from '@/types/financial';
import { LoansList } from './loans-list';
import { AddLoanDialog } from './add-loan-dialog';
import { DebtToIncomeCard } from './debt-to-income-card';
import { PayoffStrategiesCard } from './payoff-strategies-card';
import { formatCurrency } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface DebtToIncomeData {
  debtToIncomeRatio: number;
  monthlyIncome: number;
  totalMonthlyPayments: number;
  totalDebt: number;
  riskLevel: 'low' | 'medium' | 'high';
  recommendation: string;
}

export function LoansOverview() {
  const { user } = useUser();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [debtToIncomeData, setDebtToIncomeData] = useState<DebtToIncomeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);

  useEffect(() => {
    if (user) {
      fetchLoans();
      fetchDebtToIncomeData();
    }
  }, [user]);

  const fetchLoans = async () => {
    try {
      const response = await fetch('/api/loans');
      if (response.ok) {
        const data = await response.json();
        setLoans(Array.isArray(data) ? data : []);
      } else {
        console.error('Error fetching loans:', await response.text());
        setLoans([]);
      }
    } catch (error) {
      console.error('Error fetching loans:', error);
      setLoans([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDebtToIncomeData = async () => {
    try {
      const response = await fetch('/api/loans/debt-to-income');
      if (response.ok) {
        const data = await response.json();
        setDebtToIncomeData(data);
      } else {
        // Handle API errors gracefully
        const errorData = await response.json();
        if (errorData.debtToIncomeRatio !== undefined) {
          // API returned partial data with error
          setDebtToIncomeData(errorData);
        } else {
          console.error('Error fetching debt-to-income data:', errorData);
        }
      }
    } catch (error) {
      console.error('Error fetching debt-to-income data:', error);
      // Set default data to prevent UI crashes
      setDebtToIncomeData({
        debtToIncomeRatio: 0,
        monthlyIncome: 0,
        totalMonthlyPayments: 0,
        totalDebt: 0,
        riskLevel: 'medium',
        recommendation: 'Unable to calculate debt-to-income ratio. Please check your internet connection and try again.'
      });
    }
  };

  const activeLoans = loans.filter(loan => loan && loan.currentBalance.amount > 0);
  const totalDebt = activeLoans.reduce((sum, loan) => sum + (loan.currentBalance?.amount || 0), 0);
  const totalMonthlyPayments = activeLoans.reduce((sum, loan) => sum + (loan.monthlyPayment?.amount || 0), 0);

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
      case 'low': return <Target className="h-4 w-4" />;
      case 'medium': return <TrendingDown className="h-4 w-4" />;
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      default: return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Loans & Debt</h2>
          <p className="text-muted-foreground">
            Track and manage all your loans and debt obligations
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Loan
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Debt</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totalDebt)}
            </div>
            <p className="text-xs text-muted-foreground">
              {activeLoans.length} active loan{activeLoans.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Payments</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalMonthlyPayments)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total monthly obligations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Debt-to-Income</CardTitle>
            {debtToIncomeData && getRiskIcon(debtToIncomeData.riskLevel)}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {debtToIncomeData ? `${debtToIncomeData.debtToIncomeRatio.toFixed(1)}%` : 'N/A'}
            </div>
            {debtToIncomeData && (
              <Badge 
                variant="outline" 
                className={`text-xs ${getRiskLevelColor(debtToIncomeData.riskLevel)}`}
              >
                {debtToIncomeData.riskLevel.toUpperCase()} RISK
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Interest</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeLoans.length > 0 
                ? `${(activeLoans.reduce((sum, loan) => sum + (loan.interestRate || 0), 0) / activeLoans.length).toFixed(1)}%`
                : 'N/A'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Weighted average rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Debt-to-Income Alert */}
      {debtToIncomeData && debtToIncomeData.riskLevel !== 'low' && (
        <Alert className={debtToIncomeData.riskLevel === 'high' ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'}>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Debt Management Recommendation:</strong> {debtToIncomeData.recommendation}
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="strategies">Strategies</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <LoansList 
                loans={loans} 
                onLoanUpdated={fetchLoans}
                onLoanDeleted={fetchLoans}
              />
            </div>
            <div className="space-y-6">
              <DebtToIncomeCard data={debtToIncomeData} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="strategies" className="space-y-6">
          <PayoffStrategiesCard />
        </TabsContent>
      </Tabs>

      <AddLoanDialog 
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onLoanAdded={fetchLoans}
      />
    </div>
  );
}
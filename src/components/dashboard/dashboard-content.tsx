"use client";

import { Timestamp } from "firebase/firestore";
import { DashboardCards } from "@/components/dashboard/dashboard-cards";
import { 
  MonthlySpendingChart,
  LoanRepaymentChart,
  DebtToIncomeChart,
  InvestmentGrowthChart,
  FundProgressChart,
  AssetGrowthChart
} from "@/components/dashboard/charts";
import { 
  calculateDashboardMetrics,
  generateMonthlySpendingData,
  generateLoanRepaymentData,
  generateDebtToIncomeData,
  generateInvestmentGrowthData,
  generateFundProgressData,
  generateAssetGrowthData,
} from "@/lib/dashboard-calculations";
import { useCurrency } from "@/contexts/currency-context";
import { useState, useEffect } from "react";
import { Investment, Income, Expense, Loan, Goal } from "@/types/financial";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

// Mock data for demonstration - in real app this would come from Firebase
const mockData = {
  investments: [
    {
      id: "1",
      userId: "user1",
      type: "stocks" as const,
      name: "Apple Inc.",
      symbol: "AAPL",
      quantity: 10,
      purchasePrice: { amount: 150, currency: "USD" },
      currentPrice: { amount: 175, currency: "USD" },
      purchaseDate: Timestamp.fromDate(new Date("2023-01-01")),
      currency: "USD",
      description: "Technology stock investment",
    },
    {
      id: "2",
      userId: "user1",
      type: "mutual_funds" as const,
      name: "S&P 500 Index Fund",
      quantity: 100,
      purchasePrice: { amount: 400, currency: "USD" },
      currentPrice: { amount: 450, currency: "USD" },
      purchaseDate: Timestamp.fromDate(new Date("2023-02-01")),
      currency: "USD",
      description: "Diversified index fund",
    },
  ] as Investment[],
  incomes: [
    {
      id: "1",
      userId: "user1",
      type: "salary" as const,
      source: "Tech Company",
      amount: { amount: 8000, currency: "USD" },
      frequency: "monthly" as const,
      startDate: Timestamp.fromDate(new Date("2023-01-01")),
      isActive: true,
    },
    {
      id: "2",
      userId: "user1",
      type: "bonus" as const,
      source: "Annual Bonus",
      amount: { amount: 10000, currency: "USD" },
      frequency: "annually" as const,
      startDate: Timestamp.fromDate(new Date("2023-01-01")),
      isActive: true,
    },
  ] as Income[],
  expenses: [
    {
      id: "1",
      userId: "user1",
      category: "rent" as const,
      name: "Apartment Rent",
      amount: { amount: 2500, currency: "USD" },
      frequency: "monthly" as const,
      isFixed: true,
      startDate: Timestamp.fromDate(new Date("2023-01-01")),
    },
    {
      id: "2",
      userId: "user1",
      category: "groceries" as const,
      name: "Food & Groceries",
      amount: { amount: 600, currency: "USD" },
      frequency: "monthly" as const,
      isFixed: false,
      startDate: Timestamp.fromDate(new Date("2023-01-01")),
    },
    {
      id: "3",
      userId: "user1",
      category: "utilities" as const,
      name: "Utilities",
      amount: { amount: 200, currency: "USD" },
      frequency: "monthly" as const,
      isFixed: true,
      startDate: Timestamp.fromDate(new Date("2023-01-01")),
    },
  ] as Expense[],
  loans: [
    {
      id: "1",
      userId: "user1",
      type: "car" as const,
      name: "Car Loan",
      principal: { amount: 25000, currency: "USD" },
      currentBalance: { amount: 18000, currency: "USD" },
      interestRate: 4.5,
      termMonths: 60,
      monthlyPayment: { amount: 467, currency: "USD" },
      startDate: Timestamp.fromDate(new Date("2022-06-01")),
      nextPaymentDate: Timestamp.fromDate(new Date("2024-02-01")),
    },
  ] as Loan[],
  goals: [
    {
      id: "1",
      userId: "user1",
      type: "retirement" as const,
      name: "Retirement Savings",
      targetAmount: { amount: 1000000, currency: "USD" },
      currentAmount: { amount: 125000, currency: "USD" },
      targetDate: Timestamp.fromDate(new Date("2055-01-01")),
      monthlyContribution: { amount: 1500, currency: "USD" },
      priority: "high" as const,
      isActive: true,
    },
    {
      id: "2",
      userId: "user1",
      type: "emergency_fund" as const,
      name: "Emergency Fund",
      targetAmount: { amount: 20000, currency: "USD" },
      currentAmount: { amount: 8000, currency: "USD" },
      targetDate: Timestamp.fromDate(new Date("2025-01-01")),
      monthlyContribution: { amount: 500, currency: "USD" },
      priority: "high" as const,
      isActive: true,
    },
    {
      id: "3",
      userId: "user1",
      type: "vacation" as const,
      name: "Europe Trip",
      targetAmount: { amount: 5000, currency: "USD" },
      currentAmount: { amount: 2000, currency: "USD" },
      targetDate: Timestamp.fromDate(new Date("2024-08-01")),
      monthlyContribution: { amount: 300, currency: "USD" },
      priority: "medium" as const,
      isActive: true,
    },
  ] as Goal[],
};

export function DashboardContent() {
  const [dashboardMetrics, setDashboardMetrics] = useState(
    calculateDashboardMetrics([], [], [], [], [], 0)
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading data
    const loadData = async () => {
      setIsLoading(true);

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Calculate metrics with mock data
      const metrics = calculateDashboardMetrics(
        mockData.investments,
        mockData.incomes,
        mockData.expenses,
        mockData.loans,
        mockData.goals,
        15000 // Mock cash savings
      );

      setDashboardMetrics(metrics);
      setIsLoading(false);
    };

    loadData();
  }, []);

  // Generate chart data
  const monthlySpendingData = generateMonthlySpendingData(dashboardMetrics.monthlyExpenses);
  const loanRepaymentData = mockData.loans.length > 0 ? generateLoanRepaymentData(mockData.loans[0]) : [];
  const debtToIncomeData = generateDebtToIncomeData(dashboardMetrics.totalDebt, dashboardMetrics.monthlyIncome);
  const investmentGrowthData = generateInvestmentGrowthData(dashboardMetrics.portfolioValue);
  const fundProgressData = generateFundProgressData(mockData.goals);
  const assetGrowthData = generateAssetGrowthData();

  // Chart props
  const currentFunds = {
    emergency: { 
      current: mockData.goals.find(g => g.type === 'emergency_fund')?.currentAmount.amount || 8000, 
      target: mockData.goals.find(g => g.type === 'emergency_fund')?.targetAmount.amount || 20000 
    },
    car: { 
      current: 5000, 
      target: 25000 
    },
    retirement: { 
      current: mockData.goals.find(g => g.type === 'retirement')?.currentAmount.amount || 125000, 
      target: mockData.goals.find(g => g.type === 'retirement')?.targetAmount.amount || 1000000 
    },
  };

  const currentAssets = {
    homes: 250000,
    cars: 22000,
    land: 105000,
    total: 377000,
  };

  const appreciation = {
    homes: 5.2,
    cars: -12.5,
    land: 3.8,
    total: 2.1,
  };

  return (
    <div className="flex flex-1 flex-col gap-8 p-4 pt-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Financial Dashboard
          </h1>
          <p className="text-muted-foreground">
            Get a comprehensive view of your financial health and progress toward your goals.
          </p>
        </div>
      </div>

      {/* Dashboard Cards */}
      <DashboardCards metrics={dashboardMetrics} isLoading={isLoading} />

      {/* Monthly Overview Section */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Monthly Overview</h2>
          <p className="text-muted-foreground">Track your monthly spending and budget progress</p>
        </div>
        
        <MonthlySpendingChart 
          data={monthlySpendingData} 
          isLoading={isLoading}
        />
      </div>

      <Separator />

      {/* Loans Section */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Loans & Debt Management</h2>
          <p className="text-muted-foreground">Monitor your debt repayment progress and ratios</p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
          {mockData.loans.length > 0 && (
            <LoanRepaymentChart
              data={loanRepaymentData}
              loanName={mockData.loans[0].name}
              originalBalance={mockData.loans[0].principal.amount}
              currentBalance={mockData.loans[0].currentBalance.amount}
              monthsRemaining={36} // Mock data
              isLoading={isLoading}
            />
          )}
          
          <DebtToIncomeChart
            data={debtToIncomeData}
            currentRatio={dashboardMetrics.debtToIncomeRatio}
            isLoading={isLoading}
          />
        </div>
      </div>

      <Separator />

      {/* Investment & Funds Section */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Investment & Funds</h2>
          <p className="text-muted-foreground">Track investment growth and savings fund progress</p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
          <InvestmentGrowthChart
            data={investmentGrowthData}
            currentValue={dashboardMetrics.portfolioValue}
            averageGrowthRate={8.2} // Mock average growth rate
            projectedValue={dashboardMetrics.portfolioValue * 1.17} // Mock projected value
            isLoading={isLoading}
          />
          
          <FundProgressChart
            data={fundProgressData}
            currentFunds={currentFunds}
            isLoading={isLoading}
          />
        </div>
      </div>

      <Separator />

      {/* Assets Section */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Assets</h2>
          <p className="text-muted-foreground">Monitor the growth and depreciation of your physical assets</p>
        </div>
        
        <AssetGrowthChart
          data={assetGrowthData}
          currentAssets={currentAssets}
          appreciation={appreciation}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
export default DashboardContent;

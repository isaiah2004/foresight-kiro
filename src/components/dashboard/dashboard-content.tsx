"use client";

import { Timestamp } from "firebase/firestore";
import { DashboardCards } from "@/components/dashboard/dashboard-cards";
import { calculateDashboardMetrics } from "@/lib/dashboard-calculations";
import { useCurrency } from "@/contexts/currency-context";
import { useState, useEffect } from "react";
import { Investment, Income, Expense, Loan, Goal } from "@/types/financial";

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

  useEffect(() => {
    // Simulate loading data
    const loadData = async () => {

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
    };

    loadData();
  }, []);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Financial Dashboard
          </h1>
          <p className="text-muted-foreground">
            Get a comprehensive view of your financial health and progress
            toward your goals.
          </p>
        </div>
      </div>

      <DashboardCards metrics={dashboardMetrics} />

      {/* Placeholder for future charts and visualizations */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="bg-muted/50 aspect-video rounded-xl flex items-center justify-center border border-border">
          <p className="text-muted-foreground">Cash Flow Chart (Coming Soon)</p>
        </div>
        <div className="bg-muted/50 aspect-video rounded-xl flex items-center justify-center border border-border">
          <p className="text-muted-foreground">
            Portfolio Allocation (Coming Soon)
          </p>
        </div>
      </div>
    </div>
  );
}
export default DashboardContent;

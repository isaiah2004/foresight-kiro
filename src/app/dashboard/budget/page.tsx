"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Calculator,
  Target, 
  TrendingUp,
  AlertCircle,
  PieChart,
  DollarSign,
  Wallet,
  ArrowRight
} from "lucide-react";
import Link from "next/link";

export default function BudgetPage() {
  const currentBudget = {
    totalBudget: 5000,
    totalSpent: 3245,
    totalRemaining: 1755,
    categories: [
      { name: "Essentials", budgeted: 2500, spent: 1823, color: "bg-blue-500" },
      { name: "Entertainment", budgeted: 400, spent: 456, color: "bg-purple-500" },
      { name: "Savings", budgeted: 800, spent: 800, color: "bg-green-500" },
      { name: "Transportation", budgeted: 600, spent: 234, color: "bg-orange-500" },
      { name: "Miscellaneous", budgeted: 700, spent: 532, color: "bg-gray-500" },
    ]
  };

  const getProgressPercentage = (spent: number, budgeted: number) => {
    return Math.min(Math.round((spent / budgeted) * 100), 100);
  };

  const overBudgetCategories = currentBudget.categories.filter(cat => cat.spent > cat.budgeted);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Budget Planning</h1>
          <p className="text-muted-foreground">
            Track your spending, manage budget categories, and reach your financial goals.
          </p>
        </div>
      </div>

      {/* Budget Overview Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${currentBudget.totalBudget.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">This month's budget</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${currentBudget.totalSpent.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {getProgressPercentage(currentBudget.totalSpent, currentBudget.totalBudget)}% of budget used
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remaining</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${currentBudget.totalRemaining.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Available to spend</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {overBudgetCategories.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-5 w-5" />
              Budget Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700 mb-2">
              You're over budget in {overBudgetCategories.length} categories:
            </p>
            <ul className="list-disc list-inside text-sm text-red-600">
              {overBudgetCategories.map((cat, index) => (
                <li key={index}>
                  {cat.name}: ${(cat.spent - cat.budgeted).toLocaleString()} over budget
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href="/dashboard/budget/buckets">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-blue-600" />
                Budget Buckets
              </CardTitle>
              <CardDescription>
                Organize spending into categories and track allocations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {currentBudget.categories.length} active categories
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href="/dashboard/budget/income-splits">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-green-600" />
                Income Splits
              </CardTitle>
              <CardDescription>
                Automatically divide income across budget categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Configure allocation rules
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href="/dashboard/budget/manage-budgets">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-600" />
                Manage Budgets
              </CardTitle>
              <CardDescription>
                Create, edit, and track all your budgets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  View all budget templates
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Link>
        </Card>
      </div>

      {/* Category Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Category Progress</CardTitle>
          <CardDescription>
            Track spending across all your budget categories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {currentBudget.categories.map((category, index) => {
              const percentage = getProgressPercentage(category.spent, category.budgeted);
              const isOverBudget = category.spent > category.budgeted;
              
              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${category.color}`} />
                      <span className="font-medium">{category.name}</span>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-medium ${isOverBudget ? 'text-red-600' : ''}`}>
                        ${category.spent.toLocaleString()} / ${category.budgeted.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {percentage}% used
                      </div>
                    </div>
                  </div>
                  <Progress 
                    value={percentage} 
                    className={`h-2 ${isOverBudget ? 'bg-red-100' : ''}`}
                  />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
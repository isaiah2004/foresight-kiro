import Link from 'next/link';
import { DollarSign, Receipt, TrendingUp, PieChart } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function IncomeExpensesPage() {
  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Income & Expenses</h2>
          <p className="text-muted-foreground">
            Manage your income sources and track your expenses
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Income Management
            </CardTitle>
            <CardDescription>
              Track and manage your income sources to understand your earning potential
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                • Add salary, bonus, and other income sources
              </p>
              <p className="text-sm text-muted-foreground">
                • View income projections and breakdowns
              </p>
              <p className="text-sm text-muted-foreground">
                • Track monthly and annual earnings
              </p>
            </div>
            <Button asChild className="w-full">
              <Link href="/dashboard/income">
                <TrendingUp className="h-4 w-4 mr-2" />
                Manage Income Sources
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-red-600" />
              Expense Tracking
            </CardTitle>
            <CardDescription>
              Monitor and categorize your expenses to optimize spending
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                • Categorize expenses by type
              </p>
              <p className="text-sm text-muted-foreground">
                • Set budgets and track spending
              </p>
              <p className="text-sm text-muted-foreground">
                • Identify optimization opportunities
              </p>
            </div>
            <Button asChild variant="outline" className="w-full" disabled>
              <Link href="/dashboard/expenses">
                <PieChart className="h-4 w-4 mr-2" />
                Coming Soon
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Overview</CardTitle>
          <CardDescription>
            Get a snapshot of your financial flow
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              Start by adding your income sources to see your financial overview here.
            </p>
            <Button asChild className="mt-4">
              <Link href="/dashboard/income">
                Get Started with Income Tracking
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
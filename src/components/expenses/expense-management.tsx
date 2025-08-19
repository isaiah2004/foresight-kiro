'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, TrendingUp, AlertTriangle, PieChart } from 'lucide-react';
import { ExpenseTable } from './expense-table';
import { ExpenseDialog } from './expense-dialog';
import { ExpenseSummaryCards } from './expense-summary-cards';
import { ExpenseChart } from './expense-chart';
import { ExpenseAnalysis } from './expense-analysis';
import { Expense, ExpenseCategory } from '@/types/financial';
import { toast } from '@/hooks/use-toast';

interface ExpenseAnalysisData {
  totalMonthly: number;
  fixedExpenses: number;
  variableExpenses: number;
  categoryBreakdown: Record<ExpenseCategory, number>;
  suggestions: string[];
}

export function ExpenseManagement() {
  const { user } = useUser();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [analysis, setAnalysis] = useState<ExpenseAnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (user) {
      fetchExpenses();
      fetchAnalysis();
    }
  }, [user]);

  const fetchExpenses = async () => {
    try {
      const response = await fetch('/api/expenses');
      if (!response.ok) throw new Error('Failed to fetch expenses');
      const data = await response.json();
      setExpenses(data);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      toast({
        title: 'Error',
        description: 'Failed to load expenses',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalysis = async () => {
    try {
      const response = await fetch('/api/expenses/analysis');
      if (!response.ok) throw new Error('Failed to fetch analysis');
      const data = await response.json();
      setAnalysis(data);
    } catch (error) {
      console.error('Error fetching analysis:', error);
    }
  };

  const handleExpenseCreated = (expense: Expense) => {
    setExpenses(prev => [expense, ...prev]);
    fetchAnalysis(); // Refresh analysis
    setDialogOpen(false);
    toast({
      title: 'Success',
      description: 'Expense added successfully',
    });
  };

  const handleExpenseUpdated = (expense: Expense) => {
    setExpenses(prev => prev.map(e => e.id === expense.id ? expense : e));
    fetchAnalysis(); // Refresh analysis
    setEditingExpense(null);
    setDialogOpen(false);
    toast({
      title: 'Success',
      description: 'Expense updated successfully',
    });
  };

  const handleExpenseDeleted = (expenseId: string) => {
    setExpenses(prev => prev.filter(e => e.id !== expenseId));
    fetchAnalysis(); // Refresh analysis
    toast({
      title: 'Success',
      description: 'Expense deleted successfully',
    });
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setDialogOpen(true);
  };

  const handleAddExpense = () => {
    setEditingExpense(null);
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Expense Tracking</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                <div className="h-4 w-4 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-24 bg-muted animate-pulse rounded mb-2" />
                <div className="h-3 w-32 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Expense Tracking</h2>
          <p className="text-muted-foreground">
            Monitor and categorize your expenses to understand your spending patterns
          </p>
        </div>
        <Button onClick={handleAddExpense}>
          <Plus className="mr-2 h-4 w-4" />
          Add Expense
        </Button>
      </div>

      {analysis && <ExpenseSummaryCards analysis={analysis} />}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="expenses">All Expenses</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
          <TabsTrigger value="charts">Charts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Recent Expenses
                </CardTitle>
                <CardDescription>
                  Your most recent expense entries
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ExpenseTable
                  expenses={expenses.slice(0, 5)}
                  onEdit={handleEditExpense}
                  onDelete={handleExpenseDeleted}
                  compact
                />
              </CardContent>
            </Card>

            {analysis && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Spending Breakdown
                  </CardTitle>
                  <CardDescription>
                    Expenses by category this month
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ExpenseChart data={analysis.categoryBreakdown} />
                </CardContent>
              </Card>
            )}
          </div>

          {analysis && analysis.suggestions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Optimization Suggestions
                </CardTitle>
                <CardDescription>
                  Ways to improve your spending habits
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analysis.suggestions.map((suggestion, index) => (
                    <div key={index} className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                      <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm">{suggestion}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Expenses</CardTitle>
              <CardDescription>
                Manage all your expense entries
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ExpenseTable
                expenses={expenses}
                onEdit={handleEditExpense}
                onDelete={handleExpenseDeleted}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          {analysis && <ExpenseAnalysis analysis={analysis} />}
        </TabsContent>

        <TabsContent value="charts" className="space-y-4">
          {analysis && (
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Category Breakdown</CardTitle>
                  <CardDescription>
                    Monthly spending by category
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ExpenseChart data={analysis.categoryBreakdown} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Fixed vs Variable</CardTitle>
                  <CardDescription>
                    Breakdown of fixed and variable expenses
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ExpenseChart 
                    data={{
                      fixed: analysis.fixedExpenses,
                      variable: analysis.variableExpenses
                    }}
                  />
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <ExpenseDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        expense={editingExpense}
        onExpenseCreated={handleExpenseCreated}
        onExpenseUpdated={handleExpenseUpdated}
      />
    </div>
  );
}
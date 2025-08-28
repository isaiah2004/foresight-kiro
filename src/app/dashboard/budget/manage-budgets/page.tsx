"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Copy, Calendar } from "lucide-react";

export default function ManageBudgetsPage() {
  const budgets = [
    {
      id: 1,
      name: "Monthly Budget - December 2024",
      type: "Monthly",
      status: "Active",
      totalAmount: 5000,
      spent: 3245,
      categories: 8,
      createdDate: "Dec 1, 2024",
    },
    {
      id: 2,
      name: "Holiday Spending Budget",
      type: "Custom",
      status: "Active",
      totalAmount: 1500,
      spent: 892,
      categories: 4,
      createdDate: "Nov 15, 2024",
    },
    {
      id: 3,
      name: "Monthly Budget - November 2024",
      type: "Monthly",
      status: "Completed",
      totalAmount: 4800,
      spent: 4756,
      categories: 8,
      createdDate: "Nov 1, 2024",
    },
    {
      id: 4,
      name: "Vacation Fund Budget",
      type: "Savings Goal",
      status: "Active",
      totalAmount: 3000,
      spent: 1200,
      categories: 1,
      createdDate: "Oct 1, 2024",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800";
      case "Completed":
        return "bg-gray-100 text-gray-800";
      case "Draft":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getProgressPercentage = (spent: number, total: number) => {
    return Math.round((spent / total) * 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manage Budgets</h1>
          <p className="text-muted-foreground">
            Create, edit, and track all your budgets in one place.
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Create Budget
        </Button>
      </div>

      <div className="grid gap-4">
        {budgets.map((budget) => (
          <Card key={budget.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{budget.name}</CardTitle>
                  <CardDescription className="flex items-center gap-4 mt-1">
                    <span>Type: {budget.type}</span>
                    <span>•</span>
                    <span>Created: {budget.createdDate}</span>
                    <span>•</span>
                    <span>{budget.categories} categories</span>
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(budget.status)}>
                    {budget.status}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">Budget Total:</span>
                      <span className="font-semibold">${budget.totalAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">Spent:</span>
                      <span className="font-medium">${budget.spent.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">Remaining:</span>
                      <span className={`font-medium ${
                        budget.totalAmount - budget.spent >= 0 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        ${(budget.totalAmount - budget.spent).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">
                      {getProgressPercentage(budget.spent, budget.totalAmount)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Used</div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="gap-1">
                      <Edit className="h-3 w-3" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1">
                      <Copy className="h-3 w-3" />
                      Duplicate
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1">
                      <Calendar className="h-3 w-3" />
                      View Details
                    </Button>
                  </div>
                  <Button variant="outline" size="sm" className="gap-1 text-red-600 hover:text-red-700">
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Budget Templates</CardTitle>
          <CardDescription>
            Quick start with pre-configured budget templates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
              <div className="font-medium">50/30/20 Rule</div>
              <div className="text-sm text-muted-foreground mt-1">
                50% needs, 30% wants, 20% savings
              </div>
            </div>
            <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
              <div className="font-medium">Zero-Based Budget</div>
              <div className="text-sm text-muted-foreground mt-1">
                Every dollar has a purpose
              </div>
            </div>
            <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
              <div className="font-medium">Envelope Method</div>
              <div className="text-sm text-muted-foreground mt-1">
                Cash-based spending categories
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

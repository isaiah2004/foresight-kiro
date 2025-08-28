"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { DollarSign, PieChart, Settings } from "lucide-react";

export default function IncomeSplitsPage() {
  const incomeSplits = [
    {
      name: "Essentials",
      percentage: 50,
      amount: 2500,
      color: "bg-blue-500",
    },
    {
      name: "Savings & Investments",
      percentage: 20,
      amount: 1000,
      color: "bg-green-500",
    },
    {
      name: "Entertainment & Lifestyle",
      percentage: 15,
      amount: 750,
      color: "bg-purple-500",
    },
    {
      name: "Emergency Fund",
      percentage: 10,
      amount: 500,
      color: "bg-orange-500",
    },
    {
      name: "Miscellaneous",
      percentage: 5,
      amount: 250,
      color: "bg-gray-500",
    },
  ];

  const totalIncome = 5000;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Income Splits</h1>
          <p className="text-muted-foreground">
            Configure how your income is automatically divided across different budget categories.
          </p>
        </div>
        <Button className="gap-2">
          <Settings className="h-4 w-4" />
          Adjust Splits
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Income Distribution
            </CardTitle>
            <CardDescription>
              Monthly income: ${totalIncome.toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {incomeSplits.map((split, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${split.color}`} />
                      <span className="text-sm font-medium">{split.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">${split.amount.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">{split.percentage}%</div>
                    </div>
                  </div>
                  <Progress value={split.percentage} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Monthly Breakdown
            </CardTitle>
            <CardDescription>
              Automatic allocation based on your income splits
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium">Total Monthly Income</span>
                <span className="font-semibold text-green-600">
                  ${totalIncome.toLocaleString()}
                </span>
              </div>
              {incomeSplits.map((split, index) => (
                <div key={index} className="flex justify-between">
                  <span className="text-sm text-muted-foreground">{split.name}</span>
                  <span className="text-sm font-medium">
                    ${split.amount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Split Configuration</CardTitle>
          <CardDescription>
            Adjust how your income is automatically divided. Changes will take effect next month.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Income split configuration interface will be implemented here.</p>
            <p className="text-sm mt-2">
              You'll be able to drag sliders to adjust percentages and see real-time updates.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

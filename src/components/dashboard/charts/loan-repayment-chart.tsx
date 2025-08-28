"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { CurrencyDisplay } from "@/components/currency/currency-display";
import { useCurrency } from "@/contexts/currency-context";
import { Progress } from "@/components/ui/progress";
import { Calendar, TrendingDown } from "lucide-react";

interface LoanRepaymentData {
  month: string;
  remainingBalance: number;
  principalPaid: number;
  interestPaid: number;
}

interface LoanRepaymentChartProps {
  data: LoanRepaymentData[];
  loanName: string;
  originalBalance: number;
  currentBalance: number;
  monthsRemaining: number;
  isLoading?: boolean;
}

export function LoanRepaymentChart({ 
  data, 
  loanName, 
  originalBalance, 
  currentBalance, 
  monthsRemaining, 
  isLoading 
}: LoanRepaymentChartProps) {
  const { primaryCurrency } = useCurrency();
  
  const progressPercentage = ((originalBalance - currentBalance) / originalBalance) * 100;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loan Repayment Progress</CardTitle>
          <CardDescription>Track your loan payoff progress</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] animate-pulse bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  const chartConfig = {
    remainingBalance: {
      label: "Remaining Balance",
      color: "var(--color-chart-1)",
    },
    principalPaid: {
      label: "Principal Paid",
      color: "var(--color-chart-2)",
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingDown className="h-5 w-5" />
          {loanName} - Repayment Progress
        </CardTitle>
        <CardDescription>Track your loan payoff progress and timeline</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Summary */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Progress</span>
            <span className="font-medium">{progressPercentage.toFixed(1)}% paid off</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              <CurrencyDisplay amount={currentBalance} currency={primaryCurrency} variant="small" /> remaining
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {monthsRemaining} months left
            </span>
          </div>
        </div>

        {/* Chart */}
        <ChartContainer config={chartConfig} className="h-[250px]">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="month" 
              className="text-xs"
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip 
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="rounded-lg border bg-background p-2 shadow-sm">
                      <p className="text-sm font-medium">{label}</p>
                      {payload.map((entry, index) => (
                        <p key={index} className="text-sm" style={{ color: entry.color }}>
                          {entry.name}: <CurrencyDisplay amount={entry.value as number} currency={primaryCurrency} variant="small" />
                        </p>
                      ))}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Line
              type="monotone"
              dataKey="remainingBalance"
              stroke={chartConfig.remainingBalance.color}
              strokeWidth={3}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

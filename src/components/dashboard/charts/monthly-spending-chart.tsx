"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { CurrencyDisplay } from "@/components/currency/currency-display";
import { useCurrency } from "@/contexts/currency-context";
import { TrendingUp } from "lucide-react";

interface MonthlySpendingData {
  month: string;
  spending: number;
  budget: number;
  category: string;
}

interface MonthlySpendingChartProps {
  data: MonthlySpendingData[];
  isLoading?: boolean;
}

export function MonthlySpendingChart({ data, isLoading }: MonthlySpendingChartProps) {
  const { primaryCurrency } = useCurrency();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>This Month's Spending</CardTitle>
          <CardDescription>Track your spending patterns over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] animate-pulse bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  const chartConfig = {
    spending: {
      label: "Spending",
      color: "var(--color-chart-1)",

    },
    budget: {
      label: "Budget",
      color: "var(--color-chart-2)",
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          This Month's Spending
        </CardTitle>
        <CardDescription>Track your spending patterns over time</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px]">
          <AreaChart data={data}>
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
            <Area
              type="monotone"
              dataKey="budget"
              stackId="1"
              stroke={chartConfig.budget.color}
              fill={chartConfig.budget.color}
              fillOpacity={0.3}
            />
            <Area
              type="monotone"
              dataKey="spending"
              stackId="2"
              stroke={chartConfig.spending.color}
              fill={chartConfig.spending.color}
              fillOpacity={0.6}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { useCurrency } from "@/contexts/currency-context";
import { AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DebtToIncomeData {
  month: string;
  ratio: number;
  totalDebt: number;
  monthlyIncome: number;
}

interface DebtToIncomeChartProps {
  data: DebtToIncomeData[];
  currentRatio: number;
  isLoading?: boolean;
}

export function DebtToIncomeChart({ data, currentRatio, isLoading }: DebtToIncomeChartProps) {
  const { primaryCurrency } = useCurrency();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Debt-to-Income Ratio</CardTitle>
          <CardDescription>Monitor your debt relative to income over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] animate-pulse bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  const chartConfig = {
    ratio: {
      label: "Debt-to-Income Ratio",
      color: currentRatio > 36 ? "var(--color-chart-3)" : currentRatio > 20 ? "var(--color-chart-2)" : "var(--color-chart-1)",
    },
  };

  const getRiskLevel = (ratio: number) => {
    if (ratio <= 20) return { level: "Excellent", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" };
    if (ratio <= 36) return { level: "Good", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" };
    if (ratio <= 50) return { level: "Caution", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300" };
    return { level: "High Risk", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300" };
  };

  const riskLevel = getRiskLevel(currentRatio);
  const isImproving = data.length > 1 && data[data.length - 1].ratio < data[data.length - 2].ratio;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {currentRatio > 36 ? (
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
          ) : isImproving ? (
            <TrendingDown className="h-5 w-5 text-green-600" />
          ) : (
            <TrendingUp className="h-5 w-5 text-blue-600" />
          )}
          Debt-to-Income Ratio
        </CardTitle>
        <CardDescription>Monitor your debt relative to income over time</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Status */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold">{currentRatio.toFixed(1)}%</p>
            <p className="text-sm text-muted-foreground">Current ratio</p>
          </div>
          <Badge className={riskLevel.color}>
            {riskLevel.level}
          </Badge>
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
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip 
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const data = payload[0]?.payload as DebtToIncomeData;
                  return (
                    <div className="rounded-lg border bg-background p-3 shadow-sm">
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-sm text-muted-foreground">
                        Ratio: {data?.ratio.toFixed(1)}%
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Debt: ${(data?.totalDebt || 0).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Income: ${(data?.monthlyIncome || 0).toLocaleString()}/month
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            {/* Reference lines for risk levels */}
            <ReferenceLine y={20} stroke="var(--color-chart-2)" strokeDasharray="2 2" />
            <ReferenceLine y={36} stroke="var(--color-chart-3)" strokeDasharray="2 2" />
            <Line
              type="monotone"
              dataKey="ratio"
              stroke={chartConfig.ratio.color}
              strokeWidth={3}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ChartContainer>

        {/* Risk Level Info */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Below 20%: Excellent financial health</p>
          <p>• 20-36%: Good manageable debt level</p>
          <p>• Above 36%: Consider reducing debt</p>
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { CurrencyDisplay } from "@/components/currency/currency-display";
import { useCurrency } from "@/contexts/currency-context";
import { Progress } from "@/components/ui/progress";
import { Wallet, Target, PiggyBank } from "lucide-react";

interface FundProgressData {
  month: string;
  emergencyFund: number;
  carFund: number;
  retirementFund: number;
  targetEmergency: number;
  targetCar: number;
  targetRetirement: number;
}

interface FundProgressChartProps {
  data: FundProgressData[];
  currentFunds: {
    emergency: { current: number; target: number; };
    car: { current: number; target: number; };
    retirement: { current: number; target: number; };
  };
  isLoading?: boolean;
}

export function FundProgressChart({ data, currentFunds, isLoading }: FundProgressChartProps) {
  const { primaryCurrency } = useCurrency();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Fund Progress</CardTitle>
          <CardDescription>Track your savings goals over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] animate-pulse bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  const chartConfig = {
    emergencyFund: {
      label: "Emergency Fund",
      color: "var(--color-chart-1)",
    },
    carFund: {
      label: "Car Fund",
      color: "var(--color-chart-2)",
    },
    retirementFund: {
      label: "Retirement Fund",
      color: "var(--color-chart-3)",
    },
  };

  const calculateProgress = (current: number, target: number) => {
    return target > 0 ? Math.min(100, (current / target) * 100) : 0;
  };

  const funds = [
    {
      name: "Emergency Fund",
      icon: <Wallet className="h-4 w-4" />,
      current: currentFunds.emergency.current,
      target: currentFunds.emergency.target,
      progress: calculateProgress(currentFunds.emergency.current, currentFunds.emergency.target),
      color: "text-red-600",
      bgColor: "bg-red-50 dark:bg-red-950",
    },
    {
      name: "Car Fund",
      icon: <PiggyBank className="h-4 w-4" />,
      current: currentFunds.car.current,
      target: currentFunds.car.target,
      progress: calculateProgress(currentFunds.car.current, currentFunds.car.target),
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950",
    },
    {
      name: "Retirement Fund",
      icon: <Target className="h-4 w-4" />,
      current: currentFunds.retirement.current,
      target: currentFunds.retirement.target,
      progress: calculateProgress(currentFunds.retirement.current, currentFunds.retirement.target),
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Fund Progress Tracker
        </CardTitle>
        <CardDescription>Monitor your savings goals and milestones</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          {funds.map((fund) => (
            <div key={fund.name} className={`p-4 rounded-lg ${fund.bgColor}`}>
              <div className="flex items-center gap-2 mb-2">
                {fund.icon}
                <span className="font-medium text-sm">{fund.name}</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <CurrencyDisplay amount={fund.current} currency={primaryCurrency} variant="small" />
                  <span className="text-muted-foreground">
                    <CurrencyDisplay amount={fund.target} currency={primaryCurrency} variant="small" />
                  </span>
                </div>
                <Progress value={fund.progress} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {fund.progress.toFixed(1)}% complete
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Chart */}
        <ChartContainer config={chartConfig} className="h-[300px]">
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
              dataKey="emergencyFund"
              stroke={chartConfig.emergencyFund.color}
              strokeWidth={3}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="carFund"
              stroke={chartConfig.carFund.color}
              strokeWidth={3}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="retirementFund"
              stroke={chartConfig.retirementFund.color}
              strokeWidth={3}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ChartContainer>

        {/* Fund Goals Info */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Emergency Fund: 3-6 months of expenses</p>
          <p>• Car Fund: Vehicle purchase or replacement</p>
          <p>• Retirement Fund: Long-term financial security</p>
        </div>
      </CardContent>
    </Card>
  );
}

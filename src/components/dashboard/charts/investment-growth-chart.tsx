"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { CurrencyDisplay } from "@/components/currency/currency-display";
import { useCurrency } from "@/contexts/currency-context";
import { TrendingUp, Target, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface InvestmentGrowthData {
  month: string;
  historical: number;
  projected: number;
  growthRate: number;
}

interface InvestmentGrowthChartProps {
  data: InvestmentGrowthData[];
  currentValue: number;
  averageGrowthRate: number;
  projectedValue: number;
  isLoading?: boolean;
}

export function InvestmentGrowthChart({ 
  data, 
  currentValue, 
  averageGrowthRate, 
  projectedValue, 
  isLoading 
}: InvestmentGrowthChartProps) {
  const { primaryCurrency } = useCurrency();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Investment Growth</CardTitle>
          <CardDescription>Track portfolio performance and future projections</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] animate-pulse bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  const chartConfig = {
    historical: {
      label: "Historical Value",
      color: "var(--color-chart-1)",
    },
    projected: {
      label: "Projected Value",
      color: "var(--color-chart-2)",
    },
  };

  const historicalData = data.filter(d => d.historical > 0);
  const projectedData = data.filter(d => d.projected > 0);
  const combinedData = data;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Investment Growth Analysis
        </CardTitle>
        <CardDescription>Track portfolio performance and future projections</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              <CurrencyDisplay amount={currentValue} currency={primaryCurrency} variant="large" showOriginal={false} />
            </p>
            <p className="text-xs text-muted-foreground">Current Value</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">
              {averageGrowthRate > 0 ? '+' : ''}{averageGrowthRate.toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground">Avg Growth Rate</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">
              <CurrencyDisplay amount={projectedValue} currency={primaryCurrency} variant="large" showOriginal={false} />
            </p>
            <p className="text-xs text-muted-foreground">Projected (2Y)</p>
          </div>
          <div className="text-center">
            <Badge variant={averageGrowthRate > 7 ? "default" : averageGrowthRate > 3 ? "secondary" : "destructive"}>
              {averageGrowthRate > 7 ? "Strong" : averageGrowthRate > 3 ? "Moderate" : "Weak"} Growth
            </Badge>
          </div>
        </div>

        {/* Tabs for different views */}
        <Tabs defaultValue="combined" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="combined">Combined View</TabsTrigger>
            <TabsTrigger value="historical">Historical Only</TabsTrigger>
            <TabsTrigger value="projected">Projection Only</TabsTrigger>
          </TabsList>

          <TabsContent value="combined" className="space-y-4">
            <ChartContainer config={chartConfig} className="h-[300px]">
              <LineChart data={combinedData}>
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
                  dataKey="historical"
                  stroke={chartConfig.historical.color}
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  connectNulls={false}
                />
                <Line
                  type="monotone"
                  dataKey="projected"
                  stroke={chartConfig.projected.color}
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 3 }}
                  connectNulls={false}
                />
              </LineChart>
            </ChartContainer>
          </TabsContent>

          <TabsContent value="historical" className="space-y-4">
            <ChartContainer config={chartConfig} className="h-[300px]">
              <AreaChart data={historicalData}>
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
                          <p className="text-sm">
                            Value: <CurrencyDisplay amount={payload[0]?.value as number} currency={primaryCurrency} variant="small" />
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="historical"
                  stroke={chartConfig.historical.color}
                  fill={chartConfig.historical.color}
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ChartContainer>
          </TabsContent>

          <TabsContent value="projected" className="space-y-4">
            <ChartContainer config={chartConfig} className="h-[300px]">
              <LineChart data={projectedData}>
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
                          <p className="text-sm font-medium">{label} (Projected)</p>
                          <p className="text-sm">
                            Value: <CurrencyDisplay amount={payload[0]?.value as number} currency={primaryCurrency} variant="small" />
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="projected"
                  stroke={chartConfig.projected.color}
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ChartContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

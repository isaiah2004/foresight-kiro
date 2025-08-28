"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { CurrencyDisplay } from "@/components/currency/currency-display";
import { useCurrency } from "@/contexts/currency-context";
import { Home, Car, TrendingUp, TrendingDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AssetData {
  month: string;
  homes: number;
  cars: number;
  land: number;
  totalAssets: number;
}

interface AssetGrowthChartProps {
  data: AssetData[];
  currentAssets: {
    homes: number;
    cars: number;
    land: number;
    total: number;
  };
  appreciation: {
    homes: number;
    cars: number;
    land: number;
    total: number;
  };
  isLoading?: boolean;
}

export function AssetGrowthChart({ 
  data, 
  currentAssets, 
  appreciation, 
  isLoading 
}: AssetGrowthChartProps) {
  const { primaryCurrency } = useCurrency();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Asset Growth & Depreciation</CardTitle>
          <CardDescription>Track value changes of your physical assets</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] animate-pulse bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  const chartConfig = {
    homes: {
      label: "Real Estate",
      color: "var(--color-chart-1)",
    },
    cars: {
      label: "Vehicles",
      color: "var(--color-chart-2)",
    },
    land: {
      label: "Land",
      color: "var(--color-chart-3)",
    },
    totalAssets: {
      label: "Total Assets",
      color: "var(--color-chart-4)",
    },
  };

  const assets = [
    {
      name: "Real Estate",
      icon: <Home className="h-4 w-4" />,
      value: currentAssets.homes,
      change: appreciation.homes,
      color: appreciation.homes >= 0 ? "text-green-600" : "text-red-600",
      bgColor: "bg-blue-50 dark:bg-blue-950",
    },
    {
      name: "Vehicles",
      icon: <Car className="h-4 w-4" />,
      value: currentAssets.cars,
      change: appreciation.cars,
      color: appreciation.cars >= 0 ? "text-green-600" : "text-red-600",
      bgColor: "bg-orange-50 dark:bg-orange-950",
    },
    {
      name: "Land",
      icon: <TrendingUp className="h-4 w-4" />,
      value: currentAssets.land,
      change: appreciation.land,
      color: appreciation.land >= 0 ? "text-green-600" : "text-red-600",
      bgColor: "bg-green-50 dark:bg-green-950",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Home className="h-5 w-5" />
          Asset Growth & Depreciation
        </CardTitle>
        <CardDescription>Track value changes of your physical assets over time</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Asset Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          {assets.map((asset) => (
            <div key={asset.name} className={`p-4 rounded-lg ${asset.bgColor}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {asset.icon}
                  <span className="font-medium text-sm">{asset.name}</span>
                </div>
                {asset.change >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
              </div>
              <div className="space-y-1">
                <p className="text-lg font-bold">
                  <CurrencyDisplay amount={asset.value} currency={primaryCurrency} variant="large" showOriginal={false} />
                </p>
                <div className="flex items-center justify-between">
                  <Badge variant={asset.change >= 0 ? "default" : "destructive"}>
                    {asset.change >= 0 ? '+' : ''}{asset.change.toFixed(1)}%
                  </Badge>
                  <p className="text-xs text-muted-foreground">
                    {asset.change >= 0 ? 'Appreciation' : 'Depreciation'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Total Assets Summary */}
        <div className="p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Asset Value</p>
              <p className="text-2xl font-bold">
                <CurrencyDisplay amount={currentAssets.total} currency={primaryCurrency} variant="large" showOriginal={false} />
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-muted-foreground">Overall Change</p>
              <div className="flex items-center gap-2">
                {appreciation.total >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
                <Badge variant={appreciation.total >= 0 ? "default" : "destructive"}>
                  {appreciation.total >= 0 ? '+' : ''}{appreciation.total.toFixed(1)}%
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Chart */}
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
                    <div className="rounded-lg border bg-background p-3 shadow-sm">
                      <p className="text-sm font-medium">{label}</p>
                      {payload.reverse().map((entry, index) => (
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
              dataKey="land"
              stackId="1"
              stroke={chartConfig.land.color}
              fill={chartConfig.land.color}
              fillOpacity={0.8}
            />
            <Area
              type="monotone"
              dataKey="homes"
              stackId="1"
              stroke={chartConfig.homes.color}
              fill={chartConfig.homes.color}
              fillOpacity={0.8}
            />
            <Area
              type="monotone"
              dataKey="cars"
              stackId="1"
              stroke={chartConfig.cars.color}
              fill={chartConfig.cars.color}
              fillOpacity={0.8}
            />
          </AreaChart>
        </ChartContainer>

        {/* Asset Type Info */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Real Estate: Generally appreciates over time</p>
          <p>• Vehicles: Typically depreciate, especially in first few years</p>
          <p>• Land: Often stable or appreciating investment</p>
        </div>
      </CardContent>
    </Card>
  );
}

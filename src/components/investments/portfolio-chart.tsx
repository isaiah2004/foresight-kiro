"use client";

import { Investment } from '@/types/financial';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer } from '@/components/ui/chart';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { useCurrency } from '@/contexts/currency-context';

interface PortfolioChartProps {
  investments: Investment[];
}

export function PortfolioChart({ investments }: PortfolioChartProps) {
  const { formatCurrency } = useCurrency();
  // Calculate portfolio distribution by type
  const getPortfolioDistribution = () => {
    const distribution: Record<string, { value: number; count: number }> = {};
    
    investments.forEach(investment => {
      const currentPrice = investment.currentPrice?.amount || investment.purchasePrice.amount;
      const value = currentPrice * investment.quantity;
      
      if (!distribution[investment.type]) {
        distribution[investment.type] = { value: 0, count: 0 };
      }
      
      distribution[investment.type].value += value;
      distribution[investment.type].count += 1;
    });

    const typeLabels: Record<string, string> = {
      stocks: 'Stocks',
      bonds: 'Bonds',
      mutual_funds: 'Mutual Funds',
      real_estate: 'Real Estate',
      crypto: 'Cryptocurrency',
      other: 'Other',
    };

    return Object.entries(distribution).map(([type, data]) => ({
      name: typeLabels[type] || type,
      value: data.value,
      count: data.count,
      type,
    }));
  };

  // Calculate individual investment performance
  const getInvestmentPerformance = () => {
    return investments.map(investment => {
      const currentPrice = investment.currentPrice?.amount || investment.purchasePrice.amount;
      const currentValue = currentPrice * investment.quantity;
      const costBasis = investment.purchasePrice.amount * investment.quantity;
      const gainLoss = currentValue - costBasis;
      const gainLossPercentage = costBasis > 0 ? (gainLoss / costBasis) * 100 : 0;

      return {
        name: investment.name.length > 15 ? investment.name.substring(0, 15) + '...' : investment.name,
        fullName: investment.name,
        currentValue,
        costBasis,
        gainLoss,
        gainLossPercentage,
        symbol: investment.symbol,
      };
    }).sort((a, b) => b.currentValue - a.currentValue);
  };

  const distributionData = getPortfolioDistribution();
  const performanceData = getInvestmentPerformance();

  // Colors for the charts
  const COLORS = [
    '#0088FE', // Blue
    '#00C49F', // Green
    '#FFBB28', // Yellow
    '#FF8042', // Orange
    '#8884D8', // Purple
    '#82CA9D', // Light Green
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.dataKey === 'currentValue' && `Current Value: ${formatCurrency(entry.value)}`}
              {entry.dataKey === 'costBasis' && `Cost Basis: ${formatCurrency(entry.value)}`}
              {entry.dataKey === 'gainLoss' && `Gain/Loss: ${formatCurrency(entry.value)}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p>Value: {formatCurrency(data.value)}</p>
          <p>Investments: {data.count}</p>
          <p>Percentage: {((data.value / distributionData.reduce((sum, item) => sum + item.value, 0)) * 100).toFixed(1)}%</p>
        </div>
      );
    }
    return null;
  };

  if (investments.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No investments to display. Add some investments to see your portfolio charts!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Portfolio Distribution */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Portfolio Distribution</CardTitle>
            <CardDescription>
              Breakdown of your investments by asset type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{}}
              className="mx-auto aspect-square max-h-[300px]"
            >
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Asset Allocation</CardTitle>
            <CardDescription>
              Value and count by investment type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {distributionData.map((item, index) => {
                const totalValue = distributionData.reduce((sum, d) => sum + d.value, 0);
                const percentage = totalValue > 0 ? (item.value / totalValue) * 100 : 0;
                
                return (
                  <div key={item.type} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-sm font-medium">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{formatCurrency(item.value)}</div>
                      <div className="text-xs text-muted-foreground">
                        {percentage.toFixed(1)}% • {item.count} investment{item.count !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Investment Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Investment Performance</CardTitle>
          <CardDescription>
            Current value vs. cost basis for each investment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{}}
            className="h-[400px]"
          >
            <BarChart data={performanceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={12}
              />
              <YAxis 
                tickFormatter={(value) => formatCurrency(value)}
                fontSize={12}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="costBasis" fill="#8884d8" name="Cost Basis" />
              <Bar dataKey="currentValue" fill="#82ca9d" name="Current Value" />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Gain/Loss Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Gain/Loss by Investment</CardTitle>
          <CardDescription>
            Profit or loss for each investment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{}}
            className="h-[300px]"
          >
            <BarChart data={performanceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={12}
              />
              <YAxis 
                tickFormatter={(value) => formatCurrency(value)}
                fontSize={12}
              />
              <Tooltip 
                formatter={(value: number) => [formatCurrency(value), 'Gain/Loss']}
                labelFormatter={(label) => {
                  const item = performanceData.find(d => d.name === label);
                  return item?.fullName || label;
                }}
              />
              <Bar 
                dataKey="gainLoss" 
                fill="#8884d8"
                name="Gain/Loss"
              >
                {performanceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.gainLoss >= 0 ? '#22c55e' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
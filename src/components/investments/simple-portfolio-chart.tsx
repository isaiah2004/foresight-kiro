"use client";

import { useEffect, useMemo, useState } from 'react';
import { Investment } from '@/types/financial';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCurrency } from '@/contexts/currency-context';
import { SimplePortfolioChartSkeleton } from './simple-portfolio-chart-skeleton';

interface SimplePortfolioChartProps {
  investments: Investment[];
}

export function SimplePortfolioChart({ investments }: SimplePortfolioChartProps) {
  const { formatCurrency, convertAmount, primaryCurrency, isLoading: contextLoading } = useCurrency();

  // Local state for converted/aggregated data in primary currency
  const [isConverting, setIsConverting] = useState<boolean>(true);
  const [distributionData, setDistributionData] = useState<Array<{ name: string; value: number; count: number; type: string }>>([]);
  const [performanceData, setPerformanceData] = useState<Array<{ name: string; symbol?: string; currentValue: number; costBasis: number; gainLoss: number; gainLossPercentage: number }>>([]);

  // Labels map memoized
  const typeLabels = useMemo<Record<string, string>>(() => ({
    stocks: 'Stocks',
    bonds: 'Bonds',
    mutual_funds: 'Mutual Funds',
    real_estate: 'Real Estate',
    crypto: 'Cryptocurrency',
    other: 'Other',
  }), []);

  useEffect(() => {
    let cancelled = false;
    const convertAll = async () => {
      // Wait for context to be ready
      if (contextLoading) return;
      setIsConverting(true);

      try {
        // Build distribution map in primary currency
        const distribution: Record<string, { value: number; count: number }> = {};

        // Build performance array in primary currency
        const perf: Array<{ name: string; symbol?: string; currentValue: number; costBasis: number; gainLoss: number; gainLossPercentage: number }> = [];

        // Convert each investment's relevant amounts to primary currency
        for (const inv of investments) {
          // Determine currencies
          const unitCurrentAmount = inv.currentPrice?.amount ?? inv.purchasePrice.amount;
          const unitCurrentCurrency = inv.currentPrice?.currency ?? inv.currency ?? inv.purchasePrice.currency;
          const unitPurchaseAmount = inv.purchasePrice.amount;
          const unitPurchaseCurrency = inv.purchasePrice.currency ?? inv.currency;

          // Convert unit prices to primary currency
          const [convertedCurrent, convertedPurchase] = await Promise.all([
            convertAmount(unitCurrentAmount, unitCurrentCurrency, primaryCurrency),
            convertAmount(unitPurchaseAmount, unitPurchaseCurrency, primaryCurrency),
          ]);

          const currentValue = convertedCurrent.amount * inv.quantity;
          const costBasis = convertedPurchase.amount * inv.quantity;
          const gainLoss = currentValue - costBasis;
          const gainLossPercentage = costBasis > 0 ? (gainLoss / costBasis) * 100 : 0;

          // Distribution by type
          if (!distribution[inv.type]) {
            distribution[inv.type] = { value: 0, count: 0 };
          }
          distribution[inv.type].value += currentValue;
          distribution[inv.type].count += 1;

          // Performance row
          perf.push({
            name: inv.name,
            symbol: inv.symbol,
            currentValue,
            costBasis,
            gainLoss,
            gainLossPercentage,
          });
        }

        if (!cancelled) {
          const distArray = Object.entries(distribution).map(([type, data]) => ({
            name: typeLabels[type] || type,
            value: data.value,
            count: data.count,
            type,
          }));

          perf.sort((a, b) => b.currentValue - a.currentValue);

          setDistributionData(distArray);
          setPerformanceData(perf);
        }
      } catch (e) {
        // On failure, fall back to non-converted values to avoid blank UI
        if (!cancelled) {
          const distribution: Record<string, { value: number; count: number }> = {};
          const perf = investments.map(inv => {
            const currentPrice = inv.currentPrice?.amount ?? inv.purchasePrice.amount;
            const currentValue = currentPrice * inv.quantity;
            const costBasis = inv.purchasePrice.amount * inv.quantity;
            const gainLoss = currentValue - costBasis;
            const gainLossPercentage = costBasis > 0 ? (gainLoss / costBasis) * 100 : 0;

            if (!distribution[inv.type]) distribution[inv.type] = { value: 0, count: 0 };
            distribution[inv.type].value += currentValue;
            distribution[inv.type].count += 1;

            return { name: inv.name, symbol: inv.symbol, currentValue, costBasis, gainLoss, gainLossPercentage };
          }).sort((a, b) => b.currentValue - a.currentValue);

          const distArray = Object.entries(distribution).map(([type, data]) => ({
            name: typeLabels[type] || type,
            value: data.value,
            count: data.count,
            type,
          }));

          setDistributionData(distArray);
          setPerformanceData(perf);
        }
      } finally {
        if (!cancelled) setIsConverting(false);
      }
    };

    convertAll();
    return () => { cancelled = true; };
  }, [investments, primaryCurrency, convertAmount, contextLoading, typeLabels]);

  const totalValue = useMemo(() => distributionData.reduce((sum, item) => sum + item.value, 0), [distributionData]);

  // Colors for the charts
  const COLORS = [
    '#3b82f6', // Blue
    '#10b981', // Green
    '#f59e0b', // Yellow
    '#ef4444', // Red
    '#8b5cf6', // Purple
    '#06b6d4', // Cyan
  ];



  if (investments.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No investments to display. Add some investments to see your portfolio charts!</p>
      </div>
    );
  }

  if (contextLoading || isConverting) {
    return <SimplePortfolioChartSkeleton />;
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
            <div className="space-y-4">
              {distributionData.map((item, index) => {
                const percentage = totalValue > 0 ? (item.value / totalValue) * 100 : 0;
                
                return (
                  <div key={item.type} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-sm font-medium">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{formatCurrency(item.value)}</div>
                        <div className="text-xs text-muted-foreground">
                          {percentage.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${percentage}%`,
                          backgroundColor: COLORS[index % COLORS.length]
                        }}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {item.count} investment{item.count !== 1 ? 's' : ''}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Investments</CardTitle>
            <CardDescription>
              Your largest investments by current value
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {performanceData.slice(0, 5).map((investment, index) => {
                const isPositive = investment.gainLoss >= 0;
                
                return (
                  <div key={investment.name} className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium truncate">{investment.name}</span>
                        {investment.symbol && (
                          <code className="text-xs bg-muted px-1 py-0.5 rounded">
                            {investment.symbol}
                          </code>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Current: {formatCurrency(investment.currentValue)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        {isPositive ? '+' : ''}{formatCurrency(investment.gainLoss)}
                      </div>
                      <div className={`text-xs ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        {isPositive ? '+' : ''}{investment.gainLossPercentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Investment Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Summary</CardTitle>
          <CardDescription>
            Overview of all your investments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
              <div className="text-sm text-muted-foreground">Total Portfolio Value</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold">
                {performanceData.reduce((sum, inv) => sum + inv.costBasis, 0) > 0 
                  ? formatCurrency(performanceData.reduce((sum, inv) => sum + inv.costBasis, 0))
                  : '$0.00'
                }
              </div>
              <div className="text-sm text-muted-foreground">Total Cost Basis</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              {(() => {
                const totalGainLoss = performanceData.reduce((sum, inv) => sum + inv.gainLoss, 0);
                const isPositive = totalGainLoss >= 0;
                return (
                  <>
                    <div className={`text-2xl font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                      {isPositive ? '+' : ''}{formatCurrency(totalGainLoss)}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Gain/Loss</div>
                  </>
                );
              })()}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* All Investments Performance */}
      <Card>
        <CardHeader>
          <CardTitle>All Investments</CardTitle>
          <CardDescription>
            Performance of each investment in your portfolio
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {performanceData.map((investment) => {
              const isPositive = investment.gainLoss >= 0;
              const maxValue = Math.max(...performanceData.map(inv => inv.currentValue));
              const barWidth = maxValue > 0 ? (investment.currentValue / maxValue) * 100 : 0;
              
              return (
                <div key={investment.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <span className="text-sm font-medium truncate">{investment.name}</span>
                      {investment.symbol && (
                        <code className="text-xs bg-muted px-1 py-0.5 rounded">
                          {investment.symbol}
                        </code>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{formatCurrency(investment.currentValue)}</div>
                      <div className={`text-xs ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        {isPositive ? '+' : ''}{formatCurrency(investment.gainLoss)} ({isPositive ? '+' : ''}{investment.gainLossPercentage.toFixed(1)}%)
                      </div>
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="h-2 rounded-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
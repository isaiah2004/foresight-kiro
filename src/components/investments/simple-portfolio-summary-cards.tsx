"use client";

import { PortfolioSummary } from "@/types/financial";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  Shield,
} from "lucide-react";
import { useCurrency } from "@/contexts/currency-context";

interface SimplePortfolioSummaryCardsProps {
  summary: PortfolioSummary;
}

export function SimplePortfolioSummaryCards({
  summary,
}: SimplePortfolioSummaryCardsProps) {
  const { formatCurrency } = useCurrency();
  const isPositive = summary.totalGainLoss.amount >= 0;
  
  console.log('Summary data in cards:', summary);

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "low":
        return "text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300";
      case "medium":
        return "text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300";
      case "high":
        return "text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300";
      default:
        return "text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getDiversificationColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getDiversificationLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    return "Needs improvement";
  };

  const getRiskDescription = (riskLevel: string) => {
    switch (riskLevel) {
      case "low":
        return "Conservative approach with stable returns";
      case "medium":
        return "Balanced approach with moderate risk";
      case "high":
        return "Aggressive approach with higher volatility";
      default:
        return "Risk level assessment";
    }
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Total Portfolio Value */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(summary.totalValue.amount)}
          </div>
          <p className="text-xs text-muted-foreground">
            Total market value of all investments
          </p>
        </CardContent>
      </Card>

      {/* Total Gain/Loss */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Return</CardTitle>
          {isPositive ? (
            <TrendingUp className="h-4 w-4 text-green-600" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-600" />
          )}
        </CardHeader>
        <CardContent>
          <div
            className={`text-2xl font-bold ${
              isPositive ? "text-green-600" : "text-red-600"
            }`}
          >
            {formatCurrency(summary.totalGainLoss.amount)}
          </div>
          <p
            className={`text-xs ${
              isPositive ? "text-green-600" : "text-red-600"
            }`}
          >
            {formatPercentage(summary.gainLossPercentage)} return
          </p>
        </CardContent>
      </Card>

      {/* Diversification Score */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Diversification</CardTitle>
          <PieChart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div
            className={`text-2xl font-bold ${getDiversificationColor(
              summary.diversificationScore
            )}`}
          >
            {Math.round(summary.diversificationScore)}%
          </div>
          <p className="text-xs text-muted-foreground">
            {getDiversificationLabel(summary.diversificationScore)}
          </p>
        </CardContent>
      </Card>

      {/* Risk Level */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Risk Level</CardTitle>
          <Shield className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div
            className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${getRiskLevelColor(
              summary.riskLevel
            )}`}
          >
            {summary.riskLevel.toUpperCase()} RISK
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {getRiskDescription(summary.riskLevel)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { PortfolioSummary } from "@/types/financial";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  Shield,
} from "lucide-react";
import { formatPercentage } from "@/lib/dashboard-calculations";
import { useCurrency } from "@/contexts/currency-context";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

interface PortfolioSummaryCardsProps {
  summary: PortfolioSummary;
}

export function PortfolioSummaryCards({ summary }: PortfolioSummaryCardsProps) {
  const { formatCurrency } = useCurrency();
  const isPositive = summary.totalGainLoss.amount >= 0;

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getDiversificationColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
          <CardTitle className="text-sm font-medium">
            <HoverCard>
              <HoverCardTrigger className="cursor-help">
                Diversification
              </HoverCardTrigger>
              <HoverCardContent className="w-80">
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">
                    Portfolio Diversification
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Measures how well your investments are spread across
                    different asset types. Higher diversification can help
                    reduce risk by not putting all your money in one type of
                    investment.
                  </p>
                  <div className="text-xs text-muted-foreground">
                    • 80-100%: Excellent diversification
                    <br />
                    • 60-79%: Good diversification
                    <br />• Below 60%: Consider diversifying more
                  </div>
                </div>
              </HoverCardContent>
            </HoverCard>
          </CardTitle>
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
            {summary.diversificationScore >= 80
              ? "Excellent"
              : summary.diversificationScore >= 60
              ? "Good"
              : "Needs improvement"}
          </p>
        </CardContent>
      </Card>

      {/* Risk Level */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            <HoverCard>
              <HoverCardTrigger className="cursor-help">
                Risk Level
              </HoverCardTrigger>
              <HoverCardContent className="w-80">
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">
                    Portfolio Risk Assessment
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Based on your investment mix, this shows how risky your
                    portfolio is. Higher risk investments can offer higher
                    returns but also higher potential losses.
                  </p>
                  <div className="text-xs text-muted-foreground">
                    • <span className="text-green-600">Low Risk</span>:
                    Conservative, stable investments
                    <br />• <span className="text-yellow-600">Medium Risk</span>
                    : Balanced mix of investments
                    <br />• <span className="text-red-600">High Risk</span>:
                    Aggressive, volatile investments
                  </div>
                </div>
              </HoverCardContent>
            </HoverCard>
          </CardTitle>
          <Shield className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <Badge className={getRiskLevelColor(summary.riskLevel)}>
            {summary.riskLevel.toUpperCase()} RISK
          </Badge>
          <p className="text-xs text-muted-foreground mt-2">
            {summary.riskLevel === "low" &&
              "Conservative approach with stable returns"}
            {summary.riskLevel === "medium" &&
              "Balanced approach with moderate risk"}
            {summary.riskLevel === "high" &&
              "Aggressive approach with higher volatility"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

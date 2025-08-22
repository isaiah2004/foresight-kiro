"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { InvestmentDocument, InvestmentType } from "@/types/financial";
import { InvestmentTable } from "./investment-table";
import { BondInvestmentTable } from "./bond-investment-table";
import { RealEstateInvestmentTable } from "./real-estate-investment-table";
import { InvestmentDialog } from "./investment-dialog";
import { InvestmentsByTypeSkeleton } from "./investments-by-type-skeleton";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/contexts/currency-context";

interface InvestmentsByTypeProps {
  type: InvestmentType;
}

export function InvestmentsByType({ type }: InvestmentsByTypeProps) {
  const { user, isLoaded } = useUser();
  const { toast } = useToast();
  const { formatCurrency, convertAmount, primaryCurrency } = useCurrency();
  const [investments, setInvestments] = useState<InvestmentDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingInvestment, setEditingInvestment] =
    useState<InvestmentDocument | null>(null);
  const [summary, setSummary] = useState({
    totalValue: 0,
    totalCost: 0,
    totalGainLoss: 0,
    gainLossPercentage: 0,
    count: 0,
  });

  const fetchInvestments = async () => {
    try {
      const response = await fetch(`/api/investments?type=${type}`);
      if (!response.ok) throw new Error("Failed to fetch investments");

      const data = await response.json();
      setInvestments(data.investments);
    } catch (error) {
      console.error("Error fetching investments:", error);
      toast({
        title: "Error",
        description: "Failed to load investments. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate summary whenever investments change
  const updateSummary = async () => {
    if (investments.length === 0) {
      setSummary({
        totalValue: 0,
        totalCost: 0,
        totalGainLoss: 0,
        gainLossPercentage: 0,
        count: 0,
      });
      return;
    }

    const summaryData = await calculateSummary();
    setSummary(summaryData);
  };

  // Update summary when investments change
  useEffect(() => {
    if (investments.length > 0) {
      updateSummary().catch((error) => {
        console.error("Error updating summary:", error);
        // Fallback to simple calculation without currency conversion
        const simpleSummary = {
          totalValue: investments.reduce((sum, inv) => {
            const currentPrice =
              inv.currentPrice?.amount || inv.purchasePrice.amount;
            return sum + currentPrice * inv.quantity;
          }, 0),
          totalCost: investments.reduce(
            (sum, inv) => sum + inv.purchasePrice.amount * inv.quantity,
            0
          ),
          totalGainLoss: 0,
          gainLossPercentage: 0,
          count: investments.length,
        };
        simpleSummary.totalGainLoss =
          simpleSummary.totalValue - simpleSummary.totalCost;
        simpleSummary.gainLossPercentage =
          simpleSummary.totalCost > 0
            ? (simpleSummary.totalGainLoss / simpleSummary.totalCost) * 100
            : 0;
        setSummary(simpleSummary);
      });
    }
  }, [investments]); // eslint-disable-line react-hooks/exhaustive-deps

  const refreshPrices = async () => {
    console.log("Refresh Prices button clicked!");
    setRefreshing(true);
    try {
      // Get all investments with symbols
      const symbolInvestments = investments.filter((inv) => inv.symbol);
      if (symbolInvestments.length === 0) {
        toast({
          title: "No symbols to refresh",
          description:
            "Add symbols to your investments to get real-time prices.",
        });
        setRefreshing(false);
        return;
      }

      console.log(
        "Starting price refresh for investments:",
        symbolInvestments.map((inv) => ({
          name: inv.name,
          symbol: inv.symbol,
          type: inv.type,
        }))
      );

      // Separate crypto and non-crypto investments
      const cryptoInvestments = symbolInvestments.filter(
        (inv) => inv.type === "crypto"
      );
      const stockInvestments = symbolInvestments.filter(
        (inv) => inv.type !== "crypto"
      );

      const quotes: Record<string, any> = {};

      // Fetch crypto quotes using Alpha Vantage
      if (cryptoInvestments.length > 0) {
        const cryptoPromises = cryptoInvestments.map(async (investment) => {
          try {
            const response = await fetch(
              `/api/market-data/crypto-quote?symbol=${investment.symbol}`
            );
            if (response.ok) {
              const data = await response.json();
              quotes[investment.symbol!] = data;
            }
          } catch (error) {
            console.error(
              `Failed to fetch crypto quote for ${investment.symbol}:`,
              error
            );
          }
        });
        await Promise.all(cryptoPromises);
      }

      // Fetch stock quotes using FinnHub
      if (stockInvestments.length > 0) {
        const symbols = stockInvestments.map((inv) => inv.symbol!).join(",");
        try {
          const response = await fetch(
            `/api/market-data/quote?symbols=${symbols}`
          );
          if (response.ok) {
            const data = await response.json();
            Object.assign(quotes, data.quotes);
          }
        } catch (error) {
          console.error("Failed to fetch stock quotes:", error);
        }
      }

      // Update investments with new prices
      console.log("All quotes received:", quotes);

      const updatePromises = symbolInvestments.map(async (investment) => {
        const quote = quotes[investment.symbol!];
        console.log(`Processing ${investment.symbol}: quote =`, quote);

        // Handle different quote structures (crypto vs stock)
        const currentPrice =
          quote?.cryptoQuote?.currentPrice || quote?.currentPrice;

        if (quote && currentPrice > 0) {
          console.log(
            `Updating ${investment.symbol} with price ${currentPrice}`
          );

          const updateResponse = await fetch(
            `/api/investments/${investment.id}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                currentPrice: {
                  amount: currentPrice,
                  currency:
                    investment.currency ||
                    investment.purchasePrice?.currency ||
                    "USD",
                },
              }),
            }
          );

          if (!updateResponse.ok) {
            const errorData = await updateResponse.json();
            console.error(`Failed to update ${investment.symbol}:`, errorData);
            throw new Error(
              `Failed to update ${investment.symbol}: ${
                errorData.error || "Unknown error"
              }`
            );
          } else {
            console.log(`Successfully updated ${investment.symbol}`);
          }
        } else {
          console.log(
            `Skipping ${
              investment.symbol
            }: quote=${quote}, currentPrice=${currentPrice}, rawQuote=${JSON.stringify(
              quote
            )}`
          );
        }
      });

      await Promise.all(updatePromises);

      // Refresh data
      await fetchInvestments();

      toast({
        title: "Prices updated",
        description:
          "Investment prices have been refreshed with latest market data.",
      });
    } catch (error) {
      console.error("Error refreshing prices:", error);
      toast({
        title: "Error",
        description: "Failed to refresh prices. Please try again.",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleInvestmentSaved = async () => {
    await fetchInvestments();
    setDialogOpen(false);
    setEditingInvestment(null);
  };

  const handleEditInvestment = (investment: InvestmentDocument) => {
    setEditingInvestment(investment);
    setDialogOpen(true);
  };

  const handleDeleteInvestment = async (id: string) => {
    try {
      const response = await fetch(`/api/investments/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete investment");

      await fetchInvestments();

      toast({
        title: "Investment deleted",
        description: "The investment has been removed from your portfolio.",
      });
    } catch (error) {
      console.error("Error deleting investment:", error);
      toast({
        title: "Error",
        description: "Failed to delete investment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddInvestment = () => {
    setEditingInvestment(null);
    setDialogOpen(true);
  };

  // Calculate summary stats for this investment type
  const calculateSummary = async () => {
    let totalValue = 0;
    let totalCost = 0;

    // Convert each investment to primary currency before summing
    for (const investment of investments) {
      const currentPrice =
        investment.currentPrice?.amount || investment.purchasePrice.amount;
      const currentValue = currentPrice * investment.quantity;
      const costBasis = investment.purchasePrice.amount * investment.quantity;

      // Get the investment's currency
      const investmentCurrency =
        investment.currency ||
        investment.currentPrice?.currency ||
        investment.purchasePrice?.currency ||
        "USD";

      try {
        // Only convert if currency is different from primary currency
        if (investmentCurrency !== primaryCurrency && primaryCurrency) {
          // Convert current value to primary currency
          const convertedCurrentValue = await convertAmount(
            currentValue,
            investmentCurrency,
            primaryCurrency
          );
          totalValue += convertedCurrentValue.amount;

          // Convert cost basis to primary currency
          const convertedCostBasis = await convertAmount(
            costBasis,
            investmentCurrency,
            primaryCurrency
          );
          totalCost += convertedCostBasis.amount;
        } else {
          // Same currency, no conversion needed
          totalValue += currentValue;
          totalCost += costBasis;
        }
      } catch (error) {
        console.error(
          "Currency conversion failed for investment:",
          investment.name,
          error
        );
        // Fallback to original amounts if conversion fails
        totalValue += currentValue;
        totalCost += costBasis;
      }
    }

    const totalGainLoss = totalValue - totalCost;
    const gainLossPercentage =
      totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

    return {
      totalValue,
      totalCost,
      totalGainLoss,
      gainLossPercentage,
      count: investments.length,
    };
  };

  const getTypeInfo = (type: InvestmentType) => {
    const typeInfo = {
      stocks: {
        title: "Stocks",
        description: "Equity investments in publicly traded companies",
        education:
          "Stocks represent ownership shares in companies. They can provide growth through price appreciation and income through dividends.",
      },
      etf: {
        title: "ETFs",
        description: "Exchange-traded funds that track indexes or sectors",
        education:
          "ETFs are investment funds that trade on stock exchanges like individual stocks. They typically track an index, commodity, bonds, or basket of assets.",
      },
      options: {
        title: "Options",
        description: "Derivative contracts for buying or selling assets",
        education:
          "Options give you the right (but not obligation) to buy or sell an asset at a specific price before expiration. They can be used for hedging or speculation.",
      },
      bonds: {
        title: "Bonds",
        description: "Fixed-income securities and debt instruments",
        education:
          "Bonds are loans you make to companies or governments. They typically provide regular interest payments and return your principal at maturity.",
      },
      mutual_funds: {
        title: "Mutual Funds",
        description: "Professionally managed investment funds",
        education:
          "Mutual funds pool money from many investors to buy a diversified portfolio of stocks, bonds, or other securities.",
      },
      real_estate: {
        title: "Real Estate",
        description: "Property investments and REITs",
        education:
          "Real estate investments can include rental properties, REITs, or real estate funds that provide exposure to property markets.",
      },
      crypto: {
        title: "Cryptocurrency",
        description: "Digital currencies and blockchain assets",
        education:
          "Cryptocurrencies are digital assets that use blockchain technology. They are highly volatile and speculative investments.",
      },
      other: {
        title: "Other Investments",
        description: "Alternative and miscellaneous investments",
        education:
          "This category includes commodities, collectibles, and other alternative investment types.",
      },
    };
    return typeInfo[type];
  };

  useEffect(() => {
    console.log(
      "InvestmentsByType useEffect triggered. User:",
      user,
      "isLoaded:",
      isLoaded
    );
    if (isLoaded && user) {
      setLoading(true);
      fetchInvestments();
    }
  }, [user, isLoaded, type]); // eslint-disable-line react-hooks/exhaustive-deps

  // Show loading skeleton while data is being fetched
  if (!isLoaded || loading) {
    return <InvestmentsByTypeSkeleton type={type} />;
  }

  const typeInfo = getTypeInfo(type);
  const isPositive = summary.totalGainLoss >= 0;

  return (
    <div className="space-y-6">
      {/* Type Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>{typeInfo.title} Summary</CardTitle>
          <CardDescription>{typeInfo.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Value
              </p>
              <p className="text-2xl font-bold">
                {formatCurrency(summary.totalValue)}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Cost
              </p>
              <p className="text-lg">{formatCurrency(summary.totalCost)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Gain/Loss
              </p>
              <p
                className={`text-lg font-medium ${
                  isPositive ? "text-green-600" : "text-red-600"
                }`}
              >
                {isPositive ? "+" : ""}
                {formatCurrency(summary.totalGainLoss)}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Return
              </p>
              <p
                className={`text-lg font-medium ${
                  isPositive ? "text-green-600" : "text-red-600"
                }`}
              >
                {isPositive ? "+" : ""}
                {summary.gainLossPercentage.toFixed(2)}%
              </p>
            </div>
          </div>
          {/* <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              {typeInfo.education}
            </p>
          </div> */}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button onClick={handleAddInvestment}>
            <Plus className="mr-2 h-4 w-4" />
            Add {typeInfo.title}
          </Button>
          <Button
            variant="outline"
            onClick={refreshPrices}
            disabled={refreshing}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh Prices
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">
          {summary.count} investment{summary.count !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Investments Table */}
      {type === 'bonds' ? (
        <BondInvestmentTable
          investments={investments}
          onEdit={handleEditInvestment}
          onDelete={handleDeleteInvestment}
        />
      ) : type === 'real_estate' ? (
        <RealEstateInvestmentTable
          investments={investments}
          onEdit={handleEditInvestment}
          onDelete={handleDeleteInvestment}
        />
      ) : (
        <InvestmentTable
          investments={investments}
          onEdit={handleEditInvestment}
          onDelete={handleDeleteInvestment}
        />
      )}

      {/* Investment Dialog */}
      <InvestmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        investment={editingInvestment}
        onSaved={handleInvestmentSaved}
        defaultType={type}
        allowedTypes={
          type === 'stocks'
            ? (['stocks', 'etf', 'options'] as InvestmentType[])
            : type === 'etf'
            ? (['etf'] as InvestmentType[])
            : type === 'options'
            ? (['options'] as InvestmentType[])
            : undefined
        }
      />
    </div>
  );
}

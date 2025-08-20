"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import {
  InvestmentDocument,
  PortfolioSummary,
} from "@/types/financial";
import { SimpleInvestmentTable } from "./simple-investment-table";
import { InvestmentDialog } from "./investment-dialog";
import { SimplePortfolioSummaryCards } from "./simple-portfolio-summary-cards";
import { SimplePortfolioChart } from "./simple-portfolio-chart";
import { InvestmentPortfolioSkeleton } from "./investment-portfolio-skeleton";
import { CurrencyExposureAnalysis } from "./currency-exposure-analysis";
import { CurrencyHedgingRecommendations } from "./currency-hedging-recommendations";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function InvestmentPortfolio() {
  const { user } = useUser();
  const { toast } = useToast();
  const [investments, setInvestments] = useState<InvestmentDocument[]>([]);
  const [portfolioSummary, setPortfolioSummary] =
    useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingInvestment, setEditingInvestment] =
    useState<InvestmentDocument | null>(null);

  const fetchInvestments = async () => {
    try {
      const response = await fetch("/api/investments");
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
    }
  };

  const fetchPortfolioSummary = async () => {
    try {
      const response = await fetch("/api/investments/portfolio");
      if (!response.ok) throw new Error("Failed to fetch portfolio summary");

      const data = await response.json();
      console.log('Portfolio Summary received:', data.portfolioSummary);
      setPortfolioSummary(data.portfolioSummary);
    } catch (error) {
      console.error("Error fetching portfolio summary:", error);
      toast({
        title: "Error",
        description: "Failed to load portfolio summary. Please try again.",
        variant: "destructive",
      });
    }
  };

  const refreshPrices = async () => {
    console.log('Refresh Prices button clicked on Investment Portfolio!');
    setRefreshing(true);
    try {
      // Get all investments with symbols
      const symbolInvestments = investments.filter((inv) => inv.symbol);
      console.log(
        "Investments with symbols:",
        symbolInvestments.map((inv) => ({
          name: inv.name,
          symbol: inv.symbol,
          type: inv.type,
          currentPrice: inv.currentPrice,
        }))
      );

      if (symbolInvestments.length === 0) {
        toast({
          title: "No symbols to refresh",
          description:
            "Add symbols to your investments to get real-time prices.",
        });
        return;
      }
      
      console.log('Starting price refresh for investments:', symbolInvestments.map(inv => ({ name: inv.name, symbol: inv.symbol, type: inv.type })));

      // Separate crypto and non-crypto investments
      const cryptoInvestments = symbolInvestments.filter(inv => inv.type === 'crypto');
      const stockInvestments = symbolInvestments.filter(inv => inv.type !== 'crypto');

      const quotes: Record<string, any> = {};

      // Fetch crypto quotes using Alpha Vantage
      if (cryptoInvestments.length > 0) {
        console.log("Fetching crypto quotes for:", cryptoInvestments.map(inv => inv.symbol));
        const cryptoPromises = cryptoInvestments.map(async (investment) => {
          try {
            const response = await fetch(`/api/market-data/crypto-quote?symbol=${investment.symbol}`);
            if (response.ok) {
              const data = await response.json();
              quotes[investment.symbol!] = data;
            }
          } catch (error) {
            console.error(`Failed to fetch crypto quote for ${investment.symbol}:`, error);
          }
        });
        await Promise.all(cryptoPromises);
      }

      // Fetch stock quotes using FinnHub
      if (stockInvestments.length > 0) {
        const symbols = stockInvestments.map((inv) => inv.symbol!).join(",");
        console.log("Fetching stock quotes for symbols:", symbols);
        try {
          const response = await fetch(`/api/market-data/quote?symbols=${symbols}`);
          if (response.ok) {
            const data = await response.json();
            Object.assign(quotes, data.quotes);
          }
        } catch (error) {
          console.error('Failed to fetch stock quotes:', error);
        }
      }

      console.log("All received quotes:", quotes);

      // Update investments with new prices
      const updatePromises = symbolInvestments.map(async (investment) => {
        const quote = quotes[investment.symbol!];
        console.log(`Processing ${investment.symbol}: quote =`, quote);
        
        // Handle different quote structures (crypto vs stock)
        const currentPrice = quote?.cryptoQuote?.currentPrice || quote?.currentPrice;

        if (quote && currentPrice > 0) {
          console.log(`Updating ${investment.symbol} with price ${currentPrice}`);
          const updateResponse = await fetch(
            `/api/investments/${investment.id}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                currentPrice: {
                  amount: currentPrice,
                  currency: investment.currency || investment.purchasePrice?.currency || "USD",
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
            `Skipping ${investment.symbol}: quote=${quote}, currentPrice=${currentPrice}, rawQuote=${JSON.stringify(quote)}`
          );
        }
      });

      await Promise.all(updatePromises);

      // Refresh data
      await Promise.all([fetchInvestments(), fetchPortfolioSummary()]);

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
    await Promise.all([fetchInvestments(), fetchPortfolioSummary()]);
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

      await Promise.all([fetchInvestments(), fetchPortfolioSummary()]);

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

  useEffect(() => {
    if (user) {
      setLoading(true);
      Promise.all([fetchInvestments(), fetchPortfolioSummary()]).finally(() => {
        setLoading(false);
      });
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Show loading skeleton while data is being fetched
  if (loading) {
    return <InvestmentPortfolioSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Portfolio Summary */}
      {portfolioSummary && (
        <SimplePortfolioSummaryCards summary={portfolioSummary} />
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Investment
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
      </div>

      {/* Portfolio Content */}
      <Tabs defaultValue="table" className="space-y-4">
        <TabsList>
          <TabsTrigger value="table">Holdings</TabsTrigger>
          <TabsTrigger value="chart">Performance</TabsTrigger>
          <TabsTrigger value="currency">Currency Analysis</TabsTrigger>
          <TabsTrigger value="hedging">Hedging</TabsTrigger>
        </TabsList>

        <TabsContent value="table" className="space-y-4">
          <SimpleInvestmentTable
            investments={investments}
            onEdit={handleEditInvestment}
            onDelete={handleDeleteInvestment}
          />
        </TabsContent>

        <TabsContent value="chart" className="space-y-4">
          <SimplePortfolioChart investments={investments} />
        </TabsContent>

        <TabsContent value="currency" className="space-y-4">
          <CurrencyExposureAnalysis investments={investments} />
        </TabsContent>

        <TabsContent value="hedging" className="space-y-4">
          <CurrencyHedgingRecommendations investments={investments} />
        </TabsContent>
      </Tabs>

      {/* Investment Dialog */}
      <InvestmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        investment={editingInvestment}
        onSaved={handleInvestmentSaved}
      />
    </div>
  );
}

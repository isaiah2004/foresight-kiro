"use client";

import { useState, useEffect } from 'react';
import { InvestmentDocument } from "@/types/financial";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { useCurrency } from '@/contexts/currency-context';

interface SimpleInvestmentTableProps {
  investments: InvestmentDocument[];
  onEdit: (investment: InvestmentDocument) => void;
  onDelete: (id: string) => void;
}

interface SimpleInvestmentRowProps {
  investment: InvestmentDocument;
  onEdit: (investment: InvestmentDocument) => void;
  onDelete: (id: string) => void;
}

function SimpleInvestmentRow({ investment, onEdit, onDelete }: SimpleInvestmentRowProps) {
  const { formatCurrency, convertAmount, primaryCurrency } = useCurrency();
  const [calculatedData, setCalculatedData] = useState<{
    purchasePrice: number;
    currentPrice: number;
    currentValue: number;
    costBasis: number;
    gainLoss: number;
    originalCurrency: string;
  } | null>(null);

  useEffect(() => {
    const calculateValues = async () => {
      try {
        // Add safety checks for all required fields
        const purchaseAmount = investment.purchasePrice?.amount;
        const currentAmount = investment.currentPrice?.amount;
        const quantity = investment.quantity || 0;
        
        // Ensure we have valid numbers for calculations
        const purchasePrice = purchaseAmount && !isNaN(purchaseAmount) ? purchaseAmount : 0;
        const currentPrice = currentAmount && !isNaN(currentAmount) ? currentAmount : purchasePrice;
        const validQuantity = quantity && !isNaN(quantity) ? quantity : 0;
        
        const currentValue = currentPrice * validQuantity;
        const costBasis = purchasePrice * validQuantity;
        
        // Get the investment's currency
        const investmentCurrency = investment.currency || 
                                  investment.currentPrice?.currency || 
                                  investment.purchasePrice?.currency || 
                                  'USD';

        // Convert to primary currency if different
        if (investmentCurrency !== primaryCurrency && primaryCurrency) {
          const convertedCurrentValue = await convertAmount(currentValue, investmentCurrency, primaryCurrency);
          const convertedCostBasis = await convertAmount(costBasis, investmentCurrency, primaryCurrency);
          const convertedPurchasePrice = await convertAmount(purchasePrice, investmentCurrency, primaryCurrency);
          const convertedCurrentPrice = await convertAmount(currentPrice, investmentCurrency, primaryCurrency);
          
          const gainLoss = convertedCurrentValue.amount - convertedCostBasis.amount;
          
          setCalculatedData({
            purchasePrice: convertedPurchasePrice.amount,
            currentPrice: convertedCurrentPrice.amount,
            currentValue: convertedCurrentValue.amount,
            costBasis: convertedCostBasis.amount,
            gainLoss,
            originalCurrency: investmentCurrency
          });
        } else {
          // Same currency, no conversion needed
          const gainLoss = currentValue - costBasis;
          setCalculatedData({
            purchasePrice,
            currentPrice,
            currentValue,
            costBasis,
            gainLoss,
            originalCurrency: investmentCurrency
          });
        }
      } catch (error) {
        console.error('Error calculating values for investment:', investment.name, error);
        // Fallback to simple calculation without currency conversion
        const purchaseAmount = investment.purchasePrice?.amount || 0;
        const currentAmount = investment.currentPrice?.amount || purchaseAmount;
        const quantity = investment.quantity || 0;
        const currentValue = currentAmount * quantity;
        const costBasis = purchaseAmount * quantity;
        const gainLoss = currentValue - costBasis;
        
        setCalculatedData({
          purchasePrice: purchaseAmount,
          currentPrice: currentAmount,
          currentValue,
          costBasis,
          gainLoss,
          originalCurrency: 'USD'
        });
      }
    };

    calculateValues();
  }, [investment, primaryCurrency, convertAmount]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!calculatedData) {
    return (
      <div className="border rounded-lg p-4 space-y-2 bg-card">
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          <span className="ml-2 text-sm text-muted-foreground">Calculating...</span>
        </div>
      </div>
    );
  }

  const { purchasePrice, currentPrice, currentValue, gainLoss, originalCurrency } = calculatedData;
  const isPositive = gainLoss >= 0;
  const validQuantity = investment.quantity || 0;

  return (
    <div className="border rounded-lg p-4 space-y-4 bg-card">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
        <div className="flex-1">
          <h3 className="font-semibold text-lg">{investment.name}</h3>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            {investment.symbol && (
              <code className="text-xs bg-muted px-2 py-1 rounded">
                {investment.symbol}
              </code>
            )}
            <span className="text-sm text-muted-foreground capitalize">
              {investment.type.replace("_", " ")}
            </span>
          </div>
        </div>
        <div className="flex space-x-2 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(investment)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(investment.id)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">Quantity</p>
          <p className="font-medium">
            {validQuantity.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Purchase Price</p>
          <div className="flex flex-col">
            <p className="font-medium">
              {formatCurrency(purchasePrice)}
            </p>
            {originalCurrency !== primaryCurrency && (
              <span className="text-xs text-muted-foreground">
                ${(investment.purchasePrice?.amount || 0).toFixed(2)} USD
              </span>
            )}
          </div>
        </div>
        <div>
          <p className="text-muted-foreground">Current Price</p>
          <div className="flex flex-col">
            <p className="font-medium">
              {formatCurrency(currentPrice)}
              {!investment.currentPrice && investment.symbol && (
                <span className="text-xs text-orange-600 ml-1">
                  (needs refresh)
                </span>
              )}
              {!investment.currentPrice && !investment.symbol && (
                <span className="text-xs text-muted-foreground ml-1">
                  (no symbol)
                </span>
              )}
              {investment.currentPrice && (
                <span className="text-xs text-green-600 ml-1">(live)</span>
              )}
            </p>
            {originalCurrency !== primaryCurrency && (
              <span className="text-xs text-muted-foreground">
                ${((investment.currentPrice?.amount || investment.purchasePrice?.amount) || 0).toFixed(2)} USD
              </span>
            )}
          </div>
        </div>
        <div>
          <p className="text-muted-foreground">Current Value</p>
          <p className="font-medium">{formatCurrency(currentValue)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Gain/Loss</p>
          <p
            className={`font-medium ${
              isPositive ? "text-green-600" : "text-red-600"
            }`}
          >
            {isPositive ? "+" : ""}{formatCurrency(gainLoss)}
          </p>
        </div>
      </div>
    </div>
  );
}

export function SimpleInvestmentTable({
  investments,
  onEdit,
  onDelete,
}: SimpleInvestmentTableProps) {
  if (investments.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          No investments found. Add your first investment to get started!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {investments.map((investment) => (
        <SimpleInvestmentRow
          key={investment.id}
          investment={investment}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

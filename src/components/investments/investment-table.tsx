"use client";

import { useState, useEffect } from 'react';
import { Investment, InvestmentDocument } from '@/types/financial';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Edit, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatPercentage } from '@/lib/dashboard-calculations';
import { useCurrency } from '@/contexts/currency-context';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface InvestmentTableProps {
  investments: InvestmentDocument[];
  onEdit: (investment: InvestmentDocument) => void;
  onDelete: (id: string) => void;
}

interface InvestmentRowProps {
  investment: InvestmentDocument;
  onEdit: (investment: InvestmentDocument) => void;
  onDelete: (id: string) => void;
}

function InvestmentRow({ investment, onEdit, onDelete }: InvestmentRowProps) {
  const { formatCurrency, convertAmount, primaryCurrency } = useCurrency();
  const [calculatedData, setCalculatedData] = useState<{
    gainLoss: number;
    gainLossPercentage: number;
    currentValue: number;
    costBasis: number;
    originalCurrency: string;
  // Unit prices in the user's primary currency (or original if no conversion)
  purchasePrice: number;
  currentPrice: number;
  } | null>(null);

  const calculateGainLoss = async (investment: Investment) => {
    const currentPrice = investment.currentPrice?.amount || investment.purchasePrice.amount;
    const currentValue = currentPrice * investment.quantity;
    const costBasis = investment.purchasePrice.amount * investment.quantity;
    
    // Get the investment's currency
    const investmentCurrency = investment.currency || 
                              investment.currentPrice?.currency || 
                              investment.purchasePrice?.currency || 
                              'USD';
    
    try {
      // Only convert if currency is different from primary currency
      if (investmentCurrency !== primaryCurrency && primaryCurrency) {
        const convertedCurrentValue = await convertAmount(currentValue, investmentCurrency, primaryCurrency);
        const convertedCostBasis = await convertAmount(costBasis, investmentCurrency, primaryCurrency);
        
        const gainLoss = convertedCurrentValue.amount - convertedCostBasis.amount;
        const gainLossPercentage = convertedCostBasis.amount > 0 ? (gainLoss / convertedCostBasis.amount) * 100 : 0;
        const unitCurrentPrice = investment.quantity > 0 ? convertedCurrentValue.amount / investment.quantity : 0;
        const unitPurchasePrice = investment.quantity > 0 ? convertedCostBasis.amount / investment.quantity : 0;
        
        return { 
          gainLoss, 
          gainLossPercentage, 
          currentValue: convertedCurrentValue.amount,
          costBasis: convertedCostBasis.amount,
          originalCurrency: investmentCurrency,
          purchasePrice: unitPurchasePrice,
          currentPrice: unitCurrentPrice
        };
      }
    } catch (error) {
      console.error('Currency conversion failed for investment:', investment.name, error);
    }
    
    // Fallback to original calculation if same currency or conversion fails
    const gainLoss = currentValue - costBasis;
    const gainLossPercentage = costBasis > 0 ? (gainLoss / costBasis) * 100 : 0;
    
    return { 
      gainLoss, 
      gainLossPercentage, 
      currentValue,
      costBasis,
      originalCurrency: investmentCurrency,
      purchasePrice: investment.purchasePrice.amount,
      currentPrice: currentPrice
    };
  };

  useEffect(() => {
    const loadCalculatedData = async () => {
      try {
        const data = await calculateGainLoss(investment);
        setCalculatedData(data);
      } catch (error) {
        console.error('Error calculating gain/loss for investment:', investment.name, error);
        // Fallback to simple calculation without currency conversion
        const currentPrice = investment.currentPrice?.amount || investment.purchasePrice.amount;
        const currentValue = currentPrice * investment.quantity;
        const costBasis = investment.purchasePrice.amount * investment.quantity;
        const gainLoss = currentValue - costBasis;
        const gainLossPercentage = costBasis > 0 ? (gainLoss / costBasis) * 100 : 0;
        const investmentCurrency = investment.currency || 
                                  investment.currentPrice?.currency || 
                                  investment.purchasePrice?.currency || 
                                  'USD';
        
        setCalculatedData({
          gainLoss,
          gainLossPercentage,
          currentValue,
          costBasis,
          originalCurrency: investmentCurrency,
          purchasePrice: investment.purchasePrice.amount,
          currentPrice: currentPrice
        });
      }
    };
    
    loadCalculatedData();
  }, [investment, primaryCurrency]); // eslint-disable-line react-hooks/exhaustive-deps

  const getInvestmentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      stocks: 'Stocks',
      bonds: 'Bonds',
      mutual_funds: 'Mutual Funds',
      real_estate: 'Real Estate',
      crypto: 'Cryptocurrency',
      other: 'Other',
    };
    return labels[type] || type;
  };

  const getInvestmentTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      stocks: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      bonds: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      mutual_funds: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      real_estate: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      crypto: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      other: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
    };
    return colors[type] || colors.other;
  };

  const getInvestmentEducation = (type: string) => {
    const education: Record<string, { title: string; description: string; riskLevel: string }> = {
      stocks: {
        title: 'Stocks (Equities)',
        description: 'Shares of ownership in a company. When you buy stocks, you become a partial owner and can benefit from the company\'s growth through price appreciation and dividends.',
        riskLevel: 'Medium to High Risk'
      },
      bonds: {
        title: 'Bonds (Fixed Income)',
        description: 'Loans you give to companies or governments. In return, they pay you regular interest and return your principal when the bond matures. Generally more stable than stocks.',
        riskLevel: 'Low to Medium Risk'
      },
      mutual_funds: {
        title: 'Mutual Funds',
        description: 'Pooled investments managed by professionals. Your money is combined with other investors to buy a diversified portfolio of stocks, bonds, or other securities.',
        riskLevel: 'Varies by Fund Type'
      },
      real_estate: {
        title: 'Real Estate',
        description: 'Property investments including rental properties, REITs (Real Estate Investment Trusts), or real estate funds. Can provide rental income and property appreciation.',
        riskLevel: 'Medium Risk'
      },
      crypto: {
        title: 'Cryptocurrency',
        description: 'Digital currencies like Bitcoin and Ethereum. Highly volatile and speculative investments that can experience dramatic price swings.',
        riskLevel: 'Very High Risk'
      },
      other: {
        title: 'Other Investments',
        description: 'Various other investment types such as commodities, collectibles, or alternative investments.',
        riskLevel: 'Risk Varies'
      }
    };
    return education[type] || education.other;
  };

  if (!calculatedData) {
    return (
      <TableRow>
        <TableCell colSpan={9} className="text-center py-4">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span className="text-sm text-muted-foreground">Calculating...</span>
          </div>
        </TableCell>
      </TableRow>
    );
  }

  const { gainLoss, gainLossPercentage, currentValue, originalCurrency } = calculatedData;
  const isPositive = gainLoss >= 0;
  const education = getInvestmentEducation(investment.type);

  // Get display prices - show original currency for individual prices
  const currentPrice = investment.currentPrice?.amount || investment.purchasePrice.amount;
  const purchasePrice = investment.purchasePrice.amount;

  return (
    <TableRow>
      <TableCell className="font-medium">
        <div className="flex flex-col">
          <span>{investment.name}</span>
          {investment.description && (
            <span className="text-xs text-muted-foreground">
              {investment.description}
            </span>
          )}
        </div>
      </TableCell>
      <TableCell>
        <HoverCard>
          <HoverCardTrigger>
            <Badge className={getInvestmentTypeColor(investment.type)}>
              {getInvestmentTypeLabel(investment.type)}
            </Badge>
          </HoverCardTrigger>
          <HoverCardContent className="w-80">
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">{education.title}</h4>
              <p className="text-sm text-muted-foreground">
                {education.description}
              </p>
              <div className="text-xs font-medium text-muted-foreground">
                {education.riskLevel}
              </div>
            </div>
          </HoverCardContent>
        </HoverCard>
      </TableCell>
      <TableCell>
        {investment.symbol ? (
          <code className="text-xs bg-muted px-1 py-0.5 rounded">
            {investment.symbol}
          </code>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell className="text-right">
        {investment.quantity.toLocaleString()}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex flex-col items-end">
          <span>{formatCurrency(calculatedData.purchasePrice)}</span>
          {originalCurrency !== primaryCurrency && (
            <span className="text-xs text-muted-foreground">
              ${investment.purchasePrice.amount.toFixed(2)} USD
            </span>
          )}
        </div>
      </TableCell>
      <TableCell className="text-right">
        {investment.currentPrice ? (
          <div className="flex items-center justify-end space-x-1">
            <div className="flex flex-col items-end">
              <span>{formatCurrency(calculatedData.currentPrice)}</span>
              {originalCurrency !== primaryCurrency && (
                <span className="text-xs text-muted-foreground">
                  ${(investment.currentPrice?.amount || investment.purchasePrice.amount).toFixed(2)} USD
                </span>
              )}
            </div>
            {investment.currentPrice !== investment.purchasePrice && (
              <Tooltip>
                <TooltipTrigger>
                  {investment.currentPrice > investment.purchasePrice ? (
                    <TrendingUp className="h-3 w-3 text-green-600" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-600" />
                  )}
                </TooltipTrigger>
                <TooltipContent>
                  <p>Real-time market price</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-end">
            <span className="text-muted-foreground">
              {formatCurrency(calculatedData.purchasePrice)}
            </span>
            {originalCurrency !== primaryCurrency && (
              <span className="text-xs text-muted-foreground">
                ${investment.purchasePrice.amount.toFixed(2)} USD
              </span>
            )}
          </div>
        )}
      </TableCell>
      <TableCell className="text-right font-medium">
        {formatCurrency(currentValue)}
      </TableCell>
      <TableCell className="text-right">
        <div className={`flex flex-col items-end ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          <span className="font-medium">
            {isPositive ? '+' : ''}{formatCurrency(gainLoss)}
          </span>
          <span className="text-xs">
            ({isPositive ? '+' : ''}{formatPercentage(gainLossPercentage)})
          </span>
        </div>
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(investment)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onDelete(investment.id)}
              className="text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

export function InvestmentTable({ investments, onEdit, onDelete }: InvestmentTableProps) {

  if (investments.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No investments found. Add your first investment to get started!</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Investment</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Symbol</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead className="text-right">Purchase Price</TableHead>
              <TableHead className="text-right">Current Price</TableHead>
              <TableHead className="text-right">Current Value</TableHead>
              <TableHead className="text-right">Gain/Loss</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {investments.map((investment) => (
              <InvestmentRow
                key={investment.id}
                investment={investment}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  );
}
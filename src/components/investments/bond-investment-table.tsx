"use client";

import { useEffect, useState } from "react";
import { InvestmentDocument } from "@/types/financial";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Edit, MoreHorizontal, Trash2 } from "lucide-react";
import { useCurrency } from "@/contexts/currency-context";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { safeFormatDate } from "@/lib/utils";

interface BondInvestmentTableProps {
  investments: InvestmentDocument[];
  onEdit: (investment: InvestmentDocument) => void;
  onDelete: (id: string) => void;
}

interface RowCalcs {
  currentValue: number;
  costBasis: number;
  gainLoss: number;
  gainLossPercentage: number;
  unitPurchasePrice: number;
  unitCurrentPrice: number;
  originalCurrency: string;
}

export function BondInvestmentTable({ investments, onEdit, onDelete }: BondInvestmentTableProps) {
  const { convertAmount, primaryCurrency, formatCurrency } = useCurrency();
  const [calcs, setCalcs] = useState<Record<string, RowCalcs>>({});

  useEffect(() => {
    const compute = async () => {
      const results: Record<string, RowCalcs> = {};
      for (const inv of investments) {
        const unitCurrent = inv.currentPrice?.amount || inv.purchasePrice.amount;
        const currentValue = unitCurrent * inv.quantity;
        const costBasis = inv.purchasePrice.amount * inv.quantity;
        const invCurrency = inv.currency || inv.currentPrice?.currency || inv.purchasePrice.currency || "USD";
        try {
          if (primaryCurrency && invCurrency !== primaryCurrency) {
            const convertedCurrent = await convertAmount(currentValue, invCurrency, primaryCurrency);
            const convertedCost = await convertAmount(costBasis, invCurrency, primaryCurrency);
            results[inv.id] = {
              currentValue: convertedCurrent.amount,
              costBasis: convertedCost.amount,
              gainLoss: convertedCurrent.amount - convertedCost.amount,
              gainLossPercentage: convertedCost.amount > 0 ? ((convertedCurrent.amount - convertedCost.amount) / convertedCost.amount) * 100 : 0,
              unitPurchasePrice: inv.quantity > 0 ? convertedCost.amount / inv.quantity : 0,
              unitCurrentPrice: inv.quantity > 0 ? convertedCurrent.amount / inv.quantity : 0,
              originalCurrency: invCurrency,
            };
          } else {
            results[inv.id] = {
              currentValue,
              costBasis,
              gainLoss: currentValue - costBasis,
              gainLossPercentage: costBasis > 0 ? ((currentValue - costBasis) / costBasis) * 100 : 0,
              unitPurchasePrice: inv.purchasePrice.amount,
              unitCurrentPrice: unitCurrent,
              originalCurrency: invCurrency,
            };
          }
        } catch (e) {
          results[inv.id] = {
            currentValue,
            costBasis,
            gainLoss: currentValue - costBasis,
            gainLossPercentage: costBasis > 0 ? ((currentValue - costBasis) / costBasis) * 100 : 0,
            unitPurchasePrice: inv.purchasePrice.amount,
            unitCurrentPrice: unitCurrent,
            originalCurrency: invCurrency,
          };
        }
      }
      setCalcs(results);
    };
    compute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [investments, primaryCurrency]);

  if (investments.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No bonds found. Add your first bond to get started.</p>
      </div>
    );
  }

  const pct = (n: number) => `${n.toFixed(2)}%`;

  return (
    <TooltipProvider>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Bond</TableHead>
              <TableHead>Issuer</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead className="text-right">Coupon</TableHead>
              <TableHead>Frequency</TableHead>
              <TableHead>Maturity</TableHead>
              <TableHead className="text-right">Face Value</TableHead>
              <TableHead className="text-right">Purchase Price</TableHead>
              <TableHead className="text-right">Current Price</TableHead>
              <TableHead className="text-right">Units</TableHead>
              <TableHead className="text-right">Current Value</TableHead>
              <TableHead className="text-right">Gain/Loss</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {investments.map((inv) => {
              const b = inv.bondData;
              const row = calcs[inv.id];
              const isPositive = row ? row.gainLoss >= 0 : true;
              const fv = b?.faceValue?.amount;
              const currency = b?.faceValue?.currency || inv.purchasePrice.currency || inv.currency || "USD";
              const cleanPct = (b as any)?.cleanPricePercent as number | undefined;
              const priceType = (b as any)?.priceType as string | undefined;
              return (
                <TableRow key={inv.id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{inv.name}</span>
                      {inv.symbol && (
                        <code className="text-xs bg-muted px-1 py-0.5 rounded w-max mt-1">{inv.symbol}</code>
                      )}
                      {priceType === 'percent_of_par' && cleanPct !== undefined && (
                        <span className="text-xs text-muted-foreground mt-1">Clean: {cleanPct.toFixed(2)}% of par</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {b?.issuer ? (
                      <span>{b.issuer}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {b?.creditRating ? (
                      <Badge variant="secondary">{b.creditRating}</Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {b?.couponRate !== undefined ? pct(b.couponRate) : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell>
                    {b?.couponFrequency
                      ? b.couponFrequency === 'semi_annual' ? 'Semi-Annual' : b.couponFrequency === 'annual' ? 'Annual' : 'Quarterly'
                      : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell>
                    {b?.maturityDate ? safeFormatDate(b.maturityDate) : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-right">
                    {fv !== undefined ? (
                      <span>
                        {fv.toLocaleString(undefined, { maximumFractionDigits: 2 })} {currency}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {row ? (
                      <div className="flex flex-col items-end">
                        <span>{formatCurrency(row.unitPurchasePrice)}</span>
                        {row.originalCurrency !== primaryCurrency && (
                          <span className="text-xs text-muted-foreground">
                            {`${(inv.purchasePrice.amount).toFixed(2)} ${row.originalCurrency}`}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {row ? (
                      <div className="flex flex-col items-end">
                        <span>{formatCurrency(row.unitCurrentPrice)}</span>
                        {row.originalCurrency !== primaryCurrency && (
                          <span className="text-xs text-muted-foreground">
                            {`${((inv.currentPrice?.amount ?? inv.purchasePrice.amount)).toFixed(2)} ${row.originalCurrency}`}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">{inv.quantity.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    {row ? formatCurrency(row.currentValue) : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-right">
                    {row ? (
                      <div className={`flex flex-col items-end ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        <span className="font-medium">{isPositive ? '+' : ''}{formatCurrency(row.gainLoss)}</span>
                        <span className="text-xs">({isPositive ? '+' : ''}{row.gainLossPercentage.toFixed(2)}%)</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
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
                        <DropdownMenuItem onClick={() => onEdit(inv)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDelete(inv.id)} className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  );
}

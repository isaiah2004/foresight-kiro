'use client';

import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Globe, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useCurrency } from '@/contexts/currency-context';
import type { Currency } from '@/types/financial';

interface CurrencySwitcherProps {
  variant?: 'default' | 'compact';
  className?: string;
}

export function CurrencySwitcher({ variant = 'default', className }: CurrencySwitcherProps) {
  const { primaryCurrency, currencies, isLoading, refreshCurrency } = useCurrency();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleCurrencyChange = async (newCurrency: string) => {
    if (newCurrency === primaryCurrency) return;

    try {
      setIsUpdating(true);
      
      const response = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          primaryCurrency: newCurrency
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update currency');
      }

      // Refresh currency context
      await refreshCurrency();
      
      if (variant === 'default') {
        toast({
          title: 'Currency Updated',
          description: `Currency changed to ${newCurrency}`
        });
      }
    } catch (error) {
      console.error('Error updating currency:', error);
      toast({
        title: 'Error',
        description: 'Failed to update currency',
        variant: 'destructive'
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const currentCurrencyInfo = currencies.find(c => c.code === primaryCurrency);

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Loader2 className="h-4 w-4 animate-spin" />
        {variant === 'default' && <span className="text-sm">Loading...</span>}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <Select value={primaryCurrency} onValueChange={handleCurrencyChange} disabled={isUpdating}>
        <SelectTrigger className={`w-auto min-w-[80px] ${className}`}>
          <div className="flex items-center gap-1">
            <Globe className="h-3 w-3" />
            <SelectValue placeholder={primaryCurrency} />
          </div>
        </SelectTrigger>
        <SelectContent>
          {currencies.map((currency) => (
            <SelectItem key={currency.code} value={currency.code}>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono text-xs">
                  {currency.code}
                </Badge>
                <span className="text-sm">{currency.symbol}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex items-center gap-2">
        <Globe className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Currency:</span>
      </div>
      
      <Select value={primaryCurrency} onValueChange={handleCurrencyChange} disabled={isUpdating}>
        <SelectTrigger className="w-[200px]">
          <SelectValue>
            {currentCurrencyInfo && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="font-mono">
                  {currentCurrencyInfo.code}
                </Badge>
                <span>{currentCurrencyInfo.symbol} {currentCurrencyInfo.name}</span>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {currencies.map((currency) => (
            <SelectItem key={currency.code} value={currency.code}>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="font-mono">
                  {currency.code}
                </Badge>
                <span className="font-medium">{currency.symbol}</span>
                <span className="text-muted-foreground">{currency.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {isUpdating && (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      )}
    </div>
  );
}
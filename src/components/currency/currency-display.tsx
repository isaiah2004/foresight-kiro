'use client';

import { useState, useEffect } from 'react';
import { useCurrency } from '@/contexts/currency-context';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import type { CurrencyAmount } from '@/types/financial';

interface CurrencyDisplayProps {
  amount: number;
  currency: string;
  showOriginal?: boolean;
  className?: string;
  variant?: 'default' | 'large' | 'small';
  showCurrencyCode?: boolean;
}

export function CurrencyDisplay({ 
  amount, 
  currency, 
  showOriginal = true,
  className = '',
  variant = 'default',
  showCurrencyCode = false
}: CurrencyDisplayProps) {
  const { convertAmount, formatCurrencyAmount, primaryCurrency, isLoading: contextLoading } = useCurrency();
  const [convertedAmount, setConvertedAmount] = useState<CurrencyAmount | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const performConversion = async () => {
      if (contextLoading) return;
      
      setIsLoading(true);
      try {
        const result = await convertAmount(amount, currency);
        setConvertedAmount(result);
      } catch (error) {
        console.error('Currency conversion failed:', error);
        // Fallback to original amount
        setConvertedAmount({
          amount,
          currency
        });
      } finally {
        setIsLoading(false);
      }
    };

    performConversion();
  }, [amount, currency, convertAmount, contextLoading]);

  if (contextLoading || isLoading || !convertedAmount) {
    return <Skeleton className={`h-6 w-20 ${className}`} />;
  }

  const sizeClasses = {
    small: 'text-sm',
    default: 'text-base',
    large: 'text-lg font-semibold'
  };

  const formattedAmount = formatCurrencyAmount(convertedAmount, showOriginal && currency !== primaryCurrency);

  return (
    <span className={`${sizeClasses[variant]} ${className}`}>
      {formattedAmount}
      {showCurrencyCode && (
        <Badge variant="outline" className="ml-2 text-xs">
          {convertedAmount.currency}
        </Badge>
      )}
    </span>
  );
}

// Specialized components for common use cases
export function LargeCurrencyDisplay(props: Omit<CurrencyDisplayProps, 'variant'>) {
  return <CurrencyDisplay {...props} variant="large" />;
}

export function SmallCurrencyDisplay(props: Omit<CurrencyDisplayProps, 'variant'>) {
  return <CurrencyDisplay {...props} variant="small" />;
}

// Component for displaying currency amounts that are already converted
export function FormattedCurrencyAmount({ 
  currencyAmount, 
  showOriginal = true,
  className = '',
  variant = 'default'
}: {
  currencyAmount: CurrencyAmount;
  showOriginal?: boolean;
  className?: string;
  variant?: 'default' | 'large' | 'small';
}) {
  const { formatCurrencyAmount } = useCurrency();

  const sizeClasses = {
    small: 'text-sm',
    default: 'text-base',
    large: 'text-lg font-semibold'
  };

  return (
    <span className={`${sizeClasses[variant]} ${className}`}>
      {formatCurrencyAmount(currencyAmount, showOriginal)}
    </span>
  );
}
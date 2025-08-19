import { useState, useEffect } from 'react';
import { useCurrency } from '@/contexts/currency-context';
import type { CurrencyAmount } from '@/types/financial';

/**
 * Hook for converting and displaying currency amounts
 * Handles loading states and error fallbacks
 */
export function useCurrencyDisplay(amount: number, currency: string) {
  const { convertAmount, formatCurrencyAmount, primaryCurrency } = useCurrency();
  const [convertedAmount, setConvertedAmount] = useState<CurrencyAmount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const performConversion = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const result = await convertAmount(amount, currency);
        setConvertedAmount(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Conversion failed');
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
  }, [amount, currency, convertAmount]);

  const formattedAmount = convertedAmount 
    ? formatCurrencyAmount(convertedAmount, currency !== primaryCurrency)
    : '';

  return {
    convertedAmount,
    formattedAmount,
    isLoading,
    error,
    primaryCurrency
  };
}

/**
 * Hook for batch currency conversion
 * Useful for tables or lists with multiple currency amounts
 */
export function useBatchCurrencyDisplay(
  amounts: Array<{ amount: number; currency: string; id: string }>
) {
  const { convertAmount, formatCurrencyAmount, primaryCurrency } = useCurrency();
  const [convertedAmounts, setConvertedAmounts] = useState<Map<string, CurrencyAmount>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const performBatchConversion = async () => {
      setIsLoading(true);
      const results = new Map<string, CurrencyAmount>();
      
      try {
        const conversions = await Promise.allSettled(
          amounts.map(async ({ amount, currency, id }) => {
            const converted = await convertAmount(amount, currency);
            return { id, converted };
          })
        );

        conversions.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            results.set(result.value.id, result.value.converted);
          } else {
            // Fallback for failed conversions
            const original = amounts[index];
            results.set(original.id, {
              amount: original.amount,
              currency: original.currency
            });
          }
        });

        setConvertedAmounts(results);
      } catch (error) {
        console.error('Batch currency conversion failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (amounts.length > 0) {
      performBatchConversion();
    } else {
      setIsLoading(false);
    }
  }, [amounts, convertAmount]);

  const getFormattedAmount = (id: string, showOriginal: boolean = true): string => {
    const converted = convertedAmounts.get(id);
    if (!converted) return '';
    
    const original = amounts.find(a => a.id === id);
    return formatCurrencyAmount(converted, showOriginal && original?.currency !== primaryCurrency);
  };

  return {
    convertedAmounts,
    getFormattedAmount,
    isLoading,
    primaryCurrency
  };
}
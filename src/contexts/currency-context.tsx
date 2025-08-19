'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { currencyService } from '@/lib/services/currency-service';
import type { Currency, CurrencyAmount } from '@/types/financial';

interface CurrencyContextType {
  primaryCurrency: string;
  currencies: Currency[];
  isLoading: boolean;
  convertAmount: (amount: number, fromCurrency: string, toCurrency?: string) => Promise<CurrencyAmount>;
  formatCurrency: (amount: number, currency?: string, locale?: string) => string;
  formatCurrencyAmount: (currencyAmount: CurrencyAmount, showOriginal?: boolean) => string;
  refreshCurrency: () => Promise<void>;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

interface CurrencyProviderProps {
  children: React.ReactNode;
}

export function CurrencyProvider({ children }: CurrencyProviderProps) {
  const [primaryCurrency, setPrimaryCurrency] = useState<string>('USD');
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load initial currency data
  const loadCurrencyData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Load user preferences and supported currencies in parallel
      const [preferencesResponse, supportedCurrencies] = await Promise.all([
        fetch('/api/user/preferences').catch(() => null),
        currencyService.getSupportedCurrencies()
      ]);
      
      // Set supported currencies
      setCurrencies(supportedCurrencies);
      
      // Set primary currency from user preferences
      if (preferencesResponse?.ok) {
        const { preferences } = await preferencesResponse.json();
        setPrimaryCurrency(preferences?.primaryCurrency || 'USD');
      } else {
        setPrimaryCurrency('USD'); // Default fallback
      }
    } catch (error) {
      console.error('Error loading currency data:', error);
      setPrimaryCurrency('USD');
      setCurrencies([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    loadCurrencyData();
  }, [loadCurrencyData]);

  // Convert amount to user's primary currency (or specified currency)
  const convertAmount = useCallback(async (
    amount: number, 
    fromCurrency: string, 
    toCurrency?: string
  ): Promise<CurrencyAmount> => {
    const targetCurrency = toCurrency || primaryCurrency;
    
    if (fromCurrency === targetCurrency) {
      return {
        amount,
        currency: targetCurrency
      };
    }

    try {
      return await currencyService.convertAmount(amount, fromCurrency, targetCurrency);
    } catch (error) {
      console.error('Currency conversion failed:', error);
      // Return original amount if conversion fails
      return {
        amount,
        currency: fromCurrency
      };
    }
  }, [primaryCurrency]);

  // Format currency using the service
  const formatCurrency = useCallback((
    amount: number, 
    currency?: string, 
    locale?: string
  ): string => {
    const currencyCode = currency || primaryCurrency;
    return currencyService.formatCurrency(amount, currencyCode, locale);
  }, [primaryCurrency]);

  // Format CurrencyAmount with optional original currency display
  const formatCurrencyAmount = useCallback((
    currencyAmount: CurrencyAmount, 
    showOriginal: boolean = false
  ): string => {
    const mainFormatted = formatCurrency(currencyAmount.amount, currencyAmount.currency);
    
    // Show original amount if it was converted and showOriginal is true
    if (showOriginal && 
        currencyAmount.convertedAmount && 
        currencyAmount.exchangeRate && 
        currencyAmount.currency !== primaryCurrency) {
      const originalAmount = currencyAmount.convertedAmount / currencyAmount.exchangeRate;
      const originalFormatted = formatCurrency(originalAmount, primaryCurrency);
      return `${mainFormatted} (${originalFormatted})`;
    }
    
    return mainFormatted;
  }, [formatCurrency, primaryCurrency]);

  // Refresh currency data (useful after currency changes)
  const refreshCurrency = useCallback(async () => {
    await loadCurrencyData();
  }, [loadCurrencyData]);

  // Listen for currency changes (e.g., from settings page)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'primaryCurrencyChanged') {
        refreshCurrency();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [refreshCurrency]);

  const value: CurrencyContextType = {
    primaryCurrency,
    currencies,
    isLoading,
    convertAmount,
    formatCurrency,
    formatCurrencyAmount,
    refreshCurrency
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

// Custom hook to use currency context
export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}

// Hook for converting and formatting amounts
export function useCurrencyConversion() {
  const { convertAmount, formatCurrencyAmount, primaryCurrency } = useCurrency();
  
  const convertAndFormat = useCallback(async (
    amount: number,
    fromCurrency: string,
    showOriginal: boolean = true
  ): Promise<string> => {
    const converted = await convertAmount(amount, fromCurrency);
    return formatCurrencyAmount(converted, showOriginal);
  }, [convertAmount, formatCurrencyAmount]);

  return {
    convertAndFormat,
    primaryCurrency
  };
}
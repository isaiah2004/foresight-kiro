/**
 * Financial App Theme Configuration
 * 
 * This file contains the custom theme configuration for the Foresight financial app.
 * It defines color schemes for positive/negative financial values and other UI elements.
 */

export const financialTheme = {
  colors: {
    // Financial semantic colors
    positive: {
      light: "oklch(0.646 0.222 142.1)", // Green for gains/positive values
      dark: "oklch(0.488 0.243 142.1)",
      foreground: "oklch(0.985 0 0)"
    },
    negative: {
      light: "oklch(0.577 0.245 27.325)", // Red for losses/negative values  
      dark: "oklch(0.704 0.191 22.216)",
      foreground: "oklch(0.985 0 0)"
    },
    warning: {
      light: "oklch(0.828 0.189 84.429)", // Yellow/orange for warnings
      dark: "oklch(0.769 0.188 70.08)",
      foreground: "oklch(0.145 0 0)"
    },
    info: {
      light: "oklch(0.6 0.118 184.704)", // Blue for informational content
      dark: "oklch(0.696 0.17 162.48)",
      foreground: "oklch(0.985 0 0)"
    }
  },
  
  // Financial data visualization colors
  charts: {
    income: "oklch(0.646 0.222 142.1)", // Green
    expenses: "oklch(0.577 0.245 27.325)", // Red
    investments: "oklch(0.6 0.118 184.704)", // Blue
    debt: "oklch(0.828 0.189 84.429)", // Orange
    savings: "oklch(0.488 0.243 264.376)" // Purple
  },
  
  // Component variants for financial data
  variants: {
    positive: "bg-positive text-positive-foreground",
    negative: "bg-negative text-negative-foreground", 
    warning: "bg-warning text-warning-foreground",
    info: "bg-info text-info-foreground"
  }
} as const;

/**
 * Utility function to get the appropriate color class based on a financial value
 */
export function getFinancialColorClass(value: number, type: 'text' | 'bg' | 'border' = 'text') {
  const colorName = value >= 0 ? 'positive' : 'negative';
  return `${type}-${colorName}`;
}

/**
 * Utility function to format financial values with appropriate styling
 */
export function formatFinancialValue(value: number, currency = 'USD') {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  });
  
  return {
    formatted: formatter.format(Math.abs(value)),
    isPositive: value >= 0,
    colorClass: getFinancialColorClass(value, 'text')
  };
}

export type FinancialTheme = typeof financialTheme;
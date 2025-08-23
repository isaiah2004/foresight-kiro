import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | { amount: number; currency?: string }, currency: string = 'USD'): string {
  const amountValue = typeof amount === 'number' ? amount : amount.amount;
  const currencyCode = typeof amount === 'object' && amount.currency ? amount.currency : currency;
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
  }).format(amountValue);
}

export function safeFormatDate(dateValue: any): string {
  try {
    let date: Date;
    
    if (dateValue instanceof Date) {
      date = dateValue;
    } else if (dateValue && typeof dateValue.toDate === 'function') {
      // Firestore Timestamp
      date = dateValue.toDate();
    } else if (typeof dateValue === 'string') {
      date = new Date(dateValue);
    } else if (typeof dateValue === 'number') {
      date = new Date(dateValue);
    } else {
      // Fallback to current date
      date = new Date();
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return new Date().toLocaleDateString();
    }
    
    return date.toLocaleDateString();
  } catch (error) {
    if (process.env.NODE_ENV !== 'test') {
      console.error('Error formatting date:', error);
    }
    return new Date().toLocaleDateString();
  }
}

export function safeToDateString(dateValue: any): string {
  try {
    let date: Date;
    
    if (dateValue instanceof Date) {
      date = dateValue;
    } else if (dateValue && typeof dateValue.toDate === 'function') {
      // Firestore Timestamp
      date = dateValue.toDate();
    } else if (typeof dateValue === 'string') {
      date = new Date(dateValue);
    } else if (typeof dateValue === 'number') {
      date = new Date(dateValue);
    } else {
      // Fallback to current date
      date = new Date();
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      date = new Date();
    }
    
    return date.toISOString().split('T')[0];
  } catch (error) {
    if (process.env.NODE_ENV !== 'test') {
      console.error('Error converting date to string:', error);
    }
    return new Date().toISOString().split('T')[0];
  }
}

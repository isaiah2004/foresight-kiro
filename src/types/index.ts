// Core user types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: Date;
}

// Financial data types (basic structure for future implementation)
export interface Investment {
  id: string;
  userId: string;
  type: 'stocks' | 'bonds' | 'mutual_funds' | 'real_estate' | 'crypto' | 'other';
  name: string;
  symbol?: string;
  quantity: number;
  purchasePrice: number;
  currentPrice?: number;
  purchaseDate: Date;
  description?: string;
}

export interface Income {
  id: string;
  userId: string;
  type: 'salary' | 'bonus' | 'other';
  source: string;
  amount: number;
  frequency: 'weekly' | 'bi-weekly' | 'monthly' | 'quarterly' | 'annually';
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
}

export interface Expense {
  id: string;
  userId: string;
  category: 'rent' | 'groceries' | 'utilities' | 'entertainment' | 'other';
  name: string;
  amount: number;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually';
  isFixed: boolean;
  startDate: Date;
  endDate?: Date;
}

export interface Loan {
  id: string;
  userId: string;
  type: 'home' | 'car' | 'personal' | 'other';
  name: string;
  principal: number;
  currentBalance: number;
  interestRate: number;
  termMonths: number;
  monthlyPayment: number;
  startDate: Date;
  nextPaymentDate: Date;
}

export interface Goal {
  id: string;
  userId: string;
  type: 'retirement' | 'education' | 'vacation' | 'emergency_fund' | 'other';
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: Date;
  monthlyContribution: number;
  priority: 'low' | 'medium' | 'high';
  isActive: boolean;
}
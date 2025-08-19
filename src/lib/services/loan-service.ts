import { orderBy, Timestamp } from 'firebase/firestore';
import { BaseFirebaseService } from '../firebase-service';
import { Loan, LoanType, CurrencyAmount } from '../../types/financial';

export class LoanService extends BaseFirebaseService<Loan> {
  constructor() {
    super('loans');
  }

  // Get loans by type
  async getByType(userId: string, type: LoanType): Promise<Loan[]> {
    try {
      // Get all loans and filter in memory to avoid Firebase index issues
      const allLoans = await this.getAllOrdered(userId);
      return allLoans.filter(loan => loan.type === type);
    } catch (error) {
      console.error('Error getting loans by type:', error);
      return []; // Return empty array instead of throwing
    }
  }

  // Get active loans (with remaining balance)
  async getActiveLoans(userId: string): Promise<Loan[]> {
    try {
      // Get all loans and filter in memory to avoid complex Firebase queries
      const allLoans = await this.getAllOrdered(userId);
      return allLoans
        .filter(loan => loan.currentBalance.amount > 0)
        .sort((a, b) => {
          try {
            const dateA = a.nextPaymentDate instanceof Timestamp ? a.nextPaymentDate.toDate() : new Date(a.nextPaymentDate as any);
            const dateB = b.nextPaymentDate instanceof Timestamp ? b.nextPaymentDate.toDate() : new Date(b.nextPaymentDate as any);
            return dateA.getTime() - dateB.getTime();
          } catch (error) {
            console.error('Error comparing payment dates:', error);
            return 0;
          }
        });
    } catch (error) {
      console.error('Error getting active loans:', error);
      return []; // Return empty array instead of throwing
    }
  }

  // Get all loans ordered by start date
  async getAllOrdered(userId: string): Promise<Loan[]> {
    return this.getAll(userId, [orderBy('startDate', 'desc')]);
  }

  // Calculate total debt
  async getTotalDebt(userId: string): Promise<{ amount: number; currency: string }> {
    try {
      const activeLoans = await this.getActiveLoans(userId);
      if (!activeLoans || activeLoans.length === 0) return { amount: 0, currency: 'USD' }; // Default currency
      
      if (activeLoans.length > 0) {
        const total = activeLoans.reduce((total, loan) => total + (loan.currentBalance?.amount || 0), 0);
        return { 
          amount: total, 
          currency: activeLoans[0].currentBalance.currency 
        };
      }
      
      return { amount: 0, currency: 'USD' };
    } catch (error) {
      console.error('Error calculating total debt:', error);
      return { amount: 0, currency: 'USD' };
    }
  }

  // Calculate total monthly payments
  async getTotalMonthlyPayments(userId: string): Promise<{ amount: number; currency: string }> {
    try {
      const activeLoans = await this.getActiveLoans(userId);
      if (!activeLoans || activeLoans.length === 0) return { amount: 0, currency: 'USD' }; // Default currency
      
      if (activeLoans.length > 0) {
        const total = activeLoans.reduce((total, loan) => total + (loan.monthlyPayment?.amount || 0), 0);
        return { 
          amount: total, 
          currency: activeLoans[0].monthlyPayment.currency 
        };
      }
      
      return { amount: 0, currency: 'USD' };
    } catch (error) {
      console.error('Error calculating total monthly payments:', error);
      return { amount: 0, currency: 'USD' };
    }
  }

  // Calculate debt-to-income ratio (requires monthly income)
  async getDebtToIncomeRatio(userId: string, monthlyIncome: { amount: number; currency: string }): Promise<number> {
    if (monthlyIncome.amount <= 0) return 0;
    
    const totalMonthlyPayments = await this.getTotalMonthlyPayments(userId);
    return (totalMonthlyPayments.amount / monthlyIncome.amount) * 100;
  }

  // Generate amortization schedule for a loan
  generateAmortizationSchedule(loan: Loan): {
    paymentNumber: number;
    paymentDate: Date;
    principalPayment: number;
    interestPayment: number;
    remainingBalance: number;
  }[] {
    if (!loan || !loan.currentBalance || loan.currentBalance.amount <= 0 || !loan.monthlyPayment || loan.monthlyPayment.amount <= 0) {
      return [];
    }

    const schedule = [];
    const monthlyRate = (loan.interestRate || 0) / 100 / 12;
    let remainingBalance = loan.currentBalance.amount;
    
    let currentDate = loan.nextPaymentDate instanceof Timestamp ? loan.nextPaymentDate.toDate() : new Date(loan.nextPaymentDate as any);
    
    const maxPayments = Math.min(loan.termMonths || 360, 360 * 2); // Cap at 60 years to be safe
    
    for (let i = 1; remainingBalance > 0.01 && i <= maxPayments; i++) {
      const interestPayment = remainingBalance * monthlyRate;
      const principalPayment = Math.min(loan.monthlyPayment.amount - interestPayment, remainingBalance);
      
      if (principalPayment <= 0 && remainingBalance > 0) {
        console.warn('Loan payment is less than interest, amortization will not complete.');
        break;
      }
      
      remainingBalance -= principalPayment;
      
      schedule.push({
        paymentNumber: i,
        paymentDate: new Date(currentDate),
        principalPayment: Math.round(principalPayment * 100) / 100,
        interestPayment: Math.round(interestPayment * 100) / 100,
        remainingBalance: Math.max(0, Math.round(remainingBalance * 100) / 100)
      });
      
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    return schedule;
  }

  // Calculate payoff date for a loan
  calculatePayoffDate(loan: Loan): Date {
    try {
      if (!loan || !loan.currentBalance || loan.currentBalance.amount <= 0) {
        return new Date();
      }
      
      const schedule = this.generateAmortizationSchedule(loan);
      return schedule.length > 0 ? schedule[schedule.length - 1].paymentDate : new Date();
    } catch (error) {
      console.error('Error calculating payoff date:', error);
      return new Date();
    }
  }

  // Calculate total interest for remaining loan term
  calculateTotalInterest(loan: Loan): number {
    try {
      if (!loan || !loan.currentBalance || loan.currentBalance.amount <= 0) {
        return 0;
      }
      
      const schedule = this.generateAmortizationSchedule(loan);
      return schedule.reduce((total, payment) => total + (payment.interestPayment || 0), 0);
    } catch (error) {
      console.error('Error calculating total interest:', error);
      return 0;
    }
  }

  // Get debt payoff strategies
  async getDebtPayoffStrategies(userId: string): Promise<{
    snowball: { order: Loan[]; totalInterest: number; payoffTime: number };
    avalanche: { order: Loan[]; totalInterest: number; payoffTime: number };
  }> {
    try {
      const activeLoans = await this.getActiveLoans(userId);
      
      if (!activeLoans || activeLoans.length === 0) {
        return {
          snowball: { order: [], totalInterest: 0, payoffTime: 0 },
          avalanche: { order: [], totalInterest: 0, payoffTime: 0 }
        };
      }
      
      const snowballOrder = [...activeLoans].sort((a, b) => 
        (a.currentBalance?.amount || 0) - (b.currentBalance?.amount || 0)
      );
      
      const avalancheOrder = [...activeLoans].sort((a, b) => 
        (b.interestRate || 0) - (a.interestRate || 0)
      );
      
      const snowballTotalInterest = snowballOrder.reduce((total, loan) => 
        total + this.calculateTotalInterest(loan), 0
      );
      
      const avalancheTotalInterest = avalancheOrder.reduce((total, loan) => 
        total + this.calculateTotalInterest(loan), 0
      );
      
      const totalMonthlyPayments = await this.getTotalMonthlyPayments(userId);
      const totalDebt = await this.getTotalDebt(userId);
      
      const payoffTime = totalDebt.amount > 0 && totalMonthlyPayments.amount > 0 
        ? Math.ceil(totalDebt.amount / totalMonthlyPayments.amount) 
        : 0;
      
      return {
        snowball: {
          order: snowballOrder,
          totalInterest: snowballTotalInterest,
          payoffTime
        },
        avalanche: {
          order: avalancheOrder,
          totalInterest: avalancheTotalInterest,
          payoffTime
        }
      };
    } catch (error) {
      console.error('Error getting debt payoff strategies:', error);
      return {
        snowball: { order: [], totalInterest: 0, payoffTime: 0 },
        avalanche: { order: [], totalInterest: 0, payoffTime: 0 }
      };
    }
  }

  // Make a payment on a loan
  async makePayment(userId: string, loanId: string, paymentAmount: number): Promise<void> {
    const loan = await this.getById(userId, loanId);
    if (!loan) throw new Error('Loan not found');
    
    const newBalanceAmount = Math.max(0, loan.currentBalance.amount - paymentAmount);
    
    let nextPaymentDate = loan.nextPaymentDate instanceof Timestamp ? loan.nextPaymentDate.toDate() : new Date(loan.nextPaymentDate as any);
    nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
    
    const newBalance: CurrencyAmount = {
      ...loan.currentBalance,
      amount: newBalanceAmount,
    };

    await this.update(userId, loanId, {
      currentBalance: newBalance,
      nextPaymentDate: Timestamp.fromDate(nextPaymentDate)
    });
  }

  // Get loans requiring payment soon (within next 7 days)
  async getUpcomingPayments(userId: string): Promise<Loan[]> {
    try {
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
      
      const activeLoans = await this.getActiveLoans(userId);
      if (!activeLoans || activeLoans.length === 0) return [];
      
      return activeLoans.filter(loan => {
        try {
          const paymentDate = loan.nextPaymentDate instanceof Timestamp ? loan.nextPaymentDate.toDate() : new Date(loan.nextPaymentDate as any);
          return paymentDate <= sevenDaysFromNow;
        } catch (error) {
          console.error('Error comparing payment date:', error);
          return false;
        }
      });
    } catch (error) {
      console.error('Error getting upcoming payments:', error);
      return [];
    }
  }
}

export const loanService = new LoanService();

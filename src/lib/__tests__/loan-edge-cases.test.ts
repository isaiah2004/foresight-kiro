/**
 * Tests for loan edge cases and error handling
 */

import { LoanService } from '../services/loan-service';
import { Loan } from '../../types/financial';
import { Timestamp } from 'firebase/firestore';

// Mock Firebase
jest.mock('../firebase-service');

describe('Loan Edge Cases', () => {
  let loanService: LoanService;

  beforeEach(() => {
    loanService = new LoanService();
  });

  describe('Empty loan scenarios', () => {
    it('should handle empty loan list gracefully', async () => {
      jest.spyOn(loanService, 'getAllOrdered').mockResolvedValue([]);

      const activeLoans = await loanService.getActiveLoans('test-user');
  const totalDebt = await loanService.getTotalDebt('test-user');
  const totalPayments = await loanService.getTotalMonthlyPayments('test-user');
      const strategies = await loanService.getDebtPayoffStrategies('test-user');

      expect(activeLoans).toEqual([]);
  expect(totalDebt.amount).toBe(0);
  expect(totalPayments.amount).toBe(0);
      expect(strategies.snowball.order).toEqual([]);
      expect(strategies.avalanche.order).toEqual([]);
    });

    it('should handle service errors gracefully', async () => {
      jest.spyOn(loanService, 'getAllOrdered').mockRejectedValue(new Error('Database error'));

      const activeLoans = await loanService.getActiveLoans('test-user');
  const totalDebt = await loanService.getTotalDebt('test-user');
  const totalPayments = await loanService.getTotalMonthlyPayments('test-user');

      expect(activeLoans).toEqual([]);
  expect(totalDebt.amount).toBe(0);
  expect(totalPayments.amount).toBe(0);
    });
  });

  describe('Paid off loan scenarios', () => {
    const paidOffLoan: Loan = {
      id: 'paid-off-loan',
      userId: 'test-user',
      type: 'car',
      name: 'Paid Off Car Loan',
      principal: { amount: 25000, currency: 'USD' },
      currentBalance: { amount: 0, currency: 'USD' }, // Paid off
      interestRate: 5.5,
      termMonths: 60,
      monthlyPayment: { amount: 478.66, currency: 'USD' },
      startDate: Timestamp.fromDate(new Date('2020-01-01')),
      nextPaymentDate: Timestamp.fromDate(new Date('2024-01-01')),
    };

    it('should handle paid off loans in amortization schedule', () => {
      const schedule = loanService.generateAmortizationSchedule(paidOffLoan);
      expect(schedule).toEqual([]);
    });

    it('should return 0 interest for paid off loans', () => {
      const totalInterest = loanService.calculateTotalInterest(paidOffLoan);
      expect(totalInterest).toBe(0);
    });

    it('should return current date for paid off loan payoff date', () => {
      const payoffDate = loanService.calculatePayoffDate(paidOffLoan);
      expect(payoffDate).toBeInstanceOf(Date);
    });
  });

  describe('Invalid loan data scenarios', () => {
    const invalidLoan: Loan = {
      id: 'invalid-loan',
      userId: 'test-user',
      type: 'personal',
      name: 'Invalid Loan',
      principal: { amount: 10000, currency: 'USD' },
      currentBalance: { amount: 5000, currency: 'USD' },
      interestRate: 0, // Zero interest
      termMonths: 0, // Zero term
      monthlyPayment: { amount: 0, currency: 'USD' }, // Zero payment
      startDate: Timestamp.fromDate(new Date('2023-01-01')),
      nextPaymentDate: Timestamp.fromDate(new Date('2024-01-01')),
    };

    it('should handle zero monthly payment gracefully', () => {
      const schedule = loanService.generateAmortizationSchedule(invalidLoan);
      expect(schedule).toEqual([]);
    });

    it('should handle zero interest rate', () => {
      const validLoan = {
        ...invalidLoan,
        monthlyPayment: { amount: 500, currency: 'USD' },
        termMonths: 12,
      };

      const schedule = loanService.generateAmortizationSchedule(validLoan);
      expect(schedule.length).toBeGreaterThan(0);
      
      // All payments should be principal only
      schedule.forEach(payment => {
        expect(payment.interestPayment).toBe(0);
      });
    });

    it('should handle missing loan data', () => {
      const schedule = loanService.generateAmortizationSchedule(null as any);
      expect(schedule).toEqual([]);

      const totalInterest = loanService.calculateTotalInterest(null as any);
      expect(totalInterest).toBe(0);
    });
  });

  describe('Date handling edge cases', () => {
    it('should handle invalid payment dates', () => {
      const loanWithBadDate: Loan = {
        id: 'bad-date-loan',
        userId: 'test-user',
        type: 'personal',
        name: 'Bad Date Loan',
        principal: { amount: 10000, currency: 'USD' },
        currentBalance: { amount: 5000, currency: 'USD' },
        interestRate: 5,
        termMonths: 12,
        monthlyPayment: { amount: 500, currency: 'USD' },
        startDate: Timestamp.fromDate(new Date('2023-01-01')),
        nextPaymentDate: null as any, // Invalid date
      };

      // Should not throw error
      expect(() => {
        const schedule = loanService.generateAmortizationSchedule(loanWithBadDate);
        expect(Array.isArray(schedule)).toBe(true);
      }).not.toThrow();
    });
  });

  describe('Calculation edge cases', () => {
    it('should handle very high interest rates', () => {
      const highInterestLoan: Loan = {
        id: 'high-interest-loan',
        userId: 'test-user',
        type: 'personal',
        name: 'High Interest Loan',
        principal: { amount: 1000, currency: 'USD' },
        currentBalance: { amount: 1000, currency: 'USD' },
        interestRate: 99.9, // Very high rate
        termMonths: 12,
        monthlyPayment: { amount: 200, currency: 'USD' },
        startDate: Timestamp.fromDate(new Date('2023-01-01')),
        nextPaymentDate: Timestamp.fromDate(new Date('2024-01-01')),
      };

      const schedule = loanService.generateAmortizationSchedule(highInterestLoan);
      expect(schedule.length).toBeGreaterThan(0);
      
      // Should still generate valid payments
      schedule.forEach(payment => {
        expect(payment.principalPayment).toBeGreaterThanOrEqual(0);
        expect(payment.interestPayment).toBeGreaterThanOrEqual(0);
        expect(payment.remainingBalance).toBeGreaterThanOrEqual(0);
      });
    });

    it('should handle very long loan terms', () => {
      const longTermLoan: Loan = {
        id: 'long-term-loan',
        userId: 'test-user',
        type: 'home',
        name: 'Long Term Loan',
        principal: { amount: 100000, currency: 'USD' },
        currentBalance: { amount: 100000, currency: 'USD' },
        interestRate: 3.5,
        termMonths: 500, // Very long term
        monthlyPayment: { amount: 500, currency: 'USD' },
        startDate: Timestamp.fromDate(new Date('2023-01-01')),
        nextPaymentDate: Timestamp.fromDate(new Date('2024-01-01')),
      };

      const schedule = loanService.generateAmortizationSchedule(longTermLoan);
      
      // Should cap at reasonable length
      expect(schedule.length).toBeLessThanOrEqual(360); // Max 30 years
    });

    it('should handle loans with missing or undefined properties', () => {
      const incompleteLoan = {
        id: 'incomplete-loan',
        userId: 'test-user',
        type: 'personal',
        name: 'Incomplete Loan',
        principal: { amount: 10000, currency: 'USD' },
        currentBalance: { amount: 5000, currency: 'USD' },
        // Missing interestRate, termMonths, monthlyPayment
        startDate: Timestamp.fromDate(new Date('2023-01-01')),
        nextPaymentDate: Timestamp.fromDate(new Date('2024-01-01')),
      } as Loan;

      // Should not throw errors
      expect(() => {
        const schedule = loanService.generateAmortizationSchedule(incompleteLoan);
        const totalInterest = loanService.calculateTotalInterest(incompleteLoan);
        const payoffDate = loanService.calculatePayoffDate(incompleteLoan);
        
        expect(Array.isArray(schedule)).toBe(true);
        expect(typeof totalInterest).toBe('number');
        expect(payoffDate).toBeInstanceOf(Date);
      }).not.toThrow();
    });
  });

  describe('Debt-to-income edge cases', () => {
    it('should handle zero income gracefully', async () => {
      const ratio = await loanService.getDebtToIncomeRatio('test-user', { amount: 0, currency: 'USD' });
      expect(ratio).toBe(0);
    });

    it('should handle negative income gracefully', async () => {
      const ratio = await loanService.getDebtToIncomeRatio('test-user', { amount: -1000, currency: 'USD' });
      expect(ratio).toBe(0);
    });

    it('should handle very high debt-to-income ratios', async () => {
      jest.spyOn(loanService, 'getTotalMonthlyPayments').mockResolvedValue({ amount: 10000, currency: 'USD' });
      
      const ratio = await loanService.getDebtToIncomeRatio('test-user', { amount: 1000, currency: 'USD' });
      expect(ratio).toBe(1000); // 1000% ratio
    });
  });

  describe('Payment processing edge cases', () => {
    it('should handle payment on non-existent loan', async () => {
      jest.spyOn(loanService, 'getById').mockResolvedValue(null);

      await expect(
        loanService.makePayment('test-user', 'non-existent', 100)
      ).rejects.toThrow('Loan not found');
    });

    it('should handle overpayment gracefully', async () => {
      const loan: Loan = {
        id: 'test-loan',
        userId: 'test-user',
        type: 'personal',
        name: 'Test Loan',
        principal: { amount: 10000, currency: 'USD' },
        currentBalance: { amount: 1000, currency: 'USD' },
        interestRate: 5,
        termMonths: 12,
        monthlyPayment: { amount: 500, currency: 'USD' },
        startDate: Timestamp.fromDate(new Date('2023-01-01')),
        nextPaymentDate: Timestamp.fromDate(new Date('2024-01-01')),
      };

      jest.spyOn(loanService, 'getById').mockResolvedValue(loan);
      jest.spyOn(loanService, 'update').mockResolvedValue();

      // Pay more than remaining balance
      await loanService.makePayment('test-user', 'test-loan', 2000);

      expect(loanService.update).toHaveBeenCalledWith(
        'test-user',
        'test-loan',
        expect.objectContaining({
          currentBalance: { amount: 0, currency: 'USD' }, // Should not go negative
        })
      );
    });
  });
});
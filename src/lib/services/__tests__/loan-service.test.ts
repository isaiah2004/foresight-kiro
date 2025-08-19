import { LoanService } from '../loan-service';
import { Loan } from '../../../types/financial';
import { Timestamp } from 'firebase/firestore';

// Mock Firebase
jest.mock('../../firebase-service');

describe('LoanService', () => {
  let loanService: LoanService;
  let mockLoan: Loan;

  beforeEach(() => {
    loanService = new LoanService();
    mockLoan = {
      id: 'test-loan-1',
      userId: 'test-user',
      type: 'car',
      name: 'Test Car Loan',
      principal: { amount: 25000, currency: 'USD' },
      currentBalance: { amount: 20000, currency: 'USD' },
      interestRate: 5.5,
      termMonths: 60,
      monthlyPayment: { amount: 478.66, currency: 'USD' },
      startDate: Timestamp.fromDate(new Date('2023-01-01')),
      nextPaymentDate: Timestamp.fromDate(new Date('2024-02-01')),
    };
  });

  describe('generateAmortizationSchedule', () => {
    it('should generate correct amortization schedule', () => {
      const schedule = loanService.generateAmortizationSchedule(mockLoan);
      
      expect(schedule).toBeDefined();
      expect(schedule.length).toBeGreaterThan(0);
      
      // First payment should have more interest than principal
      const firstPayment = schedule[0];
      expect(firstPayment.interestPayment).toBeGreaterThan(firstPayment.principalPayment);
      
      // Last payment should have remaining balance of 0
      const lastPayment = schedule[schedule.length - 1];
      expect(lastPayment.remainingBalance).toBe(0);
      
      // Each payment should equal monthly payment (except possibly the last)
      schedule.slice(0, -1).forEach(payment => {
        const totalPayment = payment.principalPayment + payment.interestPayment;
        expect(totalPayment).toBeCloseTo(mockLoan.monthlyPayment.amount, 2);
      });
    });

    it('should handle zero interest rate', () => {
      const zeroInterestLoan: Loan = {
        ...mockLoan,
        interestRate: 0,
        monthlyPayment: { amount: mockLoan.currentBalance.amount / mockLoan.termMonths, currency: 'USD' },
      };
      
      const schedule = loanService.generateAmortizationSchedule(zeroInterestLoan);
      
      expect(schedule).toBeDefined();
      expect(schedule.length).toBeGreaterThan(0);
      
      // All payments should be principal only
      schedule.forEach(payment => {
        expect(payment.interestPayment).toBe(0);
        expect(payment.principalPayment).toBeGreaterThan(0);
      });
    });

    it('should handle small remaining balances correctly', () => {
      const smallBalanceLoan: Loan = {
        ...mockLoan,
        currentBalance: { amount: 100, currency: 'USD' },
        monthlyPayment: { amount: 50, currency: 'USD' },
      };
      
      const schedule = loanService.generateAmortizationSchedule(smallBalanceLoan);
      
      expect(schedule).toBeDefined();
      expect(schedule.length).toBeLessThanOrEqual(3); // Should pay off quickly
      
      const lastPayment = schedule[schedule.length - 1];
      expect(lastPayment.remainingBalance).toBe(0);
    });
  });

  describe('calculateTotalInterest', () => {
    it('should calculate total interest correctly', () => {
      const totalInterest = loanService.calculateTotalInterest(mockLoan);
      
      expect(totalInterest).toBeGreaterThan(0);
      expect(totalInterest).toBeLessThan(mockLoan.currentBalance.amount);
    });

    it('should return 0 for zero interest loan', () => {
      const zeroInterestLoan = {
        ...mockLoan,
        interestRate: 0,
      };
      
      const totalInterest = loanService.calculateTotalInterest(zeroInterestLoan);
      expect(totalInterest).toBe(0);
    });
  });

  describe('calculatePayoffDate', () => {
    it('should calculate payoff date correctly', () => {
      const payoffDate = loanService.calculatePayoffDate(mockLoan);
      
      expect(payoffDate).toBeInstanceOf(Date);
      expect(payoffDate.getTime()).toBeGreaterThan(mockLoan.nextPaymentDate.toDate().getTime());
    });
  });

  describe('debt payoff strategies', () => {
    const mockLoans: Loan[] = [
      {
        ...mockLoan,
        id: 'loan-1',
        name: 'High Interest Loan',
        currentBalance: { amount: 5000, currency: 'USD' },
        interestRate: 18.0,
        monthlyPayment: { amount: 200, currency: 'USD' },
      },
      {
        ...mockLoan,
        id: 'loan-2',
        name: 'Medium Interest Loan',
        currentBalance: { amount: 10000, currency: 'USD' },
        interestRate: 8.0,
        monthlyPayment: { amount: 300, currency: 'USD' },
      },
      {
        ...mockLoan,
        id: 'loan-3',
        name: 'Low Interest Loan',
        currentBalance: { amount: 15000, currency: 'USD' },
        interestRate: 4.0,
        monthlyPayment: { amount: 400, currency: 'USD' },
      },
    ];

    beforeEach(() => {
      // Mock the getActiveLoans method
      jest.spyOn(loanService, 'getActiveLoans').mockResolvedValue(mockLoans);
      jest.spyOn(loanService, 'getTotalMonthlyPayments').mockResolvedValue({ amount: 900, currency: 'USD' });
      jest.spyOn(loanService, 'getTotalDebt').mockResolvedValue({ amount: 30000, currency: 'USD' });
    });

    it('should order loans correctly for debt avalanche (highest interest first)', async () => {
      const strategies = await loanService.getDebtPayoffStrategies('test-user');
      
      const avalancheOrder = strategies.avalanche.order;
      expect(avalancheOrder[0].interestRate).toBe(18.0); // Highest interest first
      expect(avalancheOrder[1].interestRate).toBe(8.0);
      expect(avalancheOrder[2].interestRate).toBe(4.0); // Lowest interest last
    });

    it('should order loans correctly for debt snowball (smallest balance first)', async () => {
      const strategies = await loanService.getDebtPayoffStrategies('test-user');
      
      const snowballOrder = strategies.snowball.order;
      expect(snowballOrder[0].currentBalance).toBe(5000); // Smallest balance first
      expect(snowballOrder[1].currentBalance).toBe(10000);
      expect(snowballOrder[2].currentBalance).toBe(15000); // Largest balance last
    });

    it('should calculate strategy totals', async () => {
      const strategies = await loanService.getDebtPayoffStrategies('test-user');
      
      expect(strategies.snowball.totalInterest).toBeGreaterThan(0);
      expect(strategies.avalanche.totalInterest).toBeGreaterThan(0);
      expect(strategies.snowball.payoffTime).toBeGreaterThan(0);
      expect(strategies.avalanche.payoffTime).toBeGreaterThan(0);
    });
  });

  describe('debt-to-income calculations', () => {
    it('should calculate debt-to-income ratio correctly', async () => {
      const monthlyIncome = 5000;
      const monthlyPayments = 1500;
      
      jest.spyOn(loanService, 'getTotalMonthlyPayments').mockResolvedValue({ amount: monthlyPayments, currency: 'USD' });
      
      const ratio = await loanService.getDebtToIncomeRatio('test-user', { amount: monthlyIncome, currency: 'USD' });
      
      expect(ratio).toBe(30); // 1500 / 5000 * 100 = 30%
    });

    it('should return 0 for zero income', async () => {
      const ratio = await loanService.getDebtToIncomeRatio('test-user', { amount: 0, currency: 'USD' });
      expect(ratio).toBe(0);
    });

    it('should handle negative income gracefully', async () => {
      const ratio = await loanService.getDebtToIncomeRatio('test-user', { amount: -1000, currency: 'USD' });
      expect(ratio).toBe(0);
    });
  });

  describe('payment processing', () => {
    beforeEach(() => {
      jest.spyOn(loanService, 'getById').mockResolvedValue(mockLoan);
      jest.spyOn(loanService, 'update').mockResolvedValue();
    });

    it('should process payment correctly', async () => {
      const paymentAmount = 1000;
      
      await loanService.makePayment('test-user', 'test-loan-1', paymentAmount);
      
      expect(loanService.update).toHaveBeenCalledWith(
        'test-user',
        'test-loan-1',
        expect.objectContaining({
          currentBalance: { amount: mockLoan.currentBalance.amount - paymentAmount, currency: 'USD' },
        })
      );
    });

    it('should not allow payment to create negative balance', async () => {
      const paymentAmount = mockLoan.currentBalance.amount + 1000;
      
      await loanService.makePayment('test-user', 'test-loan-1', paymentAmount);
      
      expect(loanService.update).toHaveBeenCalledWith(
        'test-user',
        'test-loan-1',
        expect.objectContaining({
          currentBalance: { amount: 0, currency: 'USD' }, // Should not go below 0
        })
      );
    });

    it('should update next payment date', async () => {
      const paymentAmount = 500;
      
      await loanService.makePayment('test-user', 'test-loan-1', paymentAmount);
      
      expect(loanService.update).toHaveBeenCalledWith(
        'test-user',
        'test-loan-1',
        expect.objectContaining({
          nextPaymentDate: expect.any(Timestamp),
        })
      );
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle loan not found in makePayment', async () => {
      jest.spyOn(loanService, 'getById').mockResolvedValue(null);
      
      await expect(
        loanService.makePayment('test-user', 'non-existent-loan', 100)
      ).rejects.toThrow('Loan not found');
    });

    it('should handle very high interest rates', () => {
      const highInterestLoan: Loan = {
        ...mockLoan,
        interestRate: 99.9,
      };
      
      const schedule = loanService.generateAmortizationSchedule(highInterestLoan);
      
      expect(schedule).toBeDefined();
      expect(schedule.length).toBeGreaterThan(0);
      
      // Should still generate valid schedule
      schedule.forEach(payment => {
        expect(payment.principalPayment).toBeGreaterThanOrEqual(0);
        expect(payment.interestPayment).toBeGreaterThanOrEqual(0);
        expect(payment.remainingBalance).toBeGreaterThanOrEqual(0);
      });
    });

    it('should handle very short loan terms', () => {
      const shortTermLoan: Loan = {
        ...mockLoan,
        termMonths: 1,
        monthlyPayment: { amount: mockLoan.currentBalance.amount * 1.1, currency: 'USD' }, // Enough to cover principal + interest
      };
      
      const schedule = loanService.generateAmortizationSchedule(shortTermLoan);
      
      expect(schedule).toBeDefined();
      expect(schedule.length).toBe(1);
      expect(schedule[0].remainingBalance).toBe(0);
    });
  });
});

// Integration tests for loan calculations
describe('Loan Calculation Integration', () => {
  it('should maintain mathematical consistency across all calculations', () => {
    const loanService = new LoanService();
    const testLoan: Loan = {
      id: 'integration-test',
      userId: 'test-user',
      type: 'personal',
      name: 'Integration Test Loan',
      principal: { amount: 10000, currency: 'USD' },
      currentBalance: { amount: 8000, currency: 'USD' },
      interestRate: 6.0,
      termMonths: 36,
      monthlyPayment: { amount: 304.22, currency: 'USD' },
      startDate: Timestamp.fromDate(new Date('2023-01-01')),
      nextPaymentDate: Timestamp.fromDate(new Date('2024-01-01')),
    };

    const schedule = loanService.generateAmortizationSchedule(testLoan);
    const totalInterest = loanService.calculateTotalInterest(testLoan);
    const payoffDate = loanService.calculatePayoffDate(testLoan);

    // Verify schedule consistency
    const calculatedTotalInterest = schedule.reduce(
      (sum, payment) => sum + payment.interestPayment,
      0
    );
    
    expect(Math.abs(calculatedTotalInterest - totalInterest)).toBeLessThan(0.01);
    
    // Verify payoff date matches schedule
    const schedulePayoffDate = schedule[schedule.length - 1].paymentDate;
    expect(Math.abs(payoffDate.getTime() - schedulePayoffDate.getTime())).toBeLessThan(24 * 60 * 60 * 1000); // Within 1 day
    
    // Verify balance decreases monotonically
    for (let i = 1; i < schedule.length; i++) {
      expect(schedule[i].remainingBalance).toBeLessThanOrEqual(schedule[i - 1].remainingBalance);
    }
  });
});
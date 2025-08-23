/**
 * Tests for loan calculation functions
 * These tests focus on the mathematical accuracy of loan calculations
 */

// Simple loan calculation functions for testing
export function calculateMonthlyPayment(
  principal: number,
  annualRate: number,
  termMonths: number
): number {
  if (annualRate === 0) {
    return principal / termMonths;
  }

  const monthlyRate = annualRate / 100 / 12;
  return principal * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
    (Math.pow(1 + monthlyRate, termMonths) - 1);
}

export function generateAmortizationSchedule(
  principal: number,
  annualRate: number,
  termMonths: number,
  monthlyPayment: number
): Array<{
  paymentNumber: number;
  principalPayment: number;
  interestPayment: number;
  remainingBalance: number;
}> {
  const schedule = [];
  const monthlyRate = annualRate / 100 / 12;
  let remainingBalance = principal;

  for (let i = 1; i <= termMonths && remainingBalance > 0.01; i++) {
    const interestPayment = remainingBalance * monthlyRate;
    const principalPayment = Math.min(monthlyPayment - interestPayment, remainingBalance);
    remainingBalance -= principalPayment;

    schedule.push({
      paymentNumber: i,
      principalPayment: Math.round(principalPayment * 100) / 100,
      interestPayment: Math.round(interestPayment * 100) / 100,
      remainingBalance: Math.round(remainingBalance * 100) / 100
    });
  }

  return schedule;
}

export function calculateTotalInterest(schedule: Array<{ interestPayment: number }>): number {
  return schedule.reduce((total, payment) => total + payment.interestPayment, 0);
}

export function calculateDebtToIncomeRatio(
  monthlyDebtPayments: number,
  monthlyIncome: number
): number {
  if (monthlyIncome <= 0) return 0;
  return (monthlyDebtPayments / monthlyIncome) * 100;
}

describe('Loan Calculations', () => {
  describe('calculateMonthlyPayment', () => {
    it('should calculate correct monthly payment for standard loan', () => {
      const principal = 25000;
      const annualRate = 5.5;
      const termMonths = 60;

  const monthlyPayment = calculateMonthlyPayment(principal, annualRate, termMonths);

  // Expected payment for this loan should be around $477.53
  expect(monthlyPayment).toBeCloseTo(477.53, 2);
    });

    it('should handle zero interest rate', () => {
      const principal = 12000;
      const annualRate = 0;
      const termMonths = 24;

      const monthlyPayment = calculateMonthlyPayment(principal, annualRate, termMonths);

      expect(monthlyPayment).toBe(500); // 12000 / 24 = 500
    });

    it('should handle high interest rates', () => {
      const principal = 10000;
      const annualRate = 25;
      const termMonths = 36;

      const monthlyPayment = calculateMonthlyPayment(principal, annualRate, termMonths);

      expect(monthlyPayment).toBeGreaterThan(principal / termMonths);
      expect(monthlyPayment).toBeLessThan(principal); // Sanity check
    });

    it('should handle short term loans', () => {
      const principal = 5000;
      const annualRate = 6;
      const termMonths = 6;

      const monthlyPayment = calculateMonthlyPayment(principal, annualRate, termMonths);

      expect(monthlyPayment).toBeGreaterThan(800);
      expect(monthlyPayment).toBeLessThan(900);
    });
  });

  describe('generateAmortizationSchedule', () => {
    it('should generate correct amortization schedule', () => {
      const principal = 10000;
      const annualRate = 6;
      const termMonths = 12;
      const monthlyPayment = calculateMonthlyPayment(principal, annualRate, termMonths);

  const schedule = generateAmortizationSchedule(principal, annualRate, termMonths, monthlyPayment);

  expect(schedule).toHaveLength(12);

  // First payment should have more principal than interest
  expect(schedule[0].principalPayment).toBeGreaterThan(schedule[0].interestPayment);

      // Last payment should have more principal than interest
      const lastPayment = schedule[schedule.length - 1];
      expect(lastPayment.principalPayment).toBeGreaterThan(lastPayment.interestPayment);

      // Final balance should be zero (or very close)
      expect(lastPayment.remainingBalance).toBeLessThan(0.01);

      // Each payment should equal monthly payment (within rounding)
      schedule.forEach(payment => {
        const totalPayment = payment.principalPayment + payment.interestPayment;
        expect(totalPayment).toBeCloseTo(monthlyPayment, 1);
      });
    });

    it('should handle zero interest correctly', () => {
      const principal = 6000;
      const annualRate = 0;
      const termMonths = 6;
      const monthlyPayment = 1000;

      const schedule = generateAmortizationSchedule(principal, annualRate, termMonths, monthlyPayment);

      expect(schedule).toHaveLength(6);

      // All payments should be principal only
      schedule.forEach(payment => {
        expect(payment.interestPayment).toBe(0);
        expect(payment.principalPayment).toBe(1000);
      });

      expect(schedule[5].remainingBalance).toBe(0);
    });

    it('should handle early payoff scenarios', () => {
      const principal = 5000;
      const annualRate = 5;
      const termMonths = 60;
      const monthlyPayment = 500; // Higher than required payment

      const schedule = generateAmortizationSchedule(principal, annualRate, termMonths, monthlyPayment);

      // Should pay off early
      expect(schedule.length).toBeLessThan(termMonths);
      expect(schedule[schedule.length - 1].remainingBalance).toBeLessThan(0.01);
    });

    it('should maintain balance consistency', () => {
      const principal = 15000;
      const annualRate = 4.5;
      const termMonths = 36;
      const monthlyPayment = calculateMonthlyPayment(principal, annualRate, termMonths);

      const schedule = generateAmortizationSchedule(principal, annualRate, termMonths, monthlyPayment);

      // Verify balance decreases monotonically
      for (let i = 1; i < schedule.length; i++) {
        expect(schedule[i].remainingBalance).toBeLessThanOrEqual(schedule[i - 1].remainingBalance);
      }

      // Verify first balance calculation
      const firstPayment = schedule[0];
      const expectedFirstBalance = principal - firstPayment.principalPayment;
      expect(firstPayment.remainingBalance).toBeCloseTo(expectedFirstBalance, 2);
    });
  });

  describe('calculateTotalInterest', () => {
    it('should calculate total interest correctly', () => {
      const schedule = [
        { interestPayment: 50.00 },
        { interestPayment: 49.50 },
        { interestPayment: 49.00 },
      ];

      const totalInterest = calculateTotalInterest(schedule);
      expect(totalInterest).toBe(148.50);
    });

    it('should handle empty schedule', () => {
      const totalInterest = calculateTotalInterest([]);
      expect(totalInterest).toBe(0);
    });

    it('should handle zero interest payments', () => {
      const schedule = [
        { interestPayment: 0 },
        { interestPayment: 0 },
        { interestPayment: 0 },
      ];

      const totalInterest = calculateTotalInterest(schedule);
      expect(totalInterest).toBe(0);
    });
  });

  describe('calculateDebtToIncomeRatio', () => {
    it('should calculate debt-to-income ratio correctly', () => {
      const monthlyDebtPayments = 1500;
      const monthlyIncome = 5000;

      const ratio = calculateDebtToIncomeRatio(monthlyDebtPayments, monthlyIncome);
      expect(ratio).toBe(30);
    });

    it('should return 0 for zero income', () => {
      const ratio = calculateDebtToIncomeRatio(1000, 0);
      expect(ratio).toBe(0);
    });

    it('should return 0 for negative income', () => {
      const ratio = calculateDebtToIncomeRatio(1000, -500);
      expect(ratio).toBe(0);
    });

    it('should handle zero debt payments', () => {
      const ratio = calculateDebtToIncomeRatio(0, 5000);
      expect(ratio).toBe(0);
    });

    it('should handle high debt-to-income ratios', () => {
      const monthlyDebtPayments = 4000;
      const monthlyIncome = 5000;

      const ratio = calculateDebtToIncomeRatio(monthlyDebtPayments, monthlyIncome);
      expect(ratio).toBe(80);
    });

    it('should handle ratios over 100%', () => {
      const monthlyDebtPayments = 6000;
      const monthlyIncome = 5000;

      const ratio = calculateDebtToIncomeRatio(monthlyDebtPayments, monthlyIncome);
      expect(ratio).toBe(120);
    });
  });

  describe('Integration tests', () => {
    it('should maintain mathematical consistency across all calculations', () => {
      const principal = 20000;
      const annualRate = 5.5;
      const termMonths = 48;

      const monthlyPayment = calculateMonthlyPayment(principal, annualRate, termMonths);
      const schedule = generateAmortizationSchedule(principal, annualRate, termMonths, monthlyPayment);
      const totalInterest = calculateTotalInterest(schedule);

      // Total of all payments should equal principal + total interest
      const totalPrincipalPaid = schedule.reduce((sum, payment) => sum + payment.principalPayment, 0);
      const totalInterestPaid = schedule.reduce((sum, payment) => sum + payment.interestPayment, 0);

  expect(totalPrincipalPaid).toBeCloseTo(principal, 1);
      expect(totalInterestPaid).toBeCloseTo(totalInterest, 2);

      // Total payments should equal principal + interest
  const totalPayments = totalPrincipalPaid + totalInterestPaid;
  expect(totalPayments).toBeCloseTo(principal + totalInterest, 1);
    });

    it('should handle realistic loan scenarios', () => {
      // Mortgage scenario
      const mortgagePrincipal = 300000;
      const mortgageRate = 3.5;
      const mortgageTermMonths = 360; // 30 years

      const mortgagePayment = calculateMonthlyPayment(mortgagePrincipal, mortgageRate, mortgageTermMonths);
      expect(mortgagePayment).toBeCloseTo(1347.13, 2);

      // Car loan scenario
      const carPrincipal = 25000;
      const carRate = 4.5;
      const carTermMonths = 60; // 5 years

  const carPayment = calculateMonthlyPayment(carPrincipal, carRate, carTermMonths);
  expect(carPayment).toBeCloseTo(466.08, 2);

      // Personal loan scenario
      const personalPrincipal = 10000;
      const personalRate = 12.0;
      const personalTermMonths = 36; // 3 years

      const personalPayment = calculateMonthlyPayment(personalPrincipal, personalRate, personalTermMonths);
      expect(personalPayment).toBeCloseTo(332.14, 2);
    });
  });
});
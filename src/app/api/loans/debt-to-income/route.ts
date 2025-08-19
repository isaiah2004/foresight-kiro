import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { loanService } from '@/lib/services/loan-service';
import { incomeService } from '@/lib/services/income-service';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get monthly income with error handling
    let monthlyIncome = { amount: 0, currency: 'USD' };
    try {
      monthlyIncome = await incomeService.getMonthlyIncome(userId);
    } catch (error) {
      console.error('Error getting monthly income:', error);
      // Continue with 0 income to show debt-to-income as unavailable
    }
    
    // Calculate debt-to-income ratio with error handling
    let debtToIncomeRatio = 0;
    let totalMonthlyPayments = { amount: 0, currency: 'USD' };
    let totalDebt = { amount: 0, currency: 'USD' };
    
    try {
      debtToIncomeRatio = await loanService.getDebtToIncomeRatio(userId, monthlyIncome);
      totalMonthlyPayments = await loanService.getTotalMonthlyPayments(userId);
      totalDebt = await loanService.getTotalDebt(userId);
    } catch (error) {
      console.error('Error calculating debt metrics:', error);
      // Continue with 0 values
    }

    // Determine risk level based on debt-to-income ratio
    let riskLevel: 'low' | 'medium' | 'high';
    let recommendation: string;

    if (monthlyIncome.amount === 0) {
      riskLevel = 'medium';
      recommendation = 'Add your income information to get a complete debt-to-income analysis.';
    } else if (debtToIncomeRatio <= 20) {
      riskLevel = 'low';
      recommendation = 'Your debt-to-income ratio is excellent. You have good financial flexibility.';
    } else if (debtToIncomeRatio <= 36) {
      riskLevel = 'medium';
      recommendation = 'Your debt-to-income ratio is manageable but could be improved. Consider paying down high-interest debt first.';
    } else {
      riskLevel = 'high';
      recommendation = 'Your debt-to-income ratio is high. Focus on reducing debt and increasing income to improve your financial health.';
    }

    return NextResponse.json({
      debtToIncomeRatio,
      monthlyIncome: monthlyIncome.amount,
      totalMonthlyPayments: totalMonthlyPayments.amount,
      totalDebt: totalDebt.amount,
      riskLevel,
      recommendation,
    });
  } catch (error) {
    console.error('Error calculating debt-to-income ratio:', error);
    return NextResponse.json(
      { 
        error: 'Failed to calculate debt-to-income ratio',
        debtToIncomeRatio: 0,
        monthlyIncome: 0,
        totalMonthlyPayments: 0,
        totalDebt: 0,
        riskLevel: 'medium',
        recommendation: 'Unable to calculate debt-to-income ratio. Please try again later.'
      },
      { status: 500 }
    );
  }
}
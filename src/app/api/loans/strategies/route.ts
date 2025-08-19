import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { loanService } from '@/lib/services/loan-service';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get strategies with error handling
    let strategies;
    let totalDebt = { amount: 0, currency: 'USD' };
    let totalMonthlyPayments = { amount: 0, currency: 'USD' };
    
    try {
      strategies = await loanService.getDebtPayoffStrategies(userId);
      totalDebt = await loanService.getTotalDebt(userId);
      totalMonthlyPayments = await loanService.getTotalMonthlyPayments(userId);
    } catch (error) {
      console.error('Error calculating strategies:', error);
      // Return empty strategies instead of failing
      strategies = {
        snowball: { order: [], totalInterest: 0, payoffTime: 0 },
        avalanche: { order: [], totalInterest: 0, payoffTime: 0 }
      };
    }

    return NextResponse.json({
      strategies,
      summary: {
        totalDebt: totalDebt.amount,
        totalMonthlyPayments: totalMonthlyPayments.amount,
      },
    });
  } catch (error) {
    console.error('Error fetching debt payoff strategies:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch debt payoff strategies',
        strategies: {
          snowball: { order: [], totalInterest: 0, payoffTime: 0 },
          avalanche: { order: [], totalInterest: 0, payoffTime: 0 }
        },
        summary: {
          totalDebt: 0,
          totalMonthlyPayments: 0,
        }
      },
      { status: 500 }
    );
  }
}
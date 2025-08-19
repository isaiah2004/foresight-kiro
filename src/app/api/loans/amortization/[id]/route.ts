import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { loanService } from '@/lib/services/loan-service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const loan = await loanService.getById(userId, id);
    
    if (!loan) {
      return NextResponse.json({ error: 'Loan not found' }, { status: 404 });
    }

    // Handle edge case of paid off loan
    if (loan.currentBalance.amount <= 0) {
      return NextResponse.json({
        schedule: [],
        totalInterest: 0,
        payoffDate: new Date(),
        totalPayments: 0,
        message: 'This loan has been paid off'
      });
    }

    let amortizationSchedule: any[] = [];
    let totalInterest = 0;
    let payoffDate = new Date();

    try {
      amortizationSchedule = loanService.generateAmortizationSchedule(loan);
      totalInterest = loanService.calculateTotalInterest(loan);
      payoffDate = loanService.calculatePayoffDate(loan);
    } catch (calculationError) {
      console.error('Error in loan calculations:', calculationError);
      // Return empty schedule instead of failing
    }

    return NextResponse.json({
      schedule: amortizationSchedule,
      totalInterest,
      payoffDate,
      totalPayments: amortizationSchedule.length,
    });
  } catch (error) {
    console.error('Error generating amortization schedule:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate amortization schedule',
        schedule: [],
        totalInterest: 0,
        payoffDate: new Date(),
        totalPayments: 0,
      },
      { status: 500 }
    );
  }
}
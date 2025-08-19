import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { loanService } from '@/lib/services/loan-service';
import { z } from 'zod';

const paymentSchema = z.object({
  amount: z.number().positive('Payment amount must be positive'),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { amount } = paymentSchema.parse(body);

    // Verify loan exists and belongs to user
    const loan = await loanService.getById(userId, id);
    if (!loan) {
      return NextResponse.json({ error: 'Loan not found' }, { status: 404 });
    }

    if (amount > loan.currentBalance.amount) {
      return NextResponse.json(
        { error: 'Payment amount cannot exceed current balance' },
        { status: 400 }
      );
    }

    await loanService.makePayment(userId, id, amount);
    
    // Get the updated loan to return
    const updatedLoan = await loanService.getById(userId, id);
    
    return NextResponse.json({
      message: 'Payment processed successfully',
      loan: updatedLoan,
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid payment data', details: error.issues },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to process payment' },
      { status: 500 }
    );
  }
}
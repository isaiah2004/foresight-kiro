import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { loanService } from '@/lib/services/loan-service';
import { updateLoanFormSchema } from '@/lib/validations';
import { ZodError } from 'zod';
import { Timestamp } from 'firebase/firestore';

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

    return NextResponse.json(loan);
  } catch (error) {
    console.error('Error fetching loan:', error);
    return NextResponse.json(
      { error: 'Failed to fetch loan' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateLoanFormSchema.parse({
      ...body,
      id,
    });

    const { currency, ...updateFields } = validatedData;

    // Build the update object, converting to CurrencyAmount and Timestamp
    const updateData: { [key: string]: any } = {};

    for (const [key, value] of Object.entries(updateFields)) {
      if (value === undefined || value === null) continue;

      if (key === 'principal' || key === 'currentBalance' || key === 'monthlyPayment') {
        if (typeof value === 'number' && currency) {
          const existingLoan = await loanService.getById(userId, id);
          updateData[key] = {
            amount: value,
            currency: currency || existingLoan?.principal.currency || 'USD',
          };
        }
      } else if (key === 'startDate' || key === 'nextPaymentDate') {
        updateData[key] = Timestamp.fromDate(new Date(value as string));
      } else if (key !== 'id') {
        updateData[key] = value;
      }
    }

    await loanService.update(userId, id, updateData);
    
    const loan = await loanService.getById(userId, id);
    return NextResponse.json(loan);
  } catch (error) {
    console.error('Error updating loan:', error);
    
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid loan data', details: error.issues },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update loan' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await loanService.delete(userId, id);
    
    return NextResponse.json({ message: 'Loan deleted successfully' });
  } catch (error) {
    console.error('Error deleting loan:', error);
    return NextResponse.json(
      { error: 'Failed to delete loan' },
      { status: 500 }
    );
  }
}
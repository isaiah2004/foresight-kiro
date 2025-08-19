import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { loanService } from '@/lib/services/loan-service';
import { createLoanFormSchema } from '@/lib/validations';
import { ZodError } from 'zod';
import { Timestamp } from 'firebase/firestore';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const active = searchParams.get('active');

    let loans;
    
    if (type) {
      loans = await loanService.getByType(userId, type as any);
    } else if (active === 'true') {
      loans = await loanService.getActiveLoans(userId);
    } else {
      loans = await loanService.getAllOrdered(userId);
    }

    return NextResponse.json(loans);
  } catch (error) {
    console.error('Error fetching loans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch loans' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createLoanFormSchema.parse(body);

    // Manually construct the loan object with CurrencyAmount
    const loanData = {
      userId,
      name: validatedData.name,
      type: validatedData.type,
      interestRate: validatedData.interestRate,
      termMonths: validatedData.termMonths,
      principal: {
        amount: validatedData.principal,
        currency: validatedData.currency,
      },
      currentBalance: {
        amount: validatedData.currentBalance,
        currency: validatedData.currency,
      },
      monthlyPayment: {
        amount: validatedData.monthlyPayment,
        currency: validatedData.currency,
      },
      startDate: Timestamp.fromDate(new Date(validatedData.startDate)),
      nextPaymentDate: Timestamp.fromDate(new Date(validatedData.nextPaymentDate)),
    };

    const loanId = await loanService.create(userId, loanData);
    
    // Get the created loan to return
    const loan = await loanService.getById(userId, loanId);
    return NextResponse.json(loan, { status: 201 });
  } catch (error) {
    console.error('Error creating loan:', error);
    
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid loan data', details: error.issues },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create loan' },
      { status: 500 }
    );
  }
}
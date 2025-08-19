import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { expenseService } from '@/lib/services/expense-service';
import { createExpenseSchema } from '@/lib/validations';
import { Timestamp } from 'firebase/firestore';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const isFixed = searchParams.get('isFixed');

    let expenses;
    
    if (category) {
      expenses = await expenseService.getByCategory(userId, category as any);
    } else if (isFixed !== null) {
      if (isFixed === 'true') {
        expenses = await expenseService.getFixedExpenses(userId);
      } else {
        expenses = await expenseService.getVariableExpenses(userId);
      }
    } else {
      expenses = await expenseService.getAllOrdered(userId);
    }

    return NextResponse.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch expenses' },
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
    const validatedData = createExpenseSchema.parse({
      ...body,
      userId,
    });

    // Convert dates to Firestore Timestamps
    const expenseData = {
      ...validatedData,
      startDate: Timestamp.fromDate(validatedData.startDate),
      endDate: validatedData.endDate ? Timestamp.fromDate(validatedData.endDate) : undefined,
    };

    const expenseId = await expenseService.create(userId, expenseData);
    
    // Get the created expense to return
    const expense = await expenseService.getById(userId, expenseId);
    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error('Error creating expense:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid expense data', details: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create expense' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { incomeService } from '@/lib/services/income-service';
import { createIncomeSchema } from '@/lib/validations';
import { Timestamp } from 'firebase/firestore';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const activeOnly = searchParams.get('active') === 'true';

    let incomes;
    if (type) {
      incomes = await incomeService.getIncomesByType(userId, type);
    } else if (activeOnly) {
      incomes = await incomeService.getActiveIncomes(userId);
    } else {
      incomes = await incomeService.getAll(userId);
    }

    return NextResponse.json(incomes);
  } catch (error) {
    console.error('Error fetching incomes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch incomes' },
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

    // Validate the request body
    const validationResult = createIncomeSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const incomeData = validationResult.data;

    // Convert date strings to Timestamp objects and add userId
    const processedData: any = {
      ...incomeData,
      userId,
      startDate: Timestamp.fromDate(new Date(incomeData.startDate)),
    };
    
    // Only add endDate if it exists (Firebase doesn't allow undefined values)
    if (incomeData.endDate) {
      processedData.endDate = Timestamp.fromDate(new Date(incomeData.endDate));
    }

    const incomeId = await incomeService.create(userId, processedData);
    const createdIncome = await incomeService.getById(userId, incomeId);

    return NextResponse.json(createdIncome, { status: 201 });
  } catch (error) {
    console.error('Error creating income:', error);
    return NextResponse.json(
      { error: 'Failed to create income' },
      { status: 500 }
    );
  }
}
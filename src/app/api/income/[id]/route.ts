import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { incomeService } from '@/lib/services/income-service';
import { updateIncomeSchema } from '@/lib/validations';
import { Timestamp } from 'firebase/firestore';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const income = await incomeService.getById(userId, id);
    
    if (!income) {
      return NextResponse.json({ error: 'Income not found' }, { status: 404 });
    }

    return NextResponse.json(income);
  } catch (error) {
    console.error('Error fetching income:', error);
    return NextResponse.json(
      { error: 'Failed to fetch income' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    const { id } = await params;
    
    // Validate the request body
    const validationResult = updateIncomeSchema.safeParse({ ...body, id });
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { id: validatedId, ...updateData } = validationResult.data;
    
    // Convert date strings to Timestamp objects if they exist
    const processedData: any = { ...updateData };
    if (updateData.startDate) {
      processedData.startDate = Timestamp.fromDate(new Date(updateData.startDate));
    }
    if (updateData.endDate) {
      processedData.endDate = Timestamp.fromDate(new Date(updateData.endDate));
    }

    await incomeService.update(userId, id, processedData);
    const updatedIncome = await incomeService.getById(userId, id);

    return NextResponse.json(updatedIncome);
  } catch (error) {
    console.error('Error updating income:', error);
    return NextResponse.json(
      { error: 'Failed to update income' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await incomeService.delete(userId, id);

    return NextResponse.json({ message: 'Income deleted successfully' });
  } catch (error) {
    console.error('Error deleting income:', error);
    return NextResponse.json(
      { error: 'Failed to delete income' },
      { status: 500 }
    );
  }
}
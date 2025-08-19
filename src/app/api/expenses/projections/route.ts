import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { expenseService } from '@/lib/services/expense-service';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projections = await expenseService.getExpenseProjections(userId);
    return NextResponse.json(projections);
  } catch (error) {
    console.error('Error fetching expense projections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch expense projections' },
      { status: 500 }
    );
  }
}
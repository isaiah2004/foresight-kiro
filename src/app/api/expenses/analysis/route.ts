import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { expenseService } from '@/lib/services/expense-service';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const analysis = await expenseService.getSpendingAnalysis(userId);
    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Error fetching expense analysis:', error);
    return NextResponse.json(
      { error: 'Failed to fetch expense analysis' },
      { status: 500 }
    );
  }
}
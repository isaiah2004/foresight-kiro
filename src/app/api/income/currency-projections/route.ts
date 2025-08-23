import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { incomeService } from '@/lib/services/income-service';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const targetCurrency = searchParams.get('currency');

    if (!targetCurrency) {
      return NextResponse.json(
        { error: 'Target currency is required' },
        { status: 400 }
      );
    }

    const projections = await incomeService.getCurrencySpecificProjections(userId, targetCurrency);

    return NextResponse.json(projections);
  } catch (error) {
    if (process.env.NODE_ENV !== 'test') {
      console.error('Error fetching currency projections:', error);
    }
    return NextResponse.json(
      { error: 'Failed to fetch currency projections' },
      { status: 500 }
    );
  }
}
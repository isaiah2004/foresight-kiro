import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { incomeService } from '@/lib/services/income-service';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currencyExposure = await incomeService.getIncomeByCurrency(userId);

    return NextResponse.json(currencyExposure);
  } catch (error) {
    if (process.env.NODE_ENV !== 'test') {
      console.error('Error fetching currency exposure:', error);
    }
    return NextResponse.json(
      { error: 'Failed to fetch currency exposure' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { incomeService } from '@/lib/services/income-service';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const taxImplications = await incomeService.getTaxImplications(userId);

    return NextResponse.json(taxImplications);
  } catch (error) {
    console.error('Error fetching tax implications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tax implications' },
      { status: 500 }
    );
  }
}
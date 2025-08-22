import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { loanService } from '@/lib/services/loan-service';
import { userService } from '@/lib/services/user-service';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's primary currency
    const user = await userService.getById(userId);
    const primaryCurrency = user?.preferences?.primaryCurrency || 'USD';

    const projections = await loanService.getMultiCurrencyProjections(userId, primaryCurrency);

    return NextResponse.json(projections);
  } catch (error) {
    console.error('Error fetching multi-currency projections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projections' },
      { status: 500 }
    );
  }
}
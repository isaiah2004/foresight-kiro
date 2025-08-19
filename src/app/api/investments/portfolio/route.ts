import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { investmentService } from '@/lib/services/investment-service';
import { userService } from '@/lib/services/user-service';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's primary currency preference
    const userPreferences = await userService.getUserPreferences(userId);
    const primaryCurrency = userPreferences? userPreferences.primaryCurrency : 'USD';

    const portfolioSummary = await investmentService.getPortfolioSummary(userId, primaryCurrency);
    
    return NextResponse.json({ portfolioSummary });
  } catch (error) {
    console.error('Error fetching portfolio summary:', error);
    return NextResponse.json(
      { error: 'Failed to fetch portfolio summary' },
      { status: 500 }
    );
  }
}
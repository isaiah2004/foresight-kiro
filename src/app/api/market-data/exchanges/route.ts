import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { enhancedMarketDataService } from '@/lib/services/enhanced-market-data-service';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const currency = searchParams.get('currency');
    const includeStatus = searchParams.get('includeStatus') === 'true';

    if (currency) {
      // Get currency-specific market recommendations
      const recommendations = enhancedMarketDataService.getCurrencyMarketRecommendations(currency);
      return NextResponse.json({ recommendations });
    }

    if (includeStatus) {
      // Get global market status
      const marketStatus = enhancedMarketDataService.getGlobalMarketStatus();
      return NextResponse.json({ marketStatus });
    }

    // Get all supported exchanges
    const exchanges = enhancedMarketDataService.getSupportedExchanges();
    return NextResponse.json({ exchanges });
  } catch (error) {
    console.error('Error fetching exchange information:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exchange information' },
      { status: 500 }
    );
  }
}
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
    const symbol = searchParams.get('symbol');
    const exchangesParam = searchParams.get('exchanges');
    
    if (!symbol) {
      return NextResponse.json({ error: 'Symbol parameter is required' }, { status: 400 });
    }

    // Parse exchanges parameter (comma-separated list of exchange suffixes)
    const exchanges = exchangesParam 
      ? exchangesParam.split(',').map(e => e.trim()).filter(e => e.length > 0)
      : [];

    // Get multi-currency quote for the same company across different exchanges
    const multiCurrencyQuote = await enhancedMarketDataService.getMultiCurrencyQuote(symbol, exchanges);
    
    if (!multiCurrencyQuote) {
      return NextResponse.json({ error: 'No quotes found for the specified symbol' }, { status: 404 });
    }

    return NextResponse.json({ multiCurrencyQuote });
  } catch (error) {
    console.error('Error fetching multi-currency quote:', error);
    return NextResponse.json(
      { error: 'Failed to fetch multi-currency quote' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { MarketDataService } from '@/lib/services/market-data-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
      return NextResponse.json({ error: 'Query parameter must be at least 2 characters' }, { status: 400 });
    }

    const marketDataService = new MarketDataService();
    const results = await marketDataService.searchCrypto(query);

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error in crypto search API:', error);
    return NextResponse.json(
      { error: 'Failed to search cryptocurrencies' },
      { status: 500 }
    );
  }
}
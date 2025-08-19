import { NextRequest, NextResponse } from 'next/server';
import { MarketDataService } from '@/lib/services/market-data-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');

    if (!symbol) {
      return NextResponse.json({ error: 'Symbol parameter is required' }, { status: 400 });
    }

    const marketDataService = new MarketDataService();
    const cryptoQuote = await marketDataService.getCryptoQuote(symbol.toUpperCase());

    if (!cryptoQuote) {
      return NextResponse.json({ error: 'Cryptocurrency not found or API unavailable' }, { status: 404 });
    }

    return NextResponse.json({ cryptoQuote });
  } catch (error) {
    console.error('Error in crypto quote API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cryptocurrency quote' },
      { status: 500 }
    );
  }
}
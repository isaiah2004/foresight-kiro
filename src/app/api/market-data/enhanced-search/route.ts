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
    const query = searchParams.get('q');
    
    if (!query || query.trim().length === 0) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
    }

    // Search for symbols with exchange and currency information
    const results = await enhancedMarketDataService.searchSymbolsWithExchange(query.trim());
    
    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error searching symbols with exchange info:', error);
    return NextResponse.json(
      { error: 'Failed to search symbols' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { marketDataService } from '@/lib/services/market-data-service';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const symbolsParam = searchParams.get('symbols');
    
    if (!symbolsParam) {
      return NextResponse.json({ error: 'Symbols parameter is required' }, { status: 400 });
    }

    const symbols = symbolsParam.split(',').map(s => s.trim()).filter(s => s.length > 0);
    
    if (symbols.length === 0) {
      return NextResponse.json({ error: 'At least one symbol is required' }, { status: 400 });
    }

    // Get quotes for all symbols
    const quotes = await marketDataService.getMultipleQuotes(symbols);
    
    return NextResponse.json({ quotes });
  } catch (error) {
    console.error('Error fetching market quotes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch market quotes' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { currencyService } from '@/lib/services/currency-service';
import { z } from 'zod';

const exchangeRateQuerySchema = z.object({
  from: z.string().min(3).max(3),
  to: z.string().min(3).max(3),
});

const multipleRatesQuerySchema = z.object({
  pairs: z.string().transform((str) => {
    try {
      const parsed = JSON.parse(str);
      return z.array(z.object({
        from: z.string().min(3).max(3),
        to: z.string().min(3).max(3)
      })).parse(parsed);
    } catch {
      throw new Error('Invalid pairs format');
    }
  })
});

// GET /api/currencies/exchange-rates?from=USD&to=EUR
// GET /api/currencies/exchange-rates?pairs=[{"from":"USD","to":"EUR"},{"from":"GBP","to":"USD"}]
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    
    // Check if requesting multiple pairs
    const pairsParam = searchParams.get('pairs');
    if (pairsParam) {
      const { pairs } = multipleRatesQuerySchema.parse({ pairs: pairsParam });
      
      const rates = await currencyService.getMultipleRates(pairs);
      
      return NextResponse.json({
        rates,
        count: rates.length
      });
    }
    
    // Single pair request
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    
    if (!from || !to) {
      return NextResponse.json(
        { error: 'Missing required parameters: from and to' },
        { status: 400 }
      );
    }

    const { from: validFrom, to: validTo } = exchangeRateQuerySchema.parse({ from, to });
    
    const rate = await currencyService.getExchangeRate(validFrom, validTo);
    
    return NextResponse.json({ rate });
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: error.issues },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch exchange rates' },
      { status: 500 }
    );
  }
}
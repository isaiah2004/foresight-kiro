import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { currencyService } from '@/lib/services/currency-service';
import { z } from 'zod';
import { currencyCodeSchema } from '@/lib/validations';

const exchangeRateQuerySchema = z.object({
  from: currencyCodeSchema,
  to: currencyCodeSchema,
});

const pairsArraySchema = z.array(
  z.object({
    from: currencyCodeSchema,
    to: currencyCodeSchema,
  })
);

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
      // Parse pairs JSON safely and validate with Zod
      let parsedPairs: unknown;
      try {
        parsedPairs = JSON.parse(pairsParam);
      } catch {
        return NextResponse.json(
          { error: 'Invalid parameters' },
          { status: 400 }
        );
      }

      const parsed = pairsArraySchema.safeParse(parsedPairs);
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Invalid parameters' },
          { status: 400 }
        );
      }

      const rates = await currencyService.getMultipleRates(parsed.data);

      return NextResponse.json({
        rates,
        count: rates.length,
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
    if (process.env.NODE_ENV !== 'test') {
      console.error('Error fetching exchange rates:', error);
    }
    
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
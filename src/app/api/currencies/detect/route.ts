import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { currencyService } from '@/lib/services/currency-service';
import { z } from 'zod';

const detectQuerySchema = z.object({
  countryCode: z.string().min(2).max(2).optional(),
  marketSymbol: z.string().optional(),
}).refine((data) => data.countryCode || data.marketSymbol, {
  message: 'Either countryCode or marketSymbol must be provided'
});

// GET /api/currencies/detect?countryCode=US
// GET /api/currencies/detect?marketSymbol=AAPL
// GET /api/currencies/detect?marketSymbol=VOD.L
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
    
    const countryCode = searchParams.get('countryCode');
    const marketSymbol = searchParams.get('marketSymbol');
    
    // Filter out null values before validation
    const params: any = {};
    if (countryCode) params.countryCode = countryCode;
    if (marketSymbol) params.marketSymbol = marketSymbol;
    
    const validatedParams = detectQuerySchema.parse(params);
    
    let detectedCurrency: string;
    let detectionMethod: string;
    
    if (validatedParams.countryCode) {
      detectedCurrency = await currencyService.detectCurrencyFromLocation(validatedParams.countryCode);
      detectionMethod = 'location';
    } else if (validatedParams.marketSymbol) {
      detectedCurrency = await currencyService.detectCurrencyFromMarket(validatedParams.marketSymbol);
      detectionMethod = 'market';
    } else {
      // This shouldn't happen due to schema validation, but just in case
      detectedCurrency = 'USD';
      detectionMethod = 'default';
    }
    
    // Get currency info
    const currencyInfo = await currencyService.getCurrencyInfo(detectedCurrency);
    
    return NextResponse.json({
      detectedCurrency,
      detectionMethod,
      currencyInfo,
      input: {
        countryCode: validatedParams.countryCode,
        marketSymbol: validatedParams.marketSymbol
      }
    });
  } catch (error) {
    console.error('Error detecting currency:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: error.issues },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to detect currency' },
      { status: 500 }
    );
  }
}
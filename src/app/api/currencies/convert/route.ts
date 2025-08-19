import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { currencyService } from '@/lib/services/currency-service';
import { z } from 'zod';

const convertQuerySchema = z.object({
  amount: z.string().transform((str) => {
    const num = parseFloat(str);
    if (isNaN(num) || num < 0) {
      throw new Error('Invalid amount');
    }
    return num;
  }),
  from: z.string().min(3).max(3),
  to: z.string().min(3).max(3),
});

const multipleConvertQuerySchema = z.object({
  conversions: z.string().transform((str) => {
    try {
      const parsed = JSON.parse(str);
      return z.array(z.object({
        amount: z.number().min(0),
        from: z.string().min(3).max(3),
        to: z.string().min(3).max(3)
      })).parse(parsed);
    } catch {
      throw new Error('Invalid conversions format');
    }
  })
});

// GET /api/currencies/convert?amount=100&from=USD&to=EUR
// GET /api/currencies/convert?conversions=[{"amount":100,"from":"USD","to":"EUR"},{"amount":50,"from":"GBP","to":"USD"}]
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
    
    // Check if requesting multiple conversions
    const conversionsParam = searchParams.get('conversions');
    if (conversionsParam) {
      const { conversions } = multipleConvertQuerySchema.parse({ conversions: conversionsParam });
      
      const results = await currencyService.convertMultipleAmounts(conversions);
      
      return NextResponse.json({
        conversions: results,
        count: results.length
      });
    }
    
    // Single conversion request
    const amount = searchParams.get('amount');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    
    if (!amount || !from || !to) {
      return NextResponse.json(
        { error: 'Missing required parameters: amount, from, to' },
        { status: 400 }
      );
    }

    const validatedParams = convertQuerySchema.parse({ amount, from, to });
    
    const result = await currencyService.convertAmount(
      validatedParams.amount,
      validatedParams.from,
      validatedParams.to
    );
    
    return NextResponse.json({ conversion: result });
  } catch (error) {
    console.error('Error converting currency:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: error.issues },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to convert currency' },
      { status: 500 }
    );
  }
}
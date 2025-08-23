import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { currencyService } from '@/lib/services/currency-service';
import { z } from 'zod';
import { currencyCodeSchema } from '@/lib/validations';

const convertQuerySchema = z.object({
  amount: z.preprocess((val) => {
    if (typeof val === 'string' || typeof val === 'number') {
      const num = typeof val === 'string' ? parseFloat(val) : val;
      return isNaN(num as number) ? undefined : num;
    }
    return val;
  }, z.number().min(0, 'Amount must be non-negative')),
  from: currencyCodeSchema,
  to: currencyCodeSchema,
});

const multipleConversionsArraySchema = z.array(z.object({
  amount: z.number().min(0),
  from: currencyCodeSchema,
  to: currencyCodeSchema,
}));

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
      // Parse JSON safely then validate
      let parsed: unknown;
      try {
        parsed = JSON.parse(conversionsParam);
      } catch {
        return NextResponse.json(
          { error: 'Invalid parameters' },
          { status: 400 }
        );
      }

      const validated = multipleConversionsArraySchema.safeParse(parsed);
      if (!validated.success) {
        return NextResponse.json(
          { error: 'Invalid parameters' },
          { status: 400 }
        );
      }

      const results = await currencyService.convertMultipleAmounts(validated.data);

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
    if (process.env.NODE_ENV !== 'test') {
      console.error('Error converting currency:', error);
    }
    
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
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { currencyService } from '@/lib/services/currency-service';
import { z } from 'zod';

const historicalRatesQuerySchema = z.object({
  from: z.string().min(3).max(3),
  to: z.string().min(3).max(3),
  startDate: z.string().transform((str) => {
    const date = new Date(str);
    if (isNaN(date.getTime())) {
      throw new Error('Invalid start date');
    }
    return date;
  }),
  endDate: z.string().transform((str) => {
    const date = new Date(str);
    if (isNaN(date.getTime())) {
      throw new Error('Invalid end date');
    }
    return date;
  })
}).refine((data) => data.startDate <= data.endDate, {
  message: 'Start date must be before or equal to end date'
});

// GET /api/currencies/exchange-rates/historical?from=USD&to=EUR&startDate=2024-01-01&endDate=2024-01-31
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
    
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    if (!from || !to || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required parameters: from, to, startDate, endDate' },
        { status: 400 }
      );
    }

    const validatedParams = historicalRatesQuerySchema.parse({
      from,
      to,
      startDate,
      endDate
    });
    
    const rates = await currencyService.getHistoricalRates(
      validatedParams.from,
      validatedParams.to,
      validatedParams.startDate,
      validatedParams.endDate
    );
    
    return NextResponse.json({
      rates,
      count: rates.length,
      period: {
        from: validatedParams.startDate,
        to: validatedParams.endDate
      }
    });
  } catch (error) {
    console.error('Error fetching historical exchange rates:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: error.issues },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch historical exchange rates' },
      { status: 500 }
    );
  }
}
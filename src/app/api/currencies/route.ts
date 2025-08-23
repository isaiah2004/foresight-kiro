import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { currencyService } from '@/lib/services/currency-service';
import { z } from 'zod';

// GET /api/currencies - Get supported currencies
export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const currencies = await currencyService.getSupportedCurrencies();
    
    return NextResponse.json({
      currencies,
      count: currencies.length
    });
  } catch (error) {
    if (process.env.NODE_ENV !== 'test') {
      console.error('Error fetching currencies:', error);
    }
    return NextResponse.json(
      { error: 'Failed to fetch currencies' },
      { status: 500 }
    );
  }
}
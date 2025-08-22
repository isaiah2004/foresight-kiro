import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { expenseService } from '@/lib/services/expense-service';
import { userService } from '@/lib/services/user-service';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's primary currency
    const user = await userService.getById(userId);
    const primaryCurrency = user?.preferences?.primaryCurrency || 'USD';

    const projections = await expenseService.getMultiCurrencyProjections(userId, primaryCurrency);

    // Calculate exchange rate impact analysis
    const exchangeRateImpact = projections.map(projection => {
      const totalOriginal = Object.values(projection.originalAmounts).reduce((sum, amount) => sum + amount, 0);
      const conversionImpact = projection.amount - totalOriginal;
      
      return {
        ...projection,
        exchangeRateImpact: conversionImpact,
        exchangeRateImpactPercentage: totalOriginal > 0 ? (conversionImpact / totalOriginal) * 100 : 0
      };
    });

    return NextResponse.json({
      primaryCurrency,
      projections: exchangeRateImpact,
      summary: {
        averageMonthlyExpense: projections.reduce((sum, p) => sum + p.amount, 0) / projections.length,
        totalProjectedExpense: projections.reduce((sum, p) => sum + p.amount, 0),
        currenciesInvolved: Array.from(new Set(
          projections.flatMap(p => Object.keys(p.originalAmounts))
        ))
      }
    });
  } catch (error) {
    console.error('Error fetching multi-currency expense projections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch expense projections' },
      { status: 500 }
    );
  }
}
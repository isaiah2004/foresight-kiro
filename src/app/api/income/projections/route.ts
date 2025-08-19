import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { incomeService } from '@/lib/services/income-service';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projections = await incomeService.getIncomeProjections(userId);
    const monthlyIncome = await incomeService.calculateMonthlyIncome(userId);
    const annualIncome = await incomeService.calculateAnnualIncome(userId);
    const breakdown = await incomeService.getIncomeBreakdown(userId);

    return NextResponse.json({
      projections,
      monthlyIncome,
      annualIncome,
      breakdown
    });
  } catch (error) {
    console.error('Error fetching income projections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch income projections' },
      { status: 500 }
    );
  }
}
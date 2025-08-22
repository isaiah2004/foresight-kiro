import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { expenseService } from '@/lib/services/expense-service';
import { userService } from '@/lib/services/user-service';
import { z } from 'zod';
import { currencyAmountSchema, expenseCategorySchema } from '@/lib/validations';

const budgetLimitsSchema = z.record(
  expenseCategorySchema,
  currencyAmountSchema
);

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const budgetLimits = budgetLimitsSchema.parse(body.budgetLimits);

    // Get user's primary currency
    const user = await userService.getById(userId);
    const primaryCurrency = user?.preferences?.primaryCurrency || 'USD';

    const alerts = await expenseService.getBudgetAlerts(userId, budgetLimits, primaryCurrency);

    // Categorize alerts by severity
    const alertSummary = {
      total: alerts.length,
      danger: alerts.filter(a => a.alertLevel === 'danger').length,
      warning: alerts.filter(a => a.alertLevel === 'warning').length,
      info: alerts.filter(a => a.alertLevel === 'info').length,
      overBudgetCategories: alerts.filter(a => a.percentageUsed >= 100).map(a => a.category),
      nearLimitCategories: alerts.filter(a => a.percentageUsed >= 80 && a.percentageUsed < 100).map(a => a.category)
    };

    return NextResponse.json({
      primaryCurrency,
      alerts,
      summary: alertSummary,
      recommendations: generateBudgetRecommendations(alerts)
    });
  } catch (error) {
    console.error('Error generating budget alerts:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid budget limits data', details: error.issues },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to generate budget alerts' },
      { status: 500 }
    );
  }
}

function generateBudgetRecommendations(alerts: any[]): string[] {
  const recommendations: string[] = [];
  
  const overBudgetAlerts = alerts.filter(a => a.alertLevel === 'danger');
  const warningAlerts = alerts.filter(a => a.alertLevel === 'warning');
  
  if (overBudgetAlerts.length > 0) {
    recommendations.push(`You have ${overBudgetAlerts.length} categories over budget. Consider reducing spending in: ${overBudgetAlerts.map(a => a.category).join(', ')}`);
  }
  
  if (warningAlerts.length > 0) {
    recommendations.push(`Monitor spending in ${warningAlerts.length} categories approaching budget limits: ${warningAlerts.map(a => a.category).join(', ')}`);
  }
  
  // Find highest spending category
  const highestSpending = alerts.reduce((max, alert) => 
    alert.currentAmount.amount > max.currentAmount.amount ? alert : max
  );
  
  if (highestSpending.percentageUsed > 50) {
    recommendations.push(`${highestSpending.category} is your highest expense category. Look for optimization opportunities.`);
  }
  
  // Currency-specific recommendations
  const multiCurrencyCategories = alerts.filter(a => 
    a.currentAmount.currency !== a.budgetLimit.currency
  );
  
  if (multiCurrencyCategories.length > 0) {
    recommendations.push('Consider the impact of exchange rate fluctuations on your multi-currency budget categories.');
  }
  
  return recommendations;
}
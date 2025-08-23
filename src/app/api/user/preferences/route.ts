import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { userService } from '@/lib/services/user-service';
import { userPreferencesSchema } from '@/lib/validations';
import { z } from 'zod';

// GET /api/user/preferences - Get user preferences
export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const preferences = await userService.getUserPreferences(userId);
    
    return NextResponse.json({
      preferences: preferences || {
        primaryCurrency: 'USD',
        locale: 'en-US',
        riskTolerance: 'moderate'
      }
    });
  } catch (error) {
    if (process.env.NODE_ENV !== 'test') {
      console.error('Error fetching user preferences:', error);
    }
    return NextResponse.json(
      { error: 'Failed to fetch user preferences' },
      { status: 500 }
    );
  }
}

// PUT /api/user/preferences - Update user preferences
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate the request body
    const partial = userPreferencesSchema.partial().parse(body);

    // Merge with safe defaults ONLY for booleans to ensure consistent shape
    const merged = {
      ...partial,
      notifications: partial.notifications ?? true,
      showOriginalCurrencies: partial.showOriginalCurrencies ?? true,
      autoDetectCurrency: partial.autoDetectCurrency ?? false,
    };
    
    await userService.updatePreferences(userId, merged);
    
    return NextResponse.json({
      success: true,
      message: 'Preferences updated successfully'
    });
  } catch (error) {
    if (process.env.NODE_ENV !== 'test') {
      console.error('Error updating user preferences:', error);
    }
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid preferences data', details: error.issues },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update user preferences' },
      { status: 500 }
    );
  }
}
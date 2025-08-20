import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { categoryService } from '@/lib/services/category-service';
import { createExpenseCategorySchema } from '@/lib/validations';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as 'recurring' | 'one-time' | null;
    const categories = await categoryService.listMerged(userId, type ?? undefined);
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching expense categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const validated = createExpenseCategorySchema.parse({ ...body, userId });
    const id = await categoryService.create(userId, {
      name: validated.name,
      emoji: validated.emoji,
      type: validated.type,
      userId,
      isSystem: false,
    } as any);
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    console.error('Error creating expense category:', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}

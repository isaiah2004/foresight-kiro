import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { categoryService } from '@/lib/services/category-service';
import { updateExpenseCategorySchema } from '@/lib/validations';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const validated = updateExpenseCategorySchema.parse({ ...body, id });
    await categoryService.update(userId, id, {
      name: validated.name as any,
      emoji: validated.emoji as any,
      type: validated.type as any,
    });
    return NextResponse.json({ id }, { status: 200 });
  } catch (error) {
    console.error('Error updating expense category:', error);
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    await categoryService.delete(userId, id);
    return NextResponse.json({ id }, { status: 200 });
  } catch (error) {
    console.error('Error deleting expense category:', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}

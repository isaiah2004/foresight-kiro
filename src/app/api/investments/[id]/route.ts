import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { investmentService } from '@/lib/services/investment-service';
import { updateInvestmentSchema } from '@/lib/validations';
import { InvestmentDocument } from '@/types/financial';
import { Timestamp } from 'firebase/firestore';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const investment = await investmentService.getById(userId, id) as InvestmentDocument;
    
    if (!investment) {
      return NextResponse.json({ error: 'Investment not found' }, { status: 404 });
    }

    // Ensure dates are properly serialized
    const serializedInvestment: any = {
      ...investment,
      purchaseDate: investment.purchaseDate?.toDate ? investment.purchaseDate.toDate().toISOString() : investment.purchaseDate,
      createdAt: investment.createdAt?.toDate ? investment.createdAt.toDate().toISOString() : investment.createdAt,
      updatedAt: investment.updatedAt?.toDate ? investment.updatedAt.toDate().toISOString() : investment.updatedAt,
    };

    // Handle type-specific date serialization
    if (investment.optionData?.expirationDate) {
      serializedInvestment.optionData = {
        ...investment.optionData,
        expirationDate: investment.optionData.expirationDate?.toDate
          ? investment.optionData.expirationDate.toDate().toISOString()
          : investment.optionData.expirationDate
      };
    }

    if (investment.bondData?.maturityDate) {
      serializedInvestment.bondData = {
        ...investment.bondData,
        maturityDate: investment.bondData.maturityDate?.toDate
          ? investment.bondData.maturityDate.toDate().toISOString()
          : investment.bondData.maturityDate
      };
    }

    if (investment.mutualFundData?.inceptionDate) {
      serializedInvestment.mutualFundData = {
        ...investment.mutualFundData,
        inceptionDate: investment.mutualFundData.inceptionDate?.toDate
          ? investment.mutualFundData.inceptionDate.toDate().toISOString()
          : investment.mutualFundData.inceptionDate
      };
    }

    return NextResponse.json({ investment: serializedInvestment });
  } catch (error) {
    console.error('Error fetching investment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch investment' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    
    // Validate the request body
    const validatedData = updateInvestmentSchema.parse({
      ...body,
      id,
    });

    // Convert dates to Timestamps
    const updateData: any = { ...validatedData };
    if (body.purchaseDate) {
      updateData.purchaseDate = Timestamp.fromDate(new Date(body.purchaseDate));
    }
    
    // Handle type-specific date conversions
    if (validatedData.optionData?.expirationDate) {
      updateData.optionData = {
        ...validatedData.optionData,
        expirationDate: Timestamp.fromDate(validatedData.optionData.expirationDate)
      };
    }
    
    if (validatedData.bondData?.maturityDate) {
      updateData.bondData = {
        ...validatedData.bondData,
        maturityDate: Timestamp.fromDate(validatedData.bondData.maturityDate)
      };
    }
    
    if (validatedData.mutualFundData?.inceptionDate) {
      updateData.mutualFundData = {
        ...validatedData.mutualFundData,
        inceptionDate: Timestamp.fromDate(validatedData.mutualFundData.inceptionDate)
      };
    }

    await investmentService.update(userId, id, updateData);
    
    // Get the updated investment to return
    const updatedInvestment = await investmentService.getById(userId, id) as InvestmentDocument;
    
    return NextResponse.json({ investment: updatedInvestment });
  } catch (error) {
    console.error('Error updating investment:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid investment data', details: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update investment' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await investmentService.delete(userId, id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting investment:', error);
    return NextResponse.json(
      { error: 'Failed to delete investment' },
      { status: 500 }
    );
  }
}
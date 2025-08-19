import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { investmentService } from '@/lib/services/investment-service';
import { createInvestmentSchema } from '@/lib/validations';
import { InvestmentDocument } from '@/types/financial';
import { Timestamp } from 'firebase/firestore';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    let investments: InvestmentDocument[];
    if (type) {
      investments = await investmentService.getByType(userId, type as any) as InvestmentDocument[];
    } else {
      investments = await investmentService.getAllOrdered(userId) as InvestmentDocument[];
    }

    // Ensure dates are properly serialized
    const serializedInvestments = investments.map(investment => {
      const serialized: any = {
        ...investment,
        purchaseDate: investment.purchaseDate?.toDate ? investment.purchaseDate.toDate().toISOString() : investment.purchaseDate,
        createdAt: investment.createdAt?.toDate ? investment.createdAt.toDate().toISOString() : investment.createdAt,
        updatedAt: investment.updatedAt?.toDate ? investment.updatedAt.toDate().toISOString() : investment.updatedAt,
      };

      // Handle type-specific date serialization
      if (investment.optionData?.expirationDate) {
        serialized.optionData = {
          ...investment.optionData,
          expirationDate: investment.optionData.expirationDate?.toDate
            ? investment.optionData.expirationDate.toDate().toISOString()
            : investment.optionData.expirationDate
        };
      }

      if (investment.bondData?.maturityDate) {
        serialized.bondData = {
          ...investment.bondData,
          maturityDate: investment.bondData.maturityDate?.toDate
            ? investment.bondData.maturityDate.toDate().toISOString()
            : investment.bondData.maturityDate
        };
      }

      if (investment.mutualFundData?.inceptionDate) {
        serialized.mutualFundData = {
          ...investment.mutualFundData,
          inceptionDate: investment.mutualFundData.inceptionDate?.toDate
            ? investment.mutualFundData.inceptionDate.toDate().toISOString()
            : investment.mutualFundData.inceptionDate
        };
      }

      return serialized;
    });

    return NextResponse.json({ investments: serializedInvestments });
  } catch (error) {
    console.error('Error fetching investments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch investments' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate the request body
    const validatedData = createInvestmentSchema.parse({
      ...body,
      userId,
    });

    // Convert dates to Timestamps
    const createData: any = {
      ...validatedData,
      purchaseDate: Timestamp.fromDate(validatedData.purchaseDate),
      // Handle type-specific date conversions
      ...(validatedData.optionData?.expirationDate && {
        optionData: {
          ...validatedData.optionData,
          expirationDate: Timestamp.fromDate(validatedData.optionData.expirationDate)
        }
      }),
      ...(validatedData.bondData?.maturityDate && {
        bondData: {
          ...validatedData.bondData,
          maturityDate: Timestamp.fromDate(validatedData.bondData.maturityDate)
        }
      }),
      ...(validatedData.mutualFundData?.inceptionDate && {
        mutualFundData: {
          ...validatedData.mutualFundData,
          inceptionDate: Timestamp.fromDate(validatedData.mutualFundData.inceptionDate)
        }
      }),
    };

    const investmentId = await investmentService.create(userId, createData);

    return NextResponse.json({ investment: { id: investmentId, ...createData } }, { status: 201 });
  } catch (error) {
    console.error('Error creating investment:', error);

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid investment data', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create investment' },
      { status: 500 }
    );
  }
}
import { Suspense } from 'react';
import { InvestmentsByType } from '@/components/investments/investments-by-type';
import { InvestmentsByTypeSkeleton } from '@/components/investments/investments-by-type-skeleton';

export default function BondsPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Bond Investments</h2>
        <p className="text-muted-foreground">
          Track your bond portfolio and fixed-income investments
        </p>
      </div>
  <Suspense fallback={<InvestmentsByTypeSkeleton type="bonds" />}>
        <InvestmentsByType type="bonds" />
      </Suspense>
    </div>
  );
}
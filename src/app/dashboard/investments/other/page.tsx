import { Suspense } from 'react';
import { InvestmentsByType } from '@/components/investments/investments-by-type';
import { InvestmentsByTypeSkeleton } from '@/components/investments/investments-by-type-skeleton';

export default function OtherInvestmentsPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Other Investments</h2>
        <p className="text-muted-foreground">
          Track alternative investments, commodities, and miscellaneous assets
        </p>
      </div>
      <Suspense fallback={<InvestmentsByTypeSkeleton />}>
        <InvestmentsByType type="other" />
      </Suspense>
    </div>
  );
}
import { Suspense } from 'react';
import { LoansOverview } from '@/components/loans/loans-overview';
import { PageSkeleton } from '@/components/ui/page-skeleton';

export default function LoansPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <LoansOverview />
    </Suspense>
  );
}
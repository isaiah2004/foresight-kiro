import { Suspense } from 'react';
import { DashboardMainSkeleton } from '@/components/ui/page-skeleton';
import { DashboardContent } from '@/components/dashboard/dashboard-content';

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardMainSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}

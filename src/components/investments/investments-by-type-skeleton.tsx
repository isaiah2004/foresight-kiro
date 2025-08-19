import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import type { InvestmentType } from '@/types/financial';

export function InvestmentsByTypeSkeleton({ type = 'other' }: { type?: InvestmentType }) {
  const isBonds = type === 'bonds';
  const headerColsClass = isBonds ? 'grid grid-cols-12 gap-4 mb-4' : 'grid grid-cols-9 gap-4 mb-4';
  const rowColsClass = isBonds ? 'grid grid-cols-12 gap-4 mb-3' : 'grid grid-cols-9 gap-4 mb-3';
  const colCount = isBonds ? 12 : 9;
  return (
    <div className="space-y-6">
      {/* Type Summary Card Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-24" />
              </div>
            ))}
          </div>
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons Skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-4 w-24" />
      </div>

      {/* Investment Table Skeleton */}
      <div className="rounded-md border">
        <div className="p-4">
          {/* Table Header */}
          <div className={headerColsClass}>
            {Array.from({ length: colCount }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
          
          {/* Table Rows */}
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={rowColsClass}>
              {Array.from({ length: colCount }).map((_, j) => (
                <Skeleton key={j} className="h-6 w-full" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
import { Suspense } from "react";
import { InvestmentsByType } from "@/components/investments/investments-by-type";
import { InvestmentsByTypeSkeleton } from "@/components/investments/investments-by-type-skeleton";

export default function CryptoPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">
          Cryptocurrency Investments
        </h2>
        <p className="text-muted-foreground">
          Track your cryptocurrency portfolio and digital asset investments
        </p>
      </div>
      <Suspense fallback={<InvestmentsByTypeSkeleton />}>
        <InvestmentsByType type="crypto" />
      </Suspense>
    </div>
  );
}

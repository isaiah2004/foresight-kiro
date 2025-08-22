import { Suspense } from "react";
import { InvestmentPortfolio } from "@/components/investments/investment-portfolio";
import { InvestmentPortfolioSkeleton } from "@/components/investments/investment-portfolio-skeleton";

export default function InvestmentsPage() {
  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">
          Investment Portfolio
        </h2>
      </div>
      <Suspense fallback={<InvestmentPortfolioSkeleton />}>
        <InvestmentPortfolio />
      </Suspense>
    </div>
  );
}

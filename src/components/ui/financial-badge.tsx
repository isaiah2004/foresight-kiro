import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const financialBadgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        positive: "border-transparent bg-positive text-positive-foreground hover:bg-positive/80",
        negative: "border-transparent bg-negative text-negative-foreground hover:bg-negative/80",
        warning: "border-transparent bg-warning text-warning-foreground hover:bg-warning/80",
        info: "border-transparent bg-info text-info-foreground hover:bg-info/80",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface FinancialBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof financialBadgeVariants> {
  value?: number
}

function FinancialBadge({ className, variant, value, children, ...props }: FinancialBadgeProps) {
  // Auto-determine variant based on value if provided
  const autoVariant = value !== undefined 
    ? (value >= 0 ? 'positive' : 'negative')
    : variant

  return (
    <div className={cn(financialBadgeVariants({ variant: autoVariant }), className)} {...props}>
      {children}
    </div>
  )
}

export { FinancialBadge, financialBadgeVariants }
import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FinancialBadge } from "@/components/ui/financial-badge"
import { formatFinancialValue } from "@/lib/theme"
import { cn } from "@/lib/utils"

interface FinancialCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string
  value: number
  currency?: string
  showBadge?: boolean
  trend?: {
    value: number
    period: string
  }
}

function FinancialCard({ 
  title, 
  description, 
  value, 
  currency = 'USD',
  showBadge = false,
  trend,
  className,
  ...props 
}: FinancialCardProps) {
  const { formatted, isPositive, colorClass } = formatFinancialValue(value, currency)
  const trendFormatted = trend ? formatFinancialValue(trend.value, currency) : null

  return (
    <Card className={cn("", className)} {...props}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {showBadge && (
          <FinancialBadge value={value}>
            {isPositive ? '+' : ''}{formatted}
          </FinancialBadge>
        )}
      </CardHeader>
      <CardContent>
        <div className={cn("text-2xl font-bold", colorClass)}>
          {isPositive ? '' : '-'}{formatted}
        </div>
        {description && (
          <CardDescription className="mt-1">
            {description}
          </CardDescription>
        )}
        {trend && trendFormatted && (
          <p className={cn("text-xs mt-1", trendFormatted.colorClass)}>
            {trendFormatted.isPositive ? '+' : ''}{trendFormatted.formatted} from {trend.period}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export { FinancialCard }
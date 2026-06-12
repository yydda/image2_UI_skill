import type { HTMLAttributes } from "react"
import { cn } from "@/lib/utils"

interface PriceTextProps extends HTMLAttributes<HTMLSpanElement> {
  amount: string
  currency?: string
}

export function PriceText({ amount, currency = "￥", className, ...props }: PriceTextProps) {
  return (
    <span className={cn("inline-flex items-baseline gap-1 font-semibold tabular-nums", className)} {...props}>
      <span className="text-[0.65em]">{currency}</span>
      <span>{amount}</span>
    </span>
  )
}

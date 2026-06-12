import type { HTMLAttributes } from "react"
import { cn } from "@/lib/utils"

type BadgeTone = "default" | "brand" | "success" | "warning"

interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  tone?: BadgeTone
}

const toneClass: Record<BadgeTone, string> = {
  default: "border bg-card text-muted-foreground",
  brand: "border-brand/20 bg-brand-muted text-brand",
  success: "border-success/20 bg-success/10 text-success",
  warning: "border-warning/25 bg-warning/10 text-warning",
}

export function Badge({ className, tone = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn("inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm", toneClass[tone], className)}
      data-component="badge"
      {...props}
    />
  )
}

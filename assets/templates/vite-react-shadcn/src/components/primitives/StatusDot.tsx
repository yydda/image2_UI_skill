import type { HTMLAttributes } from "react"
import { cn } from "@/lib/utils"

type StatusDotTone = "default" | "success" | "warning" | "danger"

interface StatusDotProps extends HTMLAttributes<HTMLDivElement> {
  label: string
  tone?: StatusDotTone
}

const toneClass: Record<StatusDotTone, string> = {
  default: "bg-muted-foreground",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-destructive",
}

export function StatusDot({ label, tone = "default", className, ...props }: StatusDotProps) {
  return (
    <div className={cn("inline-flex items-center gap-2 text-sm text-muted-foreground", className)} {...props}>
      <span className={cn("size-2 rounded-full", toneClass[tone])} aria-hidden="true" />
      <span>{label}</span>
    </div>
  )
}

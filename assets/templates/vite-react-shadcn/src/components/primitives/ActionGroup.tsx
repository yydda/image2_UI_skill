import type { HTMLAttributes } from "react"
import { cn } from "@/lib/utils"

export function ActionGroup({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-wrap items-center gap-3", className)}
      data-component="action-group"
      {...props}
    />
  )
}

import type { HTMLAttributes } from "react"
import { cn } from "@/lib/utils"

type IconFrameTone = "default" | "brand" | "success" | "warning"

interface IconFrameProps extends HTMLAttributes<HTMLDivElement> {
  tone?: IconFrameTone
}

const toneClass: Record<IconFrameTone, string> = {
  default: "border bg-background text-foreground",
  brand: "border-brand/20 bg-brand-muted text-brand",
  success: "border-success/20 bg-success/10 text-success",
  warning: "border-warning/25 bg-warning/10 text-warning",
}

export function IconFrame({ className, tone = "default", ...props }: IconFrameProps) {
  return (
    <div
      className={cn("grid size-9 shrink-0 place-items-center rounded-md", toneClass[tone], className)}
      data-component="icon-frame"
      {...props}
    />
  )
}

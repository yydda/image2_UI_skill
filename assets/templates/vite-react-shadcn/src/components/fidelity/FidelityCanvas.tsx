import type { HTMLAttributes } from "react"
import { cn } from "@/lib/utils"

interface FidelityCanvasProps extends HTMLAttributes<HTMLDivElement> {
  width: number
  height: number
}

export function FidelityCanvas({ width, height, className, style, ...props }: FidelityCanvasProps) {
  return (
    <div
      className={cn("relative overflow-hidden rounded-md border bg-card", className)}
      data-fidelity-canvas
      style={{
        aspectRatio: `${width} / ${height}`,
        ...style,
      }}
      {...props}
    />
  )
}

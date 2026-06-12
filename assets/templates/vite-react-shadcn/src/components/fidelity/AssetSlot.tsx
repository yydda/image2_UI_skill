import type { ImgHTMLAttributes } from "react"
import { cn } from "@/lib/utils"

interface AssetSlotProps extends ImgHTMLAttributes<HTMLImageElement> {
  fidelityId: string
  decorative?: boolean
  fit?: "contain" | "cover" | "fill"
}

const fitClass = {
  contain: "object-contain",
  cover: "object-cover",
  fill: "object-fill",
}

export function AssetSlot({
  fidelityId,
  decorative = false,
  fit = "contain",
  className,
  alt,
  ...props
}: AssetSlotProps) {
  return (
    <img
      alt={decorative ? "" : alt}
      aria-hidden={decorative || undefined}
      className={cn("block size-full", fitClass[fit], className)}
      data-fidelity-id={fidelityId}
      {...props}
    />
  )
}

import type { HTMLAttributes, ReactNode } from "react"
import { cn } from "@/lib/utils"

type MeasuredTextTag = "span" | "p" | "h1" | "h2" | "h3" | "div"

interface MeasuredTextProps extends HTMLAttributes<HTMLElement> {
  as?: MeasuredTextTag
  fidelityId: string
  children: ReactNode
}

export function MeasuredText({ as: Tag = "span", fidelityId, className, ...props }: MeasuredTextProps) {
  return <Tag className={cn("tracking-normal", className)} data-fidelity-id={fidelityId} {...props} />
}

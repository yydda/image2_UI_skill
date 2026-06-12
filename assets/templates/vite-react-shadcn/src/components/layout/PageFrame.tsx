import type { HTMLAttributes } from "react"
import { cn } from "@/lib/utils"

export function PageFrame({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mx-auto w-full max-w-7xl px-6 md:px-10", className)} {...props} />
}

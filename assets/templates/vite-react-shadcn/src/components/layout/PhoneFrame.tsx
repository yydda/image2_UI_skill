import type { HTMLAttributes } from "react"
import { cn } from "@/lib/utils"

interface PhoneFrameProps extends HTMLAttributes<HTMLDivElement> {
  screenClassName?: string
}

export function PhoneFrame({ className, screenClassName, children, ...props }: PhoneFrameProps) {
  return (
    <div
      className={cn("relative mx-auto aspect-[390/844] w-full max-w-[390px] rounded-[2.4rem] bg-zinc-950 p-3 shadow-fidelity", className)}
      data-component="phone-frame"
      {...props}
    >
      <div className="absolute left-1/2 top-4 z-20 h-7 w-28 -translate-x-1/2 rounded-full bg-zinc-950" />
      <div className={cn("relative size-full overflow-hidden rounded-[2rem] bg-background", screenClassName)}>
        {children}
      </div>
    </div>
  )
}

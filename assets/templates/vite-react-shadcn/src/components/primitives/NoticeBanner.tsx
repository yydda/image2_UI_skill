import type { HTMLAttributes, ReactNode } from "react"
import { AlertCircle, Info, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"

type NoticeTone = "default" | "warning" | "danger" | "success"

interface NoticeBannerProps extends HTMLAttributes<HTMLDivElement> {
  title: string
  tone?: NoticeTone
  icon?: ReactNode
}

const toneClass: Record<NoticeTone, string> = {
  default: "border-border bg-card text-foreground",
  warning: "border-warning/30 bg-warning/10 text-foreground",
  danger: "border-destructive/30 bg-destructive/10 text-foreground",
  success: "border-success/30 bg-success/10 text-foreground",
}

const iconByTone: Record<NoticeTone, ReactNode> = {
  default: <Info className="size-5" aria-hidden="true" />,
  warning: <AlertCircle className="size-5" aria-hidden="true" />,
  danger: <AlertCircle className="size-5" aria-hidden="true" />,
  success: <ShieldCheck className="size-5" aria-hidden="true" />,
}

export function NoticeBanner({ title, tone = "default", icon, className, children, ...props }: NoticeBannerProps) {
  return (
    <div
      className={cn("grid grid-cols-[auto_1fr] gap-3 rounded-md border p-4", toneClass[tone], className)}
      data-component="notice-banner"
      {...props}
    >
      <span className={cn("mt-0.5", tone === "danger" ? "text-destructive" : tone === "success" ? "text-success" : "text-primary")}>
        {icon ?? iconByTone[tone]}
      </span>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        {children ? <div className="mt-1 text-sm leading-6 text-muted-foreground">{children}</div> : null}
      </div>
    </div>
  )
}

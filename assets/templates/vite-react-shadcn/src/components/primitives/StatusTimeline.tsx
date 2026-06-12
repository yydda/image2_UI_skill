import type { ReactNode } from "react"
import { CheckCircle2, Circle, CircleX, PlayCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export type TimelineState = "done" | "active" | "pending" | "failed" | "cancelled"

export interface TimelineItem {
  id: string
  title: string
  description?: string
  time?: string
  state?: TimelineState
  icon?: ReactNode
}

interface StatusTimelineProps {
  items: TimelineItem[]
  className?: string
}

const iconByState: Record<TimelineState, ReactNode> = {
  done: <CheckCircle2 className="size-4" aria-hidden="true" />,
  active: <PlayCircle className="size-4" aria-hidden="true" />,
  pending: <Circle className="size-4" aria-hidden="true" />,
  failed: <CircleX className="size-4" aria-hidden="true" />,
  cancelled: <CircleX className="size-4" aria-hidden="true" />,
}

const toneByState: Record<TimelineState, string> = {
  done: "text-success",
  active: "text-primary",
  pending: "text-muted-foreground",
  failed: "text-destructive",
  cancelled: "text-muted-foreground",
}

export function StatusTimeline({ items, className }: StatusTimelineProps) {
  return (
    <ol className={cn("space-y-0", className)} data-component="status-timeline">
      {items.map((item, index) => {
        const state = item.state ?? "pending"
        return (
          <li key={item.id} className="grid grid-cols-[28px_1fr_auto] gap-3">
            <div className="flex flex-col items-center">
              <span className={cn("grid size-6 place-items-center rounded-full bg-card", toneByState[state])}>
                {item.icon ?? iconByState[state]}
              </span>
              {index < items.length - 1 ? <span className="h-12 w-px border-l border-dashed border-border" /> : null}
            </div>
            <div className="pb-6">
              <p className="text-sm font-semibold text-foreground">{item.title}</p>
              {item.description ? <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.description}</p> : null}
            </div>
            {item.time ? <span className="text-sm font-semibold tabular-nums text-primary">{item.time}</span> : null}
          </li>
        )
      })}
    </ol>
  )
}

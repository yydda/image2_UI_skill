import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export interface InfoSummaryItem {
  id: string
  label: string
  value: ReactNode
  icon?: ReactNode
}

interface InfoSummaryCardProps {
  title?: string
  items: InfoSummaryItem[]
  className?: string
}

export function InfoSummaryCard({ title, items, className }: InfoSummaryCardProps) {
  return (
    <section className={cn("rounded-md border bg-card p-4", className)} data-component="info-summary-card">
      {title ? <h2 className="mb-3 text-base font-semibold">{title}</h2> : null}
      <dl className="grid gap-3 sm:grid-cols-3">
        {items.map((item) => (
          <div key={item.id} className="grid grid-cols-[auto_1fr] gap-2 rounded-md border bg-background px-3 py-2">
            {item.icon ? <span className="mt-1 text-muted-foreground">{item.icon}</span> : null}
            <div>
              <dt className="text-xs text-muted-foreground">{item.label}</dt>
              <dd className="mt-1 text-sm font-semibold text-foreground">{item.value}</dd>
            </div>
          </div>
        ))}
      </dl>
    </section>
  )
}

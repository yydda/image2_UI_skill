import type { ButtonHTMLAttributes, ReactNode } from "react"
import { CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface PaymentOptionProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  title: string
  description?: string
  icon?: ReactNode
  selected?: boolean
}

export function PaymentOption({
  title,
  description,
  icon,
  selected = false,
  className,
  ...props
}: PaymentOptionProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        "grid min-h-20 grid-cols-[auto_1fr_auto] items-center gap-3 rounded-md border bg-card px-4 text-left transition-colors",
        selected ? "border-success bg-success/5" : "border-border hover:bg-muted/40",
        className,
      )}
      data-component="payment-option"
      {...props}
    >
      {icon ? <span className="grid size-10 place-items-center">{icon}</span> : null}
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-foreground">{title}</span>
        {description ? <span className="mt-1 block text-xs text-muted-foreground">{description}</span> : null}
      </span>
      {selected ? <CheckCircle2 className="size-5 text-success" aria-hidden="true" /> : null}
    </button>
  )
}

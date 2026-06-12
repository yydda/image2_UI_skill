import type { InputHTMLAttributes, ReactNode } from "react"
import { cn } from "@/lib/utils"

interface AgreementBarProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  children: ReactNode
  fidelityId?: string
}

export function AgreementBar({ children, className, fidelityId, ...props }: AgreementBarProps) {
  return (
    <label
      className={cn("inline-flex max-w-full items-start gap-2 text-xs leading-5 text-muted-foreground", className)}
      data-component="agreement-bar"
      data-fidelity-id={fidelityId}
    >
      <input
        type="checkbox"
        className="mt-0.5 size-4 shrink-0 rounded border-border accent-primary"
        {...props}
      />
      <span className="min-w-0">{children}</span>
    </label>
  )
}

import type { ReactNode } from "react"

export interface PageRoute {
  id: string
  path: string
  title: string
  element: ReactNode
}

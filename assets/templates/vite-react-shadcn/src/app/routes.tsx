import { HomePage } from "@/pages/HomePage"
import type { PageRoute } from "@/types/page"

export const routes: PageRoute[] = [
  {
    id: "home",
    path: "/",
    title: "Moni UI Starter",
    element: <HomePage />,
  },
]

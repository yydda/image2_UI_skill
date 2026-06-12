import type { PageRoute } from "@/types/page"

interface AppShellProps {
  routes: PageRoute[]
}

export function AppShell({ routes }: AppShellProps) {
  const activeRoute = routes[0]

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div data-app-route={activeRoute.path}>{activeRoute.element}</div>
    </main>
  )
}

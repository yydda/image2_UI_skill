import { ArrowRight, CheckCircle2, Image, LayoutTemplate, Sparkles } from "lucide-react"
import { ActionGroup } from "@/components/primitives/ActionGroup"
import { Badge } from "@/components/primitives/Badge"
import { IconFrame } from "@/components/primitives/IconFrame"
import { StatusDot } from "@/components/primitives/StatusDot"
import { PageFrame } from "@/components/layout/PageFrame"
import { FidelityCanvas } from "@/components/fidelity/FidelityCanvas"
import { MeasuredText } from "@/components/fidelity/MeasuredText"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { starterChecklist } from "@/data/demo-content"

export function HomePage() {
  return (
    <PageFrame>
      <section className="grid min-h-screen w-full items-center gap-8 py-12 md:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-7">
          <Badge tone="brand">
            <Sparkles className="size-4" aria-hidden="true" />
            Moni UI starter
          </Badge>
          <div className="space-y-4">
            <MeasuredText
              as="h1"
              fidelityId="starter-title"
              className="max-w-3xl font-serif text-4xl font-semibold md:text-6xl"
            >
              Build polished UI from references and generated assets.
            </MeasuredText>
            <MeasuredText
              as="p"
              fidelityId="starter-description"
              className="max-w-2xl text-lg leading-8 text-muted-foreground"
            >
              This template is the fixed Moni front-end base. Change page code,
              tokens, and theme presets, but keep the architecture stable.
            </MeasuredText>
          </div>
          <ActionGroup>
            <Button className="gap-2">
              Start building
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
            <StatusDot label="Architecture ready" tone="success" />
          </ActionGroup>
        </div>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconFrame tone="brand">
                <LayoutTemplate className="size-4" aria-hidden="true" />
              </IconFrame>
              Project contract
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {starterChecklist.map((item) => (
              <div key={item.title} className="rounded-md border bg-muted/35 p-3 text-sm">
                <div className="flex items-center gap-2 font-medium">
                  <CheckCircle2 className="size-4 text-success" aria-hidden="true" />
                  {item.title}
                </div>
                <p className="mt-1 text-muted-foreground">{item.description}</p>
              </div>
            ))}
            <FidelityCanvas width={360} height={160} className="mt-4 bg-surface-subtle">
              <div className="absolute left-6 top-6 flex items-center gap-3">
                <IconFrame>
                  <Image className="size-5" aria-hidden="true" />
                </IconFrame>
                <div>
                  <p className="text-sm font-medium">Asset slots</p>
                  <p className="text-xs text-muted-foreground">Generated, original, repaired</p>
                </div>
              </div>
            </FidelityCanvas>
          </CardContent>
        </Card>
      </section>
    </PageFrame>
  )
}

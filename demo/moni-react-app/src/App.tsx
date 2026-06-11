import { ArrowRight, CheckCircle2, ImageIcon, LayoutDashboard } from "lucide-react"
import heroAsset from "@/assets/generated/moni-dashboard-hero.svg"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const workflow = [
  "Split UI into code and image assets",
  "Generate bitmap visuals with built-in image_gen",
  "Import local assets from src/assets/generated",
]

export default function App() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-6 py-12 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-sm text-muted-foreground">
            <LayoutDashboard className="size-4" aria-hidden="true" />
            Moni UI React workflow
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">
              From reference image to shippable React UI.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
              This demo keeps interface text in React components while local generated assets
              are imported through TypeScript and rendered inside stable layout slots.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button className="gap-2">
              Preview workflow
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
            <Button variant="outline" className="gap-2">
              <ImageIcon className="size-4" aria-hidden="true" />
              Asset manifest
            </Button>
          </div>
        </div>

        <Card className="overflow-hidden">
          <div className="aspect-[4/3] bg-muted">
            <img
              src={heroAsset}
              alt="Abstract dashboard visual representing generated Moni UI assets"
              className="h-full w-full object-cover"
            />
          </div>
          <CardHeader>
            <CardTitle>React asset contract</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {workflow.map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-md border bg-muted/35 p-3 text-sm">
                <CheckCircle2 className="size-4 text-emerald-600" aria-hidden="true" />
                <span>{item}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </main>
  )
}

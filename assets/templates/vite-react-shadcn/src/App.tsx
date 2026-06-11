import { ArrowRight, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const features = [
  "Vite + React + TypeScript",
  "shadcn/ui component structure",
  "src/assets/generated for image_gen outputs",
]

export default function App() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto grid min-h-screen w-full max-w-6xl items-center gap-8 px-6 py-12 md:grid-cols-[1fr_420px]">
        <div className="space-y-7">
          <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-sm text-muted-foreground">
            <Sparkles className="size-4" aria-hidden="true" />
            Moni UI starter
          </div>
          <div className="space-y-4">
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight md:text-6xl">
              Build polished UI from references and generated assets.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
              Use this template when a Moni UI task needs a fresh React project,
              shadcn components, and local image assets imported from TypeScript.
            </p>
          </div>
          <Button className="gap-2">
            Start building
            <ArrowRight className="size-4" aria-hidden="true" />
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Project contract</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {features.map((feature) => (
              <div key={feature} className="rounded-md border bg-muted/35 p-3 text-sm">
                {feature}
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </main>
  )
}

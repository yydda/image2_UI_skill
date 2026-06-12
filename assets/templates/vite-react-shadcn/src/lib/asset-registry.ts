import type { FidelityAsset } from "@/types/fidelity"

export const generatedAssets: Record<string, FidelityAsset> = {}

export function getGeneratedAsset(id: string) {
  return generatedAssets[id] ?? null
}

export interface FidelityBox {
  id: string
  x: number
  y: number
  width: number
  height: number
}

export interface FidelityAsset {
  id: string
  src: string
  alt?: string
  decorative?: boolean
  box?: FidelityBox
}

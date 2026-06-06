export type Passo = {
  titolo: string
  corpo: string
  domanda?: string
  risposta?: string
  loadingRisposta?: boolean
}

export type ElementoGrafico = 
  | { type: 'function'; fn: string; color: string; label: string; domain?: [number, number]; interactive?: boolean }
  | { type: 'derivative'; fn: string; color: string; label: string; domain?: [number, number] }
  | { type: 'point'; coords: [number, number]; color: string; label: string }

export type GraficoData = {
  boundingBox: [number, number, number, number]
  espressioni: ElementoGrafico[]
}

export type ToastType = 'error' | 'success' | 'info'

export type Toast = {
  id: number
  message: string
  type: ToastType
}

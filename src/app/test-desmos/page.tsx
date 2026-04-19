'use client'
import { useEffect, useRef } from 'react'

export default function TestDesmos() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://www.desmos.com/api/v1.9/calculator.js?apiKey=dcb31709b452b1cf9dc26972add0fda6'
    script.onload = () => {
      if (!ref.current) return
      const calc = (window as any).Desmos.GraphingCalculator(ref.current)
      calc.setExpression({ id: 'f', latex: 'x^2', color: '#FFD600' })
    }
    document.head.appendChild(script)
  }, [])

  return (
    <div style={{ padding: 20, background: '#1A1A1A', minHeight: '100vh' }}>
      <h1 style={{ color: '#fff', marginBottom: 20 }}>Test Desmos</h1>
      <div ref={ref} style={{ width: 600, height: 400, background: '#fff' }} />
    </div>
  )
}

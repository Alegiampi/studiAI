'use client'
import { useEffect, useRef } from 'react'

export default function TestJSXGraph() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://cdn.jsdelivr.net/npm/jsxgraph/distrib/jsxgraph.css'
    document.head.appendChild(link)

    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/jsxgraph/distrib/jsxgraphcore.js'
    script.onload = () => {
      if (!ref.current) return
      const JXG = (window as any).JXG
      const board = JXG.JSXGraph.initBoard(ref.current.id, {
        boundingbox: [-5, 5, 5, -5],
        axis: true,
        showCopyright: false,
        showNavigation: true,
        pan: { enabled: true },
        zoom: { enabled: true },
      })

      // Funzione f(x)
      board.create('functiongraph', [(x: number) => Math.sin(x) * Math.cos(x)], {
        strokeColor: '#FFD600',
        strokeWidth: 2,
        name: 'f(x)',
      })

      // Derivata f'(x) = cos(2x)
      board.create('functiongraph', [(x: number) => Math.cos(2 * x)], {
        strokeColor: '#00B894',
        strokeWidth: 2,
        name: "f'(x)",
      })
    }
    document.head.appendChild(script)
  }, [])

  return (
    <div style={{ padding: 20, background: '#1A1A1A', minHeight: '100vh' }}>
      <h1 style={{ color: '#FFD600', marginBottom: 20 }}>Test JSXGraph</h1>
      <div
        id="jsxgraph-test"
        ref={ref}
        style={{ width: 600, height: 400, background: '#2A2A2A', borderRadius: 12 }}
      />
    </div>
  )
}

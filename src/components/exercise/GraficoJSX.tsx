'use client'

import { useEffect, useRef } from 'react'
import type { EspressioneGrafico } from '@/types'

function GraficoJSX({ espressioni }: { espressioni: EspressioneGrafico[] }) {
  const ref = useRef<HTMLDivElement>(null)
  const boardRef = useRef<any>(null)
  const idRef = useRef('jsx_' + Math.random().toString(36).substr(2, 9))

  useEffect(() => {
    function init() {
      if (!ref.current || !(window as any).JXG) return
      const JXG = (window as any).JXG

      if (boardRef.current) {
        JXG.JSXGraph.freeBoard(boardRef.current)
        boardRef.current = null
      }

      const board = JXG.JSXGraph.initBoard(idRef.current, {
        boundingbox: [-5, 4, 5, -4],
        axis: true,
        showCopyright: false,
        showNavigation: true,
        pan: { enabled: true },
        zoom: { enabled: true },
      })

      espressioni.forEach((e) => {
        try {
          const fn = new Function('x', `return ${e.fn}`)
          board.create('functiongraph', [fn], {
            strokeColor: e.color,
            strokeWidth: 2.5,
          })
        } catch (err) {
          console.error('Errore espressione:', e.fn, err)
        }
      })

      boardRef.current = board
    }

    const existingLink = document.getElementById('jsxgraph-css')
    if (!existingLink) {
      const link = document.createElement('link')
      link.id = 'jsxgraph-css'
      link.rel = 'stylesheet'
      link.href = 'https://cdn.jsdelivr.net/npm/jsxgraph/distrib/jsxgraph.css'
      document.head.appendChild(link)
    }

    const existingScript = document.getElementById('jsxgraph-script')
    if (existingScript) {
      if ((window as any).JXG) init()
      else existingScript.addEventListener('load', init)
    } else {
      const script = document.createElement('script')
      script.id = 'jsxgraph-script'
      script.src = 'https://cdn.jsdelivr.net/npm/jsxgraph/distrib/jsxgraphcore.js'
      script.async = true
      script.onload = init
      document.head.appendChild(script)
    }

    return () => {
      if (boardRef.current && (window as any).JXG) {
        (window as any).JXG.JSXGraph.freeBoard(boardRef.current)
        boardRef.current = null
      }
    }
  }, [JSON.stringify(espressioni)])

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Grafico</div>
        <div style={{ display: 'flex', gap: 12 }}>
          {espressioni.map((e, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: e.color }} />
              <span style={{ fontSize: 11, color: '#888' }}>{e.label}</span>
            </div>
          ))}
        </div>
      </div>
      <div
        id={idRef.current}
        ref={ref}
        style={{ width: '100%', height: 320, borderRadius: 12, overflow: 'hidden', border: '1px solid #3A3A3A' }}
      />
    </div>
  )
}

export default GraficoJSX
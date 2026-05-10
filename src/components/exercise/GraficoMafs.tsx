'use client'

import { useMemo, useEffect, useRef, useState } from 'react'
import { Mafs, Coordinates, Plot, Point, MovablePoint, Text, Line } from 'mafs'
import 'mafs/core.css'
import 'mafs/font.css'
import { compile, derivative } from 'mathjs'
import type { GraficoData, ElementoGrafico } from '@/types'

function FunctionLayer({ fnStr, color, domain, interactive }: { fnStr: string; color: string; domain?: [number, number]; interactive?: boolean }) {
  const [t, setT] = useState(1)

  const domainKey = JSON.stringify(domain)
  const evaluate = useMemo(() => {
    try {
      const node = compile(fnStr)
      const dMin = domain ? Number(domain[0]) : -Infinity
      const dMax = domain ? Number(domain[1]) : Infinity

      return (x: number) => {
        try {
          if (x < dMin || x > dMax) return NaN
          const result = node.evaluate({ x })
          if (typeof result !== 'number' || !isFinite(result)) return NaN
          if (result > 5000) return 5000
          if (result < -5000) return -5000
          return result
        } catch {
          return NaN
        }
      }
    } catch (err) {
      console.error('Errore compilazione mathjs:', err)
      return () => NaN
    }
  }, [fnStr, domainKey])

  const df = useMemo(() => {
    if (!interactive) return null
    try {
      const dNode = derivative(fnStr, 'x').compile()
      return (x: number) => dNode.evaluate({ x })
    } catch {
      return null
    }
  }, [fnStr, interactive])

  const yt = evaluate(t)

  return (
    <>
      <Plot.OfX y={evaluate} color={color} weight={3} />
      {interactive && (
        <>
          {df && isFinite(yt) && (
            <Line.PointSlope
              point={[t, yt]}
              slope={df(t)}
              color={color}
              weight={2}
              style="dashed"
            />
          )}
          <MovablePoint
            point={[t, isFinite(yt) ? yt : 0]}
            onMove={([newT]) => setT(newT)}
            color={color}
          />
          {df && isFinite(yt) && (
            <Text
              x={t}
              y={yt}
              attach="ne"
              attachDistance={15}
              size={12}
              color={color}
            >
              m = {df(t).toFixed(2)}
            </Text>
          )}
        </>
      )}
    </>
  )
}

export default function GraficoMafs({ data }: { data: GraficoData }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)
  const [hiddenIndices, setHiddenIndices] = useState<Set<number>>(new Set())
  
  const toggleVisibility = (index: number) => {
    setHiddenIndices(prev => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  // Calcoliamo la vista iniziale (centrata) basata sui dati dell'AI
  const boxKey = JSON.stringify(data.boundingBox)
  const initialViewBox = useMemo(() => {
    if (!data?.boundingBox) return { x: [-5, 5] as [number, number], y: [-3, 7] as [number, number] }
    const [xmin, xmax, ymin, ymax] = data.boundingBox
    let finalXmin = xmin
    if (xmin >= 0) {
      const width = xmax - xmin
      finalXmin = -width * 0.2
    }
    return {
      x: [finalXmin, xmax] as [number, number],
      y: [ymin, ymax] as [number, number]
    }
  }, [boxKey])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    if (el.getBoundingClientRect().width > 0) {
      setMounted(true)
      return
    }
    const ro = new ResizeObserver((entries) => {
      if (entries[0].contentRect.width > 0) {
        setMounted(true)
        ro.disconnect()
      }
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  if (!data || !data.espressioni) return null

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Grafico Interattivo
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {data.espressioni.map((e, i) => {
            const isHidden = hiddenIndices.has(i)
            return (
              <div 
                key={i} 
                onClick={() => toggleVisibility(i)}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 5, 
                  cursor: 'pointer',
                  opacity: isHidden ? 0.4 : 1,
                  transition: 'all 0.2s ease',
                  userSelect: 'none'
                }}
              >
                <div style={{ 
                  width: 10, 
                  height: 10, 
                  borderRadius: '50%', 
                  background: isHidden ? 'transparent' : e.color,
                  border: `2px solid ${e.color}`,
                  transition: 'all 0.2s ease'
                }} />
                <span style={{ fontSize: 11, color: '#888' }}>{e.label}</span>
              </div>
            )
          })}
        </div>
      </div>

      <div
        ref={containerRef}
        style={{ width: '100%', height: 350, borderRadius: 12, overflow: 'hidden', border: '1px solid #3A3A3A', background: '#0F0F11' }}
      >
        {mounted && (
          <Mafs 
            key={boxKey} // Resetta il grafico solo quando l'AI cambia bounding box
            viewBox={initialViewBox} 
            pan={true} 
            zoom={true}
          >
            <Coordinates.Cartesian subdivisions={5} />
            {data.espressioni.map((e: ElementoGrafico, i: number) => {
              if (hiddenIndices.has(i)) return null

              if (e.type === 'function') {
                const key = `fn-${i}-${e.fn}`
                return <FunctionLayer key={key} fnStr={e.fn} color={e.color} domain={e.domain} interactive={e.interactive} />
              }
              if (e.type === 'point') {
                const key = `pt-${i}-${e.coords.join(',')}`
                return <Point key={key} x={e.coords[0]} y={e.coords[1]} color={e.color} />
              }
              return null
            })}
          </Mafs>
        )}
      </div>
    </div>
  )
}


'use client'

import { useMemo, useEffect, useRef, useState } from 'react'
import { Mafs, Coordinates, Plot, Point, MovablePoint, Text, Line } from 'mafs'
import 'mafs/core.css'
import 'mafs/font.css'
import { compile, derivative } from 'mathjs'
import { Eye, EyeOff, TrendingUp } from 'lucide-react'
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
  const [showTangent, setShowTangent] = useState(false)
  const [customColors, setCustomColors] = useState<Record<number, string>>({})

  const hasInteractive = useMemo(() => {
    return data?.espressioni?.some(e => e.type === 'function' && e.interactive)
  }, [data])
  
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
    <div className="flex flex-col md:flex-row gap-6 mb-8 w-full items-start">
      {/* Sidebar Controls */}
      <div className="flex flex-col gap-4 w-full md:w-64 shrink-0">
        <div className="text-[11px] font-semibold text-[#888] uppercase tracking-wider">
          Grafico Interattivo
        </div>

        {hasInteractive && (
          <button
            onClick={() => setShowTangent(!showTangent)}
            className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium transition-all w-full
              ${showTangent 
                ? 'bg-yellow-500/15 border border-yellow-500/30 text-yellow-400' 
                : 'bg-transparent border border-[#444] text-[#888] hover:border-[#666]'
              }`}
          >
            <TrendingUp size={14} />
            {showTangent ? 'Tangente attiva' : 'Mostra tangente'}
          </button>
        )}

        <div className="flex flex-col gap-2">
          {data.espressioni.map((e, i) => {
            const isHidden = hiddenIndices.has(i)
            const displayColor = customColors[i] || e.color
            return (
              <div 
                key={i} 
                onClick={() => toggleVisibility(i)}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-all border select-none
                  ${isHidden 
                    ? 'bg-transparent border-[#333] opacity-60 hover:border-[#444]' 
                    : 'bg-[#1A1A1A] border-[#444] hover:border-[#666] hover:scale-[1.02]'
                  }`}
                onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
                onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <div className="relative flex items-center justify-center shrink-0 w-3.5 h-3.5">
                  <div style={{ 
                    width: 12, 
                    height: 12, 
                    borderRadius: '50%', 
                    background: isHidden ? 'transparent' : displayColor,
                    border: `2px solid ${displayColor}`,
                    transition: 'all 0.2s ease'
                  }} />
                  <input 
                    type="color" 
                    value={displayColor}
                    onChange={(evt) => {
                      setCustomColors(prev => ({ ...prev, [i]: evt.target.value }))
                    }}
                    onClick={(evt) => evt.stopPropagation()}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    title="Cambia colore"
                  />
                </div>
                <span className={`text-xs font-medium flex-1 ${isHidden ? 'text-[#777]' : 'text-[#EAEAEA]'}`}>
                  {e.label}
                </span>
                {isHidden ? (
                  <EyeOff size={14} color="#666" />
                ) : (
                  <Eye size={14} color="#888" />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Graph Area */}
      <div
        ref={containerRef}
        className="flex-1 w-full h-[350px] md:h-[400px] rounded-2xl overflow-hidden border border-[#3A3A3A] bg-[#0F0F11]"
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
              const displayColor = customColors[i] || e.color

              if (e.type === 'function') {
                const key = `fn-${i}-${e.fn}`
                return <FunctionLayer key={key} fnStr={e.fn} color={displayColor} domain={e.domain} interactive={e.interactive && showTangent} />
              }
              if (e.type === 'point') {
                const key = `pt-${i}-${e.coords.join(',')}`
                return <Point key={key} x={e.coords[0]} y={e.coords[1]} color={displayColor} />
              }
              return null
            })}
          </Mafs>
        )}
      </div>
    </div>
  )
}


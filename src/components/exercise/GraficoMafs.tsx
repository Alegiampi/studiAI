'use client'

import { useMemo, useEffect, useRef, useState } from 'react'
import { Mafs, Coordinates, Plot, Point, MovablePoint, Text, Line } from 'mafs'
import 'mafs/core.css'
import 'mafs/font.css'
import { compile, derivative } from 'mathjs'
import { Eye, EyeOff, TrendingUp, Plus, Check, X, Pencil, Trash2 } from 'lucide-react'
import type { GraficoData, ElementoGrafico } from '@/types'

function FunctionLayer({ fnStr, color, domain, interactive, label }: { fnStr: string; color: string; domain?: [number, number]; interactive?: boolean; label?: string }) {
  const [t, setT] = useState(1)

  const domainKey = JSON.stringify(domain)

  // Determiniamo se è una funzione di x o di y
  const { isY, cleanFn } = useMemo(() => {
    const raw = fnStr.trim()
    const eqMatch = raw.match(/^([xy])\s*=\s*(.*)$/i)
    
    if (eqMatch) {
      const variable = eqMatch[1].toLowerCase()
      return { isY: variable === 'x', cleanFn: eqMatch[2] }
    }
    
    // Heuristic: se contiene y e non x, assumiamo sia x = f(y)
    if (raw.includes('y') && !raw.includes('x')) {
      return { isY: true, cleanFn: raw }
    }

    // Heuristic avanzata: se la label suggerisce una retta verticale "x = ..." 
    // e la funzione è una costante, allora è una retta verticale.
    if (label && /x\s*=/i.test(label) && !isNaN(Number(raw))) {
      return { isY: true, cleanFn: raw }
    }
    
    return { isY: false, cleanFn: raw }
  }, [fnStr, label])

  const evaluate = useMemo(() => {
    try {
      const node = compile(cleanFn)
      const dMin = domain ? Number(domain[0]) : -Infinity
      const dMax = domain ? Number(domain[1]) : Infinity

      return (val: number) => {
        try {
          if (val < dMin || val > dMax) return NaN
          // Forniamo sia x che y; mathjs userà quella presente nell'espressione
          const result = node.evaluate({ x: val, y: val })
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
  }, [cleanFn, domainKey])

  const df = useMemo(() => {
    if (!interactive || isY) return null // Disabilitiamo derivata interattiva per funzioni di y per ora
    try {
      const dNode = derivative(cleanFn, 'x').compile()
      return (x: number) => dNode.evaluate({ x })
    } catch {
      return null
    }
  }, [cleanFn, interactive, isY])

  const yt = evaluate(t)

  return (
    <>
      {isY ? (
        <Plot.OfY x={evaluate} color={color} weight={3} />
      ) : (
        <Plot.OfX y={evaluate} color={color} weight={3} />
      )}
      {interactive && !isY && (
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
  const [userFunctions, setUserFunctions] = useState<{fn: string, color: string}[]>([])
  const [isAddingMode, setIsAddingMode] = useState(false)
  const [newFunctionInput, setNewFunctionInput] = useState('')
  const [inputError, setInputError] = useState(false)
  const [editingUserIdx, setEditingUserIdx] = useState<number | null>(null)
  const [editInput, setEditInput] = useState('')

  const allEspressioni = useMemo(() => {
    const aiExpr = (data?.espressioni || []).map(e => ({ ...e, isUser: false }))
    const userExpr = userFunctions.map((uf, idx) => ({
      type: 'function' as const,
      fn: uf.fn,
      color: uf.color,
      label: uf.fn,
      interactive: false,
      isUser: true,
      userIdx: idx
    }))
    return [...aiExpr, ...userExpr]
  }, [data, userFunctions])

  const hasInteractive = useMemo(() => {
    return allEspressioni.some(e => e.type === 'function' && e.interactive)
  }, [allEspressioni])
  
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
          {allEspressioni.map((e, i) => {
            const isHidden = hiddenIndices.has(i)
            const displayColor = customColors[i] || e.color
            return (
              <div 
                key={i} 
                onClick={() => toggleVisibility(i)}
                className={`group flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-all border select-none
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
                
                {e.isUser && editingUserIdx === (e as any).userIdx ? (
                  <input
                    autoFocus
                    value={editInput}
                    onChange={(evt) => setEditInput(evt.target.value)}
                    onClick={(evt) => evt.stopPropagation()}
                    onBlur={() => {
                      if (!editInput.trim()) {
                        setEditingUserIdx(null)
                        return
                      }
                      try {
                        let sanitized = editInput.trim().toLowerCase()
                        sanitized = sanitized.replace(/(sin|cos|tan|log|ln|exp|sqrt|abs)x/g, '$1(x)')
                        compile(sanitized)
                        setUserFunctions(prev => {
                          const next = [...prev]
                          next[(e as any).userIdx] = { ...next[(e as any).userIdx], fn: sanitized }
                          return next
                        })
                        setEditingUserIdx(null)
                      } catch {
                        // ignore invalid edit
                        setEditingUserIdx(null)
                      }
                    }}
                    onKeyDown={(evt) => {
                      if (evt.key === 'Enter') (evt.target as any).blur()
                      if (evt.key === 'Escape') setEditingUserIdx(null)
                    }}
                    className="bg-[#2A2A2A] border-none outline-none text-xs text-[#EAEAEA] w-full px-1 rounded"
                  />
                ) : (
                  <>
                    <span className={`text-xs font-medium flex-1 truncate ${isHidden ? 'text-[#777]' : 'text-[#EAEAEA]'}`}>
                      {(e as any).label}
                    </span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {e.isUser && (
                        <>
                          <button 
                            onClick={(evt) => {
                              evt.stopPropagation()
                              setEditingUserIdx((e as any).userIdx)
                              setEditInput((e as any).fn)
                            }}
                            className="p-1 hover:bg-[#333] rounded text-[#888] hover:text-[#EAEAEA]"
                            title="Modifica"
                          >
                            <Pencil size={12} />
                          </button>
                          <button 
                            onClick={(evt) => {
                              evt.stopPropagation()
                              setUserFunctions(prev => prev.filter((_, idx) => idx !== (e as any).userIdx))
                            }}
                            className="p-1 hover:bg-[#333] rounded text-[#888] hover:text-[#F43F5E]"
                            title="Elimina"
                          >
                            <Trash2 size={12} />
                          </button>
                        </>
                      )}
                      {isHidden ? (
                        <EyeOff size={14} color="#666" />
                      ) : (
                        <Eye size={14} color="#888" />
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}

          {!isAddingMode ? (
            <button 
              onClick={() => setIsAddingMode(true)}
              className="flex items-center gap-2 text-[#888] hover:text-[#EAEAEA] text-xs font-medium px-3 py-2 mt-1 transition-colors border border-dashed border-[#333] hover:border-[#666] rounded-xl w-full justify-center"
            >
              <Plus size={14} /> Aggiungi funzione
            </button>
          ) : (
            <form 
              onSubmit={(e) => {
                e.preventDefault()
                if (!newFunctionInput.trim()) return
                
                // Auto-fix: sinx -> sin(x), cosx -> cos(x), ecc.
                let sanitized = newFunctionInput.trim().toLowerCase()
                sanitized = sanitized.replace(/(sin|cos|tan|log|ln|exp|sqrt|abs)x/g, '$1(x)')
                
                try {
                  compile(sanitized)
                  const randomColors = ['#10B981', '#F59E0B', '#3B82F6', '#8B5CF6', '#EC4899']
                  const color = randomColors[userFunctions.length % randomColors.length]
                  setUserFunctions(prev => [...prev, { fn: sanitized, color }])
                  setNewFunctionInput('')
                  setIsAddingMode(false)
                  setInputError(false)
                } catch {
                  setInputError(true)
                }
              }}
              className={`flex items-center gap-2 mt-1 bg-[#1A1A1A] border rounded-xl px-3 py-1.5 transition-colors ${inputError ? 'border-red-500/50' : 'border-[#444] focus-within:border-[#666]'}`}
            >
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#10B981' }} className="shrink-0" />
              <input
                autoFocus
                value={newFunctionInput}
                onChange={(e) => {
                  setNewFunctionInput(e.target.value)
                  setInputError(false)
                }}
                placeholder="es. sin(x) o x^2"
                className="bg-transparent border-none outline-none text-xs text-[#EAEAEA] w-full"
              />
              <button type="submit" className="text-[#888] hover:text-[#10B981]" title="Conferma">
                <Check size={14} />
              </button>
              <button type="button" onClick={() => {
                setIsAddingMode(false)
                setNewFunctionInput('')
                setInputError(false)
              }} className="text-[#888] hover:text-[#F43F5E]" title="Annulla">
                <X size={14} />
              </button>
            </form>
          )}
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
            {allEspressioni.map((e: ElementoGrafico, i: number) => {
              if (hiddenIndices.has(i)) return null
              const displayColor = customColors[i] || e.color

              if (e.type === 'function') {
                const key = `fn-${i}-${e.fn}`
                return <FunctionLayer key={key} fnStr={e.fn} color={displayColor} domain={e.domain} interactive={e.interactive && showTangent} label={e.label} />
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


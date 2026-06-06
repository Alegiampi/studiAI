'use client'

import React, { useState, useRef, useEffect, useMemo } from 'react'
import { Mafs, Coordinates, Point } from 'mafs'
import { TrendingUp } from 'lucide-react'
import 'mafs/core.css'
import 'mafs/font.css'
import type { GraficoData } from '@/types'
import { FunctionLayer } from './graph/FunctionLayer'
import { GraphSidebar } from './graph/GraphSidebar'

export default function GraficoMafs({
  data,
  sidebarCollapsed = false,
  onToggleSidebar
}: {
  data?: GraficoData
  sidebarCollapsed?: boolean
  onToggleSidebar?: () => void
}) {
  const [mounted, setMounted] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const [hiddenIndices, setHiddenIndices] = useState<Set<number>>(new Set())
  const [showTangent, setShowTangent] = useState(false)
  const [customColors, setCustomColors] = useState<Record<number, string>>({})
  const [customStyles, setCustomStyles] = useState<Record<number, 'solid' | 'dashed'>>({})
  
  const [userFunctions, setUserFunctions] = useState<{
    type: 'function' | 'point',
    fn?: string,
    coords?: [number, number],
    color: string,
    label?: string
  }[]>([])

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0)
    return () => clearTimeout(timer)
  }, [])

  const initialViewBox = useMemo(() => {
    if (!data?.boundingBox) return { x: [-5, 5] as [number, number], y: [-5, 5] as [number, number] }
    return {
      x: [data.boundingBox[0], data.boundingBox[1]] as [number, number],
      y: [data.boundingBox[2], data.boundingBox[3]] as [number, number]
    }
  }, [data])

  const boxKey = JSON.stringify(initialViewBox)

  const allEspressioni = useMemo(() => {
    const aiExpr = (data?.espressioni || []).map(e => ({ ...e, isUser: false }))
    const userExpr = userFunctions.map((uf, idx) => ({
      type: uf.type,
      fn: uf.fn,
      coords: uf.coords,
      color: uf.color,
      label: uf.label || uf.fn || (uf.coords ? `Punto (${uf.coords.join(',')})` : 'Elemento'),
      interactive: false,
      isUser: true,
      userIdx: idx
    }))
    return [...aiExpr, ...userExpr]
  }, [data, userFunctions])

  const mainFnLabel = useMemo(() => {
    if (!data?.espressioni) return null
    const main = data.espressioni.find(e => e.type === 'function' && !e.label?.toLowerCase().includes('asintoto'))
    if (main && main.type === 'function') {
      return main.label || main.fn || null
    }
    return null
  }, [data])

  if (!data || !data.espressioni) return null

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Graph Header */}
      <div className="flex items-center px-4 py-3 border-b border-[#2A2A2A] shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <TrendingUp size={16} className="text-primary/70 shrink-0" />
          <div className="min-w-0">
            <div className="text-[11px] font-semibold text-[#888] uppercase tracking-wider leading-tight">
              Grafico Interattivo
            </div>
            {mainFnLabel && (
              <div className="text-[12px] font-mono text-[#AAA] truncate leading-tight mt-0.5">
                {mainFnLabel}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Graph + Sidebar row */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0">
        <GraphSidebar
          allEspressioni={allEspressioni}
          userFunctions={userFunctions}
          setUserFunctions={setUserFunctions}
          hiddenIndices={hiddenIndices}
          setHiddenIndices={setHiddenIndices}
          showTangent={showTangent}
          setShowTangent={setShowTangent}
          customColors={customColors}
          setCustomColors={setCustomColors}
          customStyles={customStyles}
          setCustomStyles={setCustomStyles}
          collapsed={sidebarCollapsed}
          onToggleCollapse={onToggleSidebar}
        />

        <div
          ref={containerRef}
          className="flex-1 min-w-0 h-[350px] md:h-[400px] lg:h-full lg:min-h-0 rounded-2xl overflow-hidden border border-[#3A3A3A] bg-[#0F0F11]"
        >
          {mounted && (
            <Mafs 
              key={boxKey}
              viewBox={initialViewBox} 
              pan={true} 
              zoom={true}
            >
              <Coordinates.Cartesian subdivisions={5} />
              {allEspressioni.map((e: {
                type: string
                fn?: string
                coords?: [number, number]
                color: string
                label?: string
                domain?: [number, number]
                interactive?: boolean
              }, i: number) => {
                const isHidden = hiddenIndices.has(i)
                const displayColor = customColors[i] || e.color
                
                const defaultStyle = (e.type === 'derivative' || e.label?.toLowerCase().includes('asintoto')) ? 'dashed' : 'solid'
                const displayStyle = customStyles[i] || defaultStyle

                if (e.type === 'function' || e.type === 'derivative') {
                  const key = `${e.type}-${i}-${e.fn || ''}`
                  const isDerivative = e.type === 'derivative'
                  return <FunctionLayer key={key} isHidden={isHidden} fnStr={e.fn || ''} color={displayColor} domain={e.domain} interactive={isDerivative ? false : (e.interactive && showTangent)} label={e.label} lineStyle={isDerivative ? 'dashed' : displayStyle} />
                }
                if (e.type === 'point' && e.coords) {
                  const key = `pt-${i}-${e.coords.join(',')}`
                  if (isHidden) return null
                  return <Point key={key} x={e.coords[0]} y={e.coords[1]} color={displayColor} />
                }
                return null
              })}
            </Mafs>
          )}
        </div>
      </div>
    </div>
  )
}

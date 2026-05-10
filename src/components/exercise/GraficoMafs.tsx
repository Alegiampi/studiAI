'use client'

import React, { useState, useRef, useEffect, useMemo } from 'react'
import { Mafs, Coordinates, Point } from 'mafs'
import 'mafs/core.css'
import 'mafs/font.css'
import type { GraficoData } from '@/types'
import { FunctionLayer } from './graph/FunctionLayer'
import { GraphSidebar } from './graph/GraphSidebar'

export default function GraficoMafs({ data }: { data?: GraficoData }) {
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
    setMounted(true)
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

  if (!data || !data.espressioni) return null

  return (
    <div className="w-full flex flex-col md:flex-row gap-4">
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
      />

      {/* Graph Area */}
      <div
        ref={containerRef}
        className="flex-1 w-full h-[350px] md:h-[400px] rounded-2xl overflow-hidden border border-[#3A3A3A] bg-[#0F0F11]"
      >
        {mounted && (
          <Mafs 
            key={boxKey}
            viewBox={initialViewBox} 
            pan={true} 
            zoom={true}
          >
            <Coordinates.Cartesian subdivisions={5} />
            {allEspressioni.map((e: any, i: number) => {
              const isHidden = hiddenIndices.has(i)
              const displayColor = customColors[i] || e.color
              
              const defaultStyle = e.label?.toLowerCase().includes('asintoto') ? 'dashed' : 'solid'
              const displayStyle = customStyles[i] || defaultStyle

              if (e.type === 'function') {
                const key = `fn-${i}-${e.fn}`
                return <FunctionLayer key={key} isHidden={isHidden} fnStr={e.fn} color={displayColor} domain={e.domain} interactive={e.interactive && showTangent} label={e.label} lineStyle={displayStyle} />
              }
              if (e.type === 'point') {
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
  )
}

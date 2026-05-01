'use client'

import { useMemo } from 'react'
import { Mafs, Coordinates, Plot, Point } from 'mafs'
import 'mafs/core.css'
import 'mafs/font.css'
import { compile } from 'mathjs'
import type { GraficoData } from '@/types'

function FunctionLayer({ fnStr, color }: { fnStr: string; color: string }) {
  const evaluate = useMemo(() => {
    try {
      const node = compile(fnStr)
      return (x: number) => node.evaluate({ x })
    } catch (e) {
      console.error('Error compiling mathjs function:', fnStr, e)
      return () => NaN
    }
  }, [fnStr])

  return <Plot.OfX y={evaluate} color={color} weight={3} />
}

export default function GraficoMafs({ data }: { data: GraficoData }) {
  if (!data || !data.espressioni) return null

  // Defaults se l'AI sbaglia il bounding box
  const box = data.boundingBox || [-10, 10, -5, 5]
  const viewBox = { x: [box[0], box[1]] as [number, number], y: [box[2], box[3]] as [number, number] }

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Grafico Interattivo
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {data.espressioni.map((e, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: e.color }} />
              <span style={{ fontSize: 11, color: '#888' }}>{e.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ width: '100%', height: 350, borderRadius: 12, overflow: 'hidden', border: '1px solid #3A3A3A', background: '#0F0F11' }}>
        <Mafs viewBox={viewBox} pan={true} zoom={true}>
          <Coordinates.Cartesian subdivisions={5} />
          {data.espressioni.map((e, i) => {
            if (e.type === 'function' && e.fn) {
              return <FunctionLayer key={i} fnStr={e.fn} color={e.color} />
            }
            if (e.type === 'point' && e.coords) {
              return <Point key={i} x={e.coords[0]} y={e.coords[1]} color={e.color} />
            }
            return null
          })}
        </Mafs>
      </div>
    </div>
  )
}

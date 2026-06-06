import React, { useState, useMemo } from 'react'
import { Plot, Line, MovablePoint, Text } from 'mafs'
import { compile, derivative, EvalFunction } from 'mathjs'

export function FunctionLayer({ 
  fnStr, 
  color, 
  interactive, 
  label, 
  lineStyle = 'solid',
  isHidden = false
}: { 
  fnStr: string; 
  color: string; 
  domain?: [number, number]; 
  interactive?: boolean; 
  label?: string; 
  lineStyle?: 'solid' | 'dashed';
  isHidden?: boolean;
}) {
  const [t, setT] = useState(1)

  const { isY, cleanFn } = useMemo(() => {
    const raw = fnStr.trim()
    const eqMatch = raw.match(/^([xy])\s*=\s*(.*)$/i)
    if (eqMatch) {
      const variable = eqMatch[1].toLowerCase()
      return { isY: variable === 'x', cleanFn: eqMatch[2] }
    }

    // Fallback invincibili per asintoti generati dall'IA
    if (label && /vertical/i.test(label)) {
      return { isY: true, cleanFn: raw }
    }
    if (label && /orizzontal/i.test(label)) {
      return { isY: false, cleanFn: raw }
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
    let node: EvalFunction
    try {
      node = compile(cleanFn)
    } catch {
      // Se l'IA ha scritto testo invece di una formula (es. "0 (asse x)"), estraiamo solo il numero
      const match = cleanFn.match(/-?\d+(\.\d+)?/)
      node = compile(match ? match[0] : '0')
    }

    return (val: number) => {
      try {
        const scope = isY ? { y: val } : { x: val }
        const result = node.evaluate(scope)
        if (typeof result !== 'number' || !isFinite(result)) return NaN
        // Restituiamo NaN per valori grandi per SPEZZARE la linea alle discontinuità.
        // Abbassato a 200 per intercettare il campionamento di Mafs prima che tiri la riga.
        if (Math.abs(result) > 200) return NaN
        return result
      } catch {
        return NaN
      }
    }
  }, [cleanFn, isY])

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

  if (isHidden) return null

  const dashProps = lineStyle === 'dashed' ? { svgPathProps: { style: { strokeDasharray: '8, 8' } as React.CSSProperties } } : {}

  return (
    <>
      {isY ? (
        <Plot.OfY x={evaluate} color={color} weight={lineStyle === 'dashed' ? 4 : 3} style={lineStyle} {...dashProps} />
      ) : (
        <Plot.OfX y={evaluate} color={color} weight={lineStyle === 'dashed' ? 4 : 3} style={lineStyle} {...dashProps} />
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

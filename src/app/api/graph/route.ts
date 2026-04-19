import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { esercizio, spiegazione } = await req.json()

  const systemPrompt = `Sei un esperto di matematica. Il tuo unico compito è generare espressioni JavaScript per JSXGraph.

REGOLE ASSOLUTE:
1. Rispondi SOLO con un JSON array, zero testo aggiuntivo
2. Ogni oggetto ha: fn (funzione JavaScript), color (hex), label (stringa)
3. Usa SEMPRE Math.sin, Math.cos, Math.tan, Math.sqrt, Math.exp, Math.log
4. La variabile è sempre x
5. Usa * per moltiplicazione: Math.sin(x) * Math.cos(x)
6. Per potenze: Math.pow(x, 2) oppure x*x, MAI x^2
7. Per e^x usa Math.exp(x)
8. Per ln(x) usa Math.log(x)

COLORI: #FFD600 per f(x), #00B894 per f'(x), #E84393 per tangente

ESEMPI CORRETTI:
- sin(x)*cos(x) con derivata: [{"fn":"Math.sin(x)*Math.cos(x)","color":"#FFD600","label":"f(x)"},{"fn":"Math.cos(2*x)","color":"#00B894","label":"f'(x)"}]
- x^3 con derivata: [{"fn":"Math.pow(x,3)","color":"#FFD600","label":"f(x)"},{"fn":"3*Math.pow(x,2)","color":"#00B894","label":"f'(x)"}]
- tangente a sin(x) in x=1: [{"fn":"Math.sin(x)","color":"#FFD600","label":"f(x)"},{"fn":"Math.cos(1)*(x-1)+Math.sin(1)","color":"#E84393","label":"tangente in x=1"}]`

  const userPrompt = `Genera le espressioni JSXGraph per questo esercizio.

Esercizio: ${esercizio}
Spiegazione: ${spiegazione}

Rispondi SOLO con il JSON array. Nessun testo prima o dopo.`

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 500,
      temperature: 0.1,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    })
  })

  const data = await res.json()
  if (!data.choices) return NextResponse.json({ error: 'Errore API' })

  try {
    const text = data.choices[0].message.content.trim()
    const clean = text.replace(/```json|```/g, '').trim()
    const espressioni = JSON.parse(clean)
    return NextResponse.json({ espressioni })
  } catch (e) {
    console.error('Parse error:', data.choices[0].message.content)
    return NextResponse.json({ error: 'JSON non valido' })
  }
}

import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { esercizio, spiegazione } = await req.json()

  const systemPrompt = `Sei un esperto di matematica. Il tuo unico compito è generare i dati per plottare il grafico dell'esercizio usando 'mathjs'.

REGOLE ASSOLUTE:
1. Rispondi SOLO con un JSON, zero testo aggiuntivo. Nessun markdown \`\`\`json.
2. Il JSON deve avere questa struttura esatta:
{
  "boundingBox": [-10, 10, -5, 5], // [xmin, xmax, ymin, ymax] calcolato per inquadrare in modo ottimale i punti di interesse
  "espressioni": [
    { "type": "function", "fn": "sin(x)*x^2", "color": "#FFD600", "label": "f(x)" },
    { "type": "point", "coords": [1, 2], "color": "#E84393", "label": "Punto critico" }
  ]
}
3. MASSIMO 5-6 elementi in "espressioni". Disegna la funzione principale, le eventuali funzioni secondarie (es. derivata se richiesta) e TUTTI i punti chiave (es. TUTTI i punti critici, flessi o intersezioni calcolati nell'esercizio). Non omettere punti rilevanti.
4. Per le funzioni, usa stringhe matematiche standard parsabili da mathjs. La variabile è sempre 'x'.
   - Moltiplicazione: '2*x' o 'sin(x)*cos(x)'
   - Potenze: 'x^2'
   - Esponenziale: 'e^x' o 'exp(x)'
   - Logaritmi: 'log(x)' (naturale), 'log10(x)'
5. COLORI PREDEFINITI DA USARE: #FFD600 (principale), #00B894 (secondario/derivata), #E84393 (tangente/punto), #A8B1FF (asintoti).`

  const userPrompt = `Genera il JSON per questo grafico.

Esercizio: ${esercizio}
Spiegazione: ${spiegazione}

Rispondi SOLO con il JSON crudo.`

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 800,
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
    const graficoData = JSON.parse(clean)
    return NextResponse.json({ data: graficoData })
  } catch (e) {
    console.error('Parse error:', data.choices[0].message.content)
    return NextResponse.json({ error: 'JSON non valido' })
  }
}

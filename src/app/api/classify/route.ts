import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { text, scuola, classe } = await req.json()

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      max_tokens: 60,
      temperature: 0,
      messages: [
        {
          role: 'system',
          content: `Sei un classificatore di esercizi scolastici italiani. Rispondi SOLO con un JSON su una riga, niente altro.
Devi decidere se un grafico sarebbe utile per spiegare questo esercizio a uno studente di ${classe ?? 'scuola superiore'} di ${scuola ?? 'liceo scientifico'}.

Rispondi con: {"graficoUtile":true,"tipo":"derivata"} oppure {"graficoUtile":false,"tipo":"algebra"}

Tipi possibili: derivata, integrale, funzione, geometria_analitica, trigonometria, limite, algebra, equazione, altro
Il grafico è utile SOLO per: derivata, integrale, funzione, geometria_analitica, trigonometria, limite.
Per tutto il resto (equazioni, algebra, calcolo numerico, fisica senza grafici, altro) graficoUtile deve essere false.`
        },
        {
          role: 'user',
          content: `Esercizio: ${text}`
        }
      ]
    })
  })

  const data = await res.json()
  try {
    const content = data.choices[0].message.content.trim()
    const parsed = JSON.parse(content)
    return NextResponse.json(parsed)
  } catch {
    return NextResponse.json({ graficoUtile: false, tipo: 'altro' })
  }
}

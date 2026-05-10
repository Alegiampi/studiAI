import { NextRequest, NextResponse } from 'next/server'

async function callGroq(messages: any[]) {
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
      messages
    })
  })
  return res.json()
}

export async function POST(req: NextRequest) {
  try {
    const { prompt, context } = await req.json()

    const systemPrompt = `Sei l'Assistente AI del Grafico Interattivo. Il tuo compito è rispondere alle richieste dell'utente aggiungendo nuovi elementi matematici (funzioni o punti) al grafico.

CONTESTO ATTUALE (elementi già presenti sul grafico):
${JSON.stringify(context, null, 2)}

Usa il contesto per capire a quale funzione si riferisce l'utente (es. se chiede "l'asse della parabola", cerca la parabola nel contesto per sapere qual è la sua equazione e calcolare l'asse corretto).

REGOLE ASSOLUTE:
1. Rispondi SOLO con un JSON (un array di oggetti), zero testo aggiuntivo. Nessun markdown \`\`\`json.
2. L'output deve essere un array di elementi con questa struttura esatta:
[
  { "type": "function", "fn": "x = 30", "color": "#10B981", "label": "Asse x=30" },
  { "type": "point", "coords": [30, 0], "color": "#F43F5E", "label": "Vertice (30,0)" }
]
3. "type" può essere SOLO "function" o "point". Non inventare altri tipi.
4. Per le funzioni, "fn" deve essere un'espressione compatibile.
   - REGOLE PER RETTE VERTICALI: usa SEMPRE la notazione "x = numero" (es. "x = 30").
   - Usa "x" come variabile (es. "sin(x)").
5. I colori devono essere scelti tra questi per coerenza: "#10B981" (Verde), "#F59E0B" (Giallo/Arancione), "#38BDF8" (Azzurro), "#818CF8" (Viola), "#F43F5E" (Rosso).
6. Non duplicare elementi già presenti nel contesto attuale. Restituisci SOLO i NUOVI elementi da aggiungere.`

    const userPrompt = `Richiesta dell'utente: ${prompt}`

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]

    const result = await callGroq(messages)
    
    if (!result.choices?.[0]?.message?.content) {
      throw new Error('Risposta API non valida')
    }

    let rawJson = result.choices[0].message.content.trim()
    // Rimuovi eventuali backtick markdown
    if (rawJson.startsWith('```json')) {
      rawJson = rawJson.replace(/```json/g, '').replace(/```/g, '').trim()
    } else if (rawJson.startsWith('```')) {
      rawJson = rawJson.replace(/```/g, '').trim()
    }

    const elementi = JSON.parse(rawJson)

    if (!Array.isArray(elementi)) {
      throw new Error('Formato array non valido')
    }

    return NextResponse.json(elementi)

  } catch (error) {
    console.error('API Graph Assist Error:', error)
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}

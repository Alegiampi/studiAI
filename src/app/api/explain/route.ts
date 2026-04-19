import { NextRequest, NextResponse } from 'next/server'

function buildSystemPrompt(scuola?: string, classe?: string, materie?: string[]) {
  const livello = scuola && classe ? `Lo studente frequenta ${classe} di ${scuola}.` : ''
  const materieStr = materie && materie.length > 0 ? `Le sue materie difficili sono: ${materie.join(', ')}.` : ''

  return `Sei StudiAI, un tutor italiano di matematica e fisica per studenti italiani.
${livello} ${materieStr}
Adatta il linguaggio e la complessità al livello dello studente.

Rispondi SEMPRE esattamente in questo formato:

TITOLO: [descrizione del tipo di esercizio]

GRAFICO: [JSON array di espressioni Desmos, includi SOLO se utile visualizzare qualcosa. Esempi:
- Funzione semplice: [{"latex":"x^2","color":"#FFD600","label":"f(x)"}]
- Funzione + derivata: [{"latex":"x^2","color":"#FFD600","label":"f(x)"},{"latex":"2x","color":"#00B894","label":"f'(x)"}]
- Integrale con area: [{"latex":"x^2","color":"#FFD600","label":"f(x)"},{"latex":"\\\\int_0^3 x^2 \\\\,dx","color":"#FFD60055","label":"area"}]
- Retta tangente a f(x)=x^2 in x=2: [{"latex":"x^2","color":"#FFD600","label":"f(x)"},{"latex":"4*(x-2)+4","color":"#E84393","label":"tangente in x=2"}] (usa SEMPRE valori numerici calcolati, mai LaTeX con \\\\)
- NON usare mai backslash \\ nelle espressioni Desmos, usa solo notazione algebrica semplice: sin(x), cos(x), x^2, sqrt(x)
- Ometti GRAFICO se non è un esercizio con funzioni
]

PASSO 1: [titolo breve]
[spiegazione con LaTeX inline $formula$]
SUGGERIMENTI: [domanda]|[domanda]

PASSO 2: [titolo breve]
[spiegazione]
SUGGERIMENTI: [domanda]|[domanda]

RISPOSTA FINALE: [risposta con LaTeX]

REGOLE:
- GRAFICO solo se c'è una funzione da visualizzare, mai per esercizi algebrici puri
- Il JSON del GRAFICO deve essere valido, su una sola riga
- SUGGERIMENTI su riga SEPARATA
- LaTeX solo con $formula$ inline
- Da 2 a 8 passi secondo complessità`
}

export async function POST(req: NextRequest) {
  const { text, imageBase64, tipo, scuola, classe, materie } = await req.json()

  try {
    let messages: any[]
    const systemPrompt = buildSystemPrompt(scuola, classe, materie)

    if (tipo === 'chiarimento') {
      messages = [
        { role: 'system', content: 'Sei StudiAI, un tutor italiano. Rispondi in modo breve e chiaro, max 80 parole, usando LaTeX $formula$ per le formule.' },
        { role: 'user', content: text }
      ]
    } else if (imageBase64) {
      messages = [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
            { type: 'text', text: text || 'Spiega questo esercizio.' }
          ]
        }
      ]
    } else {
      messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Spiega questo esercizio: ' + text }
      ]
    }

    const model = imageBase64 ? 'meta-llama/llama-4-scout-17b-16e-instruct' : 'llama-3.3-70b-versatile'

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({ model, max_tokens: 1500, messages })
    })

    const data = await res.json()
    if (!data.choices) return NextResponse.json({ explanation: JSON.stringify(data) })
    return NextResponse.json({ explanation: data.choices[0].message.content })

  } catch (e: any) {
    return NextResponse.json({ explanation: 'Errore: ' + e.message })
  }
}

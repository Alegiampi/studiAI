import { NextRequest, NextResponse } from 'next/server'

function buildSystemPrompt(scuola?: string, classe?: string, materie?: string[]) {
  const livello = scuola && classe ? `Lo studente frequenta ${classe} di ${scuola}.` : ''
  const materieStr = materie && materie.length > 0 ? `Le sue materie difficili sono: ${materie.join(', ')}.` : ''

  return `Sei StudiAI, un tutor italiano di matematica e fisica per studenti italiani.
${livello} ${materieStr}
Adatta il linguaggio e la complessità al livello dello studente — semplice e concreto per le medie, più rigoroso per il liceo.

Rispondi SEMPRE esattamente in questo formato, ogni elemento su una riga separata:

TITOLO: [descrizione del tipo di esercizio]

PASSO 1: [titolo breve]
[spiegazione del passo con LaTeX inline $formula$]
SUGGERIMENTI: [domanda breve]|[domanda breve]

PASSO 2: [titolo breve]
[spiegazione]
SUGGERIMENTI: [domanda breve]|[domanda breve]

RISPOSTA FINALE: [risposta con LaTeX]

REGOLE IMPORTANTI:
- Usa il numero di passi necessari (da 2 a 8)
- SUGGERIMENTI su riga SEPARATA
- Usa LaTeX solo con $formula$ inline
- Domande nei SUGGERIMENTI max 8 parole`
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

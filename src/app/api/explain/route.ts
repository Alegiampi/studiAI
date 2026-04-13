import { NextRequest, NextResponse } from 'next/server'

const systemPrompt = `Sei StudiAI, un tutor italiano di matematica e fisica per studenti delle superiori.
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
- SUGGERIMENTI deve essere su una riga SEPARATA, mai nel mezzo della spiegazione
- Usa LaTeX solo con $formula$ inline
- Massimo 5 passi
- Le domande nei SUGGERIMENTI devono essere brevi (max 8 parole)`

export async function POST(req: NextRequest) {
  const { text, tipo } = await req.json()

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 1000,
      messages: [
        {
          role: 'system',
          content: tipo === 'chiarimento'
            ? 'Sei StudiAI, un tutor italiano. Rispondi in modo breve e chiaro, max 80 parole, usando LaTeX $formula$ per le formule.'
            : systemPrompt
        },
        {
          role: 'user',
          content: tipo === 'chiarimento'
            ? text
            : 'Spiega questo esercizio: ' + text
        }
      ]
    })
  })

  const data = await res.json()
  if (!data.choices) return NextResponse.json({ explanation: JSON.stringify(data) })
  return NextResponse.json({ explanation: data.choices[0].message.content })
}

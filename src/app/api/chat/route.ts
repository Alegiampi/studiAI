import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { messages, exercise, explanation } = await req.json()

  try {
    const systemPrompt = `Sei theLemma, un tutor italiano empatico, incoraggiante e super competente.
L'utente ti sta facendo delle domande su un esercizio che gli hai appena spiegato.

ESERCIZIO ORIGINALE:
${exercise || 'Non specificato'}

TUA SPIEGAZIONE ORIGINALE:
${explanation || 'Non specificata'}

REGOLE DI FORMATTAZIONE:
1. Rispondi in modo conciso (max 150 parole) e amichevole.
2. Usa SEMPRE il formato $$ formula $$ (doppio dollaro) per le formule importanti, i passaggi e i calcoli. Devono essere su una riga separata e centrate.
3. Usa il formato $formula$ (singolo dollaro) solo per citare piccoli termini matematici all'interno del testo.
4. Ogni passaggio logico deve essere chiaramente separato da un a-capo.
5. Non scusarti se l'utente non capisce, incoraggialo e riprova con un approccio diverso.`

    // Format messages for Groq API
    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m: any) => ({
        role: m.role,
        content: m.text
      }))
    ]

    const model = 'llama-3.3-70b-versatile'

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({ model, max_tokens: 1000, messages: apiMessages })
    })

    const data = await res.json()
    if (!data.choices) return NextResponse.json({ reply: 'Si è verificato un errore di connessione col tutor.' })
    
    let replyText = data.choices[0].message.content || ''
    // Fix LaTeX brackets if model uses them
    replyText = replyText.replace(/\\\[/g, '$$$$').replace(/\\\]/g, '$$$$')
    replyText = replyText.replace(/\\\(/g, '$').replace(/\\\)/g, '$')

    return NextResponse.json({ reply: replyText })

  } catch (e: any) {
    return NextResponse.json({ reply: 'Errore: ' + e.message })
  }
}

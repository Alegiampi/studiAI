import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { messages, exercise, explanation } = await req.json()

  try {
    const systemPrompt = `Sei StudiAI, un tutor italiano empatico, incoraggiante e super competente.
L'utente ti sta facendo delle domande su un esercizio che gli hai appena spiegato.

ESERCIZIO ORIGINALE:
${exercise || 'Non specificato'}

TUA SPIEGAZIONE ORIGINALE:
${explanation || 'Non specificata'}

REGOLE:
1. Rispondi in modo conciso (max 100 parole), amichevole e molto chiaro.
2. Aiuta lo studente a ragionare, non dargli solo la risposta spiattellata. Usa frasi come "Ottima domanda! Pensa a...", "Cosa succederebbe se...?".
3. Usa SEMPRE il formato $formula$ per le espressioni matematiche inline, e $$ formula $$ per blocchi separati. Usa il LaTeX per QUALSIASI simbolo o numero.
4. Non scusarti se l'utente dice di non aver capito, digli "Nessun problema, vediamo di chiarire!".`

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

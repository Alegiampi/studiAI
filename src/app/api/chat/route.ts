import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { ChatSchema } from '@/lib/schemas'
import { checkBurstLimit } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  const parsed = ChatSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Richiesta non valida', details: parsed.error.issues }, { status: 400 })
  }
  const { messages, exercise, explanation } = parsed.data

  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  if (!checkBurstLimit(`chat:${user.id}`)) {
    return NextResponse.json({ reply: 'Troppe richieste. Riprova tra qualche minuto.' }, { status: 429 })
  }

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
5. Non scusarti se l'utente non capisce, incoraggialo e riprova con un approccio diverso.
6. Per i simboli di infinito, usa sempre $+ \infty$ e $- \infty$ racchiusi tra dollari (es. $+ \infty$ e $- \infty$). Non scrivere mai '+infinito' o '-infinito' come testo semplice.`

    // Format messages for Groq API
    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m: { role: string; text: string }) => ({
        role: m.role,
        content: m.text
      }))
    ]

    const hasOpenAI = !!process.env.OPENAI_API_KEY
    let replyText = ''

    if (hasOpenAI) {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          max_tokens: 1000,
          messages: apiMessages
        })
      })
      const data = await res.json()
      if (!data.choices) return NextResponse.json({ reply: 'Si è verificato un errore di connessione col tutor.' })
      replyText = data.choices[0].message.content || ''
    } else {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          max_tokens: 1000,
          messages: apiMessages
        })
      })
      const data = await res.json()
      if (!data.choices) return NextResponse.json({ reply: 'Si è verificato un errore di connessione col tutor.' })
      replyText = data.choices[0].message.content || ''
    }

    // Fix LaTeX brackets if model uses them
    replyText = replyText.replace(/\\\[/g, '$$$$').replace(/\\\]/g, '$$$$')
    replyText = replyText.replace(/\\\(/g, '$').replace(/\\\)/g, '$')

    return NextResponse.json({ reply: replyText })

  } catch (e: unknown) {
    const errMsg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ reply: 'Errore: ' + errMsg })
  }
}

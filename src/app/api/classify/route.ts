import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { ClassifySchema } from '@/lib/schemas'
import { checkBurstLimit } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  const parsed = ClassifySchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Richiesta non valida', details: parsed.error.issues }, { status: 400 })
  }
  const { text, scuola, classe } = parsed.data

  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  if (!checkBurstLimit(`classify:${user.id}`)) {
    return NextResponse.json({ graficoUtile: false, tipo: 'altro' }, { status: 429 })
  }

  try {
    const hasOpenAI = !!process.env.OPENAI_API_KEY
    const url = hasOpenAI ? 'https://api.openai.com/v1/chat/completions' : 'https://api.groq.com/openai/v1/chat/completions'
    const key = hasOpenAI ? process.env.OPENAI_API_KEY : process.env.GROQ_API_KEY
    const model = hasOpenAI ? 'gpt-4o-mini' : 'llama-3.1-8b-instant'

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify({
        model,
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
      return NextResponse.json({ graficoUtile: false, tipo: 'altro' }, { status: 502 })
    }
  } catch (e: unknown) {
    const errMsg = e instanceof Error ? e.message : String(e)
    console.error('[classify] fetch error:', errMsg)
    return NextResponse.json({ graficoUtile: false, tipo: 'altro' })
  }
}

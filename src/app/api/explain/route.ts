import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { ExplainSchema } from '@/lib/schemas'
import { checkDailyLimit, checkBurstLimit, incrementDailyUsage } from '@/lib/rate-limit'

function buildSystemPrompt(scuola?: string, classe?: string, materie?: string[]) {
  const livello = scuola && classe ? `Lo studente frequenta ${classe} di ${scuola}.` : ''
  const materieStr = materie && materie.length > 0 ? `Le sue materie difficili sono: ${materie.join(', ')}.` : ''

  return `Sei theLemma, un tutor italiano di matematica e fisica per studenti italiani.
${livello} ${materieStr}
Adatta il linguaggio, la complessità e il numero di passi al livello dello studente. Scegli tu il numero di passi ottimali in base alla difficoltà dell'esercizio e alle capacità dello studente.

REGOLE DI RAGIONAMENTO MATEMATICO:
- Per funzioni della forma $f(x)^{g(x)}$, utilizza SEMPRE la definizione analitica $e^{g(x) \\ln f(x)}$ per determinare il dominio. Questo restringe immediatamente la base $f(x) > 0$.
- Sii rigoroso ma evita di perderti in discussioni filosofiche su casi come $0^0$ o basi negative a meno che non sia strettamente richiesto; prediligi la strada dell'analisi reale standard.
- Assicurati che i passaggi siano logicamente concatenati e che portino alla risposta finale in modo chiaro.

Rispondi SEMPRE con un oggetto JSON valido e nient'altro. Il formato esatto da rispettare è:

{
  "titolo": "descrizione breve del tipo di esercizio",
  "passi": [
    {
      "titolo": "titolo breve del passo",
      "corpo": "spiegazione dettagliata del passo, usa \\n per i ritorni a capo"
    }
  ],
  "finale": "risposta finale con LaTeX, può contenere \\n"
}

REGOLE FONDAMENTALI PER IL CONTENUTO DEI CAMPI:
- Usa da 2 a 8 passi in base alla difficoltà e al livello dello studente.
- Qualsiasi formula, equazione, variabile, numero isolato o simbolo matematico/logico deve essere SEMPRE racchiusa tra i delimitatori LaTeX $ (inline) o $$ (display). Non scrivere mai simboli o equazioni matematiche al di fuori di questi delimitatori. In particolare, non scrivere mai '+infinito' o '-infinito' come testo semplice, ma usa sempre $+ \\infty$ e $- \\infty$.
  * Esempio CORRETTO: "Assegniamo $x = 3$ e $y = 4$. Per risolvere l'esercizio, dobbiamo applicare la formula:"
- Usa un linguaggio discorsivo, con frasi naturali e variabili inline testuali ($...$). 
- Quando presenti una formula principale, un'equazione chiave o un risultato, usa SEMPRE il formato a blocco isolato $$...$$. Questo la posizionerà al centro, ben spaziata. 
- Metti sempre un \`\\n\\n\` prima e dopo ogni blocco \`$$\` in modo che sia ben isolato dal testo.
- Per equazioni multi-step usa SOLO il formato:
  $$\\begin{aligned}\\na &= b \\\\\\\\\\n&= c\\n\\end{aligned}$$
- NON usare \\[ \\], \\( \\) o \\begin{equation}. Solo $ e $$.
- Il campo "finale" contiene la risposta definitiva con LaTeX, può essere multi-riga.
- Tieni il testo arioso: paragrafi brevi separati da \\n\\n.`
}

interface ChatMessagePayload {
  role: string
  content: string | unknown[]
}

async function callGroq(
  model: string,
  messages: ChatMessagePayload[],
  maxTokens: number,
  jsonMode = false
): Promise<string> {
  const body: { model: string; max_tokens: number; messages: ChatMessagePayload[]; response_format?: { type: string } } = { model, max_tokens: maxTokens, messages }
  if (jsonMode) body.response_format = { type: 'json_object' }

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
    },
    body: JSON.stringify(body)
  })
  const data = await res.json()
  if (!data.choices) throw new Error(JSON.stringify(data))
  return data.choices[0].message.content || ''
}

async function callOpenAI(
  model: string,
  messages: ChatMessagePayload[],
  maxTokens: number,
  jsonMode = false
): Promise<string> {
  const body: { model: string; max_tokens: number; messages: ChatMessagePayload[]; response_format?: { type: string } } = { model, max_tokens: maxTokens, messages }
  if (jsonMode) body.response_format = { type: 'json_object' }

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify(body)
  })
  const data = await res.json()
  if (!data.choices) throw new Error(JSON.stringify(data))
  return data.choices[0].message.content || ''
}

function makeTransformerStream(rawStream: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
  const decoder = new TextDecoder()
  const encoder = new TextEncoder()
  let buffer = ''

  const transformStream = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      buffer += decoder.decode(chunk, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed) continue
        if (trimmed === 'data: [DONE]') continue

        if (trimmed.startsWith('data: ')) {
          try {
            const jsonStr = trimmed.slice(6)
            const parsed = JSON.parse(jsonStr)
            const content = parsed.choices?.[0]?.delta?.content || ''
            if (content) {
              controller.enqueue(encoder.encode(content))
            }
          } catch (err) {
            console.error('Error parsing SSE line:', trimmed, err)
          }
        }
      }
    },
    flush(controller) {
      if (buffer) {
        const trimmed = buffer.trim()
        if (trimmed && trimmed.startsWith('data: ') && trimmed !== 'data: [DONE]') {
          try {
            const jsonStr = trimmed.slice(6)
            const parsed = JSON.parse(jsonStr)
            const content = parsed.choices?.[0]?.delta?.content || ''
            if (content) {
              controller.enqueue(encoder.encode(content))
            }
          } catch (err) {
            console.error('Error parsing SSE line in flush:', trimmed, err)
          }
        }
      }
    }
  })

  return rawStream.pipeThrough(transformStream)
}

async function streamOpenAI(
  model: string,
  messages: ChatMessagePayload[],
  maxTokens: number,
  jsonMode = false
): Promise<ReadableStream<Uint8Array>> {
  const body: any = { model, max_tokens: maxTokens, messages, stream: true }
  if (jsonMode) body.response_format = { type: 'json_object' }

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify(body)
  })

  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(`OpenAI API error: ${res.status} - ${errorText}`)
  }

  return makeTransformerStream(res.body!)
}

async function streamGroq(
  model: string,
  messages: ChatMessagePayload[],
  maxTokens: number,
  jsonMode = false
): Promise<ReadableStream<Uint8Array>> {
  const body: any = { model, max_tokens: maxTokens, messages, stream: true }
  if (jsonMode) body.response_format = { type: 'json_object' }

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
    },
    body: JSON.stringify(body)
  })

  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(`Groq API error: ${res.status} - ${errorText}`)
  }

  return makeTransformerStream(res.body!)
}

/** Applica i fallback LaTeX (\[ \] → $$, \( \) → $) ricorsivamente in un oggetto JSON */
function fixLatexInValue(value: unknown): unknown {
  if (typeof value === 'string') {
    return value
      .replace(/\\\[/g, '$$').replace(/\\\]/g, '$$')
      .replace(/\\\(/g, '$').replace(/\\\)/g, '$')
  }
  if (Array.isArray(value)) return value.map(fixLatexInValue)
  if (value && typeof value === 'object') {
    const result: Record<string, unknown> = {}
    for (const key of Object.keys(value as object)) {
      result[key] = fixLatexInValue((value as Record<string, unknown>)[key])
    }
    return result
  }
  return value
}

export async function POST(req: NextRequest) {
  const parsed = ExplainSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Richiesta non valida', details: parsed.error.issues }, { status: 400 })
  }
  const { text, imageBase64, tipo, scuola, classe, materie } = parsed.data

  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  if (!checkBurstLimit(`explain:${user.id}`)) {
    return NextResponse.json({ explanation: 'Troppe richieste. Riprova tra qualche minuto.' }, { status: 429 })
  }

  const limitCheck = await checkDailyLimit(supabase, user.id, user.email)
  if (!limitCheck.allowed) {
    return NextResponse.json({ explanation: 'Hai raggiunto il limite giornaliero. Passa a premium per continuare.' }, { status: 429 })
  }

  try {
    const systemPrompt = buildSystemPrompt(scuola ?? undefined, classe ?? undefined, materie ?? undefined)
    const hasOpenAI = !!process.env.OPENAI_API_KEY

    if (tipo === 'chiarimento') {
      // Chiarimento rapido: modello leggero, risposta testo breve (non JSON)
      const messages = [
        {
          role: 'system',
          content: 'Sei theLemma, un tutor italiano. Rispondi in modo breve e chiaro, max 80 parole, usando LaTeX $formula$ per le formule.'
        },
        { role: 'user', content: text }
      ]
      let rawText = ''
      if (hasOpenAI) {
        rawText = await callOpenAI('gpt-4o-mini', messages, 400, false)
      } else {
        rawText = await callGroq('llama-3.1-8b-instant', messages, 400, false)
      }
      await incrementDailyUsage(supabase, user.id)
      return NextResponse.json({ explanation: rawText })
    }

    let stream: ReadableStream<Uint8Array>

    if (imageBase64) {
      // STAGE 1: llama-4-scout (visione) — estrae il testo dall'immagine
      // NOTA: llama-4-scout NON supporta JSON mode, quindi json_mode=false
      const extractMessages = [
        {
          role: 'system',
          content: 'Sei un sistema OCR specializzato in matematica e fisica. Il tuo unico compito è trascrivere FEDELMENTE tutto il testo e le formule presenti nell\'immagine, usando la notazione LaTeX dove necessario. Non spiegare, non risolvere: trascrivi soltanto.'
        },
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
            { type: 'text', text: 'Trascrivi fedelmente tutto il testo e le formule di questo esercizio.' }
          ]
        }
      ]
      const extractedText = await callGroq('meta-llama/llama-4-scout-17b-16e-instruct', extractMessages, 500, false)

      // STAGE 2: Spiegazione (usiamo gpt-4o se disponibile in quanto elabora testo)
      const explainMessages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Spiega questo esercizio: ${extractedText}` }
      ]
      if (hasOpenAI) {
        stream = await streamOpenAI('gpt-4o', explainMessages, 1500, true)
      } else {
        stream = await streamGroq('llama-3.3-70b-versatile', explainMessages, 1500, true)
      }

    } else {
      // Testo diretto: gpt-4o genera la spiegazione JSON se disponibile
      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Spiega questo esercizio: ' + text }
      ]
      if (hasOpenAI) {
        stream = await streamOpenAI('gpt-4o', messages, 1500, true)
      } else {
        stream = await streamGroq('llama-3.3-70b-versatile', messages, 1500, true)
      }
    }

    await incrementDailyUsage(supabase, user.id)

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    })

  } catch (e: unknown) {
    const errMsg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ explanation: 'Errore: ' + errMsg }, { status: 500 })
  }
}

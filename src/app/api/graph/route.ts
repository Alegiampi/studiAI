import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { GraphSchema } from '@/lib/schemas'
import { checkBurstLimit } from '@/lib/rate-limit'

async function callAI(messages: { role: string; content: string }[]) {
  const hasOpenAI = !!process.env.OPENAI_API_KEY
  const url = hasOpenAI ? 'https://api.openai.com/v1/chat/completions' : 'https://api.groq.com/openai/v1/chat/completions'
  const key = hasOpenAI ? process.env.OPENAI_API_KEY : process.env.GROQ_API_KEY
  const model = hasOpenAI ? 'gpt-4o' : 'llama-3.3-70b-versatile'

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`
    },
    body: JSON.stringify({
      model,
      max_tokens: 800,
      temperature: 0.1,
      messages
    })
  })
  return res.json()
}

export async function POST(req: NextRequest) {
  const parsed = GraphSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Richiesta non valida', details: parsed.error.issues }, { status: 400 })
  }
  const { esercizio, spiegazione } = parsed.data

  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  if (!checkBurstLimit(`graph:${user.id}`)) {
    return NextResponse.json({ error: 'Troppe richieste. Riprova tra qualche minuto.' }, { status: 429 })
  }

  const systemPrompt = `Sei un esperto di matematica. Il tuo unico compito è generare i dati per plottare il grafico dell'esercizio usando 'mathjs'.

REGOLE ASSOLUTE:
1. Rispondi SOLO con un JSON, zero testo aggiuntivo. Nessun markdown \`\`\`json.
2. Il JSON deve avere questa struttura esatta:
{
  "boundingBox": [-5, 5, -2, 8],
  "espressioni": [
    { 
      "type": "function", 
      "fn": "exp(x*log(x))", 
      "color": "#FFD600", 
      "label": "f(x)",
      "domain": [0.01, 1000],
      "interactive": true
    },
    { "type": "derivative", "fn": "2*x", "color": "#38BDF8", "label": "f'(x)" },
    { "type": "point", "coords": [1, 1], "color": "#E84393", "label": "Punto (1,1)" }
  ]
}
3. MASSIMO 5-6 elementi in "espressioni". Includi la funzione principale, derivate se utili, e i punti critici (zeri, max/min, flessi).
4. type "derivative": usa questo type per le derivate. Il campo fn deve contenere l'espressione della derivata GIÀ CALCOLATA (es. se f(x) = x², fn = "2*x"). Non impostare interactive: la derivata non interattiva.
5. NON DUPLICARE: Se usi exp(x*log(x)) per x^x, NON aggiungere anche x^x. Scegline UNA.
6. ESPRESSIONI ROBUSTE (OBBLIGATORIO):
   - Per potenze con base variabile (es. x^x, x^(1/x), (x+1)^x), usa SEMPRE la forma esponenziale: "exp(x*log(x))" o "exp((1/x)*log(x))".
   - Variabile: 'x'. Logaritmo naturale: 'log(x)'. Esponenziale: 'exp(x)'.
7. COLORI DA USARE TASSATIVAMENTE:
   - Funzione principale f(x): "#FFD600" (Giallo)
   - Derivate (f', f''): "#38BDF8" (Azzurro) o "#818CF8" (Viola chiaro)
   - Punti (flessi, zeri, ecc): "#F43F5E" (Rosso vivo)
   - Asintoti: "#F97316" (Arancione) o "#A855F7" (Viola)
8. DOMINIO E VISTA:
   - "domain": [min, max] è il dominio matematico reale.
   - "boundingBox": [xmin, xmax, ymin, ymax] definisce lo ZOOM INIZIALE. 
   - REGOLE ZOOM: Centra la vista sugli elementi chiave (vertici, zeri vicini). Se un punto (es. intersezione asse y) è troppo lontano (es. y=900 mentre il resto è vicino a 0), NON includerlo nel boundingBox per evitare uno zoom eccessivo che renderebbe il grafico illeggibile. Mantieni lo zoom su un range ragionevole (es. y tra -10 e 50 se possibile).
9. INTERATTIVITÀ:
   - Imposta "interactive": true sulla funzione principale per mostrare tangente e derivata.
10. RIGORE MATEMATICO (CRITICO):
   - Includi asintoti (es. y=0, x=0) SOLO se matematicamente esistenti.
   - REGOLE PER RETTE VERTICALI: Per asintoti o assi verticali (es. x=30), il campo "fn" DEVE essere "x = 30" (includendo x=). Se scrivi solo "30", verrà disegnata una retta orizzontale y=30.
   - Verifica i limiti per x -> 0 e x -> infinito prima di aggiungere linee di supporto. Per x^x, il limite per x->0 è 1, quindi y=0 NON è un asintoto. Non aggiungere asintoti a caso.`;

  const userPrompt = `Genera il JSON per questo grafico.

Esercizio: ${esercizio}
Spiegazione: ${spiegazione}

Rispondi SOLO con il JSON crudo.`;

  let data
  try {
    data = await callAI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ])
  } catch (e: unknown) {
    const errMsg = e instanceof Error ? e.message : String(e)
    console.error('[graph] fetch error:', errMsg)
    return NextResponse.json({ error: 'Errore di connessione.' }, { status: 502 })
  }

  if (!data.choices) {
    const errMsg = data.error?.message || 'Errore API'
    console.error('[graph] Groq error:', errMsg)
    if (data.error?.code === 'rate_limit_exceeded') {
      return NextResponse.json({ error: 'Limite API raggiunto. Riprova tra qualche minuto.' }, { status: 429 })
    }
    return NextResponse.json({ error: 'Errore API' }, { status: 502 })
  }

  try {
    const text = data.choices[0].message.content.trim();
    const clean = text.replace(/\`\`\`json|\`\`\`/g, '').trim();
    const graficoData = JSON.parse(clean);
    return NextResponse.json({ data: graficoData });
  } catch {
    return NextResponse.json({ error: 'JSON non valido' }, { status: 502 });
  }
}

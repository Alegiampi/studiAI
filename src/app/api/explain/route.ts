import { NextRequest, NextResponse } from 'next/server'

function buildSystemPrompt(scuola?: string, classe?: string, materie?: string[]) {
  const livello = scuola && classe ? `Lo studente frequenta ${classe} di ${scuola}.` : ''
  const materieStr = materie && materie.length > 0 ? `Le sue materie difficili sono: ${materie.join(', ')}.` : ''

  return `Sei theLemma, un tutor italiano di matematica e fisica per studenti italiani.
${livello} ${materieStr}
Adatta il linguaggio, la complessità e il numero di passi al livello dello studente. Scegli tu il numero di passi ottimali in base alla difficoltà dell'esercizio e alle capacità dello studente.

REGOLE DI RAGIONAMENTO MATEMATICO:
- Per funzioni della forma $f(x)^{g(x)}$, utilizza SEMPRE la definizione analitica $e^{g(x) \ln f(x)}$ per determinare il dominio. Questo restringe immediatamente la base $f(x) > 0$.
- Sii rigoroso ma evita di perderti in discussioni filosofiche su casi come $0^0$ o basi negative a meno che non sia strettamente richiesto; prediligi la strada dell'analisi reale standard.
- Assicurati che i passaggi siano logicamente concatenati e che portino alla RISPOSTA FINALE in modo chiaro.

Rispondi SEMPRE esattamente in questo formato, ogni elemento su una riga separata:

TITOLO: [descrizione del tipo di esercizio]

PASSO 1: [titolo breve]
[spiegazione del passo assicurandoti di usare $formula$ per QUALSIASI elemento matematico]

PASSO 2: [titolo breve]
[spiegazione]

... (continua con PASSO 3, PASSO 4, ecc., in base alla difficoltà)

RISPOSTA FINALE: [risposta con LaTeX]

REGOLE IMPORTANTI:
- Usa il numero di passi necessari per rendere chiara la spiegazione (da 2 a 8) in base al livello dello studente e alla difficoltà dell'esercizio.
- SUGGERIMENTI su riga SEPARATA, mai nel mezzo della spiegazione.
- **FONDAMENTALE**: Usa SEMPRE i simboli $...$ per espressioni matematiche brevi, variabili e numeri all'interno delle frasi.
- **CENTRAGGIO E SEPARAZIONE**: Ogni formula importante, passaggio algebrico o risultato significativo DEVE essere isolato dal testo su una riga propria e centrato usando ESCLUSIVAMENTE il blocco $$ ... $$.
- Per passaggi multipli o equazioni complesse, usa SEMPRE questo formato di allineamento:
$$ \begin{aligned}
espressione &= passaggio 1 \\
&= passaggio 2 \\
&= risultato
\end{aligned} $$
- ASSOLUTAMENTE NON usare parentesi quadre o tonde per il LaTeX, come \\[ \\], \\( \\), [ ], o ( ). Usa ESCLUSIVAMENTE $ per le formule inline e $$ per i blocchi separati.
- Dividi il testo in paragrafi molto brevi (max 2-3 righe) separati da una riga vuota.
- NON USARE altri ambienti come \begin{equation} o simili, usa SOLO \begin{aligned} dentro ai $$.
- Lascia i valori simbolici quando possibile, non approssimare numericamente.
- Assicurati che ogni passaggio sia visivamente arioso e mai affollato di testo.`
}

async function callGroq(model: string, messages: any[], maxTokens: number): Promise<string> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
    },
    body: JSON.stringify({ model, max_tokens: maxTokens, messages })
  })
  const data = await res.json()
  if (!data.choices) throw new Error(JSON.stringify(data))
  return data.choices[0].message.content || ''
}

export async function POST(req: NextRequest) {
  const { text, imageBase64, tipo, scuola, classe, materie } = await req.json()

  try {
    const systemPrompt = buildSystemPrompt(scuola, classe, materie)
    let explanationText = ''

    if (tipo === 'chiarimento') {
      // Chiarimento rapido: modello veloce e diretto
      const messages = [
        { role: 'system', content: 'Sei theLemma, un tutor italiano. Rispondi in modo breve e chiaro, max 80 parole, usando LaTeX $formula$ per le formule.' },
        { role: 'user', content: text }
      ]
      explanationText = await callGroq('openai/gpt-oss-120b', messages, 400)

    } else if (imageBase64) {
      // STAGE 1: Llama 4 Scout estrae il testo matematico dall'immagine
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
      const extractedText = await callGroq('meta-llama/llama-4-scout-17b-16e-instruct', extractMessages, 500)

      // STAGE 2: GPT OSS 120B ragiona sul testo estratto e genera la spiegazione completa
      const explainMessages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Spiega questo esercizio: ${extractedText}` }
      ]
      explanationText = await callGroq('openai/gpt-oss-120b', explainMessages, 1500)

    } else {
      // Testo diretto: GPT OSS 120B genera la spiegazione
      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Spiega questo esercizio: ' + text }
      ]
      explanationText = await callGroq('openai/gpt-oss-120b', messages, 1500)
    }

    // Fallback: se il modello usa comunque \[ \] o \( \)
    explanationText = explanationText.replace(/\\\[/g, '$$$$').replace(/\\\]/g, '$$$$')
    explanationText = explanationText.replace(/\\\(/g, '$').replace(/\\\)/g, '$')

    return NextResponse.json({ explanation: explanationText })

  } catch (e: any) {
    return NextResponse.json({ explanation: 'Errore: ' + e.message })
  }
}

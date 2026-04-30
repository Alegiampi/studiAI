import { NextRequest, NextResponse } from 'next/server'

function buildSystemPrompt(scuola?: string, classe?: string, materie?: string[]) {
  const livello = scuola && classe ? `Lo studente frequenta ${classe} di ${scuola}.` : ''
  const materieStr = materie && materie.length > 0 ? `Le sue materie difficili sono: ${materie.join(', ')}.` : ''

  return `Sei StudiAI, un tutor italiano di matematica e fisica per studenti italiani.
${livello} ${materieStr}
Adatta il linguaggio, la complessità e il numero di passi al livello dello studente. Scegli tu il numero di passi ottimali in base alla difficoltà dell'esercizio e alle capacità dello studente.

Rispondi SEMPRE esattamente in questo formato, ogni elemento su una riga separata:

TITOLO: [descrizione del tipo di esercizio]

PASSO 1: [titolo breve]
[spiegazione del passo con LaTeX inline $formula$]

PASSO 2: [titolo breve]
[spiegazione]

... (continua con PASSO 3, PASSO 4, ecc., in base alla difficoltà)

RISPOSTA FINALE: [risposta con LaTeX]

REGOLE IMPORTANTI:
- Usa il numero di passi necessari per rendere chiara la spiegazione (da 2 a 8) in base al livello dello studente e alla difficoltà dell'esercizio.
- SUGGERIMENTI su riga SEPARATA, mai nel mezzo della spiegazione
- Usa LaTeX con $formula$ SOLO per brevi espressioni all'interno del testo
- ASSOLUTAMENTE NON usare parentesi quadre o tonde per il LaTeX, come \\[ \\], \\( \\), [ ], o ( ). Usa ESCLUSIVAMENTE $ per le formule inline e $$ per i blocchi separati.
- **FONDAMENTALE**: Quando devi mostrare passaggi calcolosi e formule (es. equazioni, integrali), separali dal testo e centrali usando ESATTAMENTE:
$$ \begin{aligned}
espressione &= passaggio 1 \\
&= passaggio 2 \\
&= risultato
\end{aligned} $$
- Dividi il testo in brevi paragrafi separati da una riga vuota per rendere la lettura chiara e ordinata
- NON USARE altri ambienti come \begin{equation} o simili, usa SOLO \begin{aligned} dentro ai $$
- Lascia i valori simbolici quando possibile, non approssimare numericamente`
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
    
    let explanationText = data.choices[0].message.content || ''
    // Fallback: se il modello usa comunque \[ \] o \( \)
    explanationText = explanationText.replace(/\\\[/g, '$$$$').replace(/\\\]/g, '$$$$')
    explanationText = explanationText.replace(/\\\(/g, '$').replace(/\\\)/g, '$')

    return NextResponse.json({ explanation: explanationText })

  } catch (e: any) {
    return NextResponse.json({ explanation: 'Errore: ' + e.message })
  }
}

import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { text, imageBase64 } = await req.json()

  const systemPrompt = "Sei StudiAI, un tutor italiano di matematica e fisica per studenti delle superiori. Spiega gli esercizi in modo chiaro, passo per passo, in italiano. Struttura SEMPRE la risposta cosi: 1. Una riga che identifica il tipo di problema. 2. I passaggi numerati (massimo 5), ognuno con titolo breve e spiegazione. 3. La risposta finale preceduta da RISPOSTA FINALE. Usa notazione semplice. Sii incoraggiante ma diretto. Massimo 300 parole."

  const messages: any[] = []

  // Costruzione del messaggio a seconda della presenza dell'immagine
  if (imageBase64) {
    messages.push({
      role: 'user',
      content: [
        { type: 'text', text: text || 'Spiega questo esercizio passo per passo in italiano.' },
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
      ]
    })
  } else {
    messages.push({
      role: 'user',
      content: `Spiega questo esercizio passo per passo in italiano: ${text}`
    })
  }

  // Chiamata all'API di Groq
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Assicurati di avere GROQ_API_KEY nel tuo file .env
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}` 
    },
    body: JSON.stringify({
      // Modello LLaMA 3.2 Vision ospitato su Groq, in grado di leggere immagini
      model: 'llama-3.2-90b-vision-preview', 
      max_tokens: 1000,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ]
    })
  })

  const data = await res.json()
  
  if (!data.choices || data.choices.length === 0) {
    console.error("Errore dall'API di Groq:", data)
    return NextResponse.json({ explanation: "Errore durante la generazione della risposta." }, { status: 500 })
  }

  const reply = data.choices[0].message.content

  return NextResponse.json({ explanation: reply })
}
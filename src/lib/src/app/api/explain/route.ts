import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { text, imageBase64 } = await req.json()

  const systemPrompt = "Sei StudiAI, un tutor italiano di matematica e fisica per studenti delle superiori. Spiega gli esercizi in modo chiaro, passo per passo, in italiano. Struttura SEMPRE la risposta cosi: 1. Una riga che identifica il tipo di problema. 2. I passaggi numerati (massimo 5), ognuno con titolo breve e spiegazione. 3. La risposta finale preceduta da RISPOSTA FINALE. Usa notazione semplice. Sii incoraggiante ma diretto. Massimo 300 parole."

  const messages: any[] = []

  if (imageBase64) {
    messages.push({
      role: 'user',
      content: [
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
        { type: 'text', text: text || 'Spiega questo esercizio passo per passo in italiano.' }
      ]
    })
  } else {
    messages.push({
      role: 'user',
      content: `Spiega questo esercizio passo per passo in italiano: ${text}`
    })
  }

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      max_tokens: 1000,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ]
    })
  })

  const data = await res.json()
  
  if (!data.choices) {
    return NextResponse.json({ explanation: JSON.stringify(data) })
  }

  const reply = data.choices[0].message.content

  return NextResponse.json({ explanation: reply })
}
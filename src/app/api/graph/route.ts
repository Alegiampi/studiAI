import { NextRequest, NextResponse } from 'next/server'

async function callGroq(messages: any[]) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 800,
      temperature: 0.1,
      messages
    })
  })
  return res.json()
}

export async function POST(req: NextRequest) {
  const { esercizio, spiegazione } = await req.json()

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
    { "type": "point", "coords": [1, 1], "color": "#E84393", "label": "Punto (1,1)" }
  ]
}
3. MASSIMO 5-6 elementi in "espressioni". Includi la funzione principale, derivate se utili, e i punti critici (zeri, max/min, flessi).
4. NON DUPLICARE: Se usi exp(x*log(x)) per x^x, NON aggiungere anche x^x. Scegline UNA.
5. ESPRESSIONI ROBUSTE (OBBLIGATORIO):
   - Per potenze con base variabile (es. x^x, x^(1/x), (x+1)^x), usa SEMPRE la forma esponenziale: "exp(x*log(x))" o "exp((1/x)*log(x))".
   - Variabile: 'x'. Logaritmo naturale: 'log(x)'. Esponenziale: 'exp(x)'.
6. COLORI DA USARE TASSATIVAMENTE:
   - Funzione principale f(x): "#FFD600" (Giallo)
   - Derivate (f', f''): "#38BDF8" (Azzurro) o "#818CF8" (Viola chiaro)
   - Punti (flessi, zeri, ecc): "#F43F5E" (Rosso vivo)
   - Asintoti: "#9CA3AF" (Grigio chiaro)
7. DOMINIO E VISTA:
   - "domain": [min, max] è il dominio matematico reale.
   - "boundingBox": [xmin, xmax, ymin, ymax] definisce lo ZOOM INIZIALE. 
   - REGOLE ZOOM: Centra la vista sugli elementi chiave (vertici, zeri vicini). Se un punto (es. intersezione asse y) è troppo lontano (es. y=900 mentre il resto è vicino a 0), NON includerlo nel boundingBox per evitare uno zoom eccessivo che renderebbe il grafico illeggibile. Mantieni lo zoom su un range ragionevole (es. y tra -10 e 50 se possibile).
8. INTERATTIVITÀ:
   - Imposta "interactive": true sulla funzione principale per mostrare tangente e derivata.
9. RIGORE MATEMATICO (CRITICO):
   - Includi asintoti (es. y=0, x=0) SOLO se matematicamente esistenti.
   - REGOLE PER RETTE VERTICALI: Per asintoti o assi verticali (es. x=30), il campo "fn" DEVE essere "x = 30" (includendo x=). Se scrivi solo "30", verrà disegnata una retta orizzontale y=30.
   - Verifica i limiti per x -> 0 e x -> infinito prima di aggiungere linee di supporto. Per x^x, il limite per x->0 è 1, quindi y=0 NON è un asintoto. Non aggiungere asintoti a caso.`;

  const userPrompt = `Genera il JSON per questo grafico.

Esercizio: ${esercizio}
Spiegazione: ${spiegazione}

Rispondi SOLO con il JSON crudo.`;

  const data = await callGroq([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ]);

  if (!data.choices) return NextResponse.json({ error: 'Errore API' });

  try {
    const text = data.choices[0].message.content.trim();
    const clean = text.replace(/\`\`\`json|\`\`\`/g, '').trim();
    const graficoData = JSON.parse(clean);
    return NextResponse.json({ data: graficoData });
  } catch {
    return NextResponse.json({ error: 'JSON non valido' });
  }
}

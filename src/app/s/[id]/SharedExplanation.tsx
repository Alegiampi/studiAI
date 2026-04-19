'use client'

import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'

const MD = ({ children }: { children: string }) => (
  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
    {children}
  </ReactMarkdown>
)

type Passo = { titolo: string; corpo: string }

function parseExplanation(text: string): { titolo: string; passi: Passo[]; finale: string } {
  const lines = text.split('\n')
  let titolo = ''
  const passi: Passo[] = []
  let finale = ''
  let currentPasso: Passo | null = null

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    if (trimmed.startsWith('TITOLO:')) {
      titolo = trimmed.replace('TITOLO:', '').trim()
    } else if (trimmed.match(/^PASSO \d+:/)) {
      if (currentPasso) passi.push(currentPasso)
      currentPasso = { titolo: trimmed.replace(/^PASSO \d+:/, '').trim(), corpo: '' }
    } else if (trimmed.startsWith('SUGGERIMENTI:')) {
      // ignoriamo
    } else if (trimmed.startsWith('RISPOSTA FINALE:')) {
      if (currentPasso) { passi.push(currentPasso); currentPasso = null }
      finale = trimmed.replace('RISPOSTA FINALE:', '').trim()
    } else if (currentPasso) {
      currentPasso.corpo += (currentPasso.corpo ? ' ' : '') + trimmed
    }
  }
  if (currentPasso) passi.push(currentPasso)
  return { titolo, passi, finale }
}

export default function SharedExplanation({ data, id }: { data: any; id: string }) {
  const parsed = parseExplanation(data.explanation)

  return (
    <div style={{ minHeight: '100vh', background: '#1A1A1A', fontFamily: 'system-ui' }}>
      {/* Banner */}
      <div style={{ background: '#FFD600', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#1A1A1A' }}>StudiAI</div>
          <div style={{ fontSize: 11, color: '#333' }}>Spiegazioni AI per studenti italiani</div>
        </div>
        <a href="/" style={{ background: '#1A1A1A', color: '#FFD600', padding: '8px 16px', borderRadius: 20, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
          Prova gratis →
        </a>
      </div>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 20px' }}>
        {data.question && (
          <div style={{ background: '#2A2A2A', border: '1px solid #3A3A3A', borderRadius: 12, padding: '12px 14px', marginBottom: 20, fontSize: 14, color: '#A0A0A0' }}>
            {data.question}
          </div>
        )}

        {parsed.titolo && (
          <div style={{ fontSize: 18, fontWeight: 700, color: '#FFD600', marginBottom: 24, lineHeight: 1.4 }}>
            <MD>{parsed.titolo}</MD>
          </div>
        )}

        {parsed.passi.map((passo, i) => (
          <div key={i} style={{ marginBottom: 16, display: 'flex', gap: 10 }}>
            <div style={{ width: 3, background: '#FFD600', borderRadius: 4, flexShrink: 0, opacity: 0.4 }} />
            <div style={{ flex: 1 }}>
              <div style={{ border: '1px solid #3A3A3A', borderRadius: 12, overflow: 'hidden', background: '#2A2A2A' }}>
                <div style={{ background: '#333', padding: '9px 14px', borderBottom: '1px solid #3A3A3A', fontWeight: 700, fontSize: 13, color: '#E0E0E0', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: '#888', fontWeight: 400 }}>Passo {i + 1}</span>
                  <span style={{ color: '#888' }}>—</span>
                  <MD>{passo.titolo}</MD>
                </div>
                <div style={{ padding: '12px 14px', fontSize: 14, color: '#D0D0D0', lineHeight: 1.8 }}>
                  <MD>{passo.corpo}</MD>
                </div>
              </div>
            </div>
          </div>
        ))}

        {parsed.finale && (
          <div style={{ background: '#2A2A2A', border: '2px solid #FFD600', borderRadius: 12, padding: '14px 18px', marginTop: 8, marginBottom: 32 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#FFD600', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Risposta finale</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#FFD600' }}><MD>{parsed.finale}</MD></div>
          </div>
        )}

        {/* CTA bottom */}
        <div style={{ background: '#2A2A2A', border: '1px solid #3A3A3A', borderRadius: 16, padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#E0E0E0', marginBottom: 8 }}>Vuoi spiegazioni come questa?</div>
          <div style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>5 esercizi gratis al giorno. Nessuna carta richiesta.</div>
          <a href="/" style={{ display: 'inline-block', background: '#FFD600', color: '#1A1A1A', padding: '12px 28px', borderRadius: 12, fontSize: 15, fontWeight: 700, textDecoration: 'none' }}>
            Inizia gratis →
          </a>
        </div>
      </div>
    </div>
  )
}

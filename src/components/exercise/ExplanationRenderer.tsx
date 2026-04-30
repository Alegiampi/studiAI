'use client'

import { parseExplanation } from '@/lib/utils'
import type { Passo } from '@/types'
import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'


const MD = ({ children }: { children: string }) => (
  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
    {children}
  </ReactMarkdown>
)

function ExplanationRenderer({ text, esercizio }: { text: string; esercizio: string }) {
  const parsed = parseExplanation(text)
  const [passi, setPassi] = useState<Passo[]>(parsed.passi)
  const [openInput, setOpenInput] = useState<number | null>(null)
  const [inputs, setInputs] = useState<string[]>(parsed.passi.map(() => ''))

  async function chiedi(i: number, domanda: string) {
    const newPassi = [...passi]
    newPassi[i] = { ...newPassi[i], domanda, loadingRisposta: true, risposta: undefined }
    setPassi(newPassi)
    setOpenInput(null)
    const res = await fetch('/api/explain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo: 'chiarimento', text: 'Esercizio: ' + esercizio + '. Passo "' + passi[i].titolo + '": ' + passi[i].corpo + '. Domanda: ' + domanda })
    })
    const data = await res.json()
    setPassi(prev => { const updated = [...prev]; updated[i] = { ...updated[i], risposta: data.explanation, loadingRisposta: false }; return updated })
    const newInputs = [...inputs]; newInputs[i] = ''; setInputs(newInputs)
  }

  return (
    <div>
      <style>{`
        .katex { color: #F5F5F5 !important; font-weight: 600 !important; }
        .katex-display .katex { color: #F5F5F5 !important; font-weight: 600 !important; }
      `}</style>
      {parsed.titolo && <div style={{ fontSize: 18, fontWeight: 700, color: '#FFD600', marginBottom: 24, lineHeight: 1.4 }}><MD>{parsed.titolo}</MD></div>}
      {passi.map((passo, i) => (
        <div key={i} style={{ marginBottom: 16, display: 'flex', gap: 10 }}>
          <div style={{ width: 3, background: '#FFD600', borderRadius: 4, flexShrink: 0, opacity: 0.4 }} />
          <div style={{ flex: 1 }}>
            <div style={{ border: '1px solid #3A3A3A', borderRadius: 12, overflow: 'hidden', background: '#2A2A2A' }}>
              <div style={{ background: '#333', padding: '9px 14px', borderBottom: '1px solid #3A3A3A', fontWeight: 700, fontSize: 13, color: '#E0E0E0', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ color: '#888', fontWeight: 400 }}>Passo {i + 1}</span>
                <span style={{ color: '#888' }}>—</span>
                <MD>{passo.titolo}</MD>
              </div>
              <div style={{ padding: '12px 14px', fontSize: 14, color: '#D0D0D0', lineHeight: 1.8 }}><MD>{passo.corpo}</MD></div>
            </div>
            {passo.domanda && (
              <div style={{ marginTop: 8, marginLeft: 12, border: '1px solid #3A3A3A', borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ background: '#FFD600', padding: '7px 12px', fontSize: 12, color: '#1A1A1A', fontWeight: 600 }}>{passo.domanda}</div>
                <div style={{ padding: '10px 12px', fontSize: 13, color: '#D0D0D0', lineHeight: 1.7, background: '#2A2A2A' }}>
                  {passo.loadingRisposta ? <span style={{ color: '#888' }}>Sto pensando...</span> : <MD>{passo.risposta || ''}</MD>}
                </div>
              </div>
            )}
            {!passo.loadingRisposta && (
              <div style={{ marginTop: 8, marginLeft: 12 }}>
                {openInput === i ? (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input autoFocus value={inputs[i]} onChange={e => { const n = [...inputs]; n[i] = e.target.value; setInputs(n) }} onKeyDown={e => e.key === 'Enter' && chiedi(i, inputs[i].trim())} placeholder="Cosa non ti è chiaro?" style={{ flex: 1, border: '1px solid #3A3A3A', borderRadius: 20, padding: '7px 14px', fontSize: 13, outline: 'none', background: '#2A2A2A', color: '#E0E0E0' }} />
                    <button onClick={() => chiedi(i, inputs[i].trim())} style={{ width: 34, height: 34, borderRadius: '50%', background: '#FFD600', border: 'none', cursor: 'pointer', color: '#1A1A1A', fontSize: 16, flexShrink: 0, fontWeight: 700 }}>↑</button>
                    <button onClick={() => setOpenInput(null)} style={{ width: 34, height: 34, borderRadius: '50%', background: '#333', border: 'none', cursor: 'pointer', color: '#888', fontSize: 14, flexShrink: 0 }}>✕</button>
                  </div>
                ) : (
                  <button onClick={() => setOpenInput(i)} style={{ background: 'none', border: 'none', fontSize: 12, color: '#FFD600', cursor: 'pointer', padding: '2px 0', fontWeight: 500, opacity: 0.7 }}>+ Chiedimi di più su questo passo</button>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
      {parsed.finale && (
        <div style={{ background: '#2A2A2A', border: '2px solid #FFD600', borderRadius: 12, padding: '14px 18px', marginTop: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#FFD600', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Risposta finale</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#FFD600' }}><MD>{parsed.finale}</MD></div>
        </div>
      )}
    </div>
  )
}

export default ExplanationRenderer

'use client'

import { useState, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'

const DAILY_LIMIT = 5

const MD = ({ children }: { children: string }) => (
  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
    {children}
  </ReactMarkdown>
)

function cleanText(s: string) {
  return s.replace(/\$/g, '').replace(/\\([a-zA-Z]+)/g, '$1')
}

type Passo = {
  titolo: string
  corpo: string
  suggerimenti: string[]
  domanda?: string
  risposta?: string
  loadingRisposta?: boolean
}

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
      currentPasso = { titolo: trimmed.replace(/^PASSO \d+:/, '').trim(), corpo: '', suggerimenti: [] }
    } else if (trimmed.startsWith('SUGGERIMENTI:') && currentPasso) {
      currentPasso.suggerimenti = trimmed.replace('SUGGERIMENTI:', '').split('|').map(s => s.trim()).filter(Boolean)
    } else if (trimmed.startsWith('RISPOSTA FINALE:')) {
      if (currentPasso) { passi.push(currentPasso); currentPasso = null }
      finale = trimmed.replace('RISPOSTA FINALE:', '').trim()
    } else if (currentPasso && !trimmed.startsWith('SUGGERIMENTI:')) {
      currentPasso.corpo += (currentPasso.corpo ? ' ' : '') + trimmed
    }
  }
  if (currentPasso) passi.push(currentPasso)
  return { titolo, passi, finale }
}

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
      body: JSON.stringify({
        tipo: 'chiarimento',
        text: 'Esercizio: ' + esercizio + '. Passo "' + passi[i].titolo + '": ' + passi[i].corpo + '. Domanda: ' + domanda
      })
    })
    const data = await res.json()
    setPassi(prev => {
      const updated = [...prev]
      updated[i] = { ...updated[i], risposta: data.explanation, loadingRisposta: false }
      return updated
    })
    const newInputs = [...inputs]
    newInputs[i] = ''
    setInputs(newInputs)
  }

  return (
    <div>
      {parsed.titolo && (
        <div style={{ fontSize: 17, fontWeight: 700, color: '#E84393', marginBottom: 20, lineHeight: 1.4 }}>
          <MD>{parsed.titolo}</MD>
        </div>
      )}
      {passi.map((passo, i) => (
        <div key={i} style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
          <div style={{ width: 3, background: '#E8E8E8', borderRadius: 4, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ border: '1px solid #E8E8E8', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ background: '#F8F8F8', padding: '9px 14px', borderBottom: '1px solid #E8E8E8', fontWeight: 700, fontSize: 13, color: '#2D3436', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ color: '#A0A0A0', fontWeight: 400 }}>Passo {i + 1}</span>
                <span style={{ color: '#A0A0A0' }}>—</span>
                <MD>{passo.titolo}</MD>
              </div>
              <div style={{ padding: '10px 14px', fontSize: 14, color: '#2D3436', lineHeight: 1.7 }}>
                <MD>{passo.corpo}</MD>
              </div>
            </div>

            {passo.domanda && (
              <div style={{ marginTop: 8, marginLeft: 12, border: '1px solid #F0EEFF', borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ background: '#6C5CE7', padding: '7px 12px', fontSize: 12, color: '#fff', fontWeight: 500 }}>
                  {passo.domanda}
                </div>
                <div style={{ padding: '10px 12px', fontSize: 13, color: '#2D3436', lineHeight: 1.7, background: '#FAFAFE' }}>
                  {passo.loadingRisposta ? (
                    <span style={{ color: '#A0A0A0' }}>Sto pensando...</span>
                  ) : (
                    <MD>{passo.risposta || ''}</MD>
                  )}
                </div>
              </div>
            )}

            {!passo.loadingRisposta && (
              <div style={{ marginTop: 8, marginLeft: 12 }}>
                {passo.suggerimenti.length > 0 && !passo.domanda && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
                    {passo.suggerimenti.map((s, j) => (
                      <button key={j} onClick={() => chiedi(i, s)} style={{ background: '#F0EEFF', border: '1px solid #D0C8FF', borderRadius: 20, padding: '5px 12px', fontSize: 12, color: '#6C5CE7', cursor: 'pointer', fontWeight: 500 }}>
                        {cleanText(s)}
                      </button>
                    ))}
                  </div>
                )}
                {openInput === i ? (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input
                      autoFocus
                      value={inputs[i]}
                      onChange={e => { const n = [...inputs]; n[i] = e.target.value; setInputs(n) }}
                      onKeyDown={e => e.key === 'Enter' && chiedi(i, inputs[i].trim())}
                      placeholder="Cosa non ti è chiaro?"
                      style={{ flex: 1, border: '1px solid #D0C8FF', borderRadius: 20, padding: '7px 14px', fontSize: 13, outline: 'none', background: '#FAFAFE' }}
                    />
                    <button onClick={() => chiedi(i, inputs[i].trim())} style={{ width: 34, height: 34, borderRadius: '50%', background: '#6C5CE7', border: 'none', cursor: 'pointer', color: '#fff', fontSize: 16, flexShrink: 0 }}>↑</button>
                    <button onClick={() => setOpenInput(null)} style={{ width: 34, height: 34, borderRadius: '50%', background: '#F0F0F0', border: 'none', cursor: 'pointer', color: '#636E72', fontSize: 14, flexShrink: 0 }}>✕</button>
                  </div>
                ) : (
                  <button onClick={() => setOpenInput(i)} style={{ background: 'none', border: 'none', fontSize: 12, color: '#A29BFE', cursor: 'pointer', padding: '2px 0', fontWeight: 500 }}>
                    + Chiedimi di più su questo passo
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      ))}

      {parsed.finale && (
        <div style={{ background: '#FFF0F6', border: '2px solid #E84393', borderRadius: 12, padding: '12px 16px', marginTop: 4 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#E84393', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Risposta finale</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#C0306A' }}>
            <MD>{parsed.finale}</MD>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Home() {
  const [screen, setScreen] = useState<'home' | 'explanation' | 'paywall'>('home')
  const [exercise, setExercise] = useState<{ text: string; imageBase64?: string; imagePreview?: string } | null>(null)
  const [usedToday, setUsedToday] = useState(0)
  const [explanation, setExplanation] = useState('')
  const [loading, setLoading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [text, setText] = useState('')
  const [image, setImage] = useState<string | null>(null)
  const [imageBase64, setImageBase64] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const chatRef = useRef<HTMLDivElement>(null)

  const remaining = DAILY_LIMIT - usedToday
  const isLimited = remaining <= 0

  function handleFile(file: File) {
    if (!file || !file.type.startsWith('image/')) return
    setImage(URL.createObjectURL(file))
    const reader = new FileReader()
    reader.onload = (e) => setImageBase64((e.target?.result as string).split(',')[1])
    reader.readAsDataURL(file)
  }

  async function handleSubmit() {
    if (isLimited) { setScreen('paywall'); return }
    if (!text.trim() && !image) return
    setUsedToday(u => u + 1)
    setExercise({ text, imageBase64: imageBase64 || undefined, imagePreview: image || undefined })
    setScreen('explanation')
    setLoading(true)
    setExplanation('')
    const res = await fetch('/api/explain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, imageBase64, tipo: 'esercizio' })
    })
    const data = await res.json()
    setExplanation(data.explanation)
    setLoading(false)
  }

  if (screen === 'paywall') return (
    <div style={{ minHeight: '100vh', background: '#FAFAFA', fontFamily: 'system-ui' }}>
      <div style={{ background: '#6C5CE7', padding: '48px 24px 32px', textAlign: 'center' }}>
        <div style={{ fontSize: 22, fontWeight: 600, color: '#fff', marginBottom: 8 }}>Hai finito gli esercizi</div>
        <div style={{ fontSize: 14, color: '#A29BFE' }}>Sblocca spiegazioni illimitate</div>
      </div>
      <div style={{ padding: 24, maxWidth: 480, margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          {['9.99€/mese', '4.99€/mese (annuale)'].map((p, i) => (
            <div key={i} style={{ flex: 1, border: i === 1 ? '2px solid #6C5CE7' : '1px solid #E8E8E8', borderRadius: 14, padding: 16, textAlign: 'center', background: '#fff' }}>
              <div style={{ fontSize: 18, fontWeight: 600 }}>{p}</div>
              {i === 1 && <div style={{ fontSize: 12, color: '#00B894', marginTop: 4 }}>Risparmi il 50%</div>}
            </div>
          ))}
        </div>
        <button style={{ width: '100%', padding: 14, background: '#6C5CE7', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: 'pointer', marginBottom: 10 }}>Inizia ora</button>
        <button onClick={() => setScreen('home')} style={{ width: '100%', padding: 12, background: 'none', border: 'none', color: '#636E72', cursor: 'pointer' }}>Continua gratis (5 esercizi/giorno)</button>
      </div>
    </div>
  )

  if (screen === 'explanation') return (
    <div style={{ minHeight: '100vh', background: '#FAFAFA', fontFamily: 'system-ui', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px 20px', background: '#fff', borderBottom: '1px solid #E8E8E8', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => { setScreen('home'); setText(''); setImage(null); setImageBase64(null) }} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#636E72' }}>‹</button>
        <div style={{ fontSize: 15, fontWeight: 600 }}>Spiegazione</div>
      </div>
      <div ref={chatRef} style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 40px', maxWidth: 620, margin: '0 auto', width: '100%' }}>
        {exercise?.imagePreview && <img src={exercise.imagePreview} alt="esercizio" style={{ width: '100%', borderRadius: 12, marginBottom: 16 }} />}
        {exercise?.text && <div style={{ background: '#F0EEFF', borderRadius: 12, padding: '12px 14px', marginBottom: 20, fontSize: 14, color: '#4834D4' }}>{exercise.text}</div>}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#636E72' }}>Sto analizzando l&apos;esercizio...</div>
        ) : explanation ? (
          <ExplanationRenderer text={explanation} esercizio={exercise?.text || ''} />
        ) : null}
      </div>
      <div style={{ background: '#fff', borderTop: '1px solid #E8E8E8', padding: '12px 20px 20px', display: 'flex', justifyContent: 'center' }}>
        <button onClick={() => { setScreen('home'); setText(''); setImage(null); setImageBase64(null) }} style={{ height: 42, padding: '0 24px', borderRadius: 24, background: '#F0EEFF', border: 'none', color: '#6C5CE7', fontWeight: 500, cursor: 'pointer', fontSize: 14 }}>+ Nuovo esercizio</button>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAFA', fontFamily: 'system-ui' }}>
      <div style={{ padding: '20px 24px 16px', background: '#fff', borderBottom: '1px solid #E8E8E8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#6C5CE7' }}>StudiAI</div>
          <div style={{ fontSize: 11, color: '#636E72' }}>il tuo tutor di matematica e fisica</div>
        </div>
        <div onClick={() => setScreen('paywall')} style={{ background: '#F0EEFF', color: '#6C5CE7', fontSize: 12, fontWeight: 500, padding: '6px 14px', borderRadius: 20, cursor: 'pointer' }}>
          {isLimited ? '⚡ Sblocca' : `${remaining} rimasti`}
        </div>
      </div>
      <div style={{ padding: '24px 20px', maxWidth: 620, margin: '0 auto' }}>
        <div
          onClick={() => !image && fileRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]) }}
          style={{ border: '2px dashed ' + (dragging ? '#6C5CE7' : '#E8E8E8'), borderRadius: 16, padding: image ? 0 : '32px 16px', textAlign: 'center', background: dragging ? '#F0EEFF' : '#fff', cursor: image ? 'default' : 'pointer', marginBottom: 16, overflow: 'hidden', position: 'relative' }}
        >
          {image ? (
            <>
              <img src={image} alt="esercizio" style={{ width: '100%', maxHeight: 240, objectFit: 'contain' }} />
              <button onClick={e => { e.stopPropagation(); setImage(null); setImageBase64(null) }} style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer' }}>✕</button>
            </>
          ) : (
            <>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📸</div>
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Carica una foto dell&apos;esercizio</div>
              <div style={{ fontSize: 12, color: '#636E72' }}>trascina qui o clicca per scegliere</div>
            </>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files && handleFile(e.target.files[0])} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1, height: 1, background: '#E8E8E8' }} />
          <span style={{ fontSize: 12, color: '#B2BEC3' }}>oppure scrivi</span>
          <div style={{ flex: 1, height: 1, background: '#E8E8E8' }} />
        </div>
        <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Es: Calcola la derivata di f(x) = x^2 sin(x)..." rows={3} style={{ width: '100%', border: '1px solid #E8E8E8', borderRadius: 12, padding: '12px 14px', fontSize: 14, fontFamily: 'system-ui', resize: 'none', outline: 'none', marginBottom: 16 }} />
        <button onClick={handleSubmit} disabled={!text.trim() && !image} style={{ width: '100%', padding: 14, background: (!text.trim() && !image) ? '#E8E8E8' : '#6C5CE7', color: (!text.trim() && !image) ? '#B2BEC3' : '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: (!text.trim() && !image) ? 'default' : 'pointer' }}>
          {isLimited ? '⚡ Sblocca per continuare' : 'Spiega questo esercizio →'}
        </button>
        {!isLimited && (
          <div style={{ marginTop: 16, background: '#fff', border: '1px solid #E8E8E8', borderRadius: 12, padding: '10px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: '#636E72' }}>Esercizi oggi</span>
              <span style={{ fontSize: 12, fontWeight: 500, color: '#6C5CE7' }}>{usedToday}/{DAILY_LIMIT}</span>
            </div>
            <div style={{ height: 4, background: '#E8E8E8', borderRadius: 4 }}>
              <div style={{ height: '100%', width: (usedToday / DAILY_LIMIT * 100) + '%', background: '#6C5CE7', borderRadius: 4 }} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

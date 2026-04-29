'use client'

import { useRef } from 'react'
import AuthModal from '@/components/AuthModal'

const DAILY_LIMIT = 5

interface HomeScreenProps {
  user: any
  showAuth: boolean
  setShowAuth: (v: boolean) => void
  supabase: any
  setScreen: (s: 'home' | 'explanation' | 'paywall' | 'storico' | 'profilo') => void
  logout: () => void
  isLimited: boolean
  remaining: number
  image: string | null
  setImage: (v: string | null) => void
  setImageBase64: (v: string | null) => void
  dragging: boolean
  setDragging: (v: boolean) => void
  handleFile: (file: File) => void
  text: string
  setText: (v: string) => void
  handleSubmit: () => void
  usedToday: number
}

export default function HomeScreen({
  user, showAuth, setShowAuth, supabase, setScreen, logout,
  isLimited, remaining, image, setImage, setImageBase64,
  dragging, setDragging, handleFile, text, setText, handleSubmit, usedToday,
}: HomeScreenProps) {
  const fileRef = useRef<HTMLInputElement>(null)

  return (
    <div style={{ minHeight: '100vh', background: '#1A1A1A', fontFamily: 'system-ui' }}>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} supabase={supabase} />}
      <div style={{ padding: '18px 24px', background: '#222', borderBottom: '1px solid #3A3A3A', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#FFD600', letterSpacing: '-0.5px' }}>StudiAI</div>
          <div style={{ fontSize: 11, color: '#666' }}>il tuo tutor di matematica e fisica</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {user ? (
            <>
              <div style={{ fontSize: 12, color: '#888' }}>{user.email?.split('@')[0]}</div>
              <button onClick={() => setScreen('storico')} style={{ background: 'none', border: '1px solid #3A3A3A', borderRadius: 20, padding: '5px 12px', fontSize: 12, color: '#FFD600', cursor: 'pointer' }}>Storico</button>
              <button onClick={() => setScreen('profilo')} style={{ background: 'none', border: '1px solid #3A3A3A', borderRadius: 20, padding: '5px 12px', fontSize: 12, color: '#888', cursor: 'pointer' }}>Profilo</button>
              <button onClick={logout} style={{ background: 'none', border: '1px solid #3A3A3A', borderRadius: 20, padding: '5px 12px', fontSize: 12, color: '#888', cursor: 'pointer' }}>Esci</button>
            </>
          ) : (
            <button onClick={() => setShowAuth(true)} style={{ background: '#2A2A2A', border: '1px solid #3A3A3A', borderRadius: 20, padding: '6px 14px', fontSize: 12, color: '#E0E0E0', cursor: 'pointer', fontWeight: 500 }}>Accedi</button>
          )}
          <div onClick={() => setScreen('paywall')} style={{ background: '#FFD600', color: '#1A1A1A', fontSize: 12, fontWeight: 700, padding: '6px 14px', borderRadius: 20, cursor: 'pointer' }}>
            {isLimited ? '⚡ Sblocca' : `${remaining} rimasti`}
          </div>
        </div>
      </div>
      <div style={{ padding: '32px 20px', maxWidth: 640, margin: '0 auto' }}>
        <div
          onClick={() => !image && fileRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]) }}
          style={{ border: '2px dashed ' + (dragging ? '#FFD600' : '#3A3A3A'), borderRadius: 16, padding: image ? 0 : '36px 16px', textAlign: 'center', background: dragging ? '#2A2A1A' : '#222', cursor: image ? 'default' : 'pointer', marginBottom: 16, overflow: 'hidden', position: 'relative', transition: 'all 0.2s' }}
        >
          {image ? (
            <>
              <img src={image} alt="esercizio" style={{ width: '100%', maxHeight: 240, objectFit: 'contain' }} />
              <button onClick={e => { e.stopPropagation(); setImage(null); setImageBase64(null) }} style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer' }}>✕</button>
            </>
          ) : (
            <>
              <div style={{ fontSize: 36, marginBottom: 10 }}>📸</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#E0E0E0', marginBottom: 4 }}>Carica una foto dell&apos;esercizio</div>
              <div style={{ fontSize: 12, color: '#666' }}>trascina qui o clicca per scegliere</div>
            </>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files && handleFile(e.target.files[0])} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1, height: 1, background: '#3A3A3A' }} />
          <span style={{ fontSize: 12, color: '#555' }}>oppure scrivi</span>
          <div style={{ flex: 1, height: 1, background: '#3A3A3A' }} />
        </div>
        <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Es: Calcola la derivata di f(x) = x² · sin(x)..." rows={3} style={{ width: '100%', border: '1px solid #3A3A3A', borderRadius: 12, padding: '12px 14px', fontSize: 14, fontFamily: 'system-ui', resize: 'none', outline: 'none', marginBottom: 16, background: '#222', color: '#E0E0E0' }} />
        <button onClick={handleSubmit} disabled={!text.trim() && !image} style={{ width: '100%', padding: 15, background: (!text.trim() && !image) ? '#2A2A2A' : '#FFD600', color: (!text.trim() && !image) ? '#555' : '#1A1A1A', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: (!text.trim() && !image) ? 'default' : 'pointer', transition: 'all 0.2s' }}>
          {isLimited ? '⚡ Sblocca per continuare' : 'Spiega questo esercizio →'}
        </button>
        {!isLimited && (
          <div style={{ marginTop: 16, background: '#222', border: '1px solid #3A3A3A', borderRadius: 12, padding: '10px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: '#666' }}>Esercizi oggi</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#FFD600' }}>{usedToday}/{DAILY_LIMIT}</span>
            </div>
            <div style={{ height: 4, background: '#3A3A3A', borderRadius: 4 }}>
              <div style={{ height: '100%', width: (usedToday / DAILY_LIMIT * 100) + '%', background: '#FFD600', borderRadius: 4, transition: 'width 0.4s' }} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
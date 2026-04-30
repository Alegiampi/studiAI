'use client'

import { useRef, useState, useEffect } from 'react'
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

function getUserDisplayName(user: any): string {
  const meta = user?.user_metadata
  if (meta?.full_name) return meta.full_name.split(' ')[0]
  if (meta?.name) return meta.name.split(' ')[0]
  if (meta?.preferred_username) return meta.preferred_username
  return user?.email?.split('@')[0] ?? 'studente'
}

export default function HomeScreen({
  user, showAuth, setShowAuth, supabase, setScreen, logout,
  isLimited, remaining, image, setImage, setImageBase64,
  dragging, setDragging, handleFile, text, setText, handleSubmit, usedToday,
}: HomeScreenProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  const displayName = getUserDisplayName(user)

  // Blocca scroll body quando menu aperto
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  return (
    <div style={{ minHeight: '100vh', background: '#1A1A1A', fontFamily: 'system-ui' }}>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} supabase={supabase} />}

      {/* OVERLAY scuro quando menu aperto */}
      {menuOpen && (
        <div
          onClick={() => setMenuOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
            zIndex: 300, backdropFilter: 'blur(2px)',
          }}
        />
      )}

      {/* SIDEBAR */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 260,
        background: '#222', borderLeft: '1px solid #3A3A3A',
        zIndex: 400, display: 'flex', flexDirection: 'column',
        transform: menuOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1)',
        boxShadow: menuOpen ? '-8px 0 32px rgba(0,0,0,0.4)' : 'none',
      }}>
        {/* Sidebar header con avatar */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #3A3A3A', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#FFD600', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#1A1A1A', flexShrink: 0 }}>
                {displayName[0].toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#E0E0E0' }}>Ciao, {displayName}!</div>
                <div style={{ fontSize: 11, color: '#666', marginTop: 1 }}>{user.email}</div>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 16, fontWeight: 700, color: '#FFD600' }}>StudiAI</div>
          )}
          <button
            onClick={() => setMenuOpen(false)}
            style={{ background: 'none', border: 'none', color: '#555', fontSize: 20, cursor: 'pointer', lineHeight: 1, padding: 4, flexShrink: 0 }}
          >✕</button>
        </div>

        {/* Voci menu */}
        <div style={{ flex: 1, padding: '8px 0' }}>
          {user ? (
            <>
              {[
                { icon: '📚', label: 'I miei esercizi', action: () => { setScreen('storico'); setMenuOpen(false) } },
                { icon: '👤', label: 'Profilo', action: () => { setScreen('profilo'); setMenuOpen(false) } },
              ].map((item, i) => (
                <button
                  key={i}
                  onClick={item.action}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '13px 20px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, color: '#D0D0D0', textAlign: 'left' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#2A2A2A')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
                  <span style={{ fontSize: 18 }}>{item.icon}</span>
                  {item.label}
                </button>
              ))}

              {/* Card Premium */}
              <div style={{ margin: '12px 16px', background: '#2A2A1A', border: '1px solid #FFD60033', borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#FFD600', marginBottom: 4 }}>⚡ Passa a Premium</div>
                <div style={{ fontSize: 12, color: '#888', marginBottom: 10, lineHeight: 1.5 }}>Esercizi illimitati, grafici interattivi e molto altro.</div>
                <button
                  onClick={() => { setScreen('paywall'); setMenuOpen(false) }}
                  style={{ width: '100%', padding: '8px 0', background: '#FFD600', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, color: '#1A1A1A', cursor: 'pointer' }}
                >
                  Scopri i piani →
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={() => { setShowAuth(true); setMenuOpen(false) }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '13px 20px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, color: '#FFD600', textAlign: 'left', fontWeight: 600 }}
            >
              <span style={{ fontSize: 18 }}>🔑</span> Accedi o Registrati
            </button>
          )}
        </div>

        {/* Footer: Esci */}
        {user && (
          <div style={{ borderTop: '1px solid #3A3A3A', padding: '8px 0' }}>
            <button
              onClick={() => { logout(); setMenuOpen(false) }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#666', textAlign: 'left' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#2A2A2A')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              <span style={{ fontSize: 16 }}>🚪</span> Esci
            </button>
          </div>
        )}
      </div>

      {/* HEADER */}
      <div style={{ padding: '18px 24px', background: '#222', borderBottom: '1px solid #3A3A3A', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#FFD600', letterSpacing: '-0.5px' }}>StudiAI</div>
          <div style={{ fontSize: 11, color: '#666' }}>il tuo tutor di matematica e fisica</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Badge esercizi rimasti */}
          <div
            onClick={() => setScreen('paywall')}
            style={{ background: isLimited ? '#FFD600' : '#2A2A2A', border: isLimited ? 'none' : '1px solid #3A3A3A', color: isLimited ? '#1A1A1A' : '#888', fontSize: 12, fontWeight: 600, padding: '6px 12px', borderRadius: 20, cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            {isLimited ? '⚡ Sblocca' : `${remaining} rimasti`}
          </div>

          {/* Hamburger ☰ */}
          <button
            onClick={() => setMenuOpen(o => !o)}
            style={{ background: '#2A2A2A', border: '1px solid #3A3A3A', borderRadius: 10, width: 38, height: 38, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5, flexShrink: 0 }}
            aria-label="Apri menu"
          >
            <div style={{ width: 16, height: 2, background: '#E0E0E0', borderRadius: 2 }} />
            <div style={{ width: 16, height: 2, background: '#E0E0E0', borderRadius: 2 }} />
            <div style={{ width: 16, height: 2, background: '#E0E0E0', borderRadius: 2 }} />
          </button>
        </div>
      </div>

      {/* BODY */}
      <div style={{ padding: '32px 20px', maxWidth: 640, margin: '0 auto' }}>

        {/* Saluto */}
        {user && (
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#E0E0E0', letterSpacing: '-0.5px' }}>
              Ciao, <span style={{ color: '#FFD600' }}>{displayName}</span>! 👋
            </div>
            <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>Cosa studiamo oggi?</div>
          </div>
        )}

        {/* Upload box */}
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

        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Es: Calcola la derivata di f(x) = x² · sin(x)..."
          rows={3}
          style={{ width: '100%', border: '1px solid #3A3A3A', borderRadius: 12, padding: '12px 14px', fontSize: 14, fontFamily: 'system-ui', resize: 'none', outline: 'none', marginBottom: 16, background: '#222', color: '#E0E0E0' }}
        />

        <button
          onClick={handleSubmit}
          disabled={!text.trim() && !image}
          style={{ width: '100%', padding: 15, background: (!text.trim() && !image) ? '#2A2A2A' : '#FFD600', color: (!text.trim() && !image) ? '#555' : '#1A1A1A', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: (!text.trim() && !image) ? 'default' : 'pointer', transition: 'all 0.2s' }}
        >
          {isLimited ? '⚡ Sblocca per continuare' : 'Spiega questo esercizio →'}
        </button>

        {/* Progress bar esercizi */}
        {!isLimited && (
          <div style={{ marginTop: 16, background: '#222', border: '1px solid #3A3A3A', borderRadius: 12, padding: '10px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: '#666' }}>Esercizi oggi</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#FFD600' }}>{usedToday}/{DAILY_LIMIT}</span>
            </div>
            <div style={{ height: 4, background: '#3A3A3A', borderRadius: 4 }}>
              <div style={{ height: '100%', width: (Math.min(usedToday, DAILY_LIMIT) / DAILY_LIMIT * 100) + '%', background: '#FFD600', borderRadius: 4, transition: 'width 0.4s' }} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

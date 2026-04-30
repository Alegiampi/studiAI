'use client'

import { useRef, useState, useEffect } from 'react'
import AuthModal from '@/components/AuthModal'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, BookOpen, User, LogOut, Camera, Crown, Sparkles, Zap } from 'lucide-react'

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
  isPremium: boolean
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
  isPremium,
}: HomeScreenProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  const displayName = getUserDisplayName(user)

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  return (
    <div className="min-h-screen relative overflow-hidden">
      <AnimatePresence>
        {showAuth && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
          >
            <AuthModal onClose={() => setShowAuth(false)} supabase={supabase} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setMenuOpen(false)}
            className="fixed inset-0 bg-black/50 z-[300] backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* SIDEBAR */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-[280px] bg-surface border-l border-surface-border z-[400] flex flex-col shadow-2xl"
          >
            <div className="p-5 border-b border-surface-border flex justify-between items-center bg-surface-hover/30">
              {user ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-background font-extrabold text-lg shadow-lg shadow-primary/20">
                    {displayName[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="text-[15px] font-bold text-foreground">Ciao, {displayName}!</div>
                    <div className="text-xs text-foreground-subtle mt-0.5 truncate max-w-[150px]">{user.email}</div>
                  </div>
                </div>
              ) : (
                <div className="text-lg font-bold text-primary flex items-center gap-2">
                  <Sparkles size={20} /> StudiAI
                </div>
              )}
              <button onClick={() => setMenuOpen(false)} className="text-foreground-muted hover:text-foreground transition-colors p-1 rounded-md hover:bg-surface-active">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 py-4 overflow-y-auto">
              {user ? (
                <div className="space-y-1 px-3">
                  {[
                    { icon: <BookOpen size={20} />, label: 'I miei esercizi', action: () => { setScreen('storico'); setMenuOpen(false) } },
                    { icon: <User size={20} />, label: 'Profilo', action: () => { setScreen('profilo'); setMenuOpen(false) } },
                  ].map((item, i) => (
                    <button
                      key={i}
                      onClick={item.action}
                      className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-colors hover:bg-surface-hover text-foreground-muted hover:text-foreground font-medium text-[15px]"
                    >
                      <span className="text-primary">{item.icon}</span>
                      {item.label}
                    </button>
                  ))}

                  {!isPremium && (
                    <motion.div 
                      whileHover={{ scale: 1.02 }}
                      className="mt-6 mx-2 bg-gradient-to-br from-surface-active to-surface border border-primary/20 rounded-2xl p-4 shadow-lg"
                    >
                      <div className="text-[14px] font-bold text-primary mb-1 flex items-center gap-2">
                        <Zap size={16} fill="currentColor" /> Passa a Premium
                      </div>
                      <div className="text-xs text-foreground-muted mb-3 leading-relaxed">Esercizi illimitati, grafici interattivi e molto altro.</div>
                      <button
                        onClick={() => { setScreen('paywall'); setMenuOpen(false) }}
                        className="w-full py-2.5 bg-primary hover:bg-primary-hover text-background border-none rounded-xl text-sm font-bold cursor-pointer transition-colors"
                      >
                        Scopri i piani →
                      </button>
                    </motion.div>
                  )}
                </div>
              ) : (
                <div className="px-3">
                  <button
                    onClick={() => { setShowAuth(true); setMenuOpen(false) }}
                    className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary font-semibold transition-colors"
                  >
                    <User size={20} /> Accedi o Registrati
                  </button>
                </div>
              )}
            </div>

            {user && (
              <div className="border-t border-surface-border p-3">
                <button
                  onClick={() => { logout(); setMenuOpen(false) }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors hover:bg-danger/10 text-foreground-subtle hover:text-danger font-medium text-[14px]"
                >
                  <LogOut size={20} /> Esci
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-xl border-b border-surface-border px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex flex-col">
          <div className="text-[22px] font-extrabold text-primary tracking-tight flex items-center gap-1.5">
            StudiAI <Sparkles size={18} className="text-primary/70" />
          </div>
          <div className="text-[11px] font-medium text-foreground-subtle tracking-wide uppercase">il tuo tutor smart</div>
        </div>

        <div className="flex items-center gap-3">
          {isPremium ? (
            <div className="flex items-center gap-1.5 bg-primary/10 border border-primary/30 rounded-full px-3 py-1.5">
              <Crown size={14} className="text-primary" fill="currentColor" />
              <span className="text-xs font-bold text-primary">Premium</span>
            </div>
          ) : (
            <motion.div
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => setScreen('paywall')}
              className={`text-xs font-bold px-3.5 py-1.5 rounded-full cursor-pointer whitespace-nowrap shadow-sm transition-colors ${
                isLimited ? 'bg-primary text-background' : 'bg-surface-hover border border-surface-border text-foreground-muted hover:text-foreground'
              }`}
            >
              {isLimited ? '⚡ Sblocca' : `${remaining} rimasti`}
            </motion.div>
          )}

          <button
            onClick={() => setMenuOpen(true)}
            className="bg-surface-hover border border-surface-border rounded-xl w-10 h-10 flex items-center justify-center text-foreground-muted hover:text-foreground transition-all hover:border-primary/50"
            aria-label="Apri menu"
          >
            <Menu size={20} />
          </button>
        </div>
      </header>

      {/* BODY */}
      <main className="px-5 py-8 max-w-[640px] mx-auto w-full">
        {user && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
              Ciao, <span className="text-primary">{displayName}</span>! 👋
            </h1>
            <p className="text-sm font-medium text-foreground-subtle mt-1.5">Cosa studiamo di bello oggi?</p>
          </motion.div>
        )}

        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          onClick={() => !image && fileRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]) }}
          className={`relative overflow-hidden rounded-[24px] border-2 transition-all duration-300 ${
            dragging ? 'border-primary bg-primary/5 scale-[1.02]' : 'border-surface-border bg-surface hover:border-primary/40'
          } ${image ? 'p-0 border-transparent' : 'p-10 text-center cursor-pointer group'}`}
        >
          {image ? (
            <>
              <img src={image ?? undefined} alt="esercizio" className="w-full max-h-[280px] object-contain bg-black/20 backdrop-blur-md" />
              <button 
                onClick={e => { e.stopPropagation(); setImage(null); setImageBase64(null) }} 
                className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white border-none rounded-full w-8 h-8 flex items-center justify-center cursor-pointer hover:bg-black/80 transition-colors"
              >
                <X size={16} />
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-surface-active flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 group-hover:bg-primary/20 group-hover:text-primary text-foreground-muted">
                <Camera size={28} />
              </div>
              <div className="text-[15px] font-bold text-foreground mb-1">Carica una foto dell'esercizio</div>
              <div className="text-[13px] text-foreground-subtle">Trascina qui o clicca per esplorare</div>
            </div>
          )}
        </motion.div>

        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files && handleFile(e.target.files[0])} />

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="flex items-center gap-4 my-6">
          <div className="flex-1 h-[1px] bg-surface-border" />
          <span className="text-xs font-semibold text-foreground-subtle uppercase tracking-wider">oppure scrivi</span>
          <div className="flex-1 h-[1px] bg-surface-border" />
        </motion.div>

        <motion.textarea
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Es: Calcola la derivata di f(x) = x² · sin(x)..."
          rows={3}
          className="w-full border border-surface-border rounded-[20px] p-5 text-[15px] resize-none outline-none mb-6 bg-surface text-foreground placeholder:text-foreground-muted focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm"
        />

        <motion.button
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          whileHover={(!text.trim() && !image) ? {} : { scale: 1.02 }}
          whileTap={(!text.trim() && !image) ? {} : { scale: 0.98 }}
          onClick={handleSubmit}
          disabled={!text.trim() && !image}
          className={`w-full p-4 rounded-[16px] text-[16px] font-extrabold flex justify-center items-center gap-2 transition-all shadow-lg ${
            (!text.trim() && !image) 
            ? 'bg-surface-active text-foreground-subtle shadow-none cursor-default' 
            : 'bg-primary text-background hover:bg-primary-hover hover:shadow-primary/25 cursor-pointer'
          }`}
        >
          {isLimited ? (
            <><Zap size={20} fill="currentColor" /> Sblocca per continuare</>
          ) : (
            <>Spiega questo esercizio <Sparkles size={18} /></>
          )}
        </motion.button>

        {!isLimited && !isPremium && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-6 bg-surface border border-surface-border rounded-2xl p-4 shadow-sm">
            <div className="flex justify-between items-center mb-2.5">
              <span className="text-xs font-medium text-foreground-subtle">Esercizi usati oggi</span>
              <span className="text-xs font-extrabold text-primary bg-primary/10 px-2 py-0.5 rounded-md">{usedToday} / {DAILY_LIMIT}</span>
            </div>
            <div className="h-2 bg-surface-active rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(usedToday, DAILY_LIMIT) / DAILY_LIMIT * 100}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full bg-primary rounded-full relative"
              >
                <div className="absolute inset-0 bg-white/20" />
              </motion.div>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  )
}
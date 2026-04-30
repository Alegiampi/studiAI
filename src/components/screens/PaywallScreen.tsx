'use client'

import { motion } from 'framer-motion'
import { CheckCircle2, Crown, Sparkles } from 'lucide-react'

export default function PaywallScreen({ 
  usedToday, 
  DAILY_LIMIT, 
  handleCheckout, 
  onBack 
}: { 
  usedToday: number; 
  DAILY_LIMIT: number; 
  handleCheckout: (priceId: string) => void; 
  onBack: () => void;
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

      <header className="pt-16 pb-12 px-6 text-center relative z-10">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <Crown size={32} className="text-primary" fill="currentColor" />
        </motion.div>
        <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="text-4xl font-extrabold text-foreground mb-3 tracking-tight">
          {usedToday >= DAILY_LIMIT ? 'Hai finito gli esercizi ⚡' : 'Passa a Premium 👑'}
        </motion.h1>
        <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="text-lg text-foreground-subtle font-medium max-w-sm mx-auto leading-relaxed">
          Sblocca spiegazioni illimitate, grafici e impara senza limiti.
        </motion.p>
      </header>

      <main className="flex-1 px-6 pb-12 max-w-[540px] mx-auto w-full relative z-10">
        <motion.div 
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 mb-8"
        >
          <motion.div 
            whileHover={{ y: -4 }}
            onClick={() => handleCheckout(process.env.NEXT_PUBLIC_STRIPE_PRICE_MENSILE!)} 
            className="flex-1 border border-surface-border rounded-3xl p-6 text-center bg-surface cursor-pointer hover:border-primary/50 transition-all shadow-md group"
          >
            <div className="text-sm font-bold text-foreground-muted uppercase tracking-widest mb-3 group-hover:text-foreground transition-colors">Mensile</div>
            <div className="text-4xl font-extrabold text-foreground mb-1">3.99€</div>
            <div className="text-sm font-medium text-foreground-subtle">al mese</div>
          </motion.div>

          <motion.div 
            whileHover={{ y: -4 }}
            onClick={() => handleCheckout(process.env.NEXT_PUBLIC_STRIPE_PRICE_ANNUALE!)} 
            className="flex-1 border-2 border-primary rounded-3xl p-6 text-center bg-surface cursor-pointer shadow-[0_8px_30px_rgba(255,214,0,0.15)] relative group mt-3 sm:mt-0"
          >
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50 rounded-t-3xl" />
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-primary text-background text-[11px] font-extrabold px-3 py-1 rounded-full whitespace-nowrap shadow-sm flex items-center gap-1 z-10">
              <Sparkles size={12} fill="currentColor" /> PIÙ CONVENIENTE
            </div>
            
            <div className="text-sm font-bold text-primary uppercase tracking-widest mb-3 mt-3">Annuale</div>
            <div className="text-4xl font-extrabold text-foreground mb-1">29.99€</div>
            <div className="text-sm font-medium text-foreground-subtle mb-3">= 2.50€ / mese</div>
            
            <div className="inline-flex items-center gap-1.5 bg-success/10 text-success text-[12px] font-bold px-2.5 py-1 rounded-md">
              Risparmi il 37%
            </div>
          </motion.div>
        </motion.div>

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="bg-surface/50 border border-surface-border rounded-3xl p-6 mb-8 backdrop-blur-sm">
          <div className="space-y-4">
            {['Esercizi illimitati ogni giorno', 'Grafici interattivi con JSXGraph', 'Foto degli esercizi con AI vision', 'Storico completo e organizzato', 'Spiegazioni calibrate sul tuo livello'].map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <CheckCircle2 size={20} className="text-primary shrink-0" />
                <span className="text-[15px] font-medium text-foreground">{f}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="flex flex-col items-center gap-4">
          <button 
            onClick={onBack} 
            className="w-full sm:w-auto px-8 py-3.5 bg-transparent border border-surface-border rounded-2xl text-foreground font-bold cursor-pointer hover:bg-surface-hover transition-colors"
          >
            Continua gratis ({DAILY_LIMIT} esercizi/giorno)
          </button>
          
          <div className="flex items-center gap-4 text-[12px] font-medium text-foreground-subtle">
            <span>Disdici quando vuoi</span>
            <span className="w-1 h-1 rounded-full bg-surface-border" />
            <span>Pagamento sicuro via Stripe</span>
          </div>
        </motion.div>
      </main>
    </div>
  )
}

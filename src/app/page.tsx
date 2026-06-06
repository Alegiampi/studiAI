'use client'

import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import AuthModal from '@/components/AuthModal'
import { createClient } from '@/lib/supabase'

export default function WelcomePage() {
  const supabase = createClient()

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden font-outfit">
      {/* Sfondo dinamico animato */}
      <motion.div 
        animate={{ 
          x: [0, 30, -20, 0], 
          y: [0, -40, 20, 0],
          scale: [1, 1.1, 0.9, 1]
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-primary/10 blur-[120px] rounded-full pointer-events-none" 
      />
      <motion.div 
        animate={{ 
          x: [0, -40, 30, 0], 
          y: [0, 30, -30, 0],
          scale: [1, 0.9, 1.1, 1]
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/5 blur-[100px] rounded-full pointer-events-none" 
      />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="w-full max-w-[400px] text-center z-10"
      >
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="bg-primary/10 p-2 rounded-2xl">
            <Sparkles size={28} className="text-primary" />
          </div>
          <h1 className="text-[44px] font-extrabold tracking-tight flex items-baseline">
            <span className="font-light text-foreground/60">the</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-foreground to-foreground-muted">Lemma</span>
          </h1>
        </div>
        <p className="text-[16px] text-foreground-subtle mb-10 font-medium">
          Il tuo tutor intelligente 24/7
        </p>
        
        <AuthModal supabase={supabase} isEmbedded={true} />
      </motion.div>
    </div>
  )
}

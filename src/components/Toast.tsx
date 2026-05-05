'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, AlertCircle, CheckCircle2, Info, Star, Link as LinkIcon } from 'lucide-react'
import type { Toast } from '@/types'

export default function ToastContainer({ toasts, removeToast }: {
  toasts: Toast[]
  removeToast: (id: number) => void
}) {
  return (
    <div className="fixed top-6 inset-x-0 z-[999] flex flex-col items-center gap-3 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map(t => {
          const isFavorite = t.message.toLowerCase().includes('preferiti')
          const isLink = t.message.toLowerCase().includes('copiato')
          
          let colorStyles = 'bg-primary/10 border-primary/30 text-primary'
          let progressColor = 'bg-primary'
          
          if (t.type === 'error') {
            colorStyles = 'bg-red-500/15 border-red-500/40 text-red-400'
            progressColor = 'bg-red-500'
          } else if (isFavorite) {
            colorStyles = 'bg-amber-400/15 border-amber-400/40 text-amber-400'
            progressColor = 'bg-amber-400'
          } else if (isLink) {
            colorStyles = 'bg-blue-400/15 border-blue-400/40 text-blue-400'
            progressColor = 'bg-blue-400'
          } else if (t.type === 'success') {
            colorStyles = 'bg-emerald-400/15 border-emerald-400/40 text-emerald-400'
            progressColor = 'bg-emerald-400'
          }

          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: -40, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9, transition: { duration: 0.2 } }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className={`pointer-events-auto flex items-center gap-3 px-6 py-3 rounded-full shadow-[0_15px_40px_rgba(0,0,0,0.5)] border backdrop-blur-2xl relative overflow-hidden min-w-[240px] max-w-[90vw] ${colorStyles}`}
            >
              <div className="flex-shrink-0">
                {isFavorite ? (
                  <Star size={18} fill="currentColor" />
                ) : isLink ? (
                  <LinkIcon size={18} />
                ) : t.type === 'error' ? (
                  <AlertCircle size={18} />
                ) : t.type === 'success' ? (
                  <CheckCircle2 size={18} />
                ) : (
                  <Info size={18} />
                )}
              </div>
              
              <div className="text-[14px] font-black tracking-tight whitespace-nowrap">
                {t.message}
              </div>

              <button
                onClick={() => removeToast(t.id)}
                className="ml-auto p-1 -mr-2 rounded-full hover:bg-white/10 transition-colors text-white/20 hover:text-white"
              >
                <X size={14} />
              </button>

              {/* Progress bar sottile */}
              <div className="absolute bottom-0 left-0 h-[2.5px] w-full bg-white/5">
                <motion.div
                  initial={{ width: '100%' }}
                  animate={{ width: 0 }}
                  transition={{ duration: 4, ease: 'linear' }}
                  className={`h-full ${progressColor}`}
                />
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

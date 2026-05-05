'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, AlertCircle, CheckCircle2, Info } from 'lucide-react'
import type { Toast } from '@/hooks/useToast'

export default function ToastContainer({ toasts, removeToast }: {
  toasts: Toast[]
  removeToast: (id: number) => void
}) {
  return (
    <div className="fixed top-6 right-6 z-[999] flex flex-col gap-3 w-full max-w-[380px] pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map(t => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95, transition: { duration: 0.2 } }}
            className={`pointer-events-auto flex items-stretch gap-0 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.3)] border backdrop-blur-xl overflow-hidden relative group ${
              t.type === 'error'
                ? 'bg-red-500/10 border-red-500/20 text-red-400'
                : t.type === 'success'
                ? 'bg-green-500/10 border-green-500/20 text-green-400'
                : 'bg-primary/10 border-primary/20 text-primary'
            }`}
          >
            <div className="p-4 flex items-center gap-3 flex-1">
              <div className="flex-shrink-0">
                {t.type === 'error' ? <AlertCircle size={20} /> : t.type === 'success' ? <CheckCircle2 size={20} /> : <Info size={20} />}
              </div>
              <div className="flex-1 text-[14px] font-bold tracking-tight">
                {t.message}
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="p-1 rounded-lg hover:bg-white/10 transition-colors text-foreground-subtle hover:text-foreground"
              >
                <X size={16} />
              </button>
            </div>

            {/* Progress bar animata */}
            <div className="absolute bottom-0 left-0 h-[3px] w-full bg-black/10">
              <motion.div
                initial={{ width: '100%' }}
                animate={{ width: 0 }}
                transition={{ duration: 4, ease: 'linear' }}
                className={`h-full ${
                  t.type === 'error' ? 'bg-red-500' : t.type === 'success' ? 'bg-green-500' : 'bg-primary'
                }`}
              />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

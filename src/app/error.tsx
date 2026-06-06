'use client'

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-16 h-16 bg-danger/10 rounded-full flex items-center justify-center mb-6">
        <AlertTriangle size={32} className="text-danger" />
      </div>
      <h1 className="text-2xl font-extrabold text-foreground mb-3">Qualcosa è andato storto</h1>
      <p className="text-foreground-subtle text-center mb-8 max-w-md leading-relaxed">
        Si è verificato un errore imprevisto. Riprova o torna alla home.
      </p>
      <button
        onClick={() => unstable_retry()}
        className="bg-primary text-background font-bold px-6 py-3 rounded-xl hover:bg-primary-hover transition-all active:scale-95 cursor-pointer"
      >
        Riprova
      </button>
    </div>
  )
}

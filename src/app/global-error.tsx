'use client'

import { useEffect } from 'react'
import { Outfit } from 'next/font/google'
import { AlertTriangle } from 'lucide-react'
import './globals.css'

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
})

export default function GlobalError({
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
    <html lang="it" className={`${outfit.variable} h-full antialiased dark`}>
      <body className="min-h-full flex flex-col font-sans bg-background text-foreground">
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
          <div className="w-16 h-16 bg-danger/10 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle size={32} className="text-danger" />
          </div>
          <h1 className="text-2xl font-extrabold text-foreground mb-3">Qualcosa è andato storto</h1>
          <p className="text-foreground-subtle text-center mb-8 max-w-md leading-relaxed">
            Si è verificato un errore imprevisto. Ricarica la pagina o riprova.
          </p>
          <button
            onClick={() => unstable_retry()}
            className="bg-primary text-background font-bold px-6 py-3 rounded-xl hover:bg-primary-hover transition-all active:scale-95 cursor-pointer"
          >
            Riprova
          </button>
        </div>
      </body>
    </html>
  )
}

import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-primary/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/5 blur-[100px] rounded-full" />
      </div>
      <div className="text-primary text-8xl font-black mb-4 tracking-tight">404</div>
      <h1 className="text-2xl font-extrabold text-foreground mb-3">Pagina non trovata</h1>
      <p className="text-foreground-subtle text-center mb-8 max-w-md leading-relaxed">
        La pagina che stai cercando non esiste o è stata spostata.
      </p>
      <Link
        href="/home"
        className="bg-primary text-background font-bold px-6 py-3 rounded-xl hover:bg-primary-hover transition-all active:scale-95"
      >
        Torna alla home
      </Link>
    </div>
  )
}

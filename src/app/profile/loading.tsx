export default function Loading() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .shimmer-slow {
          background: linear-gradient(90deg, var(--color-surface-active) 0%, var(--color-surface-hover) 50%, var(--color-surface-active) 100%);
          background-size: 200% auto;
          animation: shimmer 2s ease-in-out infinite;
        }
      `}</style>
      <header className="sticky top-0 z-10 px-4 py-4 bg-surface/80 backdrop-blur-xl border-b border-surface-border flex items-center gap-3">
        <div className="w-10 h-10 shimmer-slow rounded-xl" />
        <div className="h-5 w-28 shimmer-slow rounded-md" />
      </header>
      <main className="flex-1 p-6 max-w-[540px] mx-auto w-full">
        <div className="space-y-8">
          <div className="space-y-3">
            <div className="h-4 w-32 shimmer-slow rounded-md" />
            <div className="h-12 shimmer-slow rounded-xl" />
          </div>
          <div className="space-y-3">
            <div className="h-4 w-40 shimmer-slow rounded-md" />
            <div className="flex gap-2.5">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-10 w-28 shimmer-slow rounded-xl" />
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <div className="h-4 w-36 shimmer-slow rounded-md" />
            <div className="flex gap-2.5">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-10 w-20 shimmer-slow rounded-xl" />
              ))}
            </div>
          </div>
          <div className="h-12 shimmer-slow rounded-xl" />
        </div>
      </main>
    </div>
  )
}

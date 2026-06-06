export default function Loading() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .shimmer-fast {
          background: linear-gradient(90deg, var(--color-surface-active) 0%, var(--color-surface-hover) 50%, var(--color-surface-active) 100%);
          background-size: 200% auto;
          animation: shimmer 1.5s ease-in-out infinite;
        }
      `}</style>
      <header className="sticky top-0 z-20 px-4 py-4 bg-surface/80 backdrop-blur-xl border-b border-surface-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 shimmer-fast rounded-xl" />
          <div className="h-5 w-32 shimmer-fast rounded-md" />
        </div>
        <div className="h-10 shimmer-fast rounded-xl" />
      </header>
      <main className="flex-1 p-5 max-w-[640px] mx-auto w-full">
        <div className="space-y-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-surface border border-surface-border rounded-2xl p-4">
              <div className="h-4 w-3/4 shimmer-fast rounded-md mb-3" />
              <div className="flex justify-between">
                <div className="h-3 w-24 shimmer-fast rounded-md opacity-60" />
                <div className="flex gap-2">
                  <div className="h-4 w-4 shimmer-fast rounded" />
                  <div className="h-4 w-4 shimmer-fast rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

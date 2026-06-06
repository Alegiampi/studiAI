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
      <header className="sticky top-0 z-20 px-4 py-4 bg-surface/80 backdrop-blur-xl border-b border-surface-border flex items-center gap-3">
        <div className="w-10 h-10 shimmer-slow rounded-xl" />
        <div className="h-5 w-28 shimmer-slow rounded-md" />
      </header>
      <main className="flex-1 overflow-y-auto px-5 pt-6 pb-24 max-w-[720px] mx-auto w-full">
        <div className="mb-6">
          <div className="h-48 shimmer-slow rounded-[20px] mb-4" />
          <div className="h-24 shimmer-slow rounded-[20px]" />
        </div>
        <div className="space-y-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-3">
              <div className="w-[2px] bg-surface-active/50 rounded-full shrink-0" />
              <div className="flex-1 bg-surface border border-surface-border rounded-[24px] overflow-hidden">
                <div className="px-5 py-4 border-b border-surface-border bg-surface-active/50">
                  <div className="h-5 w-1/3 shimmer-slow rounded-md" />
                </div>
                <div className="px-6 py-5 space-y-3">
                  <div className="h-3 shimmer-slow rounded-full w-full" />
                  <div className="h-3 shimmer-slow rounded-full w-[92%]" />
                  <div className="h-3 shimmer-slow rounded-full w-[85%]" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

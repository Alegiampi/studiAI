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
      <header className="sticky top-0 z-20 px-4 py-4 bg-surface/80 backdrop-blur-xl border-b border-surface-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-6 w-24 shimmer-fast rounded-md" />
          <div className="h-4 w-16 shimmer-fast rounded-md opacity-60" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-20 shimmer-fast rounded-xl" />
          <div className="h-8 w-8 shimmer-fast rounded-xl" />
        </div>
      </header>
      <main className="flex-1 p-5 max-w-[640px] mx-auto w-full">
        <div className="h-6 w-48 shimmer-fast rounded-md mb-2" />
        <div className="h-4 w-64 shimmer-fast rounded-md mb-6 opacity-60" />
        <div className="rounded-2xl border-2 border-surface-border p-8 flex flex-col items-center gap-4">
          <div className="w-16 h-16 shimmer-fast rounded-2xl" />
          <div className="h-4 w-40 shimmer-fast rounded-md" />
          <div className="h-3 w-56 shimmer-fast rounded-md opacity-60" />
        </div>
        <div className="flex items-center gap-3 my-6">
          <div className="h-px flex-1 bg-surface-border" />
          <div className="h-3 w-32 shimmer-fast rounded-md" />
          <div className="h-px flex-1 bg-surface-border" />
        </div>
        <div className="h-24 shimmer-fast rounded-2xl" />
        <div className="h-12 shimmer-fast rounded-2xl mt-4" />
      </main>
    </div>
  )
}

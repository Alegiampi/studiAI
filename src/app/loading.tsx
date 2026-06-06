export default function Loading() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 gap-6">
      <style>{`
        @keyframes loadingBar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
        .loading-bar {
          animation: loadingBar 1.5s ease-in-out infinite;
        }
      `}</style>
      <div className="flex items-center gap-3">
        <span className="text-[32px] font-extrabold tracking-tight">
          <span className="font-light text-foreground/60">the</span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-foreground to-foreground-muted">Lemma</span>
        </span>
      </div>
      <div className="w-48 h-1 bg-surface-border rounded-full overflow-hidden relative">
        <div className="loading-bar absolute inset-0 bg-primary rounded-full" />
      </div>
    </div>
  )
}

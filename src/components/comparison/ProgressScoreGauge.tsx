export const ProgressScoreGauge = ({ score, band }: { score: number; band: string }) => {
  const pct = Math.max(0, Math.min(100, score));
  return (
    <div className="flex items-center gap-4">
      <div className="relative w-24 h-24 shrink-0">
        <svg viewBox="0 0 36 36" className="w-24 h-24 -rotate-90">
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="hsl(var(--border))" strokeWidth="3" />
          <circle
            cx="18" cy="18" r="15.9" fill="none"
            stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round"
            strokeDasharray={`${pct}, 100`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-xl font-bold">{pct}</div>
      </div>
      <div>
        <div className="text-xs uppercase tracking-wide text-muted-foreground">Overall progress</div>
        <div className="text-lg font-semibold">{band}</div>
        <div className="text-xs text-muted-foreground">vs. your previous report</div>
      </div>
    </div>
  );
};

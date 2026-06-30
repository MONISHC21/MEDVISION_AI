import type { DeltaRow, Trend } from "./compareReports";

const TREND_META: Record<Trend, { label: string; cls: string }> = {
  improved:               { label: "⬆ Improved",     cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
  stable:                 { label: "= Stable",       cls: "bg-sky-500/10 text-sky-400 border-sky-500/30" },
  slightly_worse:         { label: "⬇ Slight",      cls: "bg-amber-500/10 text-amber-400 border-amber-500/30" },
  significantly_worse:    { label: "⬇⬇ Worse",      cls: "bg-red-500/10 text-red-400 border-red-500/30" },
  unknown:                { label: "—",              cls: "bg-secondary/50 text-muted-foreground border-border" },
};

export const ParameterDeltaTable = ({ rows }: { rows: DeltaRow[] }) => {
  if (!rows.length) return null;
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead className="bg-secondary/50 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="text-left px-3 py-2">Parameter</th>
            <th className="text-left px-3 py-2">Previous</th>
            <th className="text-left px-3 py-2">Current</th>
            <th className="text-left px-3 py-2">Normal</th>
            <th className="text-left px-3 py-2">Change</th>
            <th className="text-left px-3 py-2">Trend</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const meta = TREND_META[r.trend];
            return (
              <tr key={i} className="border-t border-border align-top">
                <td className="px-3 py-2 font-medium">{r.name}</td>
                <td className="px-3 py-2 text-muted-foreground">{r.previous}</td>
                <td className="px-3 py-2 font-medium">{r.current}</td>
                <td className="px-3 py-2 text-muted-foreground">{r.normal}</td>
                <td className="px-3 py-2 font-mono">{r.delta}</td>
                <td className="px-3 py-2"><span className={`text-xs px-2 py-0.5 rounded border ${meta.cls}`}>{meta.label}</span></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

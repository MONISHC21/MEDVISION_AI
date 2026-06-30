import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend,
} from "recharts";
import type { DeltaRow } from "./compareReports";

function num(v: string): number | null {
  const m = String(v).replace(",", "").match(/-?\d+(?:\.\d+)?/);
  return m ? Number(m[0]) : null;
}

export const TrendCharts = ({ rows }: { rows: DeltaRow[] }) => {
  const chartable = rows.filter((r) => num(r.previous) != null && num(r.current) != null);
  if (!chartable.length) return null;

  const lineData = chartable.map((r) => ({
    name: r.name.length > 14 ? r.name.slice(0, 14) + "…" : r.name,
    Previous: num(r.previous),
    Current: num(r.current),
  }));

  const radarData = chartable.slice(0, 8).map((r) => {
    const prev = num(r.previous)!;
    const curr = num(r.current)!;
    const max = Math.max(Math.abs(prev), Math.abs(curr), 1);
    return {
      param: r.name.length > 12 ? r.name.slice(0, 12) + "…" : r.name,
      Previous: Math.round((prev / max) * 100),
      Current: Math.round((curr / max) * 100),
    };
  });

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <div className="rounded-xl border border-border bg-secondary/30 p-4">
        <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Parameter trend</div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineData} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="Previous" stroke="#94a3b8" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="Current" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-secondary/30 p-4">
        <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Normalized profile (radar)</div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis dataKey="param" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <PolarRadiusAxis tick={{ fontSize: 9 }} angle={30} domain={[0, 100]} />
              <Radar name="Previous" dataKey="Previous" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.25} />
              <Radar name="Current" dataKey="Current" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.35} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", fontSize: 12 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

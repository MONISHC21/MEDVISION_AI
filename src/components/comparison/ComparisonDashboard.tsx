import { useMemo } from "react";
import { GitCompareArrows, TrendingUp, TrendingDown, Minus, FileDown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { compareReports } from "./compareReports";
import { ParameterDeltaTable } from "./ParameterDeltaTable";
import { TrendCharts } from "./TrendCharts";
import { ProgressScoreGauge } from "./ProgressScoreGauge";
import { downloadProgressReportPdf } from "./progressPdf";
import type { StoredReport } from "@/lib/reportsStore";

interface Props {
  previous: StoredReport;
  current: { analysis: any; patient_name: string };
}

export const ComparisonDashboard = ({ previous, current }: Props) => {
  const result = useMemo(() => compareReports(previous.analysis, current.analysis), [previous, current]);

  return (
    <section className="rounded-2xl border border-primary/30 bg-primary/5 p-5 md:p-6 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center">
            <GitCompareArrows className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Health Progress Comparison</h3>
            <p className="text-xs text-muted-foreground">
              Comparing {previous.report_type_label} from <strong>{result.previousDate}</strong> → <strong>{result.currentDate}</strong>
            </p>
          </div>
        </div>
        <Button
          size="sm" variant="hero"
          onClick={() => downloadProgressReportPdf(result, current.patient_name)}
        >
          <FileDown className="w-4 h-4" /> Download progress PDF
        </Button>
      </div>

      <div className="grid md:grid-cols-[auto,1fr] gap-5 items-center">
        <ProgressScoreGauge score={result.progressScore} band={result.band} />
        <p className="text-sm leading-relaxed">{result.summary}</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <StatTile color="emerald" Icon={TrendingUp} label="Improved" items={result.improved} />
        <StatTile color="sky"     Icon={Minus}      label="Stable"   items={result.stable} />
        <StatTile color="amber"   Icon={TrendingDown} label="Needs attention" items={result.worsened} />
      </div>

      <ParameterDeltaTable rows={result.rows} />
      <TrendCharts rows={result.rows} />

      <div className="space-y-2">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">Trend explanations</div>
        <ul className="space-y-1.5 text-sm">
          {result.rows.map((r, i) => (
            <li key={i} className="rounded-lg bg-secondary/30 p-3">{r.explanation}</li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 to-accent/5 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <div className="font-semibold text-sm">Personalized next steps</div>
        </div>
        <ul className="space-y-1 text-sm list-disc list-inside marker:text-primary">
          {result.nextSteps.map((s, i) => <li key={i}>{s}</li>)}
        </ul>
      </div>
    </section>
  );
};

const COLOR: Record<string, string> = {
  emerald: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  sky: "border-sky-500/30 bg-sky-500/10 text-sky-400",
  amber: "border-amber-500/30 bg-amber-500/10 text-amber-400",
};

const StatTile = ({ color, Icon, label, items }: { color: string; Icon: typeof TrendingUp; label: string; items: string[] }) => (
  <div className={`rounded-xl border p-3 ${COLOR[color]}`}>
    <div className="flex items-center gap-2 text-xs uppercase tracking-wide">
      <Icon className="w-3.5 h-3.5" />
      {label}
      <span className="ml-auto font-mono text-sm">{items.length}</span>
    </div>
    <div className="mt-1 text-xs text-foreground/80 line-clamp-3 min-h-[1.5rem]">
      {items.length ? items.join(", ") : "—"}
    </div>
  </div>
);

// Pure comparison logic — no React, no AI calls.

export type Trend = "improved" | "stable" | "slightly_worse" | "significantly_worse" | "unknown";

export interface DeltaRow {
  name: string;
  previous: string;
  current: string;
  normal: string;
  delta: string;
  trend: Trend;
  explanation: string;
}

export interface ComparisonResult {
  previousDate: string;
  currentDate: string;
  rows: DeltaRow[];
  progressScore: number;
  band: "Excellent Progress" | "Good Progress" | "Stable" | "Needs Improvement";
  improved: string[];
  stable: string[];
  worsened: string[];
  summary: string;
  nextSteps: string[];
}

interface Param {
  name: string; your_value: string; normal_range: string; status?: string;
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "").trim();

// Parse a leading number from strings like "10.2", "10.2 g/dL", "<200"
function parseNum(s?: string): number | null {
  if (!s) return null;
  const m = String(s).replace(",", "").match(/-?\d+(?:\.\d+)?/);
  return m ? Number(m[0]) : null;
}

// Parse normal range: "13-17", "13 - 17", "<200", ">40", "0.4-4.0"
function parseRange(s?: string): { lo: number | null; hi: number | null } {
  if (!s) return { lo: null, hi: null };
  const t = s.replace(/,/g, "");
  const ltMatch = t.match(/<\s*(-?\d+(?:\.\d+)?)/);
  if (ltMatch) return { lo: null, hi: Number(ltMatch[1]) };
  const gtMatch = t.match(/>\s*(-?\d+(?:\.\d+)?)/);
  if (gtMatch) return { lo: Number(gtMatch[1]), hi: null };
  const r = t.match(/(-?\d+(?:\.\d+)?)\s*[-–to]+\s*(-?\d+(?:\.\d+)?)/);
  if (r) return { lo: Number(r[1]), hi: Number(r[2]) };
  return { lo: null, hi: null };
}

function distanceFromRange(v: number | null, lo: number | null, hi: number | null): number {
  if (v == null) return 0;
  if (lo != null && v < lo) return lo - v;
  if (hi != null && v > hi) return v - hi;
  return 0;
}

function classify(prev: number | null, curr: number | null, lo: number | null, hi: number | null): Trend {
  if (prev == null || curr == null) return "unknown";
  const dPrev = distanceFromRange(prev, lo, hi);
  const dCurr = distanceFromRange(curr, lo, hi);
  if (dPrev === 0 && dCurr === 0) return "stable";
  const diff = dPrev - dCurr; // positive = improvement
  const ref = Math.max(Math.abs(prev), Math.abs(curr), 1);
  const pct = diff / ref;
  if (pct > 0.05) return "improved";
  if (pct < -0.2) return "significantly_worse";
  if (pct < -0.05) return "slightly_worse";
  return "stable";
}

function arrow(trend: Trend): string {
  return trend === "improved" ? "⬆ Improved"
    : trend === "stable" ? "= Stable"
    : trend === "slightly_worse" ? "⬇ Slightly worse"
    : trend === "significantly_worse" ? "⬇⬇ Significantly worse"
    : "—";
}

function explain(name: string, prev: number | null, curr: number | null, lo: number | null, hi: number | null, trend: Trend): string {
  if (trend === "unknown" || prev == null || curr == null) {
    return `${name}: previous and current values could not be numerically compared.`;
  }
  const range = lo != null && hi != null ? `${lo}–${hi}` : lo != null ? `>${lo}` : hi != null ? `<${hi}` : "normal range";
  if (trend === "improved") return `${name} moved from ${prev} to ${curr} — closer to the ${range} range. Keep up the supportive habits.`;
  if (trend === "stable") return `${name} stayed around ${curr}, consistent with the previous ${prev}.`;
  if (trend === "slightly_worse") return `${name} shifted from ${prev} to ${curr}, slightly further from ${range}. Worth monitoring.`;
  return `${name} changed from ${prev} to ${curr}, noticeably outside ${range}. Please discuss with a healthcare professional.`;
}

export function compareReports(prevAnalysis: any, currAnalysis: any): ComparisonResult {
  const prevDate = prevAnalysis?.overview?.report_date || "previous";
  const currDate = currAnalysis?.overview?.report_date || "current";
  const prevParams: Param[] = prevAnalysis?.parameters || [];
  const currParams: Param[] = currAnalysis?.parameters || [];

  const prevMap = new Map(prevParams.map((p) => [norm(p.name), p]));
  const rows: DeltaRow[] = [];

  for (const c of currParams) {
    const p = prevMap.get(norm(c.name));
    if (!p) continue;
    const prevV = parseNum(p.your_value);
    const currV = parseNum(c.your_value);
    const { lo, hi } = parseRange(c.normal_range || p.normal_range);
    const trend = classify(prevV, currV, lo, hi);
    const deltaTxt = prevV != null && currV != null ? (currV - prevV >= 0 ? `+${(currV - prevV).toFixed(2)}` : `${(currV - prevV).toFixed(2)}`) : "—";
    rows.push({
      name: c.name,
      previous: p.your_value,
      current: c.your_value,
      normal: c.normal_range || p.normal_range || "",
      delta: deltaTxt,
      trend,
      explanation: explain(c.name, prevV, currV, lo, hi, trend),
    });
  }

  const improved = rows.filter((r) => r.trend === "improved").map((r) => r.name);
  const stable = rows.filter((r) => r.trend === "stable").map((r) => r.name);
  const worsened = rows.filter((r) => r.trend === "slightly_worse" || r.trend === "significantly_worse").map((r) => r.name);

  let score = 50;
  for (const r of rows) {
    if (r.trend === "improved") score += 10;
    else if (r.trend === "stable") score += 2;
    else if (r.trend === "slightly_worse") score -= 6;
    else if (r.trend === "significantly_worse") score -= 14;
  }
  score = Math.max(0, Math.min(100, Math.round(score)));
  const band: ComparisonResult["band"] =
    score >= 80 ? "Excellent Progress" : score >= 65 ? "Good Progress" : score >= 45 ? "Stable" : "Needs Improvement";

  const summary =
    rows.length === 0
      ? "Could not match parameters between the two reports — make sure both are the same report type."
      : `${improved.length} parameter(s) improved, ${stable.length} stayed stable, and ${worsened.length} need attention compared with ${prevDate}.`;

  const nextSteps: string[] = [];
  if (improved.length) nextSteps.push(`Continue the lifestyle that helped: ${improved.slice(0, 4).join(", ")}.`);
  if (worsened.length) nextSteps.push(`Discuss with your doctor: ${worsened.slice(0, 4).join(", ")}.`);
  nextSteps.push("Re-test in the timeframe your clinician recommends to keep tracking these trends.");
  nextSteps.push("Maintain hydration, balanced meals, regular movement, and 7–9h of sleep.");

  return {
    previousDate: prevDate, currentDate: currDate,
    rows, progressScore: score, band, improved, stable, worsened, summary, nextSteps,
  };
}

// Local history store for medical reports (no auth required).
// Keyed by normalized report type so comparison only matches like-with-like.

const KEY = "medexplain.reports.v1";
const MAX_PER_TYPE = 20;

export interface StoredReport {
  id: string;
  saved_at: string; // ISO
  report_type_key: string; // normalized
  report_type_label: string;
  patient_name: string;
  report_date: string;
  analysis: any;
}

export function normalizeType(t?: string): string {
  return (t || "general")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60) || "general";
}

function readAll(): StoredReport[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(rows: StoredReport[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(rows));
  } catch {
    /* quota — ignore */
  }
}

export function saveReport(analysis: any): StoredReport {
  const overview = analysis?.overview ?? {};
  const row: StoredReport = {
    id: crypto.randomUUID(),
    saved_at: new Date().toISOString(),
    report_type_label: overview.report_type || "General Report",
    report_type_key: normalizeType(overview.report_type),
    patient_name: overview.patient_name || "Patient",
    report_date: overview.report_date || new Date().toISOString().slice(0, 10),
    analysis,
  };
  const all = readAll();
  all.unshift(row);
  // Cap history per type
  const grouped: Record<string, StoredReport[]> = {};
  for (const r of all) (grouped[r.report_type_key] ||= []).push(r);
  const capped: StoredReport[] = [];
  for (const k of Object.keys(grouped)) capped.push(...grouped[k].slice(0, MAX_PER_TYPE));
  capped.sort((a, b) => (a.saved_at < b.saved_at ? 1 : -1));
  writeAll(capped);
  return row;
}

export function getPreviousOfType(typeKey: string, excludeId: string): StoredReport | null {
  const all = readAll().filter((r) => r.report_type_key === typeKey && r.id !== excludeId);
  return all[0] ?? null;
}

export function listReports(): StoredReport[] {
  return readAll();
}

export function clearHistory() {
  writeAll([]);
}

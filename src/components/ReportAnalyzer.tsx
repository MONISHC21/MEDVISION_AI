import { useRef, useState } from "react";
import {
  FileSearch, Loader2, Sparkles, CheckCircle2, AlertTriangle,
  TrendingDown, TrendingUp, Apple, Dumbbell, HeartPulse, Pill,
  Award, MessageCircleQuestion, Smile, BookOpen, ClipboardList,
  Upload, FileText, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Lang } from "./LanguageToggle";
import { ReportChat } from "./ReportChat";
import { ReportExportBar } from "./export/ReportExportBar";
import { ComparisonDashboard } from "./comparison/ComparisonDashboard";
import { saveReport, getPreviousOfType, normalizeType, type StoredReport } from "@/lib/reportsStore";

const ACCEPTED = ["application/pdf", "image/jpeg", "image/png", "image/jpg", "image/webp"];
const MAX_BYTES = 8 * 1024 * 1024; // 8MB

async function fileToBase64(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(buf);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)) as any);
  }
  return btoa(binary);
}

type Status = "normal" | "slightly_low" | "slightly_high" | "high_risk";

interface Parameter {
  name: string; your_value: string; normal_range: string; status: Status;
  what_it_is?: string; why_important?: string; what_result_means?: string;
  possible_reasons?: string[];
}
interface Analysis {
  overview?: { patient_name?: string; report_date?: string; report_type?: string; summary_simple?: string };
  parameters?: Parameter[];
  medical_terms?: { term: string; definition: string; purpose: string; easy_explanation: string }[];
  health_insights?: { area: string; insight: string }[];
  nutrition?: {
    foods_to_eat?: string[]; foods_to_limit?: string[]; protein_sources?: string[];
    vitamin_sources?: string[]; mineral_sources?: string[]; hydration?: string;
  };
  exercise?: { beginner?: string[]; intermediate?: string[]; advanced?: string[] };
  lifestyle?: {
    sleep?: string; stress?: string; daily_routine?: string;
    hydration_goal?: string; healthy_habits?: string[];
  };
  prescriptions?: { name: string; purpose: string; side_effects?: string[]; precautions?: string[] }[];
  health_score?: { score: number; band: string; explanation: string };
  doctor_questions?: string[];
  motivation?: string;
  raw?: string;
}

const SAMPLE = `Patient: John Doe
Date: 2024-03-15
Test: Complete Blood Count + Lipid Panel

Hemoglobin: 10.5 g/dL (Normal: 13-17)
WBC: 7,200 /µL (Normal: 4,000-11,000)
Platelets: 240,000 /µL (Normal: 150,000-450,000)
Fasting Glucose: 112 mg/dL (Normal: 70-100)
Total Cholesterol: 220 mg/dL (Normal: <200)
LDL: 150 mg/dL (Normal: <100)
HDL: 38 mg/dL (Normal: >40)
TSH: 2.1 mIU/L (Normal: 0.4-4.0)`;

const STATUS_META: Record<Status, { label: string; cls: string; Icon: typeof CheckCircle2 }> = {
  normal:         { label: "✅ Normal",        cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30", Icon: CheckCircle2 },
  slightly_low:   { label: "🟡 Slightly Low",  cls: "bg-amber-500/10 text-amber-400 border-amber-500/30",       Icon: TrendingDown },
  slightly_high:  { label: "🟡 Slightly High", cls: "bg-amber-500/10 text-amber-400 border-amber-500/30",       Icon: TrendingUp },
  high_risk:      { label: "🔴 High Risk",     cls: "bg-red-500/10 text-red-400 border-red-500/30",             Icon: AlertTriangle },
};

interface Props { language: Lang; eli10: boolean; }

export const ReportAnalyzer = ({ language, eli10 }: Props) => {
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Analysis | null>(null);
  const [previous, setPrevious] = useState<StoredReport | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const pickFile = (f: File | null) => {
    if (!f) return;
    if (!ACCEPTED.includes(f.type)) {
      toast.error("Only PDF, JPG, PNG, or WEBP files are supported.");
      return;
    }
    if (f.size > MAX_BYTES) {
      toast.error("File is too large (max 8MB).");
      return;
    }
    setFile(f);
  };

  const run = async () => {
    const value = text.trim();
    if (!value && !file) return;
    setLoading(true); setResult(null);
    try {
      const body: Record<string, unknown> = { mode: "analyze", language, eli10 };
      if (value) body.report_text = value;
      if (file) {
        const data_base64 = await fileToBase64(file);
        body.file = { mime: file.type, data_base64, name: file.name };
      }
      const { data, error } = await supabase.functions.invoke("medical-ai", { body });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const analysis = data.analysis as Analysis;
      setResult(analysis);
      // Save + fetch previous of same type (localStorage, no auth needed)
      try {
        const typeKey = normalizeType(analysis?.overview?.report_type);
        const prev = getPreviousOfType(typeKey, "");
        const saved = saveReport(analysis);
        setPrevious(prev && prev.id !== saved.id ? prev : null);
      } catch { /* ignore storage errors */ }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not analyze the report.");
    } finally { setLoading(false); }
  };

  return (
    <div className="glass rounded-2xl p-6 md:p-8">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <FileSearch className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="text-xl font-semibold">AI Medical Report Parser</h3>
          <p className="text-sm text-muted-foreground">
            Upload a PDF/image or paste report text — get a 12-section breakdown, health score, and an AI chat about your report.
          </p>
        </div>
      </div>

      {/* Upload zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault(); setDragOver(false);
          pickFile(e.dataTransfer.files?.[0] ?? null);
        }}
        onClick={() => inputRef.current?.click()}
        className={`mb-4 rounded-2xl border-2 border-dashed cursor-pointer transition-all p-8 md:p-10 text-center group ${
          dragOver
            ? "border-primary bg-primary/15 scale-[1.01]"
            : "border-primary/40 hover:border-primary hover:bg-primary/5 bg-primary/[0.03]"
        }`}
        role="button"
        aria-label="Upload report file"
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/*"
          className="hidden"
          onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
        />
        {file ? (
          <div className="flex items-center justify-center gap-3 text-sm">
            <FileText className="w-6 h-6 text-primary" />
            <span className="font-medium truncate max-w-[260px]">{file.name}</span>
            <span className="text-muted-foreground text-xs">{(file.size / 1024).toFixed(0)} KB</span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setFile(null); if (inputRef.current) inputRef.current.value = ""; }}
              className="ml-2 p-1 rounded hover:bg-secondary"
              aria-label="Remove file"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-14 h-14 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center group-hover:bg-primary/25 transition-colors mb-1">
              <Upload className="w-7 h-7 text-primary" />
            </div>
            <div className="text-base md:text-lg font-semibold">Upload your medical report</div>
            <div className="text-sm text-muted-foreground">
              Drag &amp; drop here, or <span className="text-primary underline underline-offset-2">click to browse</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">PDF · JPG · PNG · WEBP · up to 8MB</div>
            <div className="text-[11px] text-muted-foreground/80 mt-1">
              Typical analysis time: 10–30 seconds (longer for multi-page PDFs)
            </div>
          </div>
        )}
      </div>


      <div className="text-center text-xs text-muted-foreground my-2">— or paste report text —</div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste your report text here (CBC, lipid panel, thyroid, glucose, etc.)…"
        rows={6}
        maxLength={20000}
        className="w-full bg-secondary/50 border border-border rounded-lg px-4 py-3 text-sm outline-none focus:border-primary/60 transition-colors font-mono"
      />

      <div className="flex flex-wrap gap-2 mt-3 mb-1">
        <Button onClick={run} variant="hero" disabled={loading || (!text.trim() && !file)}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Analyze Report
        </Button>
        <Button type="button" variant="ghost-glow" onClick={() => setText(SAMPLE)} disabled={loading}>
          Load sample
        </Button>
        {(text || file) && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => { setText(""); setFile(null); setResult(null); if (inputRef.current) inputRef.current.value = ""; }}
            disabled={loading}
          >
            Clear
          </Button>
        )}
      </div>

      {loading && (
        <div className="mt-6 text-sm text-muted-foreground flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          Analyzing report… this can take 10–30 seconds{file ? " (running OCR on your file)" : ""}.
        </div>
      )}

      {result && (
        <div className="mt-8 space-y-6 animate-fade-up">
          {result.raw ? (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{result.raw}</p>
          ) : (
            <>
              <ReportExportBar analysis={result as any} />
              <Overview o={result.overview} score={result.health_score} />
              <Parameters params={result.parameters} />
              <ComparisonTable params={result.parameters} />
              <Terms terms={result.medical_terms} />
              <Insights items={result.health_insights} />
              <Nutrition n={result.nutrition} />
              <Exercise e={result.exercise} />
              <Lifestyle l={result.lifestyle} />
              <Prescriptions p={result.prescriptions} />
              <DoctorQuestions items={result.doctor_questions} />
              <Motivation msg={result.motivation} />
              {previous ? (
                <ComparisonDashboard
                  previous={previous}
                  current={{ analysis: result, patient_name: result.overview?.patient_name || "Patient" }}
                />
              ) : (
                <div className="rounded-xl border border-dashed border-border bg-secondary/20 p-4 text-sm text-muted-foreground">
                  First report of this type saved — upload another one later to see a side-by-side health progress comparison with charts.
                </div>
              )}
              <ReportChat
                language={language}
                eli10={eli10}
                reportContext={JSON.stringify(result).slice(0, 8000)}
              />
              <p className="text-xs text-muted-foreground border-t border-border/50 pt-4">
                Educational information only — not medical advice. Consult a qualified healthcare professional.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
};

/* ---------- Section components ---------- */

const Section = ({ icon: Icon, title, children }: { icon: typeof CheckCircle2; title: string; children: React.ReactNode }) => (
  <section>
    <div className="flex items-center gap-2 mb-3">
      <Icon className="w-4 h-4 text-primary" />
      <h4 className="font-semibold">{title}</h4>
    </div>
    {children}
  </section>
);

const Overview = ({ o, score }: { o?: Analysis["overview"]; score?: Analysis["health_score"] }) => {
  if (!o && !score) return null;
  return (
    <section className="rounded-xl border border-primary/20 bg-primary/5 p-4 md:p-5">
      <div className="grid sm:grid-cols-3 gap-3 mb-3 text-sm">
        <Meta label="Patient" value={o?.patient_name} />
        <Meta label="Date" value={o?.report_date} />
        <Meta label="Type" value={o?.report_type} />
      </div>
      {o?.summary_simple && (
        <p className="text-sm leading-relaxed">{o.summary_simple}</p>
      )}
      {score && (
        <div className="mt-4 flex items-center gap-4">
          <div className="relative w-20 h-20 shrink-0">
            <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="hsl(var(--border))" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="15.9" fill="none" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round"
                strokeDasharray={`${Math.max(0, Math.min(100, score.score))}, 100`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-lg font-bold">{score.score}</div>
          </div>
          <div>
            <div className="flex items-center gap-2 text-sm">
              <Award className="w-4 h-4 text-primary" />
              <span className="font-semibold">Health Score: {score.band}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{score.explanation}</p>
          </div>
        </div>
      )}
    </section>
  );
};

const Meta = ({ label, value }: { label: string; value?: string }) => (
  <div>
    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
    <div className="text-sm font-medium">{value || "N/A"}</div>
  </div>
);

const Parameters = ({ params }: { params?: Parameter[] }) => {
  if (!params?.length) return null;
  return (
    <Section icon={ClipboardList} title="Test parameter analysis">
      <div className="grid gap-3">
        {params.map((p, i) => {
          const meta = STATUS_META[p.status] ?? STATUS_META.normal;
          return (
            <div key={i} className="rounded-lg border border-border bg-secondary/30 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                <div className="font-medium">{p.name}</div>
                <span className={`text-xs px-2 py-1 rounded-md border ${meta.cls}`}>{meta.label}</span>
              </div>
              <div className="grid sm:grid-cols-2 gap-2 text-xs text-muted-foreground mb-3">
                <div>Your value: <span className="text-foreground font-medium">{p.your_value}</span></div>
                <div>Normal range: <span className="text-foreground font-medium">{p.normal_range}</span></div>
              </div>
              {p.what_it_is && <P label="What it is" value={p.what_it_is} />}
              {p.why_important && <P label="Why it matters" value={p.why_important} />}
              {p.what_result_means && <P label="What your result means" value={p.what_result_means} />}
              {p.possible_reasons?.length ? (
                <div className="mt-2">
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Possible reasons</div>
                  <ul className="text-sm list-disc list-inside marker:text-primary space-y-0.5">
                    {p.possible_reasons.map((r, j) => <li key={j}>{r}</li>)}
                  </ul>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </Section>
  );
};

const P = ({ label, value }: { label: string; value: string }) => (
  <div className="mb-1.5">
    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
    <div className="text-sm">{value}</div>
  </div>
);

const ComparisonTable = ({ params }: { params?: Parameter[] }) => {
  if (!params?.length) return null;
  return (
    <Section icon={ClipboardList} title="Comparison with normal values">
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="text-left px-3 py-2">Parameter</th>
              <th className="text-left px-3 py-2">Your value</th>
              <th className="text-left px-3 py-2">Normal</th>
              <th className="text-left px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {params.map((p, i) => {
              const meta = STATUS_META[p.status] ?? STATUS_META.normal;
              const abnormal = p.status !== "normal";
              return (
                <tr key={i} className={`border-t border-border ${abnormal ? "bg-amber-500/5" : ""}`}>
                  <td className="px-3 py-2 font-medium">{p.name}</td>
                  <td className={`px-3 py-2 ${abnormal ? "text-amber-400 font-medium" : ""}`}>{p.your_value}</td>
                  <td className="px-3 py-2 text-muted-foreground">{p.normal_range}</td>
                  <td className="px-3 py-2"><span className={`text-xs px-2 py-0.5 rounded border ${meta.cls}`}>{meta.label}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Section>
  );
};

const Terms = ({ terms }: { terms?: Analysis["medical_terms"] }) => {
  if (!terms?.length) return null;
  return (
    <Section icon={BookOpen} title="Medical term explanations">
      <div className="grid sm:grid-cols-2 gap-3">
        {terms.map((t, i) => (
          <div key={i} className="rounded-lg bg-secondary/30 p-3">
            <div className="font-medium mb-1">{t.term}</div>
            <div className="text-xs text-muted-foreground mb-1">{t.definition}</div>
            <div className="text-xs text-muted-foreground mb-2"><span className="text-foreground">Purpose:</span> {t.purpose}</div>
            <div className="text-sm">{t.easy_explanation}</div>
          </div>
        ))}
      </div>
    </Section>
  );
};

const Insights = ({ items }: { items?: Analysis["health_insights"] }) => {
  if (!items?.length) return null;
  return (
    <Section icon={HeartPulse} title="Health insights">
      <ul className="space-y-2">
        {items.map((it, i) => (
          <li key={i} className="rounded-lg bg-secondary/30 p-3">
            <div className="text-xs uppercase tracking-wide text-primary mb-1">{it.area}</div>
            <div className="text-sm">{it.insight}</div>
          </li>
        ))}
      </ul>
    </Section>
  );
};

const Chips = ({ label, items }: { label: string; items?: string[] }) => {
  if (!items?.length) return null;
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1.5">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((it, i) => (
          <span key={i} className="text-xs px-2 py-1 rounded-md bg-primary/10 border border-primary/20">{it}</span>
        ))}
      </div>
    </div>
  );
};

const Nutrition = ({ n }: { n?: Analysis["nutrition"] }) => {
  if (!n) return null;
  return (
    <Section icon={Apple} title="Nutrition recommendations">
      <div className="grid sm:grid-cols-2 gap-3 rounded-lg bg-secondary/30 p-4">
        <Chips label="Foods to eat" items={n.foods_to_eat} />
        <Chips label="Foods to limit" items={n.foods_to_limit} />
        <Chips label="Protein sources" items={n.protein_sources} />
        <Chips label="Vitamin sources" items={n.vitamin_sources} />
        <Chips label="Mineral sources" items={n.mineral_sources} />
        {n.hydration && (
          <div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1.5">Hydration</div>
            <div className="text-sm">{n.hydration}</div>
          </div>
        )}
      </div>
    </Section>
  );
};

const Exercise = ({ e }: { e?: Analysis["exercise"] }) => {
  if (!e) return null;
  const levels: [string, string[] | undefined][] = [
    ["Beginner", e.beginner], ["Intermediate", e.intermediate], ["Advanced", e.advanced],
  ];
  return (
    <Section icon={Dumbbell} title="Exercise plan">
      <div className="grid sm:grid-cols-3 gap-3">
        {levels.map(([label, items]) => (
          <div key={label} className="rounded-lg bg-secondary/30 p-3">
            <div className="text-xs uppercase tracking-wide text-primary mb-2">{label}</div>
            <ul className="text-sm space-y-1 list-disc list-inside marker:text-primary">
              {(items ?? []).map((it, i) => <li key={i}>{it}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </Section>
  );
};

const Lifestyle = ({ l }: { l?: Analysis["lifestyle"] }) => {
  if (!l) return null;
  return (
    <Section icon={HeartPulse} title="Lifestyle improvements">
      <div className="grid sm:grid-cols-2 gap-3 rounded-lg bg-secondary/30 p-4 text-sm">
        {l.sleep && <P label="Sleep" value={l.sleep} />}
        {l.stress && <P label="Stress" value={l.stress} />}
        {l.daily_routine && <P label="Daily routine" value={l.daily_routine} />}
        {l.hydration_goal && <P label="Hydration goal" value={l.hydration_goal} />}
        {l.healthy_habits?.length ? (
          <div className="sm:col-span-2"><Chips label="Healthy habits" items={l.healthy_habits} /></div>
        ) : null}
      </div>
    </Section>
  );
};

const Prescriptions = ({ p }: { p?: Analysis["prescriptions"] }) => {
  if (!p?.length) return null;
  return (
    <Section icon={Pill} title="Prescription explanation">
      <div className="space-y-2">
        {p.map((m, i) => (
          <div key={i} className="rounded-lg bg-secondary/30 p-3">
            <div className="font-medium mb-1">{m.name}</div>
            <div className="text-sm mb-2"><span className="text-muted-foreground">Purpose:</span> {m.purpose}</div>
            {m.side_effects?.length ? <Chips label="Common side effects" items={m.side_effects} /> : null}
            {m.precautions?.length ? <div className="mt-2"><Chips label="Precautions" items={m.precautions} /></div> : null}
          </div>
        ))}
      </div>
    </Section>
  );
};

const DoctorQuestions = ({ items }: { items?: string[] }) => {
  if (!items?.length) return null;
  return (
    <Section icon={MessageCircleQuestion} title="Discuss with your doctor">
      <ul className="space-y-1.5">
        {items.map((q, i) => (
          <li key={i} className="text-sm flex gap-2">
            <span className="text-primary font-mono">{String(i + 1).padStart(2, "0")}.</span>
            <span>{q}</span>
          </li>
        ))}
      </ul>
    </Section>
  );
};

const Motivation = ({ msg }: { msg?: string }) => {
  if (!msg) return null;
  return (
    <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 to-accent/5 p-4 flex gap-3">
      <Smile className="w-5 h-5 text-primary shrink-0 mt-0.5" />
      <p className="text-sm italic">{msg}</p>
    </div>
  );
};

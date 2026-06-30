import { useState } from "react";
import { BookOpen, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Lang } from "./LanguageToggle";

interface Explanation {
  term?: string;
  what_it_is?: string;
  simple_explanation?: string;
  why_it_matters?: string;
  normal_function?: string;
  normal_range?: string;
  possible_reasons_abnormal?: string[];
  lifestyle_tips?: string[];
  raw?: string;
}

const SUGGESTIONS = ["Hemoglobin", "LDL Cholesterol", "TSH", "Creatinine", "HbA1c", "ALT"];

interface Props {
  language: Lang;
  eli10: boolean;
}

export const MedicalTermExplainer = ({ language, eli10 }: Props) => {
  const [term, setTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Explanation | null>(null);

  const run = async (q: string) => {
    const value = q.trim();
    if (!value) return;
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("medical-ai", {
        body: { mode: "explain", term: value, language, eli10 },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult(data.explanation as Explanation);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not get explanation.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass rounded-2xl p-6 md:p-8">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="text-xl font-semibold">Medical Term Explainer</h3>
          <p className="text-sm text-muted-foreground">Look up any test, value, or term from your report.</p>
        </div>
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); run(term); }}
        className="flex flex-col sm:flex-row gap-2 mb-3"
      >
        <input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="e.g. Hemoglobin, LDL, TSH…"
          maxLength={120}
          className="flex-1 bg-secondary/50 border border-border rounded-lg px-4 py-3 text-sm outline-none focus:border-primary/60 transition-colors"
        />
        <Button type="submit" variant="hero" disabled={loading || !term.trim()}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Explain
        </Button>
      </form>

      <div className="flex flex-wrap gap-2 mb-5">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => { setTerm(s); run(s); }}
            disabled={loading}
            className="text-xs px-3 py-1.5 rounded-full border border-border/60 hover:border-primary/50 hover:text-primary transition-colors disabled:opacity-50"
          >
            {s}
          </button>
        ))}
      </div>

      {result && (
        <div className="space-y-3 animate-fade-up">
          {result.raw ? (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{result.raw}</p>
          ) : (
            <>
              <Field label="What it is" value={result.what_it_is} />
              <Field label="Simple explanation" value={result.simple_explanation} highlight />
              <Field label="Why it matters" value={result.why_it_matters} />
              <Field label="Normal function" value={result.normal_function} />
              <Field label="Normal range" value={result.normal_range} />
              <ListField label="Possible reasons it may be abnormal" items={result.possible_reasons_abnormal} />
              <ListField label="Lifestyle tips" items={result.lifestyle_tips} />
            </>
          )}
        </div>
      )}
    </div>
  );
};

const Field = ({ label, value, highlight }: { label: string; value?: string; highlight?: boolean }) => {
  if (!value) return null;
  return (
    <div className={`rounded-lg p-3 ${highlight ? "bg-primary/5 border border-primary/20" : "bg-secondary/30"}`}>
      <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">{label}</div>
      <div className="text-sm leading-relaxed">{value}</div>
    </div>
  );
};

const ListField = ({ label, items }: { label: string; items?: string[] }) => {
  if (!items || items.length === 0) return null;
  return (
    <div className="rounded-lg bg-secondary/30 p-3">
      <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">{label}</div>
      <ul className="text-sm space-y-1 list-disc list-inside marker:text-primary">
        {items.map((it, i) => <li key={i}>{it}</li>)}
      </ul>
    </div>
  );
};

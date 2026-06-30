export function safeFilename(parts: (string | undefined | null)[], ext: string): string {
  const cleaned = parts
    .map((p) => (p || "").toString().trim())
    .filter(Boolean)
    .map((p) => p.replace(/[^\w\-.]+/g, "_").replace(/_+/g, "_").replace(/^_+|_+$/g, ""))
    .filter(Boolean);
  const base = cleaned.length ? cleaned.join("_") : "MedExplainAI_Report";
  return `${base}.${ext.replace(/^\./, "")}`;
}

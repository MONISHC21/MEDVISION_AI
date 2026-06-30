import { safeFilename } from "./filename";
import type { ExportAnalysis } from "./pdfReport";

const STATUS_LABEL: Record<string, string> = {
  normal: "Normal", slightly_low: "Slightly Low", slightly_high: "Slightly High",
  high_risk: "High Risk", borderline: "Borderline", low: "Low", high: "High", critical: "Critical",
};
const STATUS_COLOR: Record<string, string> = {
  normal: "#10b981", slightly_low: "#f59e0b", slightly_high: "#f59e0b",
  high_risk: "#ef4444", borderline: "#f59e0b", low: "#fb923c", high: "#ef4444", critical: "#dc2626",
};

const esc = (s: any) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
const list = (items?: string[]) => (items?.length ? `<ul>${items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>` : "");

export function buildHealthReportHtml(a: ExportAnalysis): { html: string; filename: string } {
  const today = new Date().toISOString().slice(0, 10);
  const patient = a.overview?.patient_name || "Patient";
  const reportDate = a.overview?.report_date || today;
  const reportType = a.overview?.report_type || "Medical Report";

  const paramsRows = (a.parameters || [])
    .map(
      (p) => `<tr>
        <td>${esc(p.name)}</td>
        <td>${esc(p.your_value)}</td>
        <td>${esc(p.normal_range)}</td>
        <td style="color:${STATUS_COLOR[p.status] || "#666"};font-weight:600">${esc(STATUS_LABEL[p.status] || p.status)}</td>
      </tr>`,
    )
    .join("");

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"/>
<title>MedExplain AI Report — ${esc(patient)}</title>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>
  *{box-sizing:border-box}
  body{font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#0f172a;background:#f8fafc;margin:0;padding:24px}
  .page{max-width:880px;margin:0 auto;background:#fff;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,.08);overflow:hidden}
  .cover{background:linear-gradient(135deg,#082f49,#0e7490);color:#fff;padding:48px 32px;text-align:center}
  .cover h1{margin:8px 0 4px;font-size:32px}
  .cover .sub{color:#bae6fd}
  .meta{display:grid;grid-template-columns:1fr 1fr;gap:8px 24px;margin:24px auto;max-width:520px;text-align:left;font-size:14px}
  .meta dt{color:#7dd3fc;text-transform:uppercase;font-size:11px;letter-spacing:.05em}
  .meta dd{margin:0 0 8px;font-weight:600}
  .body{padding:24px 32px}
  h2{font-size:16px;margin:24px 0 8px;color:#0e7490;border-left:4px solid #06b6d4;padding-left:8px}
  table{width:100%;border-collapse:collapse;font-size:14px;margin-top:8px}
  th,td{padding:8px 10px;border-bottom:1px solid #e2e8f0;text-align:left}
  th{background:#f1f5f9;font-size:12px;text-transform:uppercase;letter-spacing:.04em;color:#475569}
  .score{display:flex;align-items:center;gap:16px;background:#ecfeff;border:1px solid #a5f3fc;border-radius:12px;padding:16px;margin-top:8px}
  .score .n{font-size:32px;font-weight:800;color:#0e7490}
  .chips{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0 12px}
  .chip{background:#ecfeff;border:1px solid #a5f3fc;color:#0e7490;padding:3px 10px;border-radius:999px;font-size:12px}
  ul{margin:4px 0 12px 18px}
  .disclaimer{background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:12px;color:#78350f;font-size:13px;margin-top:24px}
  @media print{body{background:#fff;padding:0}.page{box-shadow:none}}
</style></head>
<body><div class="page">
  <header class="cover">
    <div style="font-size:13px;letter-spacing:.18em">MEDEXPLAIN AI</div>
    <h1>Health Analysis Report</h1>
    <div class="sub">Personalized educational summary</div>
    <dl class="meta">
      <div><dt>Patient</dt><dd>${esc(patient)}</dd></div>
      <div><dt>Report Type</dt><dd>${esc(reportType)}</dd></div>
      <div><dt>Report Date</dt><dd>${esc(reportDate)}</dd></div>
      <div><dt>Analysis Date</dt><dd>${esc(today)}</dd></div>
    </dl>
  </header>
  <main class="body">
    ${a.health_score ? `<h2>Executive Summary</h2>
      <div class="score"><div class="n">${esc(a.health_score.score)}</div>
        <div><strong>${esc(a.health_score.band)}</strong><br/><span style="font-size:13px;color:#475569">${esc(a.health_score.explanation)}</span></div>
      </div>` : ""}
    ${a.overview?.summary_simple ? `<p>${esc(a.overview.summary_simple)}</p>` : ""}

    ${a.parameters?.length ? `<h2>Test Results</h2>
      <table><thead><tr><th>Test</th><th>Your Value</th><th>Normal Range</th><th>Status</th></tr></thead>
      <tbody>${paramsRows}</tbody></table>` : ""}

    ${a.medical_terms?.length ? `<h2>Medical Term Explanations</h2>
      ${a.medical_terms.map((t) => `<div style="margin-bottom:10px"><strong>${esc(t.term)}</strong> — ${esc(t.definition)}<br/><span style="font-size:13px;color:#475569">${esc(t.easy_explanation)}</span></div>`).join("")}` : ""}

    ${a.health_insights?.length ? `<h2>AI Health Insights</h2>
      ${list(a.health_insights.map((i) => `${i.area}: ${i.insight}`))}` : ""}

    ${a.nutrition ? `<h2>Nutrition Recommendations</h2>
      ${a.nutrition.foods_to_eat ? `<strong>Foods to eat</strong>${list(a.nutrition.foods_to_eat)}` : ""}
      ${a.nutrition.foods_to_limit ? `<strong>Foods to limit</strong>${list(a.nutrition.foods_to_limit)}` : ""}
      ${a.nutrition.protein_sources ? `<strong>Protein sources</strong>${list(a.nutrition.protein_sources)}` : ""}
      ${a.nutrition.vitamin_sources ? `<strong>Vitamins</strong>${list(a.nutrition.vitamin_sources)}` : ""}
      ${a.nutrition.mineral_sources ? `<strong>Minerals</strong>${list(a.nutrition.mineral_sources)}` : ""}
      ${a.nutrition.hydration ? `<p><strong>Hydration:</strong> ${esc(a.nutrition.hydration)}</p>` : ""}` : ""}

    ${a.exercise ? `<h2>Exercise Recommendations</h2>
      ${a.exercise.beginner ? `<strong>Beginner</strong>${list(a.exercise.beginner)}` : ""}
      ${a.exercise.intermediate ? `<strong>Intermediate</strong>${list(a.exercise.intermediate)}` : ""}
      ${a.exercise.advanced ? `<strong>Advanced</strong>${list(a.exercise.advanced)}` : ""}` : ""}

    ${a.lifestyle ? `<h2>Lifestyle Recommendations</h2>
      ${a.lifestyle.sleep ? `<p><strong>Sleep:</strong> ${esc(a.lifestyle.sleep)}</p>` : ""}
      ${a.lifestyle.stress ? `<p><strong>Stress:</strong> ${esc(a.lifestyle.stress)}</p>` : ""}
      ${a.lifestyle.daily_routine ? `<p><strong>Daily routine:</strong> ${esc(a.lifestyle.daily_routine)}</p>` : ""}
      ${a.lifestyle.hydration_goal ? `<p><strong>Hydration goal:</strong> ${esc(a.lifestyle.hydration_goal)}</p>` : ""}
      ${a.lifestyle.healthy_habits ? `<strong>Healthy habits</strong>${list(a.lifestyle.healthy_habits)}` : ""}` : ""}

    ${a.prescriptions?.length ? `<h2>Medication Explanation</h2>
      ${a.prescriptions.map((m) => `<div style="margin-bottom:10px"><strong>${esc(m.name)}</strong><br/>
        ${m.purpose ? `<em>Purpose:</em> ${esc(m.purpose)}<br/>` : ""}
        ${m.side_effects?.length ? `<em>Side effects:</em> ${esc(m.side_effects.join(", "))}<br/>` : ""}
        ${m.precautions?.length ? `<em>Precautions:</em> ${esc(m.precautions.join(", "))}` : ""}
      </div>`).join("")}` : ""}

    ${a.doctor_questions?.length ? `<h2>Questions to Discuss With Your Doctor</h2>
      <ol>${a.doctor_questions.map((q) => `<li>${esc(q)}</li>`).join("")}</ol>` : ""}

    ${a.motivation ? `<h2>Motivational Message</h2><p><em>${esc(a.motivation)}</em></p>` : ""}

    <div class="disclaimer">⚠️ This AI-generated report is for educational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. Please consult a qualified healthcare professional regarding any medical concerns.</div>
  </main>
</div></body></html>`;

  return { html, filename: safeFilename([patient, reportDate, "MedExplainAI_Report"], "html") };
}

export function downloadHealthReportHtml(a: ExportAnalysis) {
  const { html, filename } = buildHealthReportHtml(a);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url; link.download = filename;
  document.body.appendChild(link); link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function printHealthReport(a: ExportAnalysis) {
  const { html } = buildHealthReportHtml(a);
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.open();
  w.document.write(html);
  w.document.close();
  setTimeout(() => { w.focus(); w.print(); }, 400);
}

// Professional PDF report builder for a single MedExplain analysis.
import jsPDF from "jspdf";
import autoTable, { type RowInput } from "jspdf-autotable";
import { safeFilename } from "./filename";

const BRAND = { r: 6, g: 182, b: 212 }; // cyan-500
const STATUS_COLOR: Record<string, [number, number, number]> = {
  normal: [16, 185, 129],
  slightly_low: [245, 158, 11],
  slightly_high: [245, 158, 11],
  high_risk: [239, 68, 68],
  borderline: [245, 158, 11],
  low: [251, 146, 60],
  high: [239, 68, 68],
  critical: [220, 38, 38],
};
const STATUS_LABEL: Record<string, string> = {
  normal: "Normal",
  slightly_low: "Slightly Low",
  slightly_high: "Slightly High",
  high_risk: "High",
  borderline: "Borderline",
  low: "Low",
  high: "High",
  critical: "Critical",
};

const PAGE = { w: 210, h: 297 }; // A4 mm
const MARGIN = 14;

function header(doc: jsPDF, title: string) {
  doc.setFillColor(BRAND.r, BRAND.g, BRAND.b);
  doc.rect(0, 0, PAGE.w, 12, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("MedExplain AI", MARGIN, 8);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(title, PAGE.w - MARGIN, 8, { align: "right" });
  doc.setTextColor(20, 20, 20);
}

function footer(doc: jsPDF) {
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(
      "Educational only — not medical advice. Consult a qualified healthcare professional.",
      MARGIN,
      PAGE.h - 6,
    );
    doc.text(`Page ${i} / ${pages}`, PAGE.w - MARGIN, PAGE.h - 6, { align: "right" });
  }
}

function ensureSpace(doc: jsPDF, y: number, need = 24): number {
  if (y + need > PAGE.h - 14) {
    doc.addPage();
    header(doc, "Health Analysis Report");
    return 22;
  }
  return y;
}

function sectionTitle(doc: jsPDF, y: number, label: string): number {
  y = ensureSpace(doc, y, 14);
  doc.setFillColor(240, 253, 255);
  doc.setDrawColor(BRAND.r, BRAND.g, BRAND.b);
  doc.roundedRect(MARGIN, y, PAGE.w - MARGIN * 2, 8, 1.5, 1.5, "FD");
  doc.setTextColor(8, 75, 90);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(label, MARGIN + 3, y + 5.5);
  doc.setTextColor(20, 20, 20);
  return y + 12;
}

function paragraph(doc: jsPDF, y: number, text: string, opts?: { size?: number; bold?: boolean }): number {
  if (!text) return y;
  doc.setFont("helvetica", opts?.bold ? "bold" : "normal");
  doc.setFontSize(opts?.size ?? 10);
  const lines = doc.splitTextToSize(text, PAGE.w - MARGIN * 2);
  y = ensureSpace(doc, y, lines.length * 5 + 2);
  doc.text(lines, MARGIN, y);
  return y + lines.length * 5 + 2;
}

function chips(doc: jsPDF, y: number, label: string, items?: string[]): number {
  if (!items?.length) return y;
  y = paragraph(doc, y, label, { bold: true, size: 9 });
  y = paragraph(doc, y, "• " + items.join("  • "), { size: 9 });
  return y + 1;
}

export interface ExportAnalysis {
  overview?: { patient_name?: string; report_date?: string; report_type?: string; summary_simple?: string };
  parameters?: Array<{
    name: string; your_value: string; normal_range: string; status: string;
    what_it_is?: string; why_important?: string; what_result_means?: string;
    possible_reasons?: string[];
  }>;
  medical_terms?: { term: string; definition: string; purpose: string; easy_explanation: string }[];
  health_insights?: { area: string; insight: string }[];
  nutrition?: any;
  exercise?: { beginner?: string[]; intermediate?: string[]; advanced?: string[] };
  lifestyle?: any;
  prescriptions?: { name: string; purpose: string; side_effects?: string[]; precautions?: string[] }[];
  health_score?: { score: number; band: string; explanation: string };
  doctor_questions?: string[];
  motivation?: string;
  eli10_summary?: string;
}

export function buildHealthReportPdf(a: ExportAnalysis): { doc: jsPDF; filename: string } {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const today = new Date().toISOString().slice(0, 10);
  const patient = a.overview?.patient_name || "Patient";
  const reportDate = a.overview?.report_date || today;
  const reportType = a.overview?.report_type || "Medical Report";

  // ---------- COVER ----------
  doc.setFillColor(8, 47, 73);
  doc.rect(0, 0, PAGE.w, PAGE.h, "F");
  doc.setFillColor(BRAND.r, BRAND.g, BRAND.b);
  doc.circle(PAGE.w / 2, 70, 18, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("M", PAGE.w / 2, 76, { align: "center" });

  doc.setFontSize(28);
  doc.text("MedExplain AI", PAGE.w / 2, 110, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(13);
  doc.setTextColor(180, 220, 235);
  doc.text("Personal Health Analysis Report", PAGE.w / 2, 122, { align: "center" });

  doc.setDrawColor(BRAND.r, BRAND.g, BRAND.b);
  doc.setLineWidth(0.4);
  doc.line(60, 132, PAGE.w - 60, 132);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  const meta: [string, string][] = [
    ["Patient", patient],
    ["Report Type", reportType],
    ["Report Date", reportDate],
    ["Analysis Date", today],
    ["AI Version", "MedExplain AI v2.0 (Gemini)"],
  ];
  let cy = 150;
  for (const [k, v] of meta) {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(140, 200, 215);
    doc.text(k.toUpperCase(), PAGE.w / 2 - 50, cy);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text(v, PAGE.w / 2 + 50, cy, { align: "right" });
    cy += 9;
  }

  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.setTextColor(150, 200, 215);
  const disc = doc.splitTextToSize(
    "This AI-generated report is for educational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. Please consult a qualified healthcare professional regarding any medical concerns.",
    PAGE.w - 40,
  );
  doc.text(disc, PAGE.w / 2, PAGE.h - 30, { align: "center" });

  // ---------- BODY ----------
  doc.addPage();
  header(doc, "Health Analysis Report");
  let y = 22;

  // Executive Summary
  y = sectionTitle(doc, y, "Executive Summary");
  if (a.health_score) {
    y = paragraph(doc, y, `Overall Health Score: ${a.health_score.score} / 100 — ${a.health_score.band}`, { bold: true, size: 11 });
    y = paragraph(doc, y, a.health_score.explanation || "");
  }
  if (a.overview?.summary_simple) y = paragraph(doc, y, a.overview.summary_simple);
  const positives = (a.parameters || []).filter((p) => p.status === "normal").map((p) => p.name);
  const attention = (a.parameters || []).filter((p) => p.status !== "normal").map((p) => p.name);
  if (positives.length) y = paragraph(doc, y, `Positive observations: ${positives.join(", ")}`, { size: 9 });
  if (attention.length) y = paragraph(doc, y, `Areas requiring attention: ${attention.join(", ")}`, { size: 9 });

  // Report Overview
  y = sectionTitle(doc, y, "Report Overview");
  autoTable(doc, {
    startY: y,
    theme: "plain",
    styles: { fontSize: 9, cellPadding: 1.5 },
    body: [
      ["Patient", patient],
      ["Report Type", reportType],
      ["Report Date", reportDate],
      ["Analysis Date", today],
    ],
    columnStyles: { 0: { fontStyle: "bold", textColor: [80, 80, 80], cellWidth: 40 } },
    margin: { left: MARGIN, right: MARGIN },
  });
  y = (doc as any).lastAutoTable.finalY + 6;

  // Parameter table
  if (a.parameters?.length) {
    y = sectionTitle(doc, y, "Test Results");
    const rows: RowInput[] = a.parameters.map((p) => [
      p.name,
      p.your_value,
      p.normal_range,
      STATUS_LABEL[p.status] || p.status,
    ]);
    autoTable(doc, {
      startY: y,
      head: [["Test", "Your Value", "Normal Range", "Status"]],
      body: rows,
      headStyles: { fillColor: [BRAND.r, BRAND.g, BRAND.b], textColor: 255, fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      margin: { left: MARGIN, right: MARGIN },
      didParseCell: (data) => {
        if (data.section === "body" && data.column.index === 3) {
          const p = a.parameters![data.row.index];
          const c = STATUS_COLOR[p.status] || [120, 120, 120];
          data.cell.styles.textColor = c;
          data.cell.styles.fontStyle = "bold";
        }
      },
    });
    y = (doc as any).lastAutoTable.finalY + 6;
  }

  // Medical term explanations
  if (a.medical_terms?.length) {
    y = sectionTitle(doc, y, "Medical Term Explanations");
    for (const t of a.medical_terms) {
      y = paragraph(doc, y, t.term, { bold: true, size: 10 });
      if (t.definition) y = paragraph(doc, y, `Definition: ${t.definition}`, { size: 9 });
      if (t.purpose) y = paragraph(doc, y, `Why it matters: ${t.purpose}`, { size: 9 });
      if (t.easy_explanation) y = paragraph(doc, y, `Easy explanation: ${t.easy_explanation}`, { size: 9 });
      y += 1;
    }
  }

  // Parameter detail
  if (a.parameters?.length) {
    y = sectionTitle(doc, y, "Detailed Parameter Insights");
    for (const p of a.parameters) {
      y = paragraph(doc, y, `${p.name} — ${p.your_value} (Normal: ${p.normal_range})`, { bold: true, size: 10 });
      if (p.what_it_is) y = paragraph(doc, y, `What it is: ${p.what_it_is}`, { size: 9 });
      if (p.why_important) y = paragraph(doc, y, `Why it matters: ${p.why_important}`, { size: 9 });
      if (p.what_result_means) y = paragraph(doc, y, `What your result means: ${p.what_result_means}`, { size: 9 });
      if (p.possible_reasons?.length) y = paragraph(doc, y, `Possible reasons: ${p.possible_reasons.join("; ")}`, { size: 9 });
      y += 1;
    }
  }

  // Health insights
  if (a.health_insights?.length) {
    y = sectionTitle(doc, y, "AI Health Insights");
    for (const it of a.health_insights) {
      y = paragraph(doc, y, `• ${it.area}: ${it.insight}`, { size: 10 });
    }
  }

  // Nutrition
  if (a.nutrition) {
    y = sectionTitle(doc, y, "Nutrition Recommendations");
    y = chips(doc, y, "Foods to eat", a.nutrition.foods_to_eat);
    y = chips(doc, y, "Foods to limit", a.nutrition.foods_to_limit);
    y = chips(doc, y, "Protein sources", a.nutrition.protein_sources);
    y = chips(doc, y, "Vitamins", a.nutrition.vitamin_sources);
    y = chips(doc, y, "Minerals", a.nutrition.mineral_sources);
    if (a.nutrition.hydration) y = paragraph(doc, y, `Hydration: ${a.nutrition.hydration}`, { size: 9 });
  }

  // Exercise
  if (a.exercise) {
    y = sectionTitle(doc, y, "Exercise Recommendations");
    y = chips(doc, y, "Beginner", a.exercise.beginner);
    y = chips(doc, y, "Intermediate", a.exercise.intermediate);
    y = chips(doc, y, "Advanced", a.exercise.advanced);
  }

  // Lifestyle
  if (a.lifestyle) {
    y = sectionTitle(doc, y, "Lifestyle Recommendations");
    const l = a.lifestyle;
    if (l.sleep) y = paragraph(doc, y, `Sleep: ${l.sleep}`, { size: 9 });
    if (l.stress) y = paragraph(doc, y, `Stress: ${l.stress}`, { size: 9 });
    if (l.daily_routine) y = paragraph(doc, y, `Daily routine: ${l.daily_routine}`, { size: 9 });
    if (l.hydration_goal) y = paragraph(doc, y, `Hydration goal: ${l.hydration_goal}`, { size: 9 });
    if (l.healthy_habits?.length) y = chips(doc, y, "Healthy habits", l.healthy_habits);
  }

  // Prescriptions
  if (a.prescriptions?.length) {
    y = sectionTitle(doc, y, "Medication Explanation");
    for (const m of a.prescriptions) {
      y = paragraph(doc, y, m.name, { bold: true, size: 10 });
      if (m.purpose) y = paragraph(doc, y, `Purpose: ${m.purpose}`, { size: 9 });
      if (m.side_effects?.length) y = paragraph(doc, y, `Common side effects: ${m.side_effects.join(", ")}`, { size: 9 });
      if (m.precautions?.length) y = paragraph(doc, y, `Precautions: ${m.precautions.join(", ")}`, { size: 9 });
      y += 1;
    }
  }

  // Doctor questions
  if (a.doctor_questions?.length) {
    y = sectionTitle(doc, y, "Questions to Discuss With Your Doctor");
    a.doctor_questions.forEach((q, i) => {
      y = paragraph(doc, y, `${i + 1}. ${q}`, { size: 10 });
    });
  }

  // Motivation
  if (a.motivation) {
    y = sectionTitle(doc, y, "Motivational Message");
    y = paragraph(doc, y, a.motivation, { size: 10 });
  }

  // Final disclaimer page
  y = sectionTitle(doc, y, "Medical Disclaimer");
  y = paragraph(
    doc, y,
    "This AI-generated report is for educational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.",
    { size: 9 },
  );

  footer(doc);

  const filename = safeFilename([patient, reportDate, "MedExplainAI_Report"], "pdf");
  return { doc, filename };
}

export function downloadHealthReportPdf(a: ExportAnalysis) {
  const { doc, filename } = buildHealthReportPdf(a);
  doc.save(filename);
}

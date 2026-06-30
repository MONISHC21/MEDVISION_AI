import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType,
} from "docx";
import { saveAs } from "file-saver";
import { safeFilename } from "./filename";
import type { ExportAnalysis } from "./pdfReport";

const STATUS_LABEL: Record<string, string> = {
  normal: "Normal", slightly_low: "Slightly Low", slightly_high: "Slightly High",
  high_risk: "High Risk", borderline: "Borderline", low: "Low", high: "High", critical: "Critical",
};
const STATUS_FILL: Record<string, string> = {
  normal: "D1FAE5", slightly_low: "FEF3C7", slightly_high: "FEF3C7",
  high_risk: "FEE2E2", borderline: "FEF3C7", low: "FFEDD5", high: "FEE2E2", critical: "FECACA",
};

const border = { style: BorderStyle.SINGLE, size: 4, color: "E2E8F0" };
const borders = { top: border, bottom: border, left: border, right: border };

const P = (text: string, opts: { bold?: boolean; size?: number; color?: string; italic?: boolean } = {}) =>
  new Paragraph({
    children: [new TextRun({ text, bold: opts.bold, size: opts.size ?? 22, color: opts.color, italics: opts.italic })],
    spacing: { after: 80 },
  });

const H = (text: string, level: (typeof HeadingLevel)[keyof typeof HeadingLevel] = HeadingLevel.HEADING_1) =>
  new Paragraph({
    children: [new TextRun({ text, bold: true, color: "0E7490", size: 28 })],
    heading: level,
    spacing: { before: 280, after: 120 },
  });

const cell = (text: string, fill?: string, bold = false) =>
  new TableCell({
    borders, width: { size: 25, type: WidthType.PERCENTAGE },
    shading: fill ? { fill, type: ShadingType.CLEAR, color: "auto" } : undefined,
    children: [new Paragraph({ children: [new TextRun({ text, bold, size: 20 })] })],
  });

function bulletList(items?: string[]): Paragraph[] {
  return (items ?? []).map(
    (t) => new Paragraph({ children: [new TextRun({ text: t, size: 22 })], bullet: { level: 0 } }),
  );
}

export async function downloadHealthReportDocx(a: ExportAnalysis) {
  const today = new Date().toISOString().slice(0, 10);
  const patient = a.overview?.patient_name || "Patient";
  const reportDate = a.overview?.report_date || today;
  const reportType = a.overview?.report_type || "Medical Report";

  const children: any[] = [];

  // Cover
  children.push(
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200, after: 200 },
      children: [new TextRun({ text: "MedExplain AI", bold: true, size: 56, color: "0E7490" })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 },
      children: [new TextRun({ text: "Personal Health Analysis Report", size: 28, color: "475569" })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 },
      children: [new TextRun({ text: `${patient} • ${reportType} • ${reportDate}`, size: 22 })] }),
  );

  // Executive summary
  children.push(H("Executive Summary", HeadingLevel.HEADING_1));
  if (a.health_score) {
    children.push(P(`Overall Health Score: ${a.health_score.score} / 100 — ${a.health_score.band}`, { bold: true, size: 24 }));
    if (a.health_score.explanation) children.push(P(a.health_score.explanation));
  }
  if (a.overview?.summary_simple) children.push(P(a.overview.summary_simple));

  // Overview
  children.push(H("Report Overview", HeadingLevel.HEADING_1));
  children.push(P(`Patient: ${patient}`));
  children.push(P(`Report Type: ${reportType}`));
  children.push(P(`Report Date: ${reportDate}`));
  children.push(P(`Analysis Date: ${today}`));

  // Test results table
  if (a.parameters?.length) {
    children.push(H("Test Results", HeadingLevel.HEADING_1));
    const head = new TableRow({
      tableHeader: true,
      children: ["Test", "Your Value", "Normal Range", "Status"].map((t) => cell(t, "E0F2FE", true)),
    });
    const rows = a.parameters.map(
      (p) =>
        new TableRow({
          children: [
            cell(p.name),
            cell(p.your_value),
            cell(p.normal_range),
            cell(STATUS_LABEL[p.status] || p.status, STATUS_FILL[p.status] || undefined, true),
          ],
        }),
    );
    children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [head, ...rows] }));

    children.push(H("Detailed Parameter Insights", HeadingLevel.HEADING_2));
    for (const p of a.parameters) {
      children.push(P(`${p.name} — ${p.your_value} (Normal: ${p.normal_range})`, { bold: true }));
      if (p.what_it_is) children.push(P(`What it is: ${p.what_it_is}`));
      if (p.why_important) children.push(P(`Why it matters: ${p.why_important}`));
      if (p.what_result_means) children.push(P(`What your result means: ${p.what_result_means}`));
      if (p.possible_reasons?.length) children.push(P(`Possible reasons: ${p.possible_reasons.join("; ")}`));
    }
  }

  if (a.medical_terms?.length) {
    children.push(H("Medical Term Explanations", HeadingLevel.HEADING_1));
    for (const t of a.medical_terms) {
      children.push(P(t.term, { bold: true }));
      if (t.definition) children.push(P(`Definition: ${t.definition}`));
      if (t.purpose) children.push(P(`Why it matters: ${t.purpose}`));
      if (t.easy_explanation) children.push(P(`Easy explanation: ${t.easy_explanation}`));
    }
  }

  if (a.health_insights?.length) {
    children.push(H("AI Health Insights", HeadingLevel.HEADING_1));
    children.push(...bulletList(a.health_insights.map((i) => `${i.area}: ${i.insight}`)));
  }

  if (a.nutrition) {
    children.push(H("Nutrition Recommendations", HeadingLevel.HEADING_1));
    if (a.nutrition.foods_to_eat) { children.push(P("Foods to eat", { bold: true })); children.push(...bulletList(a.nutrition.foods_to_eat)); }
    if (a.nutrition.foods_to_limit) { children.push(P("Foods to limit", { bold: true })); children.push(...bulletList(a.nutrition.foods_to_limit)); }
    if (a.nutrition.protein_sources) { children.push(P("Protein sources", { bold: true })); children.push(...bulletList(a.nutrition.protein_sources)); }
    if (a.nutrition.vitamin_sources) { children.push(P("Vitamins", { bold: true })); children.push(...bulletList(a.nutrition.vitamin_sources)); }
    if (a.nutrition.mineral_sources) { children.push(P("Minerals", { bold: true })); children.push(...bulletList(a.nutrition.mineral_sources)); }
    if (a.nutrition.hydration) children.push(P(`Hydration: ${a.nutrition.hydration}`));
  }

  if (a.exercise) {
    children.push(H("Exercise Recommendations", HeadingLevel.HEADING_1));
    if (a.exercise.beginner) { children.push(P("Beginner", { bold: true })); children.push(...bulletList(a.exercise.beginner)); }
    if (a.exercise.intermediate) { children.push(P("Intermediate", { bold: true })); children.push(...bulletList(a.exercise.intermediate)); }
    if (a.exercise.advanced) { children.push(P("Advanced", { bold: true })); children.push(...bulletList(a.exercise.advanced)); }
  }

  if (a.lifestyle) {
    children.push(H("Lifestyle Recommendations", HeadingLevel.HEADING_1));
    const l = a.lifestyle;
    if (l.sleep) children.push(P(`Sleep: ${l.sleep}`));
    if (l.stress) children.push(P(`Stress: ${l.stress}`));
    if (l.daily_routine) children.push(P(`Daily routine: ${l.daily_routine}`));
    if (l.hydration_goal) children.push(P(`Hydration goal: ${l.hydration_goal}`));
    if (l.healthy_habits?.length) { children.push(P("Healthy habits", { bold: true })); children.push(...bulletList(l.healthy_habits)); }
  }

  if (a.prescriptions?.length) {
    children.push(H("Medication Explanation", HeadingLevel.HEADING_1));
    for (const m of a.prescriptions) {
      children.push(P(m.name, { bold: true }));
      if (m.purpose) children.push(P(`Purpose: ${m.purpose}`));
      if (m.side_effects?.length) children.push(P(`Side effects: ${m.side_effects.join(", ")}`));
      if (m.precautions?.length) children.push(P(`Precautions: ${m.precautions.join(", ")}`));
    }
  }

  if (a.doctor_questions?.length) {
    children.push(H("Questions to Discuss With Your Doctor", HeadingLevel.HEADING_1));
    a.doctor_questions.forEach((q, i) => children.push(P(`${i + 1}. ${q}`)));
  }

  if (a.motivation) {
    children.push(H("Motivational Message", HeadingLevel.HEADING_1));
    children.push(P(a.motivation, { italic: true }));
  }

  children.push(H("Medical Disclaimer", HeadingLevel.HEADING_1));
  children.push(
    P(
      "This AI-generated report is for educational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. Please consult a qualified healthcare professional regarding any medical concerns.",
      { italic: true, color: "78350F" },
    ),
  );

  const doc = new Document({ sections: [{ children }] });
  const blob = await Packer.toBlob(doc);
  saveAs(blob, safeFilename([patient, reportDate, "MedExplainAI_Report"], "docx"));
}

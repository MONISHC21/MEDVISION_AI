import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { safeFilename } from "../export/filename";
import type { ComparisonResult } from "./compareReports";

const BRAND = { r: 6, g: 182, b: 212 };
const PAGE = { w: 210, h: 297 };
const MARGIN = 14;

const TREND_TEXT: Record<string, string> = {
  improved: "Improved", stable: "Stable",
  slightly_worse: "Slightly worse", significantly_worse: "Significantly worse", unknown: "—",
};
const TREND_COLOR: Record<string, [number, number, number]> = {
  improved: [16, 185, 129], stable: [56, 189, 248],
  slightly_worse: [245, 158, 11], significantly_worse: [239, 68, 68], unknown: [120, 120, 120],
};

function header(doc: jsPDF) {
  doc.setFillColor(BRAND.r, BRAND.g, BRAND.b);
  doc.rect(0, 0, PAGE.w, 12, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("MedExplain AI — Progress Report", MARGIN, 8);
  doc.setTextColor(20, 20, 20);
}

function sectionTitle(doc: jsPDF, y: number, label: string): number {
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

function para(doc: jsPDF, y: number, text: string, size = 10): number {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(size);
  const lines = doc.splitTextToSize(text, PAGE.w - MARGIN * 2);
  if (y + lines.length * 5 + 4 > PAGE.h - 14) { doc.addPage(); header(doc); y = 22; }
  doc.text(lines, MARGIN, y);
  return y + lines.length * 5 + 2;
}

export function downloadProgressReportPdf(c: ComparisonResult, patient: string) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  header(doc);
  let y = 22;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Health Progress Report", MARGIN, y);
  y += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text(`${patient} — Comparing ${c.previousDate} → ${c.currentDate}`, MARGIN, y);
  doc.setTextColor(20, 20, 20);
  y += 10;

  // Overview tile
  doc.setFillColor(236, 254, 255);
  doc.setDrawColor(165, 243, 252);
  doc.roundedRect(MARGIN, y, PAGE.w - MARGIN * 2, 22, 2, 2, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(14, 116, 144);
  doc.text(`${c.progressScore}/100`, MARGIN + 6, y + 14);
  doc.setFontSize(11);
  doc.text(c.band, MARGIN + 50, y + 10);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  doc.text(`Improved: ${c.improved.length}   Stable: ${c.stable.length}   Needs attention: ${c.worsened.length}`, MARGIN + 50, y + 17);
  doc.setTextColor(20, 20, 20);
  y += 28;

  y = sectionTitle(doc, y, "Summary");
  y = para(doc, y, c.summary);

  y = sectionTitle(doc, y, "Parameter Comparison");
  autoTable(doc, {
    startY: y,
    head: [["Parameter", "Previous", "Current", "Normal", "Change", "Trend"]],
    body: c.rows.map((r) => [r.name, r.previous, r.current, r.normal, r.delta, TREND_TEXT[r.trend]]),
    headStyles: { fillColor: [BRAND.r, BRAND.g, BRAND.b], textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    margin: { left: MARGIN, right: MARGIN },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 5) {
        const trend = c.rows[data.row.index].trend;
        const col = TREND_COLOR[trend];
        if (col) { data.cell.styles.textColor = col; data.cell.styles.fontStyle = "bold"; }
      }
    },
  });
  y = (doc as any).lastAutoTable.finalY + 6;

  y = sectionTitle(doc, y, "Trend Explanations");
  for (const r of c.rows) y = para(doc, y, `• ${r.explanation}`, 9);

  if (c.improved.length) { y = sectionTitle(doc, y, "Health Improvements"); y = para(doc, y, c.improved.join(", ")); }
  if (c.stable.length)   { y = sectionTitle(doc, y, "Stable Parameters");   y = para(doc, y, c.stable.join(", ")); }
  if (c.worsened.length) { y = sectionTitle(doc, y, "Areas Requiring Attention"); y = para(doc, y, c.worsened.join(", ")); }

  y = sectionTitle(doc, y, "Personalized Next Steps");
  for (const step of c.nextSteps) y = para(doc, y, `• ${step}`, 10);

  y = sectionTitle(doc, y, "Disclaimer");
  y = para(
    doc, y,
    "This AI-generated progress report is for educational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. Please consult a qualified healthcare professional regarding any medical concerns.",
    9,
  );

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(`Page ${i} / ${pages}`, PAGE.w - MARGIN, PAGE.h - 6, { align: "right" });
  }

  doc.save(safeFilename([patient, c.currentDate, "MedExplainAI_Progress"], "pdf"));
}

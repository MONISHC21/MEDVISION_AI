import { useState } from "react";
import { FileDown, FileText, Globe, Printer, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { downloadHealthReportPdf, type ExportAnalysis } from "./pdfReport";
import { downloadHealthReportHtml, printHealthReport } from "./htmlReport";
import { downloadHealthReportDocx } from "./docxReport";

export const ReportExportBar = ({ analysis }: { analysis: ExportAnalysis }) => {
  const [busy, setBusy] = useState<string | null>(null);

  const wrap = async (key: string, fn: () => void | Promise<void>, ok: string) => {
    setBusy(key);
    try { await fn(); toast.success(ok); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Export failed."); }
    finally { setBusy(null); }
  };

  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-2 text-sm font-medium pr-2">
        <FileDown className="w-4 h-4 text-primary" />
        Download report
      </div>
      <Button size="sm" variant="hero" disabled={!!busy} onClick={() => wrap("pdf", () => downloadHealthReportPdf(analysis), "PDF downloaded")}>
        {busy === "pdf" ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />} PDF
      </Button>
      <Button size="sm" variant="ghost-glow" disabled={!!busy} onClick={() => wrap("docx", () => downloadHealthReportDocx(analysis), "DOCX downloaded")}>
        {busy === "docx" ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />} DOCX
      </Button>
      <Button size="sm" variant="ghost-glow" disabled={!!busy} onClick={() => wrap("html", () => downloadHealthReportHtml(analysis), "HTML downloaded")}>
        {busy === "html" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />} HTML
      </Button>
      <Button size="sm" variant="ghost" disabled={!!busy} onClick={() => wrap("print", () => printHealthReport(analysis), "Print dialog opened")}>
        {busy === "print" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />} Print
      </Button>
    </div>
  );
};

import { ShieldAlert } from "lucide-react";

export const SafetyDisclaimer = ({ compact = false }: { compact?: boolean }) => (
  <div
    className={`glass rounded-xl border border-amber-500/30 bg-amber-500/5 flex gap-3 ${
      compact ? "p-3 text-xs" : "p-4 text-sm"
    }`}
    role="note"
  >
    <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
    <p className="text-amber-100/90 leading-relaxed">
      <span className="font-semibold text-amber-200">Educational only.</span>{" "}
      AI-generated information is not medical advice, diagnosis, or treatment. Always consult a qualified healthcare professional.
    </p>
  </div>
);

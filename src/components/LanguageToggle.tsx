import { Globe, Baby } from "lucide-react";

export type Lang = "en" | "hi" | "ta" | "te" | "ml";

export const LANGUAGES: { value: Lang; label: string }[] = [
  { value: "en", label: "English" },
  { value: "hi", label: "हिन्दी" },
  { value: "ta", label: "தமிழ்" },
  { value: "te", label: "తెలుగు" },
  { value: "ml", label: "മലയാളം" },
];

interface Props {
  language: Lang;
  setLanguage: (l: Lang) => void;
  eli10: boolean;
  setEli10: (v: boolean) => void;
}

export const LanguageToggle = ({ language, setLanguage, eli10, setEli10 }: Props) => (
  <div className="flex flex-wrap items-center gap-3">
    <div className="flex items-center gap-2 glass rounded-lg px-3 py-2">
      <Globe className="w-4 h-4 text-primary" />
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as Lang)}
        className="bg-transparent text-sm outline-none cursor-pointer"
        aria-label="Response language"
      >
        {LANGUAGES.map((l) => (
          <option key={l.value} value={l.value} className="bg-card">
            {l.label}
          </option>
        ))}
      </select>
    </div>

    <button
      type="button"
      onClick={() => setEli10(!eli10)}
      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm border transition-all ${
        eli10
          ? "bg-primary/15 border-primary/60 text-primary"
          : "glass border-border hover:border-primary/40"
      }`}
      aria-pressed={eli10}
    >
      <Baby className="w-4 h-4" />
      Explain like I'm 10
    </button>
  </div>
);

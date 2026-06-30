import { useEffect, useRef, useState } from "react";
import { MessageSquare, Send, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Lang } from "./LanguageToggle";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "What does my report mean?",
  "Why is this value abnormal?",
  "What foods should I eat?",
  "What should I ask my doctor?",
];

interface Props {
  language: Lang;
  eli10: boolean;
  reportContext: string; // stringified analysis JSON
}

export const ReportChat = ({ language, eli10, reportContext }: Props) => {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text: string) => {
    const value = text.trim();
    if (!value || loading) return;
    const next: Msg[] = [...messages, { role: "user", content: value }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("medical-ai", {
        body: {
          mode: "report_chat",
          language,
          eli10,
          report_context: reportContext,
          messages: next,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setMessages((m) => [...m, { role: "assistant", content: data.reply ?? "" }]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Chat failed.");
      setMessages(next);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-6 rounded-xl border border-primary/20 bg-primary/5 p-4 md:p-5">
      <div className="flex items-center gap-2 mb-3">
        <MessageSquare className="w-4 h-4 text-primary" />
        <h4 className="font-semibold">Ask about this report</h4>
      </div>

      <div ref={scrollRef} className="max-h-72 overflow-y-auto space-y-2 mb-3 pr-1">
        {messages.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Ask anything about your analyzed report — values, terms, food, lifestyle, or doctor questions.
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`text-sm rounded-lg p-3 ${
              m.role === "user"
                ? "bg-primary/15 border border-primary/30 ml-6"
                : "bg-secondary/50 border border-border mr-6"
            }`}
          >
            {m.content}
          </div>
        ))}
        {loading && (
          <div className="text-sm rounded-lg p-3 bg-secondary/50 border border-border mr-6 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-primary" /> Thinking…
          </div>
        )}
      </div>

      {messages.length === 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => send(s)}
              disabled={loading}
              className="text-xs px-3 py-1.5 rounded-full border border-border/60 hover:border-primary/50 hover:text-primary transition-colors disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => { e.preventDefault(); send(input); }}
        className="flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your report…"
          maxLength={500}
          className="flex-1 bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/60 transition-colors"
        />
        <Button type="submit" variant="hero" size="sm" disabled={loading || !input.trim()}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </form>
      <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
        <Sparkles className="w-3 h-3" /> Educational only — not medical advice.
      </p>
    </div>
  );
};

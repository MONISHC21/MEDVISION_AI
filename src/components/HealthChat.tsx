import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Lang } from "./LanguageToggle";

type Msg = { role: "user" | "assistant"; content: string };

const SAMPLE_QUESTIONS = [
  "What lifestyle changes lower cholesterol?",
  "What does high TSH usually mean?",
  "Which foods are rich in iron?",
];

interface Props {
  language: Lang;
  eli10: boolean;
}

export const HealthChat = ({ language, eli10 }: Props) => {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);
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
        body: { mode: "chat", messages: next, language, eli10 },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setMessages([...next, { role: "assistant", content: String(data.reply ?? "") }]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Chat failed.";
      toast.error(msg);
      setMessages(next.slice(0, -1));
      setInput(value);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  return (
    <div className="glass rounded-2xl p-6 md:p-8 flex flex-col h-[560px]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-semibold">AI Health Chat</h3>
            <p className="text-sm text-muted-foreground">Ask general health & wellness questions.</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            type="button"
            onClick={() => setMessages([])}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear
          </button>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto pr-1 space-y-3 mb-3">
        {messages.length === 0 && (
          <div className="text-center text-sm text-muted-foreground py-6">
            <p className="mb-3">Start with a question:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {SAMPLE_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="text-xs px-3 py-1.5 rounded-full border border-border/60 hover:border-primary/50 hover:text-primary transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap leading-relaxed ${
                m.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-sm"
                  : "bg-secondary/70 border border-border rounded-bl-sm"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-secondary/70 border border-border rounded-2xl rounded-bl-sm px-4 py-3">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
            </div>
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); send(input); }}
        className="flex gap-2"
      >
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about symptoms, nutrition, lifestyle…"
          maxLength={500}
          className="flex-1 bg-secondary/50 border border-border rounded-lg px-4 py-3 text-sm outline-none focus:border-primary/60 transition-colors"
          disabled={loading}
        />
        <Button type="submit" variant="hero" size="default" disabled={loading || !input.trim()}>
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
};

// Edge Function: medical-ai
// Hybrid companion features for MedVision AI landing page.
// Modes:
//   - "explain":     explain a medical term in structured JSON
//   - "chat":        general health Q&A
//   - "analyze":     analyze report (text OR uploaded PDF/image) → structured JSON
//   - "report_chat": contextual chat scoped to a previously analyzed report

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const LANG_NAMES: Record<string, string> = {
  en: "English", hi: "Hindi", ta: "Tamil", te: "Telugu", ml: "Malayalam",
};

const DISCLAIMER =
  "AI-generated information is for educational purposes only and is not medical advice, diagnosis, or treatment. Always consult a qualified healthcare professional.";

type ChatMessage = { role: "user" | "assistant" | "system"; content: any };

function buildSystemPrompt(opts: {
  language?: string;
  eli10?: boolean;
  mode: "explain" | "chat" | "analyze" | "report_chat";
  reportContext?: string;
}) {
  const langName = LANG_NAMES[opts.language ?? "en"] ?? "English";
  const audience = opts.eli10
    ? "Use very simple language that a 10-year-old child can understand. Use short sentences, analogies, and avoid jargon."
    : "Use clear, patient-friendly language. Avoid heavy clinical jargon; briefly explain any medical term you must use.";

  const base = `You are MedExplain AI, the educational health-literacy assistant inside the MedVision AI platform.

LANGUAGE: Respond ENTIRELY in ${langName}. Field keys in JSON stay in English; all human-readable values are in ${langName}.
AUDIENCE: ${audience}
SAFETY RULES (non-negotiable):
- You are NOT a doctor. Never diagnose, prescribe, or give dosing advice.
- For symptoms suggesting emergency (chest pain, stroke signs, severe bleeding, suicidal thoughts), tell the user to seek emergency care immediately.
- Always frame information as educational. Recommend consulting a qualified healthcare professional for personal decisions.
- If you detect critical values (e.g. very high glucose, very low hemoglobin, dangerous BP/potassium), clearly flag them and advise prompt evaluation.`;

  if (opts.mode === "analyze") {
    return `${base}

TASK: Analyze a medical lab/health report. You may receive it as raw text OR as an attached PDF/image (perform OCR yourself from the attachment). Return STRICT JSON only, no markdown, no commentary, matching exactly:
{
  "overview": {
    "patient_name": string, "report_date": string, "report_type": string,
    "summary_simple": string
  },
  "parameters": [
    { "name": string, "your_value": string, "normal_range": string,
      "status": "normal" | "slightly_low" | "slightly_high" | "high_risk",
      "what_it_is": string, "why_important": string, "what_result_means": string,
      "possible_reasons": string[] }
  ],
  "medical_terms": [{ "term": string, "definition": string, "purpose": string, "easy_explanation": string }],
  "health_insights": [{ "area": string, "insight": string }],
  "nutrition": {
    "foods_to_eat": string[], "foods_to_limit": string[], "protein_sources": string[],
    "vitamin_sources": string[], "mineral_sources": string[], "hydration": string
  },
  "exercise": { "beginner": string[], "intermediate": string[], "advanced": string[] },
  "lifestyle": {
    "sleep": string, "stress": string, "daily_routine": string,
    "hydration_goal": string, "healthy_habits": string[]
  },
  "prescriptions": [{ "name": string, "purpose": string, "side_effects": string[], "precautions": string[] }],
  "health_score": { "score": number, "band": "Excellent" | "Good" | "Moderate" | "Needs Attention", "explanation": string },
  "doctor_questions": string[],
  "motivation": string
}
Rules:
- NEVER diagnose or prescribe. Educational framing only.
- Use "N/A" or empty arrays where info is missing.
- Personalize nutrition/exercise/lifestyle to the abnormal values found.
- All human-readable strings in ${langName}; JSON keys stay English.`;
  }

  if (opts.mode === "explain") {
    return `${base}

TASK: Explain a single medical term. Return STRICT JSON only, no markdown, matching:
{
  "term": string, "what_it_is": string, "simple_explanation": string,
  "why_it_matters": string, "normal_function": string, "normal_range": string,
  "possible_reasons_abnormal": string[], "lifestyle_tips": string[]
}
Use "N/A" where a field doesn't apply.`;
  }

  if (opts.mode === "report_chat") {
    const ctx = (opts.reportContext ?? "").slice(0, 8000);
    return `${base}

TASK: Answer the user's question about THEIR previously analyzed medical report. The structured report JSON is below — ground every answer in it. If the question is not covered by the report, say so and give general educational guidance. Keep answers under ~180 words. End with a short reminder to consult a healthcare professional.

REPORT JSON:
${ctx}`;
  }

  return `${base}

TASK: Answer the user's general health question conversationally. Keep answers focused and concise (under ~180 words unless asked for detail). End every answer with a short reminder to consult a healthcare professional.`;
}

function buildAnalyzeUserContent(body: any): any {
  const text = String(body.report_text ?? "").trim();
  const file = body.file as { mime?: string; data_base64?: string; name?: string } | undefined;

  if (file?.data_base64 && file?.mime) {
    const mime = file.mime;
    const dataUrl = `data:${mime};base64,${file.data_base64}`;
    const parts: any[] = [
      { type: "text", text: text
        ? `Analyze this attached medical report. Additional notes from user:\n${text}`
        : "Analyze this attached medical report. Perform OCR and produce the structured JSON described in the system prompt." }
    ];
    if (mime.startsWith("image/")) {
      parts.push({ type: "image_url", image_url: { url: dataUrl } });
    } else {
      // PDF or other document
      parts.push({
        type: "file",
        file: { filename: file.name || "report.pdf", file_data: dataUrl },
      });
    }
    return parts;
  }

  return `Analyze this medical report text:\n\n${text}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "AI is not configured." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const mode: "explain" | "chat" | "analyze" | "report_chat" =
      body.mode === "chat" ? "chat"
      : body.mode === "analyze" ? "analyze"
      : body.mode === "report_chat" ? "report_chat"
      : "explain";
    const language: string = typeof body.language === "string" ? body.language : "en";
    const eli10: boolean = !!body.eli10;

    const system = buildSystemPrompt({
      mode, language, eli10,
      reportContext: mode === "report_chat" ? (typeof body.report_context === "string" ? body.report_context : "") : undefined,
    });

    let messages: ChatMessage[] = [{ role: "system", content: system }];
    let useJson = false;

    if (mode === "explain") {
      const term = String(body.term ?? "").trim();
      if (!term) return json({ error: "Missing 'term'." }, 400);
      if (term.length > 120) return json({ error: "Term too long." }, 400);
      useJson = true;
      messages.push({ role: "user", content: `Explain the medical term: "${term}"` });
    } else if (mode === "analyze") {
      const text = String(body.report_text ?? "").trim();
      const hasFile = !!(body.file && body.file.data_base64 && body.file.mime);
      if (!text && !hasFile) return json({ error: "Provide report_text or file." }, 400);
      if (text.length > 20000) return json({ error: "Report text too long (max 20,000 chars)." }, 400);
      if (hasFile && typeof body.file.data_base64 === "string" && body.file.data_base64.length > 12_000_000) {
        return json({ error: "File too large (max ~9MB)." }, 400);
      }
      useJson = true;
      messages.push({ role: "user", content: buildAnalyzeUserContent(body) });
    } else if (mode === "report_chat") {
      const history = Array.isArray(body.messages) ? body.messages : [];
      const safe: ChatMessage[] = history
        .filter((m: any) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
        .slice(-12)
        .map((m: any) => ({ role: m.role, content: String(m.content).slice(0, 4000) }));
      if (!safe.length || safe[safe.length - 1].role !== "user") {
        return json({ error: "Last message must be from user." }, 400);
      }
      messages = [{ role: "system", content: system }, ...safe];
    } else {
      const history = Array.isArray(body.messages) ? body.messages : [];
      const safe: ChatMessage[] = history
        .filter((m: any) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
        .slice(-12)
        .map((m: any) => ({ role: m.role, content: String(m.content).slice(0, 4000) }));
      if (!safe.length || safe[safe.length - 1].role !== "user") {
        return json({ error: "Last message must be from user." }, 400);
      }
      messages = [{ role: "system", content: system }, ...safe];
    }

    const gatewayRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages,
        ...(useJson ? { response_format: { type: "json_object" } } : {}),
      }),
    });

    if (!gatewayRes.ok) {
      const errText = await gatewayRes.text();
      let userMsg = "AI request failed.";
      if (gatewayRes.status === 429) userMsg = "Rate limit reached. Please try again in a moment.";
      else if (gatewayRes.status === 402) userMsg = "AI credits exhausted. Please add credits in your workspace.";
      console.error("Gateway error", gatewayRes.status, errText);
      return json({ error: userMsg }, gatewayRes.status);
    }

    const data = await gatewayRes.json();
    const content: string = data?.choices?.[0]?.message?.content ?? "";

    if (mode === "explain") {
      const parsed = tryParseJson(content);
      return json({ explanation: parsed ?? { raw: content }, disclaimer: DISCLAIMER });
    }
    if (mode === "analyze") {
      const parsed = tryParseJson(content);
      return json({ analysis: parsed ?? { raw: content }, disclaimer: DISCLAIMER });
    }
    return json({ reply: content, disclaimer: DISCLAIMER });
  } catch (err) {
    console.error("medical-ai error", err);
    return json({ error: "Unexpected server error." }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
function tryParseJson(s: string): unknown {
  try { return JSON.parse(s); } catch { /* noop */ }
  const m = s.match(/\{[\s\S]*\}/);
  if (m) { try { return JSON.parse(m[0]); } catch { /* noop */ } }
  return null;
}

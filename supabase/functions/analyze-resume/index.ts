import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import * as UnPDF from "https://esm.sh/unpdf@0.11.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const GROQ_MODELS = [
  "llama-3.3-70b-versatile",
  "llama3-70b-8192",
  "llama3-8b-8192",
];

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

const SYSTEM_PROMPT = `You are a senior technical recruiter and ATS expert with 15+ years of experience at FAANG companies and top-tier startups.
Evaluate the resume exactly like enterprise ATS systems and senior recruiters — critically, precisely, without generic feedback.

Scoring rules:
- overall_score: weighted average (ATS 30%, Keyword 30%, Formatting 20%, Impact 20%). 90+ is rare.
- ats_compatibility: penalize tables, text boxes, columns, headers/footers, graphics that break ATS parsing.
- keyword_match: if a job description is provided, score against it. Without a JD, evaluate general tech industry keywords.
- formatting: check section order (Contact → Summary → Experience → Education → Skills), date formats, bullet alignment.
- impact_quantification: what % of experience bullets include numbers, metrics, or measurable outcomes?
- section_analysis: evaluate Contact Info, Summary/Objective, Work Experience, Projects, Education, Skills, Certifications. Mark missing if absent.
- weak_bullets: identify 2–4 weakest bullets. Rewrites MUST start with an action verb and include at least one metric.
- suggestions: exactly 4–6 specific, prioritized, actionable items. No generic advice.
- executive_summary: 2–3 sentence professional assessment a hiring manager would read.
- experience_level: infer from seniority and scope of responsibilities, not just years.

You MUST respond with ONLY a valid JSON object — no prose, no markdown, no code fences.

JSON schema:
{
  "executive_summary": "string",
  "experience_level": "Internship" | "Entry Level" | "Mid Level" | "Senior" | "Lead / Staff" | "Executive",
  "overall_score": integer (0-100),
  "category_scores": {
    "ats_compatibility": integer (0-100),
    "keyword_match": integer (0-100),
    "formatting": integer (0-100),
    "impact_quantification": integer (0-100)
  },
  "section_analysis": [
    { "section": "string", "status": "present" | "missing" | "weak" | "strong", "feedback": "string" }
  ],
  "matched_keywords": ["string"],
  "missing_keywords": ["string"],
  "formatting_issues": ["string"],
  "weak_bullets": [{ "original": "string", "suggestion": "string" }],
  "suggestions": ["string"]
}`;

// ── PDF extraction using unpdf (Mozilla PDF.js, works in Deno) ─────────────
async function extractPdfText(buffer: ArrayBuffer): Promise<string> {
  try {
    const { extractText, getDocumentProxy } = UnPDF;
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const { text } = await extractText(pdf, { mergePages: true });
    return text.trim();
  } catch (err) {
    console.error("[extract-pdf] unpdf failed:", err);
    return "";
  }
}

// ── DOCX extraction — unzip and pull text from word/document.xml ───────────
async function extractDocxText(buffer: ArrayBuffer): Promise<string> {
  try {
    // DOCX is a ZIP. Use DecompressionStream to unzip and find document.xml
    // Deno has no native unzip, but we can use fflate via esm.sh
    const { unzipSync } = await import("https://esm.sh/fflate@0.8.2");
    const unzipped = unzipSync(new Uint8Array(buffer));

    const xmlFile = unzipped["word/document.xml"];
    if (!xmlFile) return "";

    const xml = new TextDecoder().decode(xmlFile);
    // Strip XML tags and decode entities
    const text = xml
      .replace(/<w:br[^/]*/g, "\n")
      .replace(/<w:p[ >][^>]*>/g, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#x[0-9A-Fa-f]+;/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    return text;
  } catch (err) {
    console.error("[extract-docx] failed:", err);
    return "";
  }
}

// ── Groq inference ─────────────────────────────────────────────────────────
async function callGroq(
  apiKey: string,
  resumeText: string,
  jobDescription: string,
): Promise<Record<string, unknown>> {
  const userMessage = jobDescription
    ? `Resume text:\n---\n${resumeText}\n---\n\nJob Description:\n---\n${jobDescription}\n---\n\nAnalyze this resume against the job description and return the JSON.`
    : `Resume text:\n---\n${resumeText}\n---\n\nAnalyze this resume and return the JSON.`;

  const lastErrors: string[] = [];

  for (const model of GROQ_MODELS) {
    console.log(`[analyze-resume] Trying: ${model}`);
    try {
      const response = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userMessage },
          ],
          temperature: 0.1,
          max_tokens: 4096,
          response_format: { type: "json_object" },
        }),
      });

      const responseText = await response.text();

      if (response.status === 429) {
        console.warn(`[analyze-resume] ${model} rate limited, trying next…`);
        lastErrors.push(`${model}: rate limited`);
        continue;
      }

      if (!response.ok) {
        console.error(`[analyze-resume] ${model} ${response.status}: ${responseText}`);
        lastErrors.push(`${model}: HTTP ${response.status}`);
        continue;
      }

      const data = JSON.parse(responseText);
      const content = data?.choices?.[0]?.message?.content;
      if (!content) {
        lastErrors.push(`${model}: empty response`);
        continue;
      }

      const result = JSON.parse(content.trim());
      console.log(`[analyze-resume] Success: ${model}`);
      return result;

    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[analyze-resume] ${model}:`, msg);
      lastErrors.push(`${model}: ${msg}`);
    }
  }

  throw new Error(`All models failed: ${lastErrors.join(" | ")}`);
}

// ── Main handler ───────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const respond = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    if (!GROQ_API_KEY) {
      return respond({
        error: "CONFIG_ERROR",
        details: "GROQ_API_KEY is not set. Run: npx supabase secrets set GROQ_API_KEY=<your_key>",
      }, 500);
    }

    const contentType = req.headers.get("content-type") ?? "";
    if (!contentType.includes("multipart/form-data")) {
      return respond({ error: "INVALID_REQUEST", details: "Send multipart/form-data with a 'file' field." }, 400);
    }

    const formData = await req.formData();
    const file = formData.get("file");
    const jobDescription = (
      (formData.get("job_description") as string) ??
      (formData.get("jobDescription") as string) ??
      ""
    ).slice(0, 6000);

    if (!(file instanceof File)) {
      return respond({ error: "INVALID_FILE", details: "No resume file found in the 'file' field." }, 400);
    }

    const fileName = file.name.toLowerCase();
    const isPdf = fileName.endsWith(".pdf") || file.type === "application/pdf";
    const isDocx = fileName.endsWith(".docx") || file.type.includes("officedocument") || file.type.includes("word");

    if (!isPdf && !isDocx) {
      return respond({ error: "INVALID_FILE", details: "Only PDF and DOCX files are supported." }, 400);
    }

    const arrayBuffer = await file.arrayBuffer();
    if (arrayBuffer.byteLength < 100) {
      return respond({ error: "EMPTY_FILE", details: "File is empty or too small." }, 422);
    }

    // Extract text using proper parsers
    let resumeText = "";
    if (isPdf) {
      resumeText = await extractPdfText(arrayBuffer);
    } else {
      resumeText = await extractDocxText(arrayBuffer);
    }

    console.log(`[analyze-resume] Extracted ${resumeText.length} chars from ${isPdf ? "PDF" : "DOCX"}`);

    if (resumeText.trim().length < 100) {
      return respond({
        error: "PARSE_FAILED",
        details: "Could not extract readable text from this file. If it's a PDF, make sure it's not a scanned image — try selecting/copying text in the PDF to confirm. If it's a DOCX, try re-saving it from Microsoft Word.",
      }, 422);
    }

    // Cap to ~12k chars to stay within Groq context limits
    if (resumeText.length > 12000) resumeText = resumeText.slice(0, 12000) + "\n... [truncated]";

    const result = await callGroq(GROQ_API_KEY, resumeText, jobDescription);
    return respond(result);

  } catch (err) {
    console.error("[analyze-resume] Fatal:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message.toLowerCase().includes("rate limit")) {
      return respond({ error: "RATE_LIMITED", details: "All models rate limited. Wait 60 seconds and retry." }, 429);
    }
    return respond({ error: "SERVER_ERROR", details: message }, 500);
  }
});

// @ts-nocheck
/* eslint-disable */
// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import * as UnPDF from "https://esm.sh/unpdf@0.11.0";

declare const Deno: any;
declare const File: any;

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

const SYSTEM_PROMPT = `You are a senior technical recruiter and ATS evaluation engine.
Evaluate the resume strictly against the facts present in the text provided. Do not invent skills, tools, employers, or metrics.

STRICT GROUNDING RULES:
1. No percentile or ranking claims (e.g. do not say "top 5%" or "top tier" or "top recruiters favor").
2. Bullet rewrites: Choose ONLY from the provided candidate bullets by bullet_id. Never quote fragments.
   - Do NOT rewrite any bullet that already contains numbers or metrics.
   - The suggested rewrite must keep only facts in the original bullet.
   - Write [ADD YOUR OWN NUMBER] instead of inventing numbers.
   - Do not add new content words (such as "efficiency", "workflows", "operational").
   - Do not use "Architected", "Engineered", or "Spearheaded" unless the original describes design or leadership.
   - If every bullet in the resume already has numbers, return "weak_bullets": [].
3. Every recommendation item MUST carry an "evidence_quote" copied verbatim from the resume text (must be a full bullet or measured data point).
   - Only recommend "add quantified metrics" for bullets that contain NO digits.
4. Missing keywords: suggest only if present in the target job description and absent from the resume text. If no job description is provided, return an empty missing_keywords array.
5. Section Analysis: Card descriptions must describe the resume facts directly (e.g. "LeetCode and HackerRank problems solved: 250+"), and must NOT repeat rules or internal instructions.
6. Scores: compute consistent, objective category ratings based strictly on text evidence.

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
  "weak_bullets": [{ "bullet_id": "string", "suggestion": "string" }],
  "suggestions": [{ "advice": "string", "evidence_quote": "string" }]
}`;

// ── Bullet splitting helpers (Whole bullets with IDs) ──────────────────────
const SECTION_HEADINGS = [
  { section: 'summary', regex: /^(?:(?:professional|career|executive|personal)?\s*(?:summary|profile)(?:\s+of\s+qualifications)?|about\s+me|(?:career|professional)?\s*objective)\b/i },
  { section: 'education', regex: /^(?:education(?:\s*(?:&|and)\s*(?:degree|qualifications|training))?|academic\s+(?:background|details|qualifications)|educational\s+qualifications|qualifications)\b/i },
  { section: 'skills', regex: /^(?:technical\s+skills|skills(?:\s*(?:&|and)\s*(?:technologies|tools|proficiencies|abilities))?|core\s+competencies|key\s+competencies|competencies|areas\s+of\s+expertise|technical\s+(?:proficiencies|stack|expertise|tools)|core\s+skills|key\s+skills|technologies|tools\s*&?\s*skills|technical\s+tools|languages\s*(?:&|and)\s*frameworks)\b/i },
  { section: 'projects', regex: /^(?:(?:personal|academic|key|selected|technical|software|featured|notable|engineering|coursework|open\s+source)?\s*projects|portfolio)\b/i },
  { section: 'experience', regex: /^(?:(?:work|professional|relevant|practical|career|employment)\s+(?:experience|history)|experience|employment(?:\s+history)?|work\s+history|professional\s+background|internships?(?:\s+experience)?|industrial\s+training)\b/i },
  { section: 'achievements', regex: /^(?:achievements(?:\s*(?:&|and)\s*(?:certifications|awards|honors))?|certifications?(?:\s*(?:&|and)\s*(?:licenses|certificates|training|credentials))?|certificates?|licenses(?:\s*(?:&|and)\s*certifications)?|awards|honors|competitive\s+achievements|accomplishments)\b/i }
];

const ACTION_VERBS = /^(?:designed|developed|built|reduced|implemented|created|processed|fixed|integrated|solved|participated|completed|used|architected|spearheaded|engineered|led|organized|authored|collaborated|conducted|managed|trained|optimized|deployed|automated|maintained|assisted|analyzed|delivered|tested|configured|refactored|improved|supported|established|facilitated|executed|monitored|programmed|debugged|researched|generated|achieved|coordinated|produced|worked|helped|wrote|contributed|oversaw|directed|formulated|evaluated|launched|streamlined|accelerated|pioneered|applied|structured)\b/i;

function splitResumeBullets(text: string) {
  if (!text) return [];
  const lines = text.split("\n").map((l: string) => l.trim()).filter(Boolean);
  const candidateName = (lines[0] || "").toLowerCase();
  const BULLET_START = /^[•\-*·▪▫◦►–—>]\s*|^\d+[\.\)]\s+/;

  let currentSection = "header";
  const rawBullets: { section: string; text: string }[] = [];
  let current: { section: string; text: string } | null = null;

  function flush() {
    if (current && current.text) {
      rawBullets.push({ ...current });
      current = null;
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (/^page\s*\d*(?:\s*of\s*\d*)?$/i.test(line) || /^\d+$/.test(line) || /^of$/i.test(line) || line.toLowerCase() === candidateName) {
      continue;
    }
    if (line.includes("@") && line.includes(".")) continue;
    if (line.includes("linkedin.com") || line.includes("github.com")) continue;

    let matchedHeading: string | null = null;
    if (line.length < 50) {
      for (const h of SECTION_HEADINGS) {
        if (h.regex.test(line)) {
          matchedHeading = h.section;
          break;
        }
      }
    }

    if (matchedHeading) {
      flush();
      currentSection = matchedHeading;
      continue;
    }

    if (currentSection === "skills" || currentSection === "education" || currentSection === "header" || currentSection === "summary") {
      continue;
    }

    const nextLine = (i + 1 < lines.length) ? lines[i + 1] : "";
    const isTitleFollowedByMeta = !line.endsWith('.') && !ACTION_VERBS.test(line) && nextLine && (nextLine.startsWith(",") || nextLine.startsWith("|") || nextLine.includes("|") || /\b(19\d\d|20\d\d)\b/.test(nextLine));
    const isJobOrProjectTitle = !BULLET_START.test(line) && !ACTION_VERBS.test(line) && !line.endsWith('.') && nextLine && BULLET_START.test(nextLine);

    const isMeta = isTitleFollowedByMeta || isJobOrProjectTitle || line.startsWith("|") || line.startsWith(",") || line.includes("|") || /\b(19\d\d|20\d\d)\s*[-–—]\s*(19\d\d|20\d\d|present)\b/i.test(line) || (!BULLET_START.test(line) && line.endsWith(':'));
    if (isMeta) {
      flush();
      continue;
    }

    const isExplicitBullet = BULLET_START.test(line);
    const startsWithVerb = ACTION_VERBS.test(line);

    const isContinuation = current && !isExplicitBullet && (
      !/[.!?]$/.test(current.text) ||
      /^[a-z,(]/.test(line) ||
      line.startsWith('pull requests') ||
      (!startsWithVerb && line.length < 60)
    );

    if (isContinuation) {
      current.text += " " + line;
    } else {
      flush();
      const cleanText = line.replace(BULLET_START, "").trim();
      if (cleanText.length > 10) {
        current = {
          section: currentSection,
          text: cleanText
        };
      }
    }
  }
  flush();

  return rawBullets.map((b, idx) => ({
    id: `b${idx + 1}`,
    section: b.section,
    text: b.text,
    hasDigits: /\d/.test(b.text)
  }));
}

function extractAllBullets(text: string): string[] {
  return splitResumeBullets(text).map(b => b.text);
}

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
    // @ts-ignore
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
  const candidateBullets = splitResumeBullets(resumeText);
  const unquantifiedBullets = candidateBullets.filter(b => !b.hasDigits);
  const bulletsMap = new Map(candidateBullets.map(b => [b.id, b.text]));

  const bulletsInstruction = unquantifiedBullets.length > 0
    ? `\n\nCandidate Bullets without numbers (select ONLY by bullet_id from this list):\n` +
      unquantifiedBullets.map(b => `${b.id}: "${b.text}"`).join("\n")
    : `\n\nAll candidate bullets already contain numbers/measurable metrics. Return "weak_bullets": [].`;

  const userMessage = jobDescription
    ? `Resume text:\n---\n${resumeText}\n---\n\nJob Description:\n---\n${jobDescription}\n---\n${bulletsInstruction}\n\nAnalyze this resume against the job description and return the JSON.`
    : `Resume text:\n---\n${resumeText}\n---\n${bulletsInstruction}\n\nAnalyze this resume and return the JSON.`;

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
      if (Array.isArray(result.weak_bullets)) {
        result.weak_bullets = result.weak_bullets
          .map((wb: any) => {
            const originalText = bulletsMap.get(wb.bullet_id) || wb.original || "";
            return {
              original: originalText,
              suggestion: wb.suggestion || ""
            };
          })
          .filter((wb: any) => wb.original && !/\d/.test(wb.original));
      } else {
        result.weak_bullets = [];
      }
      if (unquantifiedBullets.length === 0) {
        result.weak_bullets = [];
      }

      // Filter out any "add quantified metrics" suggestions for bullets that contain digits
      if (Array.isArray(result.suggestions)) {
        result.suggestions = result.suggestions.filter((s: any) => {
          const advice = typeof s === "string" ? s : s?.advice || "";
          const quote = typeof s === "object" ? s?.evidence_quote || "" : "";
          if (/\b(quantif|metric|measurable outcome|add.*number)\b/i.test(advice)) {
            if (/\d/.test(quote)) return false;
            if (unquantifiedBullets.length === 0) return false;
          }
          return true;
        });
      }

      // Count Experience bullets from the same split (between Experience heading and next heading)
      const expBullets = candidateBullets.filter(b => b.section === "experience");
      if (Array.isArray(result.section_analysis)) {
        const expSection = result.section_analysis.find((s: any) => s.section && /experience/i.test(s.section));
        if (expSection) {
          expSection.feedback = `${expBullets.length} experience bullet point(s) detailing roles, development tasks, and project responsibilities.`;
        }
      }
      result.experience_bullet_count = expBullets.length;

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
serve(async (req: Request) => {
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

    console.log(`[analyze-resume] Extracted resume text (${isPdf ? "PDF" : "DOCX"}, ${resumeText.length} chars):\n${resumeText}\n--- END RESUME TEXT ---`);

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

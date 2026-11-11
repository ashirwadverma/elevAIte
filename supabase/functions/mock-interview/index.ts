// @ts-nocheck
/* eslint-disable */
// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

declare const Deno: any;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-student-session",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ROLE_TOPICS: Record<string, string[]> = {
  "AI Engineer": ["ML basics", "Deep learning", "LLMs", "Prompt engineering", "RAG", "Model deployment"],
  "Machine Learning Engineer": ["Algorithms", "Feature engineering", "Evaluation metrics", "MLOps basics"],
  "Data Scientist / Analyst": ["Statistics", "SQL", "Python", "pandas", "Visualization", "Case thinking"],
  "Full Stack Engineer": ["HTML", "CSS", "JavaScript", "React", "Node.js", "REST APIs", "Databases"],
  "Frontend Engineer": ["JavaScript", "React", "CSS", "Accessibility", "Performance", "Browser basics"],
  "Backend Engineer": ["APIs", "Databases", "Authentication", "Caching", "Scalability basics"],
  "Mobile App Engineer": ["Android or iOS basics", "Flutter or React Native", "App lifecycle"],
  "DevOps / Cloud Engineer": ["Linux", "Git", "Docker", "CI/CD", "AWS or Azure basics"],
  "Cybersecurity Engineer": ["Networking", "OWASP Top 10", "Cryptography basics", "Threat thinking"],
  "QA / Test Engineer": ["Testing types", "Automation", "Test cases", "Bug reporting"],
  "Embedded / IoT Engineer": ["C/C++", "Microcontrollers", "Protocols", "RTOS basics"],
};

// Sliding-window rate limit: max 20 requests/min per client IP (PRD Section 13 Security)
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 20;
const rateBuckets = new Map<string, number[]>();

function checkRateLimit(clientKey: string): boolean {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const timestamps = (rateBuckets.get(clientKey) || []).filter((ts) => ts > windowStart);
  if (timestamps.length >= RATE_LIMIT_MAX) {
    rateBuckets.set(clientKey, timestamps);
    return false;
  }
  timestamps.push(now);
  rateBuckets.set(clientKey, timestamps);
  return true;
}

function extractJsonObject(raw: string): Record<string, unknown> {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```$/i, "")
    .trim();
  return JSON.parse(cleaned);
}

async function callAnthropic(
  apiKey: string,
  systemPrompt: string,
  userMessage: string,
  useLowerCostModel = false,
): Promise<string> {
  const model = useLowerCostModel ? "claude-3-5-haiku-latest" : "claude-3-5-sonnet-latest";
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 2048,
      temperature: 0.3,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    }),
  });
  if (!res.ok) {
    throw new Error(`Anthropic HTTP ${res.status}`);
  }
  const data = await res.json();
  const text = data?.content?.[0]?.text;
  if (!text) throw new Error("Empty Anthropic response");
  return text;
}

async function callGroq(
  apiKey: string,
  systemPrompt: string,
  userMessage: string,
  useLowerCostModel = false,
): Promise<string> {
  const models = useLowerCostModel
    ? ["llama-3.1-8b-instant", "llama-3.3-70b-versatile"]
    : ["llama-3.3-70b-versatile", "llama3-70b-8192"];

  let lastErr = "No models available";
  for (const model of models) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage },
          ],
          temperature: 0.3,
          max_tokens: 2048,
          response_format: { type: "json_object" },
        }),
      });
      if (!res.ok) {
        lastErr = `${model}: HTTP ${res.status}`;
        continue;
      }
      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content;
      if (content) return content;
      lastErr = `${model}: empty content`;
    } catch (e) {
      lastErr = `${model}: ${e instanceof Error ? e.message : String(e)}`;
    }
  }
  throw new Error(lastErr);
}

async function callAiWithRetry(
  systemPrompt: string,
  userMessage: string,
  validator: (obj: Record<string, unknown>) => boolean,
  useLowerCostModel = false,
): Promise<Record<string, unknown>> {
  const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
  const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");

  if (!ANTHROPIC_API_KEY && !GROQ_API_KEY) {
    throw new Error("No AI provider key configured on server");
  }

  let attempts = 0;
  let lastError = "";

  // Execute once + retry once if JSON parsing/validation fails (PRD Section 12)
  while (attempts < 2) {
    attempts++;
    try {
      const promptWithRepair = attempts === 2
        ? `${userMessage}\n\nIMPORTANT: Your previous output failed JSON validation (${lastError}). Respond ONLY with valid raw JSON matching the exact schema.`
        : userMessage;

      let rawText = "";
      if (ANTHROPIC_API_KEY) {
        try {
          rawText = await callAnthropic(ANTHROPIC_API_KEY, systemPrompt, promptWithRepair, useLowerCostModel);
        } catch (err) {
          if (!GROQ_API_KEY) throw err;
          rawText = await callGroq(GROQ_API_KEY, systemPrompt, promptWithRepair, useLowerCostModel);
        }
      } else if (GROQ_API_KEY) {
        rawText = await callGroq(GROQ_API_KEY, systemPrompt, promptWithRepair, useLowerCostModel);
      }

      const parsed = extractJsonObject(rawText);
      if (validator(parsed)) {
        return parsed;
      }
      lastError = "Schema mismatch";
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e);
    }
  }

  throw new Error(`AI generation failed after retry: ${lastError}`);
}

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
    // Basic session & IP rate-limit check (PRD Sections 10 & 13)
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (!checkRateLimit(clientIp)) {
      return respond({ error: "RATE_LIMITED", details: "Too many requests. Please wait a minute." }, 429);
    }

    const authHeader = req.headers.get("authorization") || "";
    const studentSessionHeader = req.headers.get("x-student-session") || "";
    if (!authHeader && !studentSessionHeader) {
      return respond({ error: "UNAUTHORIZED", details: "Student sign-in session required." }, 401);
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return respond({ error: "INVALID_REQUEST", details: "Expected JSON body." }, 400);
    }

    const url = new URL(req.url);
    const pathTail = url.pathname.split("/").filter(Boolean).pop() || "";
    const action = body.action || (["questions", "evaluate", "summary"].includes(pathTail) ? pathTail : "questions");

    // ── 1. Generate Questions (/api/questions) ────────────────────────────
    if (action === "questions") {
      const course = String(body.course || "").trim();
      const role = String(body.role || "").trim();
      const difficulty = ["Beginner", "Intermediate", "Advanced"].includes(body.difficulty)
        ? body.difficulty
        : "Intermediate";
      const count = Math.min(15, Math.max(1, Number(body.count) || 5));

      if (!course || !role || !ROLE_TOPICS[role]) {
        return respond({ error: "INVALID_INPUT", details: "Valid course and engineer role are required." }, 400);
      }

      const topics = ROLE_TOPICS[role].join(", ");
      const systemPrompt =
        `You are a senior interviewer conducting a campus interview for a ${course} student applying as a ${role}. ` +
        `Topics to cover: ${topics}. ` +
        `Generate ${count} ${difficulty}-level questions that fresher students are realistically asked. ` +
        `Mix concept, practical, and scenario questions. Never include HR, Behavioral, or unrelated role questions. ` +
        `Return ONLY valid raw JSON in this exact schema: ` +
        `{ "questions": [ { "id": 1, "text": "string", "topic": "string", "timeLimitSec": 180, "keyPoints": ["string"], "idealAnswer": "string" } ] }`;

      const userMsg = `Generate ${count} ${difficulty} interview questions for a ${course} student targeting ${role}.`;

      const aiData = await callAiWithRetry(
        systemPrompt,
        userMsg,
        (obj) => Array.isArray(obj.questions) && obj.questions.length > 0 && typeof obj.questions[0].text === "string",
        false,
      );

      const questions = (aiData.questions as any[]).slice(0, count).map((q, i) => ({
        id: q.id ?? i + 1,
        text: String(q.text || "").trim(),
        topic: String(q.topic || ROLE_TOPICS[role][0]).trim(),
        difficulty,
        role,
        course,
        timeLimitSec: Number(q.timeLimitSec) || 180,
        keyPoints: Array.isArray(q.keyPoints) ? q.keyPoints.map(String) : [],
        idealAnswer: String(q.idealAnswer || "").trim(),
      }));

      return respond({ questions });
    }

    // ── 2. Evaluate Answer (/api/evaluate) ────────────────────────────────
    if (action === "evaluate") {
      const role = String(body.role || "Software Engineer").trim();
      const difficulty = String(body.difficulty || "Intermediate").trim();
      const questionText = String(body.questionText || "").slice(0, 600).trim();
      const topic = String(body.topic || "Core Concepts").trim();
      const answerText = String(body.answerText || "").slice(0, 2000).trim(); // Cost control cap

      if (!questionText) {
        return respond({ error: "INVALID_INPUT", details: "questionText is required." }, 400);
      }

      if (!answerText) {
        return respond({
          score: 0,
          strengths: [],
          gaps: ["No answer submitted."],
          idealAnswer: "Review the core concept, explain why it matters, and support with a concise example.",
          topic,
        });
      }

      // Security: Never log full answer text
      console.log(`[mock-interview] Evaluating answer (role=${role}, topic=${topic}, chars=${answerText.length})`);

      const systemPrompt =
        `You are a strict but fair technical interviewer evaluating a ${role} (${difficulty} level) student's answer. ` +
        `Score the student's answer strictly from 0 to 10 (integer). List specific strengths and gaps based strictly on what the student wrote, plus a short ideal answer outline (2-3 sentences). Be encouraging and specific. ` +
        `Return ONLY valid raw JSON in this exact schema: ` +
        `{ "score": number, "strengths": ["string"], "gaps": ["string"], "idealAnswer": "string", "topic": "string" }`;

      const userMsg =
        `Question (${topic}): ${questionText}\n\n` +
        `Student Answer:\n"""\n${answerText}\n"""\n\n` +
        `Evaluate the answer and return the JSON object.`;

      const aiData = await callAiWithRetry(
        systemPrompt,
        userMsg,
        (obj) =>
          typeof obj.score === "number" &&
          obj.score >= 0 &&
          obj.score <= 10 &&
          Array.isArray(obj.strengths) &&
          Array.isArray(obj.gaps) &&
          typeof obj.idealAnswer === "string",
        true, // Use lower-cost model for evaluation per PRD Section 13 Cost Control
      );

      return respond({
        score: Math.min(10, Math.max(0, Math.round(Number(aiData.score)))),
        strengths: (aiData.strengths as any[]).map(String).slice(0, 4),
        gaps: (aiData.gaps as any[]).map(String).slice(0, 4),
        idealAnswer: String(aiData.idealAnswer).trim(),
        topic: String(aiData.topic || topic).trim(),
      });
    }

    // ── 3. Build Summary (/api/summary) ───────────────────────────────────
    if (action === "summary") {
      const answers = Array.isArray(body.answers) ? body.answers : [];
      const count = answers.length;
      const avg = count > 0
        ? answers.reduce((s: number, a: any) => s + (Number(a.score) || 0), 0) / count
        : 0;
      const overallScore = Math.round(avg * 10);
      const weakTopics = Array.from(
        new Set(
          answers
            .filter((a: any) => (Number(a.score) || 0) < 7 || a.skipped)
            .map((a: any) => String(a.topic || "Core Concepts")),
        ),
      );
      return respond({ overallScore, weakTopics, questionCount: count });
    }

    return respond({ error: "INVALID_ACTION", details: "Unsupported action." }, 400);
  } catch (err) {
    console.error("[mock-interview] Server error:", err instanceof Error ? err.message : String(err));
    return respond(
      { error: "SERVER_ERROR", details: err instanceof Error ? err.message : "Unknown error" },
      500,
    );
  }
});


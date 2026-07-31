# PRD — AI ATS Resume Checker
**Feature of:** ElevAIte AI
**Stack:** React frontend + Supabase (Edge Functions, Storage, Postgres) + Google Gemini API
**Author:** [your name]
**Status:** Draft v1

---

## 1. Problem & Goal

Students/job-seekers upload a resume (and optionally paste a job description) and want an instant, structured assessment of how well it will survive an ATS (Applicant Tracking System) and how well it matches the role — with concrete, actionable fixes, not vague feedback.

**Success criteria**
- User gets a result in under ~10 seconds for a 1-2 page resume
- Score + breakdown feels accurate and specific (not generic "add more skills")
- Zero API keys exposed client-side
- Works for PDF and DOCX uploads

---

## 2. User Flow

1. User lands on `/resume-analyzer`
2. Uploads resume (PDF/DOCX, max 5MB) — optionally pastes a job description
3. Clicks "Analyze"
4. Frontend shows a loading state
5. Backend (Supabase Edge Function) extracts text → calls Gemini → returns structured JSON
6. Frontend renders: overall score, category breakdown, missing keywords, formatting issues, and rewrite suggestions
7. (Optional v2) User can save the report to their account / download as PDF

---

## 3. Architecture

```
Browser (React)
   |  (1) upload file + optional JD text
   v
Supabase Edge Function: analyze-resume
   |  (2) extract text (pdf-parse / mammoth equivalent for Deno)
   |  (3) build prompt, call Gemini API (key stored in Supabase secrets)
   |  (4) validate + parse JSON response
   |  (5) optionally store result in Postgres (analyses table)
   v
Browser renders report (score cards, keyword chips, suggestions list)
```

**Why Edge Function, not direct client call:** Gemini API key must never reach the browser bundle. Supabase Edge Functions (Deno runtime) run server-side, read the key from Supabase secrets, and are the only thing allowed to call Gemini.

---

## 4. Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Frontend | React/Vite (existing) | file upload, JD textarea, results UI |
| Backend | Supabase Edge Functions (Deno + TypeScript) | `supabase functions deploy analyze-resume` |
| File parsing | `npm:pdf-parse` (via Deno npm compat) for PDF, `npm:mammoth` for DOCX | Deno Edge Functions support npm imports |
| AI model | Gemini API — `gemini-2.5-flash` (fast/cheap) or `gemini-2.5-pro` (higher quality) | via `@google/genai` SDK or plain REST |
| Storage (optional) | Supabase Storage bucket `resumes` | only if you persist uploaded files |
| Database (optional) | Supabase Postgres table `resume_analyses` | store score history per user |
| Auth (optional v2) | Supabase Auth | to let users see past analyses |
| Secrets | Supabase project secrets (`GEMINI_API_KEY`) | set via `supabase secrets set` |

---

## 5. API Contract

**Endpoint:** `POST /functions/v1/analyze-resume`

**Request** (multipart/form-data or base64 JSON):
```json
{
  "resume_text": "extracted or raw text (if extraction done client-side)",
  "resume_file_base64": "optional, if extraction done server-side",
  "file_type": "pdf | docx",
  "job_description": "optional string"
}
```

**Response:**
```json
{
  "overall_score": 78,
  "category_scores": {
    "ats_compatibility": 85,
    "keyword_match": 60,
    "formatting": 90,
    "impact_quantification": 55
  },
  "matched_keywords": ["React", "REST APIs", "Git"],
  "missing_keywords": ["Docker", "CI/CD", "Unit testing"],
  "formatting_issues": [
    "Resume uses a two-column layout, which can break ATS parsing",
    "Dates are inconsistently formatted"
  ],
  "weak_bullets": [
    {
      "original": "Responsible for backend development",
      "suggestion": "Built and shipped 4 REST APIs handling 10k+ daily requests"
    }
  ],
  "suggestions": [
    "Add measurable outcomes to at least 3 experience bullets",
    "Include a Skills section with exact keywords from the job description"
  ]
}
```

Enforce this exact shape with Gemini's **structured output / JSON mode** (`responseMimeType: "application/json"` + a `responseSchema`) so you don't have to regex-parse free text.

---

## 6. Edge Function — Implementation Steps

1. `supabase functions new analyze-resume`
2. Parse incoming file → extract raw text (or accept pre-extracted text from client to keep the function light)
3. Truncate/sanitize text (cap ~6000 words to control token cost)
4. Build system + user prompt (see §7)
5. Call Gemini REST endpoint or SDK with `responseSchema` enforcing the JSON above
6. Validate response against schema server-side (reject/retry if malformed)
7. (Optional) Insert row into `resume_analyses` table
8. Return JSON to client with proper CORS headers
9. Wrap steps 2–6 in try/catch → return typed error codes (`PARSE_FAILED`, `AI_TIMEOUT`, `INVALID_FILE`)

---

## 7. Gemini Prompt Design

**System instruction:**
> You are an ATS resume screening engine. Analyze the given resume text (and job description, if provided) exactly like an enterprise ATS + recruiter would. Be specific and critical, not generic. Always respond only in the provided JSON schema — no prose.

**User content:** resume text + job description (if present)

Use Gemini's `generationConfig.responseSchema` to strictly type the output (matches the JSON in §5) — this removes the need for manual JSON.parse error handling on malformed text.

---

## 8. Database Schema (optional, for history feature)

```sql
create table resume_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  overall_score int,
  result jsonb not null,
  created_at timestamptz default now()
);

alter table resume_analyses enable row level security;
create policy "Users see only their own analyses"
  on resume_analyses for select
  using (auth.uid() = user_id);
```

---

## 9. Security & Cost Controls

- `GEMINI_API_KEY` lives only in Supabase secrets — never in frontend `.env`
- Rate-limit per IP/user (Supabase Edge Functions + a simple counter table, or Supabase's built-in rate limiting) to prevent API cost abuse
- Cap file size (5MB) and text length before sending to Gemini
- Set a request timeout (~15s) with a friendly error state on the frontend
- Log failures (not resume content) for debugging

---

## 10. Milestones

| Phase | Scope |
|---|---|
| M1 | Edge Function skeleton + Gemini call working with hardcoded text, JSON output validated |
| M2 | PDF/DOCX text extraction wired in, file upload from frontend |
| M3 | Frontend results UI (score cards, keyword chips, suggestions list) |
| M4 | Error states, loading states, rate limiting |
| M5 (optional) | Auth + save/history of past analyses |

---

## 11. Open Questions

- Gemini Flash (cheaper/faster) vs Pro (higher quality) — decide after testing accuracy on a few real resumes
- Do you want JD matching to be mandatory or optional?
- Do you want to persist uploaded resume files in Supabase Storage, or discard after analysis (better for privacy)?
l resumes
- Do you want JD matching to be mandatory or optional?
- Do you want to persist uploaded resume files in Supabase Storage, or discard after analysis (better for privacy)?
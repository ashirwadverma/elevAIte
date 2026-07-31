# PRD — Skill Gap Analysis (v1)
**Feature of:** ElevAIte AI — AI Career Accelerator
**Stack:** React frontend + Supabase (Edge Functions, Postgres) + Google Gemini API
**Version:** v1 — Simple (curated role-skills table, no live job scraping)
**Author:** [your name]
**Status:** Draft

---

## 1. Problem

Students know they need to be "job ready" but don't know *which specific skills* they're missing for a target role, or which of those gaps actually matter. Most tools give a flat, unranked list with no reasoning and no next step.

## 2. Goal (v1 scope)

Given a resume + a target role (selected from a fixed list), return a ranked, evidence-based skill gap report, and hand the missing skills off to the Learning Roadmap feature.

**Explicitly out of scope for v1:** live job-posting scraping, custom/free-text roles, multi-language resumes. These are v2 candidates (see §10).

**Success criteria**
- Report returns in under ~8 seconds
- Every "missing skill" has a clear reason (importance/why it matters)
- Zero hallucinated skills — every matched skill must be traceable to a resume line
- No Gemini API key exposed client-side

---

## 3. User Flow

1. User is on `/resume-analyzer` (or a new `/skill-gap` route) with a resume already uploaded/analyzed
2. User selects a **target role** from a dropdown (fixed list of ~15-20 roles)
3. Clicks "Analyze Skill Gap"
4. Frontend shows loading state
5. Supabase Edge Function:
   - Extracts skills from resume text (Gemini call #1, or reuse extraction from ATS checker if already run)
   - Fetches required skills for the selected role from Postgres (`role_skills` table)
   - Compares + ranks gaps (Gemini call #2, or done in code — see §6)
6. Frontend renders: readiness score, matched skills, ranked missing skills (with "why it matters"), and a CTA button "Build my roadmap"
7. Missing skills list is passed to the Learning Roadmap feature on CTA click

---

## 4. Architecture

```
Browser (React)
  |  (1) resume text + selected role (dropdown, fixed list)
  v
Supabase Edge Function: skill-gap-analysis
  |  (2) extract skills from resume --> Gemini call
  |  (3) fetch role_skills row(s) for selected role --> Postgres query
  |  (4) compute gap + rank by importance_weight --> in code (no AI call needed)
  |  (5) optional: Gemini call to generate "why it matters" one-liners
  v
Browser renders: readiness score + matched/missing skills + CTA -> Roadmap feature
```

**Why no live job scraping in v1:** keeps scope shippable in days not weeks, keeps cost predictable (fixed roles = fixed, cacheable data), and removes a third-party API dependency. The ranking logic and UI are what matter for v1 — the data source can be upgraded later without changing the frontend contract.

---

## 5. Data Model

```sql
create table roles (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,          -- e.g. "Frontend Developer"
  description text
);

create table role_skills (
  id uuid primary key default gen_random_uuid(),
  role_id uuid references roles(id) on delete cascade,
  skill text not null,
  importance_weight int not null,     -- 1-100, higher = more critical
  category text,                      -- 'technical' | 'tool' | 'soft'
  why_it_matters text                 -- 1-line static explanation
);
```

**Seeding roles (one-time setup):**
- Pick 15-20 roles relevant to your target users (SDE, Frontend Dev, Backend Dev, Data Analyst, ML Engineer, DevOps, Product Analyst, etc.)
- For each role, use Gemini once (manually, not in production) to generate a candidate skill list with weights and one-line explanations, then **manually review and edit** before inserting — don't trust raw AI output for your core dataset. This manual QA step is what makes v1 trustworthy.

---

## 6. Edge Function Logic

**Endpoint:** `POST /functions/v1/skill-gap-analysis`

**Request:**
```json
{
  "resume_text": "extracted resume text",
  "role_id": "uuid of selected role"
}
```

**Steps inside the function:**
1. Validate input (non-empty resume_text, valid role_id)
2. Call Gemini with `responseSchema` to extract skills from resume text:
   ```json
   { "skills": [{ "name": "React", "evidence": "Built a dashboard using React and Redux" }] }
   ```
3. Query `role_skills where role_id = :role_id`
4. In plain TypeScript (no AI needed here — deterministic and free):
   - `matched = role_skills ∩ resume_skills` (case-insensitive, basic synonym map e.g. "JS" = "JavaScript")
   - `missing = role_skills - resume_skills`, sorted by `importance_weight` descending
   - `readiness_score = sum(matched weights) / sum(total weights) * 100`
5. Attach `why_it_matters` from the DB row to each missing skill (already static — no extra AI call needed)
6. Return response

**Response:**
```json
{
  "role": "Frontend Developer",
  "readiness_score": 62,
  "matched_skills": [
    { "skill": "React", "evidence": "Built a dashboard using React and Redux" }
  ],
  "missing_skills": [
    {
      "skill": "TypeScript",
      "importance_weight": 90,
      "why_it_matters": "Most production frontend codebases require TypeScript; listed in nearly every mid-level JD."
    },
    {
      "skill": "Testing (Jest/RTL)",
      "importance_weight": 70,
      "why_it_matters": "Signals code you can trust in a team setting."
    }
  ]
}
```

Note: only **one** Gemini call per request (skill extraction). Ranking and "why it matters" are deterministic/DB-driven — cheaper, faster, and impossible to hallucinate.

---

## 7. Frontend Requirements

- Role dropdown (searchable if list grows past ~15)
- Readiness score — big number + simple progress ring/bar
- Matched skills — chips, green, with evidence on hover/tap
- Missing skills — list sorted by importance, each with:
  - Skill name
  - Priority badge (High/Medium/Low from weight)
  - "Why it matters" one-liner
- CTA: **"Build my learning roadmap"** → passes `missing_skills` array to roadmap feature
- Loading state (skeleton, not spinner-only — feels faster)
- Error state: "Couldn't analyze — try again" with retry button

---

## 8. Security & Cost

- `GEMINI_API_KEY` in Supabase secrets only
- Cap resume text length before sending to Gemini (~4000 words)
- Rate-limit per user/IP (simple counter table or Supabase built-in) — this endpoint is cheap (1 AI call) so abuse risk is lower than the full ATS checker, but still worth capping
- No job-posting scraping in v1 = no external API cost/dependency risk

---

## 9. Milestones

| Phase | Scope |
|---|---|
| M1 | `roles` + `role_skills` tables created and seeded (15-20 roles, manually reviewed) |
| M2 | Edge Function: skill extraction (Gemini) + gap computation (code) working via Postman/curl |
| M3 | Frontend: role dropdown + results UI (score, matched, missing) |
| M4 | Wire CTA to pass missing_skills into Learning Roadmap feature |
| M5 | Error/loading states + rate limiting |

---

## 10. v2 Candidates (explicitly deferred)

- Replace static `role_skills` table with live job-posting analysis (skills weighted by real-time market frequency)
- Free-text/custom role input (not just dropdown)
- Track readiness score over time per user (requires auth + history table)
- Multi-resume comparison against the same role
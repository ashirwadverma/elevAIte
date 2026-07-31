-- Device-based anonymous tracking (no auth required)
-- Uses a browser-generated UUID stored in localStorage as the "device_id"

-- Usage metrics per device
create table if not exists public.usage_metrics (
  id uuid primary key default gen_random_uuid(),
  device_id text not null,
  resume_analyzer_count integer not null default 0,
  mock_interview_count integer not null default 0,
  skill_gap_count integer not null default 0,
  internship_count integer not null default 0,
  last_active_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint usage_metrics_device_id_unique unique (device_id)
);

-- Resume analysis history per device
create table if not exists public.resume_analyses (
  id uuid primary key default gen_random_uuid(),
  device_id text not null,
  file_name text not null,
  overall_score integer,
  ats_compatibility integer,
  keyword_match integer,
  formatting integer,
  impact_quantification integer,
  experience_level text,
  executive_summary text,
  matched_keywords text[],
  missing_keywords text[],
  suggestions text[],
  created_at timestamptz not null default now()
);
create index if not exists resume_analyses_device_idx on public.resume_analyses(device_id);

-- Saved roadmaps per device
create table if not exists public.saved_roadmaps (
  id uuid primary key default gen_random_uuid(),
  device_id text not null,
  title text not null,
  role text not null,
  skills text[] not null default '{}',
  weeks jsonb not null default '[]',
  notes text default '',
  progress_pct integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists saved_roadmaps_device_idx on public.saved_roadmaps(device_id);

-- RLS: enable but allow all (device_id acts as the access key for this anonymous setup)
alter table public.usage_metrics enable row level security;
alter table public.resume_analyses enable row level security;
alter table public.saved_roadmaps enable row level security;

create policy "allow_all_usage_metrics" on public.usage_metrics for all using (true) with check (true);
create policy "allow_all_resume_analyses" on public.resume_analyses for all using (true) with check (true);
create policy "allow_all_saved_roadmaps" on public.saved_roadmaps for all using (true) with check (true);

-- Mock interview session history (PRD Section 11 & IR-6)
create table if not exists public.mock_interview_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  device_id text not null,
  course text not null,
  role text not null,
  difficulty text not null,
  question_count integer not null,
  overall_score integer not null,
  average_score_out_of_10 numeric(3,1),
  weak_topics text[] not null default '{}',
  strong_topics text[] not null default '{}',
  answers jsonb not null default '[]',
  created_at timestamptz not null default now()
);

create index if not exists mock_interview_sessions_user_idx on public.mock_interview_sessions(user_id);
create index if not exists mock_interview_sessions_device_idx on public.mock_interview_sessions(device_id);

alter table public.mock_interview_sessions enable row level security;

create policy "mock_interview_sessions_owner" on public.mock_interview_sessions
  for all using (
    (auth.uid() is not null and user_id = auth.uid())
    or (auth.uid() is null and user_id is null)
  )
  with check (
    (auth.uid() is not null and user_id = auth.uid())
    or (auth.uid() is null and user_id is null)
  );


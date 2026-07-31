-- Add user_id column to all three tables (nullable so existing rows don't break)
alter table public.usage_metrics add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.resume_analyses add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.saved_roadmaps add column if not exists user_id uuid references auth.users(id) on delete cascade;

-- Add indexes on user_id for fast lookups
create index if not exists usage_metrics_user_idx on public.usage_metrics(user_id);
create index if not exists resume_analyses_user_idx on public.resume_analyses(user_id);
create index if not exists saved_roadmaps_user_idx on public.saved_roadmaps(user_id);

-- Drop the old open policies
drop policy if exists "allow_all_usage_metrics" on public.usage_metrics;
drop policy if exists "allow_all_resume_analyses" on public.resume_analyses;
drop policy if exists "allow_all_saved_roadmaps" on public.saved_roadmaps;

-- New policies: authenticated users see only their own rows; anon users see rows by device_id
create policy "usage_metrics_owner" on public.usage_metrics
  for all using (
    (auth.uid() is not null and user_id = auth.uid())
    or (auth.uid() is null and user_id is null)
  )
  with check (
    (auth.uid() is not null and user_id = auth.uid())
    or (auth.uid() is null and user_id is null)
  );

create policy "resume_analyses_owner" on public.resume_analyses
  for all using (
    (auth.uid() is not null and user_id = auth.uid())
    or (auth.uid() is null and user_id is null)
  )
  with check (
    (auth.uid() is not null and user_id = auth.uid())
    or (auth.uid() is null and user_id is null)
  );

create policy "saved_roadmaps_owner" on public.saved_roadmaps
  for all using (
    (auth.uid() is not null and user_id = auth.uid())
    or (auth.uid() is null and user_id is null)
  )
  with check (
    (auth.uid() is not null and user_id = auth.uid())
    or (auth.uid() is null and user_id is null)
  );

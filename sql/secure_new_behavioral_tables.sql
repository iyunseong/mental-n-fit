-- Secure policies, indexes, and triggers for newly added behavioral tables (idempotent)

-- Ensure required extension for gen_random_uuid()
create extension if not exists pgcrypto;

-- Common: updated_at auto-touch function
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
	new.updated_at = now();
	return new;
end;
$$;

-- A) day_summary: enable RLS and self-only policies
do $$
begin
	alter table if exists day_summary enable row level security;
exception when others then null;
end$$;

do $$
begin
	create policy day_summary_select_self on day_summary
	for select using (auth.uid() = user_id);
exception when duplicate_object then null;
end$$;

do $$
begin
	create policy day_summary_insert_self on day_summary
	for insert with check (auth.uid() = user_id);
exception when duplicate_object then null;
end$$;

do $$
begin
	create policy day_summary_update_self on day_summary
	for update using (auth.uid() = user_id);
exception when duplicate_object then null;
end$$;

do $$
begin
	create policy day_summary_delete_self on day_summary
	for delete using (auth.uid() = user_id);
exception when duplicate_object then null;
end$$;

-- Unique(user_id, date) already covers most queries; no extra index needed here

-- B) recent_presets: index, RLS, updated_at trigger
create index if not exists idx_recent_presets_user_kind_updated_at
on recent_presets (user_id, kind, updated_at desc);

do $$
begin
	alter table if exists recent_presets enable row level security;
exception when others then null;
end$$;

do $$
begin
	create policy recent_presets_select_self on recent_presets
	for select using (auth.uid() = user_id);
exception when duplicate_object then null;
end$$;

do $$
begin
	create policy recent_presets_insert_self on recent_presets
	for insert with check (auth.uid() = user_id);
exception when duplicate_object then null;
end$$;

do $$
begin
	create policy recent_presets_update_self on recent_presets
	for update using (auth.uid() = user_id);
exception when duplicate_object then null;
end$$;

do $$
begin
	create policy recent_presets_delete_self on recent_presets
	for delete using (auth.uid() = user_id);
exception when duplicate_object then null;
end$$;

do $$
begin
	create trigger set_recent_presets_updated_at
	before update on recent_presets
	for each row execute function set_updated_at();
exception when duplicate_object then null;
end$$;

-- C) missions: indexes and RLS policies
create index if not exists idx_missions_user_date on missions (user_id, date);
create index if not exists idx_missions_user_status_date on missions (user_id, status, date);

do $$
begin
	alter table if exists missions enable row level security;
exception when others then null;
end$$;

do $$
begin
	create policy missions_select_self on missions
	for select using (auth.uid() = user_id);
exception when duplicate_object then null;
end$$;

do $$
begin
	create policy missions_insert_self on missions
	for insert with check (auth.uid() = user_id);
exception when duplicate_object then null;
end$$;

do $$
begin
	create policy missions_update_self on missions
	for update using (auth.uid() = user_id);
exception when duplicate_object then null;
end$$;

do $$
begin
	create policy missions_delete_self on missions
	for delete using (auth.uid() = user_id);
exception when duplicate_object then null;
end$$;

-- D) event_log: index and RLS (user-scoped logs only)
create index if not exists idx_event_log_user_ts on event_log (user_id, ts desc);

do $$
begin
	alter table if exists event_log enable row level security;
exception when others then null;
end$$;

do $$
begin
	create policy event_log_select_self on event_log
	for select using (user_id is not null and auth.uid() = user_id);
exception when duplicate_object then null;
end$$;

do $$
begin
	create policy event_log_insert_self on event_log
	for insert with check (user_id is not null and auth.uid() = user_id);
exception when duplicate_object then null;
end$$;

do $$
begin
	create policy event_log_update_self on event_log
	for update using (user_id is not null and auth.uid() = user_id);
exception when duplicate_object then null;
end$$;

do $$
begin
	create policy event_log_delete_self on event_log
	for delete using (user_id is not null and auth.uid() = user_id);
exception when duplicate_object then null;
end$$;

-- E) metatypes: add confidence column if table exists and column missing
alter table if exists metatypes add column if not exists confidence numeric;



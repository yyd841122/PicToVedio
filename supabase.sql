create table if not exists app_users (
  id text primary key,
  credits integer not null default 12,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists video_jobs (
  id text primary key,
  user_id text not null references app_users(id) on delete cascade,
  provider text not null default 'mock',
  status text not null,
  template text,
  ratio text,
  resolution text,
  seconds integer,
  credits integer not null default 1,
  prompt text,
  input_url text,
  provider_job_id text,
  output_url text,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists payments (
  id text primary key,
  provider text not null,
  event_id text,
  user_id text not null references app_users(id) on delete cascade,
  plan text not null,
  credits integer not null,
  created_at timestamptz not null default now()
);

create table if not exists webhook_events (
  id text primary key,
  provider text not null,
  type text,
  received_at timestamptz not null default now()
);

create table if not exists credit_ledger (
  id text primary key,
  user_id text not null references app_users(id) on delete cascade,
  amount integer not null,
  source text not null,
  external_id text not null,
  plan text,
  balance_after integer not null,
  created_at timestamptz not null default now()
);

create table if not exists analytics_events (
  id text primary key,
  user_id text not null references app_users(id) on delete cascade,
  session_id text,
  name text not null,
  page text,
  referrer text,
  language text,
  properties jsonb not null default '{}'::jsonb,
  user_agent text,
  ip_hash text,
  created_at timestamptz not null default now()
);

create index if not exists idx_credit_ledger_user_created
  on credit_ledger(user_id, created_at desc);

create index if not exists idx_analytics_events_name_created
  on analytics_events(name, created_at desc);

create index if not exists idx_analytics_events_user_created
  on analytics_events(user_id, created_at desc);

alter table video_jobs
  add column if not exists input_url text;

insert into app_users(id, credits)
values ('demo-user', 12)
on conflict (id) do nothing;

-- Security hardening:
-- MotionPic AI never needs browser clients to access Supabase directly.
-- The public site talks to the Render backend, and Render uses SUPABASE_SERVICE_ROLE_KEY.
-- Keep RLS enabled and revoke public API-role access from all product tables.
revoke all on schema public from anon, authenticated;
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke all on all functions in schema public from anon, authenticated;

alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke all on functions from anon, authenticated;

alter table app_users enable row level security;
alter table video_jobs enable row level security;
alter table payments enable row level security;
alter table webhook_events enable row level security;
alter table credit_ledger enable row level security;
alter table analytics_events enable row level security;

grant usage on schema public to service_role;
grant select, insert, update, delete on table app_users to service_role;
grant select, insert, update, delete on table video_jobs to service_role;
grant select, insert, update, delete on table payments to service_role;
grant select, insert, update, delete on table webhook_events to service_role;
grant select, insert, update, delete on table credit_ledger to service_role;
grant select, insert, update, delete on table analytics_events to service_role;

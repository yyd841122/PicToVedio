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

create index if not exists idx_credit_ledger_user_created
  on credit_ledger(user_id, created_at desc);

alter table video_jobs
  add column if not exists input_url text;

insert into app_users(id, credits)
values ('demo-user', 12)
on conflict (id) do nothing;

alter table app_users disable row level security;
alter table video_jobs disable row level security;
alter table payments disable row level security;
alter table webhook_events disable row level security;
alter table credit_ledger disable row level security;

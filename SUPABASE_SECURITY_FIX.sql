-- MotionPic AI Supabase security hardening
-- Run this once in Supabase SQL Editor if Supabase warns about:
-- - rls_disabled_in_public
-- - sensitive_columns_exposed
--
-- MotionPic AI does not require browser clients to access Supabase directly.
-- The public website calls the Render backend. Render uses SUPABASE_SERVICE_ROLE_KEY.
-- Therefore anon/authenticated API roles should not have direct table access.

revoke all on schema public from anon, authenticated;
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke all on all functions in schema public from anon, authenticated;

alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke all on functions from anon, authenticated;

alter table if exists public.app_users enable row level security;
alter table if exists public.video_jobs enable row level security;
alter table if exists public.payments enable row level security;
alter table if exists public.webhook_events enable row level security;
alter table if exists public.credit_ledger enable row level security;
alter table if exists public.analytics_events enable row level security;

grant usage on schema public to service_role;

grant select, insert, update, delete on table public.app_users to service_role;
grant select, insert, update, delete on table public.video_jobs to service_role;
grant select, insert, update, delete on table public.payments to service_role;
grant select, insert, update, delete on table public.webhook_events to service_role;
grant select, insert, update, delete on table public.credit_ledger to service_role;
grant select, insert, update, delete on table public.analytics_events to service_role;

-- Optional verification queries:
-- select schemaname, tablename, rowsecurity from pg_tables where schemaname = 'public';
-- select grantee, table_name, privilege_type from information_schema.role_table_grants
-- where table_schema = 'public' and grantee in ('anon', 'authenticated')
-- order by table_name, grantee, privilege_type;

-- MotionPic AI atomic paid-credit RPC draft
-- Last updated: 2026-06-13
--
-- REVIEW ONLY until the owner explicitly approves running production SQL.
-- This function is intended for the Render backend using SUPABASE_SERVICE_ROLE_KEY.
-- Do not grant execute permission to anon, authenticated, or public browser roles.

begin;

create or replace function public.motionpic_process_payment_credit(
  p_provider text,
  p_event_id text,
  p_event_type text,
  p_payment_id text,
  p_user_id text,
  p_plan text,
  p_credits integer,
  p_source text default 'creem-checkout'
)
returns table (
  credited boolean,
  balance integer,
  duplicate_reason text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_provider text := pg_catalog.lower(pg_catalog.btrim(coalesce(p_provider, '')));
  v_event_id text := pg_catalog.btrim(coalesce(p_event_id, ''));
  v_event_type text := pg_catalog.btrim(coalesce(p_event_type, ''));
  v_payment_id text := pg_catalog.btrim(coalesce(p_payment_id, ''));
  v_user_id text := pg_catalog.btrim(coalesce(p_user_id, ''));
  v_plan text := pg_catalog.lower(pg_catalog.btrim(coalesce(p_plan, '')));
  v_source text := pg_catalog.lower(pg_catalog.btrim(coalesce(p_source, '')));
  v_ledger_id text;
  v_existing_event record;
  v_existing_ledger record;
  v_existing_payment record;
  v_ledger_found boolean := false;
  v_payment_found boolean := false;
  v_current_credits integer;
  v_new_balance integer;
  v_now timestamptz := pg_catalog.now();
begin
  if v_provider not in ('creem', 'stripe') then
    raise exception 'Unsupported payment provider: %', v_provider using errcode = '22023';
  end if;

  if v_source = '' then
    v_source := v_provider || '-checkout';
  end if;

  if v_source <> (v_provider || '-checkout') then
    raise exception 'Payment source % does not match provider %', v_source, v_provider using errcode = '22023';
  end if;

  if v_event_id = '' then
    raise exception 'Payment event id is required' using errcode = '22023';
  end if;

  if v_payment_id = '' then
    raise exception 'Payment id is required' using errcode = '22023';
  end if;

  if v_user_id = '' then
    raise exception 'User id is required' using errcode = '22023';
  end if;

  if v_plan not in ('creator', 'commerce') then
    raise exception 'Unsupported paid plan: %', v_plan using errcode = '22023';
  end if;

  if p_credits is null or p_credits <= 0 then
    raise exception 'Credits must be positive' using errcode = '22023';
  end if;

  v_ledger_id := v_source || ':' || v_payment_id;

  insert into public.webhook_events (id, provider, type, received_at)
  values (v_event_id, v_provider, nullif(v_event_type, ''), v_now)
  on conflict (id) do nothing;

  select e.provider, e.type
    into v_existing_event
  from public.webhook_events as e
  where e.id = v_event_id
  for update;

  if not found then
    raise exception 'Webhook event row could not be created or read: %', v_event_id using errcode = 'P0001';
  end if;

  if v_existing_event.provider is distinct from v_provider
    or coalesce(v_existing_event.type, '') is distinct from v_event_type
  then
    raise exception 'Existing webhook event does not match the attempted payment event: %', v_event_id
      using errcode = '23505';
  end if;

  insert into public.app_users (id, credits, created_at, updated_at)
  values (v_user_id, 0, v_now, v_now)
  on conflict (id) do nothing;

  select u.credits
    into v_current_credits
  from public.app_users as u
  where u.id = v_user_id
  for update;

  if not found then
    raise exception 'User row could not be created or locked: %', v_user_id using errcode = 'P0001';
  end if;

  if exists (
    select 1
    from public.payments as p
    where p.event_id = v_event_id
      and p.id <> v_payment_id
  ) then
    raise exception 'Existing webhook event is already linked to a different payment: %', v_event_id
      using errcode = '23505';
  end if;

  select p.id, p.provider, p.event_id, p.user_id, p.plan, p.credits
    into v_existing_payment
  from public.payments as p
  where p.id = v_payment_id;
  v_payment_found := found;

  if v_payment_found then
    if v_existing_payment.provider is distinct from v_provider
      or (
        v_existing_payment.event_id is not null
        and v_existing_payment.event_id is distinct from v_event_id
      )
      or v_existing_payment.user_id is distinct from v_user_id
      or v_existing_payment.plan is distinct from v_plan
      or v_existing_payment.credits is distinct from p_credits
    then
      raise exception 'Existing payment row does not match the attempted credit grant: %', v_payment_id
        using errcode = '23505';
    end if;
  end if;

  select
    l.id,
    l.user_id,
    l.amount,
    l.source,
    l.external_id,
    l.plan,
    l.balance_after
    into v_existing_ledger
  from public.credit_ledger as l
  where l.id = v_ledger_id;
  v_ledger_found := found;

  if v_ledger_found then
    if v_existing_ledger.user_id is distinct from v_user_id
      or v_existing_ledger.amount is distinct from p_credits
      or v_existing_ledger.source is distinct from v_source
      or v_existing_ledger.external_id is distinct from v_payment_id
      or v_existing_ledger.plan is distinct from v_plan
    then
      raise exception 'Existing credit ledger row does not match the attempted credit grant: %', v_ledger_id
        using errcode = '23505';
    end if;

    if not v_payment_found then
      raise exception 'Existing credit ledger has no payment row and requires manual reconciliation: %', v_ledger_id
        using errcode = 'P0001';
    end if;

    return query
      select false, v_existing_ledger.balance_after::integer, 'credit_ledger'::text;
    return;
  end if;

  if v_payment_found then
    raise exception 'Existing payment has no credit ledger row and requires manual reconciliation: %', v_payment_id
      using errcode = 'P0001';
  else
    insert into public.payments (id, provider, event_id, user_id, plan, credits, created_at)
    values (v_payment_id, v_provider, v_event_id, v_user_id, v_plan, p_credits, v_now);
  end if;

  v_new_balance := v_current_credits + p_credits;

  update public.app_users
  set credits = v_new_balance,
      updated_at = v_now
  where id = v_user_id;

  insert into public.credit_ledger (
    id,
    user_id,
    amount,
    source,
    external_id,
    plan,
    balance_after,
    created_at
  )
  values (
    v_ledger_id,
    v_user_id,
    p_credits,
    v_source,
    v_payment_id,
    v_plan,
    v_new_balance,
    v_now
  );

  return query
    select true, v_new_balance, null::text;
end;
$$;

revoke execute
  on function public.motionpic_process_payment_credit(text, text, text, text, text, text, integer, text)
  from public;

revoke execute
  on function public.motionpic_process_payment_credit(text, text, text, text, text, text, integer, text)
  from anon, authenticated;

grant usage on schema public to service_role;

grant execute
  on function public.motionpic_process_payment_credit(text, text, text, text, text, text, integer, text)
  to service_role;

commit;

-- Optional verification queries after owner-approved execution:
--
-- Preflight before execution: this should return zero rows. Any result requires
-- manual payment/balance/ledger reconciliation before enabling the RPC path.
--
-- select
--   p.id,
--   p.provider,
--   p.user_id,
--   p.plan,
--   p.credits,
--   u.credits as current_balance
-- from public.payments p
-- join public.app_users u on u.id = p.user_id
-- left join public.credit_ledger l
--   on l.id = (p.provider || '-checkout:' || p.id)
-- where l.id is null;
--
-- select
--   n.nspname as schema,
--   p.proname as function,
--   p.prosecdef as security_definer,
--   p.proconfig as config
-- from pg_catalog.pg_proc p
-- join pg_catalog.pg_namespace n on n.oid = p.pronamespace
-- where n.nspname = 'public'
--   and p.proname = 'motionpic_process_payment_credit';
--
-- select grantee, privilege_type
-- from information_schema.routine_privileges
-- where routine_schema = 'public'
--   and routine_name = 'motionpic_process_payment_credit'
-- order by grantee, privilege_type;

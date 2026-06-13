-- MotionPic AI atomic credit preflight
-- Last updated: 2026-06-13
--
-- READ ONLY. Run this before applying SUPABASE_ATOMIC_CREDIT_RPC_DRAFT.sql.
-- Expected result: zero rows.
--
-- If any row appears, do not apply the RPC yet. Inspect the payment, ledger,
-- event, and user balance state first because an old multi-call payment flow
-- may have created a partial or conflicting record.

select
  'payment_missing_ledger' as issue,
  p.id,
  p.provider,
  p.event_id,
  p.user_id,
  p.plan,
  p.credits,
  p.created_at as payment_created_at,
  u.credits as current_balance
from public.payments p
join public.app_users u on u.id = p.user_id
left join public.credit_ledger l
  on l.id = (p.provider || '-checkout:' || p.id)
where l.id is null

union all

select
  'payment_ledger_mismatch' as issue,
  p.id,
  p.provider,
  p.event_id,
  p.user_id,
  p.plan,
  p.credits,
  p.created_at as payment_created_at,
  u.credits as current_balance
from public.payments p
join public.app_users u on u.id = p.user_id
join public.credit_ledger l
  on l.id = (p.provider || '-checkout:' || p.id)
where l.user_id is distinct from p.user_id
  or l.amount is distinct from p.credits
  or l.source is distinct from (p.provider || '-checkout')
  or l.external_id is distinct from p.id
  or l.plan is distinct from p.plan

union all

select
  'payment_event_reused' as issue,
  p.id,
  p.provider,
  p.event_id,
  p.user_id,
  p.plan,
  p.credits,
  p.created_at as payment_created_at,
  u.credits as current_balance
from public.payments p
join public.app_users u on u.id = p.user_id
join (
  select event_id
  from public.payments
  where event_id is not null
    and pg_catalog.btrim(event_id) <> ''
  group by event_id
  having count(*) > 1
) duplicated_events on duplicated_events.event_id = p.event_id

order by payment_created_at desc;

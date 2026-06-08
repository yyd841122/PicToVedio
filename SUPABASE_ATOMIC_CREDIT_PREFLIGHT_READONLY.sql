-- MotionPic AI atomic credit preflight
-- Last updated: 2026-06-08
--
-- READ ONLY. Run this before applying SUPABASE_ATOMIC_CREDIT_RPC_DRAFT.sql.
-- Expected result: zero rows.
--
-- If any row appears, do not apply the RPC yet. Inspect the payment, ledger,
-- and user balance state first because an old multi-call payment flow may have
-- created a partial record.

select
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
order by p.created_at desc;

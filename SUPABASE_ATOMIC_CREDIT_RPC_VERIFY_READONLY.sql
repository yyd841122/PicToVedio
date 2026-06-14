-- FrameVela AI atomic paid-credit RPC post-install verification
-- Last updated: 2026-06-14
--
-- READ ONLY. Run this after applying SUPABASE_ATOMIC_CREDIT_RPC_DRAFT.sql.
-- Expected result: one row with every boolean set to true and
-- unexpected_execute_grantees set to null.
--
-- The function owner retains PostgreSQL's implicit owner privileges. This
-- check verifies that service_role is the only non-owner role with EXECUTE.

with target as (
  select
    p.oid,
    p.proowner,
    p.prosecdef,
    p.proconfig
  from pg_catalog.pg_proc p
  where p.oid = pg_catalog.to_regprocedure(
    'public.motionpic_process_payment_credit(text,text,text,text,text,text,integer,text)'
  )
),
execute_acl as (
  select
    a.grantee,
    a.privilege_type
  from target t
  cross join lateral pg_catalog.aclexplode(
    coalesce(t.proacl, pg_catalog.acldefault('f', t.proowner))
  ) a
  where a.privilege_type = 'EXECUTE'
),
role_ids as (
  select
    (select oid from pg_catalog.pg_roles where rolname = 'service_role') as service_role_oid,
    (select oid from pg_catalog.pg_roles where rolname = 'anon') as anon_oid,
    (select oid from pg_catalog.pg_roles where rolname = 'authenticated') as authenticated_oid
),
checks as (
  select
    exists (select 1 from target) as function_exists,
    coalesce((select t.prosecdef from target t), false) as security_definer,
    coalesce((
      select exists (
        select 1
        from pg_catalog.unnest(coalesce(t.proconfig, array[]::text[])) setting
        where setting in ('search_path=', 'search_path=""')
      )
      from target t
    ), false) as empty_search_path,
    exists (
      select 1
      from execute_acl a
      cross join role_ids r
      where a.grantee = r.service_role_oid
    ) as service_role_execute,
    not exists (
      select 1
      from execute_acl a
      where a.grantee = 0
    ) as public_execute_revoked,
    not exists (
      select 1
      from execute_acl a
      cross join role_ids r
      where a.grantee = r.anon_oid
    ) as anon_execute_revoked,
    not exists (
      select 1
      from execute_acl a
      cross join role_ids r
      where a.grantee = r.authenticated_oid
    ) as authenticated_execute_revoked,
    (
      select pg_catalog.string_agg(
        coalesce(grantee_role.rolname, 'PUBLIC'),
        ', ' order by coalesce(grantee_role.rolname, 'PUBLIC')
      )
      from execute_acl a
      cross join target t
      cross join role_ids r
      left join pg_catalog.pg_roles grantee_role on grantee_role.oid = a.grantee
      where a.grantee <> t.proowner
        and a.grantee is distinct from r.service_role_oid
    ) as unexpected_execute_grantees
)
select
  function_exists,
  security_definer,
  empty_search_path,
  service_role_execute,
  public_execute_revoked,
  anon_execute_revoked,
  authenticated_execute_revoked,
  unexpected_execute_grantees is null as only_service_role_execute,
  unexpected_execute_grantees
from checks;

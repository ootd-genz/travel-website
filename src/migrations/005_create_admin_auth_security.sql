-- Phase 3: single-admin authentication audit and durable login rate limiting.

create table public.admin_login_rate_limits (
  identifier_hash text primary key check (identifier_hash ~ '^[0-9a-f]{64}$'),
  window_started_at timestamptz not null default now(),
  attempt_count integer not null default 1 check (attempt_count > 0),
  updated_at timestamptz not null default now()
);

comment on table public.admin_login_rate_limits is
  'Server-only fixed-window counters. Identifiers are HMAC hashes; raw email and IP are never stored.';

create table public.admin_auth_events (
  id uuid primary key default extensions.gen_random_uuid(),
  auth_user_id uuid references auth.users(id) on delete set null,
  event_type text not null check (
    event_type in (
      'login_success',
      'login_failure',
      'login_rate_limited',
      'logout',
      'access_denied',
      'session_expired'
    )
  ),
  identifier_hash text check (
    identifier_hash is null or identifier_hash ~ '^[0-9a-f]{64}$'
  ),
  ip_hash text check (ip_hash is null or ip_hash ~ '^[0-9a-f]{64}$'),
  reason_code text check (
    reason_code is null or reason_code ~ '^[a-z0-9_]{1,64}$'
  ),
  created_at timestamptz not null default now()
);

comment on table public.admin_auth_events is
  'Append-only, privacy-minimized audit trail for single-admin authentication.';

create index admin_auth_events_created_at_idx
  on public.admin_auth_events (created_at desc);
create index admin_auth_events_auth_user_idx
  on public.admin_auth_events (auth_user_id, created_at desc)
  where auth_user_id is not null;

alter table public.admin_login_rate_limits enable row level security;
alter table public.admin_auth_events enable row level security;

revoke all on table
  public.admin_login_rate_limits,
  public.admin_auth_events
from public, anon, authenticated;

grant select on table public.admin_auth_events to authenticated;

create policy admin_auth_events_admin_read
on public.admin_auth_events
for select to authenticated
using ((select private.is_active_admin()));

create or replace function public.consume_admin_login_rate_limit(
  p_identifier_hash text,
  p_max_attempts integer,
  p_window_seconds integer
)
returns table (allowed boolean, retry_after_seconds integer)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_identifier_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'invalid identifier hash';
  end if;

  if p_max_attempts < 1 or p_max_attempts > 20 then
    raise exception 'invalid max attempts';
  end if;

  if p_window_seconds < 60 or p_window_seconds > 86400 then
    raise exception 'invalid rate limit window';
  end if;

  delete from public.admin_login_rate_limits
  where window_started_at < now() - interval '24 hours';

  return query
  with current_attempt as (
    insert into public.admin_login_rate_limits (
      identifier_hash,
      window_started_at,
      attempt_count,
      updated_at
    )
    values (p_identifier_hash, now(), 1, now())
    on conflict (identifier_hash) do update
    set
      attempt_count = case
        when public.admin_login_rate_limits.window_started_at
          <= now() - make_interval(secs => p_window_seconds)
          then 1
        else public.admin_login_rate_limits.attempt_count + 1
      end,
      window_started_at = case
        when public.admin_login_rate_limits.window_started_at
          <= now() - make_interval(secs => p_window_seconds)
          then now()
        else public.admin_login_rate_limits.window_started_at
      end,
      updated_at = now()
    returning attempt_count, window_started_at
  )
  select
    current_attempt.attempt_count <= p_max_attempts,
    greatest(
      0,
      ceil(
        extract(
          epoch from (
            current_attempt.window_started_at
            + make_interval(secs => p_window_seconds)
            - now()
          )
        )
      )::integer
    )
  from current_attempt;
end;
$$;

create or replace function public.reset_admin_login_rate_limit(
  p_identifier_hash text
)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.admin_login_rate_limits
  where identifier_hash = p_identifier_hash;
$$;

revoke all on function public.consume_admin_login_rate_limit(text, integer, integer)
  from public, anon, authenticated;
revoke all on function public.reset_admin_login_rate_limit(text)
  from public, anon, authenticated;
grant execute on function public.consume_admin_login_rate_limit(text, integer, integer)
  to service_role;
grant execute on function public.reset_admin_login_rate_limit(text)
  to service_role;


-- Phase 11: durable public rate limits and tamper-resistant admin audit trails.

create table public.request_rate_limits (
  scope text not null check (
    scope in ('booking_draft', 'booking_submit_ip', 'booking_submit_token')
  ),
  identifier_hash text not null check (identifier_hash ~ '^[0-9a-f]{64}$'),
  window_started_at timestamptz not null default now(),
  attempt_count integer not null default 1 check (attempt_count > 0),
  updated_at timestamptz not null default now(),
  primary key (scope, identifier_hash)
);

comment on table public.request_rate_limits is
  'Server-only fixed-window abuse counters. Identifiers are HMAC hashes; raw IPs and booking tokens are never stored.';

alter table public.request_rate_limits enable row level security;
alter table public.request_rate_limits force row level security;
revoke all on table public.request_rate_limits from public, anon, authenticated;

create or replace function public.consume_request_rate_limit(
  p_scope text,
  p_identifier_hash text,
  p_max_attempts integer,
  p_window_seconds integer
)
returns table (
  allowed boolean,
  retry_after_seconds integer,
  remaining integer
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_scope not in ('booking_draft', 'booking_submit_ip', 'booking_submit_token') then
    raise exception 'invalid rate limit scope';
  end if;
  if p_identifier_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'invalid identifier hash';
  end if;
  if p_max_attempts < 1 or p_max_attempts > 100 then
    raise exception 'invalid max attempts';
  end if;
  if p_window_seconds < 60 or p_window_seconds > 86400 then
    raise exception 'invalid rate limit window';
  end if;

  delete from public.request_rate_limits
  where updated_at < now() - interval '24 hours';

  return query
  with current_attempt as (
    insert into public.request_rate_limits (
      scope,
      identifier_hash,
      window_started_at,
      attempt_count,
      updated_at
    )
    values (p_scope, p_identifier_hash, now(), 1, now())
    on conflict (scope, identifier_hash) do update
    set
      attempt_count = case
        when public.request_rate_limits.window_started_at
          <= now() - make_interval(secs => p_window_seconds)
          then 1
        else public.request_rate_limits.attempt_count + 1
      end,
      window_started_at = case
        when public.request_rate_limits.window_started_at
          <= now() - make_interval(secs => p_window_seconds)
          then now()
        else public.request_rate_limits.window_started_at
      end,
      updated_at = now()
    returning attempt_count, window_started_at
  )
  select
    current_attempt.attempt_count <= p_max_attempts,
    case
      when current_attempt.attempt_count <= p_max_attempts then 0
      else greatest(
        0,
        ceil(extract(epoch from (
          current_attempt.window_started_at
          + make_interval(secs => p_window_seconds)
          - now()
        )))::integer
      )
    end,
    greatest(0, p_max_attempts - current_attempt.attempt_count)
  from current_attempt;
end;
$$;

revoke all on function public.consume_request_rate_limit(text, text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.consume_request_rate_limit(text, text, integer, integer)
  to service_role;

create or replace function public.record_content_change_event(
  p_resource_type text,
  p_resource_id text,
  p_action text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_user_id uuid := auth.uid();
  event_id uuid;
begin
  if actor_user_id is null or not (select private.is_active_admin()) then
    raise insufficient_privilege using message = 'active admin required';
  end if;
  if p_resource_type not in (
    'trip', 'destination', 'activity', 'trip_type', 'blog_post',
    'promotion', 'homepage_content', 'usp_item', 'site_settings'
  ) then
    raise exception 'invalid audit resource type';
  end if;
  if p_action not in ('create', 'update', 'delete', 'publish', 'archive') then
    raise exception 'invalid audit action';
  end if;
  if char_length(coalesce(p_resource_id, '')) > 200 then
    raise exception 'invalid audit resource id';
  end if;

  insert into public.content_change_events (
    resource_type, resource_id, action, actor_id, metadata
  ) values (
    p_resource_type, nullif(p_resource_id, ''), p_action, actor_user_id, '{}'::jsonb
  ) returning id into event_id;
  return event_id;
end;
$$;

revoke insert on table public.content_change_events from authenticated;
drop policy if exists content_change_events_admin_insert
  on public.content_change_events;
revoke all on function public.record_content_change_event(text, text, text)
  from public, anon;
grant execute on function public.record_content_change_event(text, text, text)
  to authenticated;

revoke insert on table public.booking_events from authenticated;
drop policy if exists booking_events_admin_insert on public.booking_events;

create or replace function public.record_booking_proof_access(p_booking_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_user_id uuid := auth.uid();
begin
  if actor_user_id is null or not (select private.is_active_admin()) then
    raise insufficient_privilege using message = 'active admin required';
  end if;
  if not exists (select 1 from public.bookings where id = p_booking_id) then
    raise exception 'booking not found';
  end if;

  insert into public.booking_events (
    booking_id, event_type, actor_type, actor_id, note, metadata
  ) values (
    p_booking_id,
    'transfer_proof_accessed',
    'admin',
    actor_user_id,
    'Bukti transfer diakses melalui signed URL sementara.',
    '{}'::jsonb
  );
end;
$$;

revoke all on function public.record_booking_proof_access(uuid)
  from public, anon;
grant execute on function public.record_booking_proof_access(uuid)
  to authenticated;

create or replace function private.prevent_audit_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if pg_trigger_depth() > 1 then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;
  raise exception 'audit events are append-only';
end;
$$;

create trigger admin_auth_events_append_only
before update or delete on public.admin_auth_events
for each row execute function private.prevent_audit_mutation();

create trigger content_change_events_append_only
before update or delete on public.content_change_events
for each row execute function private.prevent_audit_mutation();

create trigger booking_events_append_only
before update or delete on public.booking_events
for each row execute function private.prevent_audit_mutation();

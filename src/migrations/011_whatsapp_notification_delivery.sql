-- Phase 9: atomically claim and finalize idempotent WhatsApp deliveries.

create or replace function public.claim_whatsapp_notification(
  p_booking_id uuid,
  p_event_type text,
  p_destination_number text,
  p_max_attempts integer default 3,
  p_lease_seconds integer default 30
)
returns table (
  outcome text,
  delivery_id uuid,
  attempt_count integer,
  destination_number text,
  next_attempt_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  booking_status text;
  delivery_record public.notification_deliveries%rowtype;
begin
  if p_event_type is null
    or p_event_type <> 'booking_waiting_verification'
    or p_destination_number is null
    or p_destination_number !~ '^[1-9][0-9]{7,14}$'
    or p_max_attempts is null
    or p_max_attempts not between 1 and 10
    or p_lease_seconds is null
    or p_lease_seconds not between 5 and 300
  then
    return query
      select 'invalid_input'::text, null::uuid, 0, null::text, null::timestamptz;
    return;
  end if;

  select bookings.status
  into booking_status
  from public.bookings as bookings
  where bookings.id = p_booking_id;

  if not found then
    return query
      select 'not_found'::text, null::uuid, 0, null::text, null::timestamptz;
    return;
  end if;

  if booking_status <> 'waiting_verification' then
    return query
      select 'invalid_booking_state'::text, null::uuid, 0, null::text, null::timestamptz;
    return;
  end if;

  insert into public.notification_deliveries (
    booking_id,
    channel,
    event_type,
    destination_number,
    status,
    attempt_count
  )
  values (
    p_booking_id,
    'whatsapp',
    p_event_type,
    p_destination_number,
    'pending',
    0
  )
  on conflict (booking_id, channel, event_type) do nothing;

  select deliveries.*
  into delivery_record
  from public.notification_deliveries as deliveries
  where deliveries.booking_id = p_booking_id
    and deliveries.channel = 'whatsapp'
    and deliveries.event_type = p_event_type
  for update;

  if delivery_record.status = 'sent' then
    return query
      select
        'already_sent'::text,
        delivery_record.id,
        delivery_record.attempt_count,
        delivery_record.destination_number,
        delivery_record.next_attempt_at;
    return;
  end if;

  if delivery_record.attempt_count >= p_max_attempts then
    return query
      select
        'max_attempts'::text,
        delivery_record.id,
        delivery_record.attempt_count,
        delivery_record.destination_number,
        delivery_record.next_attempt_at;
    return;
  end if;

  if delivery_record.status = 'failed'
    and delivery_record.next_attempt_at is null
  then
    return query
      select
        'not_retryable'::text,
        delivery_record.id,
        delivery_record.attempt_count,
        delivery_record.destination_number,
        null::timestamptz;
    return;
  end if;

  if delivery_record.next_attempt_at is not null
    and delivery_record.next_attempt_at > now()
  then
    return query
      select
        (
          case
            when delivery_record.status = 'pending' then 'in_progress'
            else 'backoff'
          end
        )::text,
        delivery_record.id,
        delivery_record.attempt_count,
        delivery_record.destination_number,
        delivery_record.next_attempt_at;
    return;
  end if;

  update public.notification_deliveries
  set
    status = 'pending',
    attempt_count = attempt_count + 1,
    last_error_code = null,
    next_attempt_at = now() + make_interval(secs => p_lease_seconds)
  where id = delivery_record.id
  returning *
  into delivery_record;

  return query
    select
      'claimed'::text,
      delivery_record.id,
      delivery_record.attempt_count,
      delivery_record.destination_number,
      delivery_record.next_attempt_at;
end;
$$;

create or replace function public.finalize_whatsapp_notification(
  p_delivery_id uuid,
  p_attempt_count integer,
  p_result text,
  p_provider_message_id text,
  p_error_code text,
  p_retryable boolean,
  p_max_attempts integer default 3
)
returns table (
  outcome text,
  status text,
  next_attempt_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  delivery_record public.notification_deliveries%rowtype;
begin
  if p_result is null
    or p_result not in ('sent', 'failed')
    or p_attempt_count is null
    or p_attempt_count < 1
    or p_max_attempts is null
    or p_max_attempts not between 1 and 10
    or (p_result = 'sent' and nullif(btrim(p_provider_message_id), '') is null)
    or (p_result = 'failed' and nullif(btrim(p_error_code), '') is null)
    or char_length(coalesce(p_error_code, '')) > 100
  then
    return query select 'invalid_input'::text, null::text, null::timestamptz;
    return;
  end if;

  select deliveries.*
  into delivery_record
  from public.notification_deliveries as deliveries
  where deliveries.id = p_delivery_id
  for update;

  if not found then
    return query select 'not_found'::text, null::text, null::timestamptz;
    return;
  end if;

  if delivery_record.status <> 'pending'
    or delivery_record.attempt_count <> p_attempt_count
  then
    return query
      select
        'stale_claim'::text,
        delivery_record.status,
        delivery_record.next_attempt_at;
    return;
  end if;

  if p_result = 'sent' then
    update public.notification_deliveries
    set
      status = 'sent',
      provider_message_id = left(btrim(p_provider_message_id), 500),
      last_error_code = null,
      next_attempt_at = null,
      sent_at = now()
    where id = delivery_record.id
    returning *
    into delivery_record;
  else
    update public.notification_deliveries
    set
      status = 'failed',
      provider_message_id = null,
      last_error_code = left(btrim(p_error_code), 100),
      next_attempt_at = case
        when p_retryable and p_attempt_count < p_max_attempts then
          now() + case
            when p_attempt_count = 1 then interval '1 minute'
            else interval '5 minutes'
          end
        else null
      end,
      sent_at = null
    where id = delivery_record.id
    returning *
    into delivery_record;
  end if;

  return query
    select
      'finalized'::text,
      delivery_record.status,
      delivery_record.next_attempt_at;
end;
$$;

revoke all on function public.claim_whatsapp_notification(
  uuid,
  text,
  text,
  integer,
  integer
) from public, anon, authenticated;
revoke all on function public.finalize_whatsapp_notification(
  uuid,
  integer,
  text,
  text,
  text,
  boolean,
  integer
) from public, anon, authenticated;

grant execute on function public.claim_whatsapp_notification(
  uuid,
  text,
  text,
  integer,
  integer
) to service_role;
grant execute on function public.finalize_whatsapp_notification(
  uuid,
  integer,
  text,
  text,
  text,
  boolean,
  integer
) to service_role;

comment on function public.claim_whatsapp_notification(
  uuid,
  text,
  text,
  integer,
  integer
) is
  'Service-role-only idempotent delivery claim with a short in-flight lease.';
comment on function public.finalize_whatsapp_notification(
  uuid,
  integer,
  text,
  text,
  text,
  boolean,
  integer
) is
  'Service-role-only delivery finalization with bounded retry backoff.';

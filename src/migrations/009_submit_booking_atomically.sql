-- Phase 7: submit a booking, participant rows, and audit event atomically.

create or replace function public.submit_booking_draft(
  p_public_token_hash text,
  p_customer_name text,
  p_customer_whatsapp text,
  p_customer_email text,
  p_customer_city text,
  p_participant_names text[],
  p_sender_bank_name text,
  p_sender_account_name text,
  p_declared_transfer_amount numeric,
  p_transferred_at timestamptz,
  p_transfer_proof_path text,
  p_customer_notes text,
  p_consent_data_is_correct boolean,
  p_consent_payment_requires_verification boolean
)
returns table (
  outcome text,
  booking_id uuid,
  booking_code text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  booking_record public.bookings%rowtype;
begin
  select bookings.*
  into booking_record
  from public.bookings as bookings
  where bookings.public_token_hash = p_public_token_hash
  for update;

  if not found then
    return query select 'not_found'::text, null::uuid, null::text;
    return;
  end if;

  if booking_record.status <> 'draft' then
    if booking_record.status = 'expired' then
      return query
        select 'expired'::text, booking_record.id, booking_record.booking_code;
    elsif booking_record.status in (
      'waiting_verification',
      'confirmed',
      'payment_rejected',
      'cancelled',
      'completed'
    ) then
      return query
        select 'already_submitted'::text, booking_record.id, booking_record.booking_code;
    else
      return query
        select 'unavailable'::text, booking_record.id, booking_record.booking_code;
    end if;
    return;
  end if;

  if booking_record.draft_expires_at <= now() then
    update public.bookings
    set status = 'expired'
    where id = booking_record.id;

    insert into public.booking_events (
      booking_id,
      event_type,
      from_status,
      to_status,
      actor_type,
      actor_id,
      metadata
    )
    values (
      booking_record.id,
      'draft_expired',
      'draft',
      'expired',
      'system',
      null,
      '{}'::jsonb
    );

    return query
      select 'expired'::text, booking_record.id, booking_record.booking_code;
    return;
  end if;

  if p_declared_transfer_amount is distinct from booking_record.total_amount_snapshot then
    return query
      select 'amount_mismatch'::text, booking_record.id, booking_record.booking_code;
    return;
  end if;

  if char_length(btrim(p_customer_name)) not between 2 and 100
    or p_customer_whatsapp !~ '^[1-9][0-9]{7,14}$'
    or char_length(p_customer_email) not between 3 and 254
    or p_customer_email not like '%_@_%._%'
    or char_length(btrim(p_sender_account_name)) not between 2 and 100
    or p_transfer_proof_path !~ (
      '^' || booking_record.id::text ||
      '/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(jpg|png|pdf)$'
    )
    or not p_consent_data_is_correct
    or not p_consent_payment_requires_verification
    or coalesce(cardinality(p_participant_names), 0) <> booking_record.traveler_count
    or exists (
      select 1
      from unnest(p_participant_names) as participant_name
      where char_length(btrim(participant_name)) not between 2 and 100
    )
  then
    return query
      select 'invalid_payload'::text, booking_record.id, booking_record.booking_code;
    return;
  end if;

  update public.bookings
  set
    status = 'waiting_verification',
    customer_name = btrim(p_customer_name),
    customer_whatsapp = p_customer_whatsapp,
    customer_email = lower(btrim(p_customer_email)),
    customer_city = nullif(btrim(p_customer_city), ''),
    sender_bank_name = nullif(btrim(p_sender_bank_name), ''),
    sender_account_name = btrim(p_sender_account_name),
    declared_transfer_amount = p_declared_transfer_amount,
    transferred_at = p_transferred_at,
    transfer_proof_path = p_transfer_proof_path,
    customer_notes = nullif(btrim(p_customer_notes), ''),
    consent_data_is_correct = p_consent_data_is_correct,
    consent_payment_requires_verification =
      p_consent_payment_requires_verification,
    submitted_at = now()
  where id = booking_record.id;

  insert into public.booking_participants (
    booking_id,
    full_name,
    sort_order
  )
  select
    booking_record.id,
    btrim(participant_name),
    participant_ordinality - 1
  from unnest(p_participant_names)
    with ordinality as participants(participant_name, participant_ordinality);

  insert into public.booking_events (
    booking_id,
    event_type,
    from_status,
    to_status,
    actor_type,
    actor_id,
    metadata
  )
  values (
    booking_record.id,
    'booking_submitted',
    'draft',
    'waiting_verification',
    'system',
    null,
    jsonb_build_object('participant_count', booking_record.traveler_count)
  );

  return query
    select 'submitted'::text, booking_record.id, booking_record.booking_code;
end;
$$;

revoke all on function public.submit_booking_draft(
  text,
  text,
  text,
  text,
  text,
  text[],
  text,
  text,
  numeric,
  timestamptz,
  text,
  text,
  boolean,
  boolean
) from public, anon, authenticated;

grant execute on function public.submit_booking_draft(
  text,
  text,
  text,
  text,
  text,
  text[],
  text,
  text,
  numeric,
  timestamptz,
  text,
  text,
  boolean,
  boolean
) to service_role;

comment on function public.submit_booking_draft(
  text,
  text,
  text,
  text,
  text,
  text[],
  text,
  text,
  numeric,
  timestamptz,
  text,
  text,
  boolean,
  boolean
) is
  'Service-role-only, row-locked transition from draft to waiting_verification.';

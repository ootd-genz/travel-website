-- Phase 8: atomic admin booking transitions and audited admin notes.

create or replace function public.transition_booking_status(
  p_booking_id uuid,
  p_action text,
  p_note text default null
)
returns table (
  outcome text,
  previous_status text,
  current_status text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  booking_record public.bookings%rowtype;
  actor_user_id uuid := auth.uid();
  target_status text;
  transition_event_type text;
  normalized_note text := nullif(btrim(p_note), '');
begin
  if actor_user_id is null or not (select private.is_active_admin()) then
    raise insufficient_privilege using message = 'active admin required';
  end if;

  if p_action not in ('confirm', 'reject', 'cancel', 'complete') then
    return query select 'invalid_action'::text, null::text, null::text;
    return;
  end if;

  if char_length(coalesce(normalized_note, '')) > 2000 then
    return query select 'invalid_note'::text, null::text, null::text;
    return;
  end if;

  if p_action in ('reject', 'cancel')
    and char_length(coalesce(normalized_note, '')) < 3
  then
    return query select 'reason_required'::text, null::text, null::text;
    return;
  end if;

  select bookings.*
  into booking_record
  from public.bookings as bookings
  where bookings.id = p_booking_id
  for update;

  if not found then
    return query select 'not_found'::text, null::text, null::text;
    return;
  end if;

  target_status := case p_action
    when 'confirm' then 'confirmed'
    when 'reject' then 'payment_rejected'
    when 'cancel' then 'cancelled'
    when 'complete' then 'completed'
  end;

  transition_event_type := case p_action
    when 'confirm' then 'payment_confirmed'
    when 'reject' then 'payment_rejected'
    when 'cancel' then 'booking_cancelled'
    when 'complete' then 'booking_completed'
  end;

  if booking_record.status = target_status then
    return query
      select
        'already_current'::text,
        booking_record.status,
        booking_record.status;
    return;
  end if;

  if not (
    (
      booking_record.status = 'waiting_verification'
      and target_status in ('confirmed', 'payment_rejected', 'cancelled')
    )
    or (
      booking_record.status = 'confirmed'
      and target_status = 'completed'
    )
  ) then
    return query
      select
        'invalid_transition'::text,
        booking_record.status,
        booking_record.status;
    return;
  end if;

  update public.bookings
  set
    status = target_status,
    confirmed_at = case
      when target_status = 'confirmed' then now()
      else confirmed_at
    end,
    confirmed_by = case
      when target_status = 'confirmed' then actor_user_id
      else confirmed_by
    end
  where id = booking_record.id;

  insert into public.booking_events (
    booking_id,
    event_type,
    from_status,
    to_status,
    actor_type,
    actor_id,
    note,
    metadata
  )
  values (
    booking_record.id,
    transition_event_type,
    booking_record.status,
    target_status,
    'admin',
    actor_user_id,
    normalized_note,
    jsonb_build_object('action', p_action)
  );

  return query
    select 'transitioned'::text, booking_record.status, target_status;
end;
$$;

create or replace function public.update_booking_admin_notes(
  p_booking_id uuid,
  p_admin_notes text
)
returns table (
  outcome text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  booking_record public.bookings%rowtype;
  actor_user_id uuid := auth.uid();
  normalized_notes text := nullif(btrim(p_admin_notes), '');
begin
  if actor_user_id is null or not (select private.is_active_admin()) then
    raise insufficient_privilege using message = 'active admin required';
  end if;

  if char_length(coalesce(normalized_notes, '')) > 4000 then
    return query select 'invalid_notes'::text;
    return;
  end if;

  select bookings.*
  into booking_record
  from public.bookings as bookings
  where bookings.id = p_booking_id
  for update;

  if not found then
    return query select 'not_found'::text;
    return;
  end if;

  if booking_record.admin_notes is not distinct from normalized_notes then
    return query select 'unchanged'::text;
    return;
  end if;

  update public.bookings
  set admin_notes = normalized_notes
  where id = booking_record.id;

  insert into public.booking_events (
    booking_id,
    event_type,
    actor_type,
    actor_id,
    note,
    metadata
  )
  values (
    booking_record.id,
    'admin_note_updated',
    'admin',
    actor_user_id,
    case
      when normalized_notes is null then 'Catatan admin dikosongkan.'
      else 'Catatan admin diperbarui.'
    end,
    jsonb_build_object('has_note', normalized_notes is not null)
  );

  return query select 'updated'::text;
end;
$$;

revoke all on function public.transition_booking_status(
  uuid,
  text,
  text
) from public, anon;
revoke all on function public.update_booking_admin_notes(
  uuid,
  text
) from public, anon;

grant execute on function public.transition_booking_status(
  uuid,
  text,
  text
) to authenticated;
grant execute on function public.update_booking_admin_notes(
  uuid,
  text
) to authenticated;

comment on function public.transition_booking_status(uuid, text, text) is
  'Active-admin-only, row-locked booking state transition with an atomic audit event.';
comment on function public.update_booking_admin_notes(uuid, text) is
  'Active-admin-only admin note update with an atomic audit event.';

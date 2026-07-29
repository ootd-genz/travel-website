-- Phase 2: private booking, participants, audit events, and notification delivery.

create table public.bookings (
  id uuid primary key default extensions.gen_random_uuid(),
  booking_code text not null unique
    check (booking_code ~ '^TRV-[0-9]{8}-[A-Z0-9]{6}$'),
  public_token_hash text not null unique
    check (public_token_hash ~ '^[a-f0-9]{64}$'),
  status text not null default 'draft'
    check (status in (
      'draft',
      'waiting_verification',
      'confirmed',
      'payment_rejected',
      'cancelled',
      'completed',
      'expired'
    )),
  draft_expires_at timestamptz not null,
  package_id uuid not null references public.trips(id) on delete restrict,
  promotion_id uuid references public.promotions(id) on delete set null,
  package_name_snapshot text not null
    check (char_length(btrim(package_name_snapshot)) between 2 and 160),
  promotion_name_snapshot text,
  unit_price_snapshot numeric(14,2) not null check (unit_price_snapshot >= 0),
  price_unit_snapshot text not null check (price_unit_snapshot in ('per_person', 'per_package')),
  subtotal_amount_snapshot numeric(14,2) not null check (subtotal_amount_snapshot >= 0),
  discount_snapshot numeric(14,2) not null default 0 check (discount_snapshot >= 0),
  traveler_count integer not null check (traveler_count >= 1),
  total_amount_snapshot numeric(14,2) not null check (total_amount_snapshot >= 0),
  currency_snapshot text not null default 'IDR' check (currency_snapshot ~ '^[A-Z]{3}$'),
  price_version_at timestamptz not null,
  departure_date date,
  customer_name text check (
    customer_name is null or char_length(btrim(customer_name)) between 2 and 100
  ),
  customer_whatsapp text check (
    customer_whatsapp is null or customer_whatsapp ~ '^[1-9][0-9]{7,14}$'
  ),
  customer_email text check (
    customer_email is null or (
      char_length(customer_email) between 3 and 254
      and customer_email like '%_@_%._%'
    )
  ),
  customer_city text check (customer_city is null or char_length(customer_city) <= 100),
  sender_bank_name text check (sender_bank_name is null or char_length(sender_bank_name) <= 100),
  sender_account_name text check (
    sender_account_name is null or char_length(btrim(sender_account_name)) between 2 and 100
  ),
  declared_transfer_amount numeric(14,2) check (
    declared_transfer_amount is null or declared_transfer_amount >= 0
  ),
  transferred_at timestamptz,
  transfer_proof_path text,
  transfer_proof_deleted_at timestamptz,
  customer_notes text check (customer_notes is null or char_length(customer_notes) <= 2000),
  admin_notes text check (admin_notes is null or char_length(admin_notes) <= 4000),
  consent_data_is_correct boolean not null default false,
  consent_payment_requires_verification boolean not null default false,
  submitted_at timestamptz,
  confirmed_at timestamptz,
  confirmed_by uuid references auth.users(id) on delete restrict,
  terminal_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (draft_expires_at > created_at),
  check (discount_snapshot <= subtotal_amount_snapshot),
  check (total_amount_snapshot = subtotal_amount_snapshot - discount_snapshot),
  check (
    subtotal_amount_snapshot = case
      when price_unit_snapshot = 'per_person'
        then unit_price_snapshot * traveler_count
      else unit_price_snapshot
    end
  ),
  check (
    (status in ('draft', 'expired'))
    or (
      customer_name is not null
      and customer_whatsapp is not null
      and customer_email is not null
      and sender_account_name is not null
      and declared_transfer_amount is not null
      and (transfer_proof_path is not null or transfer_proof_deleted_at is not null)
      and consent_data_is_correct
      and consent_payment_requires_verification
      and submitted_at is not null
    )
  ),
  check (
    status not in ('confirmed', 'completed')
    or (confirmed_at is not null and confirmed_by is not null)
  ),
  check (
    (status in ('payment_rejected', 'cancelled', 'completed')) = (terminal_at is not null)
  ),
  check (transfer_proof_deleted_at is null or terminal_at is not null),
  check (transfer_proof_deleted_at is null or transfer_proof_path is null)
);

comment on column public.bookings.public_token_hash is
  'SHA-256 hex digest of the public booking token. The raw token is never stored.';
comment on column public.bookings.transfer_proof_path is
  'Private Storage object path only; never a public or signed URL.';
comment on column public.bookings.terminal_at is
  'Retention anchor for payment_rejected, cancelled, and completed bookings.';

create table public.booking_participants (
  id uuid primary key default extensions.gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  full_name text not null check (char_length(btrim(full_name)) between 2 and 100),
  sort_order integer not null check (sort_order >= 0),
  created_at timestamptz not null default now(),
  unique (booking_id, sort_order)
);

create table public.booking_events (
  id uuid primary key default extensions.gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  event_type text not null check (char_length(btrim(event_type)) between 2 and 80),
  from_status text check (from_status is null or from_status in (
    'draft', 'waiting_verification', 'confirmed', 'payment_rejected',
    'cancelled', 'completed', 'expired'
  )),
  to_status text check (to_status is null or to_status in (
    'draft', 'waiting_verification', 'confirmed', 'payment_rejected',
    'cancelled', 'completed', 'expired'
  )),
  actor_type text not null check (actor_type in ('system', 'admin')),
  actor_id uuid references auth.users(id) on delete restrict,
  note text check (note is null or char_length(note) <= 2000),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  check (
    (actor_type = 'admin' and actor_id is not null)
    or (actor_type = 'system' and actor_id is null)
  )
);

comment on table public.booking_events is
  'Append-only operational and status audit trail. Do not store signed URLs or raw proof data.';

create table public.notification_deliveries (
  id uuid primary key default extensions.gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  channel text not null check (channel in ('whatsapp')),
  event_type text not null check (char_length(btrim(event_type)) between 2 and 80),
  destination_number text not null check (destination_number ~ '^[1-9][0-9]{7,14}$'),
  provider_message_id text,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  last_error_code text check (last_error_code is null or char_length(last_error_code) <= 100),
  next_attempt_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (booking_id, channel, event_type),
  check (status <> 'sent' or sent_at is not null)
);

create index bookings_status_created_idx
  on public.bookings (status, created_at desc);
create index bookings_customer_whatsapp_idx
  on public.bookings (customer_whatsapp)
  where customer_whatsapp is not null;
create index bookings_package_created_idx
  on public.bookings (package_id, created_at desc);
create index bookings_draft_expiry_idx
  on public.bookings (draft_expires_at)
  where status = 'draft';
create index bookings_transfer_proof_retention_idx
  on public.bookings (terminal_at)
  where terminal_at is not null and transfer_proof_deleted_at is null;
create index booking_participants_booking_idx
  on public.booking_participants (booking_id, sort_order);
create index booking_events_booking_created_idx
  on public.booking_events (booking_id, created_at desc);
create index notification_deliveries_booking_created_idx
  on public.notification_deliveries (booking_id, created_at desc);
create index notification_deliveries_retry_idx
  on public.notification_deliveries (next_attempt_at)
  where status = 'failed' and next_attempt_at is not null;

create or replace function private.manage_booking_terminal_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE'
    and new.status = old.status
    and new.terminal_at is distinct from old.terminal_at
  then
    raise exception 'booking terminal timestamp is managed from status transitions';
  end if;

  if new.status in ('payment_rejected', 'cancelled', 'completed') then
    if tg_op = 'INSERT' or old.status not in ('payment_rejected', 'cancelled', 'completed') then
      new.terminal_at = now();
    end if;
  else
    new.terminal_at = null;
  end if;

  return new;
end;
$$;

create or replace function private.protect_booking_snapshot()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.public_token_hash is distinct from old.public_token_hash
    or new.package_id is distinct from old.package_id
    or new.promotion_id is distinct from old.promotion_id
    or new.package_name_snapshot is distinct from old.package_name_snapshot
    or new.promotion_name_snapshot is distinct from old.promotion_name_snapshot
    or new.unit_price_snapshot is distinct from old.unit_price_snapshot
    or new.price_unit_snapshot is distinct from old.price_unit_snapshot
    or new.subtotal_amount_snapshot is distinct from old.subtotal_amount_snapshot
    or new.discount_snapshot is distinct from old.discount_snapshot
    or new.traveler_count is distinct from old.traveler_count
    or new.total_amount_snapshot is distinct from old.total_amount_snapshot
    or new.currency_snapshot is distinct from old.currency_snapshot
    or new.price_version_at is distinct from old.price_version_at
    or new.departure_date is distinct from old.departure_date
  then
    raise exception 'booking price and package snapshot is immutable';
  end if;

  return new;
end;
$$;

revoke all on function private.manage_booking_terminal_at() from public;
revoke all on function private.protect_booking_snapshot() from public;

create trigger bookings_manage_terminal_at
before insert or update of status, terminal_at on public.bookings
for each row execute function private.manage_booking_terminal_at();
create trigger bookings_protect_snapshot
before update on public.bookings
for each row execute function private.protect_booking_snapshot();
create trigger bookings_set_updated_at
before update on public.bookings
for each row execute function private.set_updated_at();
create trigger notification_deliveries_set_updated_at
before update on public.notification_deliveries
for each row execute function private.set_updated_at();

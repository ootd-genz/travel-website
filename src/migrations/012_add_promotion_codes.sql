-- Add private promotion codes and preserve the applied code in booking snapshots.

alter table public.promotions
  add column code text
  check (
    code is null
    or (
      code = upper(btrim(code))
      and code ~ '^[A-Z0-9][A-Z0-9_-]{2,31}$'
    )
  );

create unique index promotions_code_unique_idx
  on public.promotions (code)
  where code is not null;

comment on column public.promotions.code is
  'Optional private redemption code. Null promotions remain automatic public offers.';

alter table public.bookings
  add column promotion_code_snapshot text
  check (
    promotion_code_snapshot is null
    or promotion_code_snapshot ~ '^[A-Z0-9][A-Z0-9_-]{2,31}$'
  );

comment on column public.bookings.promotion_code_snapshot is
  'Immutable promotion code snapshot stored only when a coded promotion is applied.';

-- Anonymous visitors may only discover automatic promotions. Code-based promotions
-- are validated through the server-side booking draft flow.
drop policy if exists promotions_public_read on public.promotions;
create policy promotions_public_read
on public.promotions
for select
to anon
using (
  code is null
  and is_active = true
  and starts_at <= now()
  and (ends_at is null or ends_at > now())
);

drop policy if exists promotion_trips_public_read on public.promotion_trips;
create policy promotion_trips_public_read
on public.promotion_trips
for select
to anon
using (
  exists (
    select 1
    from public.promotions
    where promotions.id = promotion_trips.promotion_id
      and promotions.code is null
      and promotions.is_active = true
      and promotions.starts_at <= now()
      and (promotions.ends_at is null or promotions.ends_at > now())
  )
  and exists (
    select 1
    from public.trips
    where trips.id = promotion_trips.trip_id
      and trips.status = 'published'
  )
);

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
    or new.promotion_code_snapshot is distinct from old.promotion_code_snapshot
    or new.unit_price_snapshot is distinct from old.unit_price_snapshot
    or new.price_unit_snapshot is distinct from old.price_unit_snapshot
    or new.subtotal_amount_snapshot is distinct from old.subtotal_amount_snapshot
    or new.discount_snapshot is distinct from old.discount_snapshot
    or new.traveler_count is distinct from old.traveler_count
    or new.total_amount_snapshot is distinct from old.total_amount_snapshot
    or new.currency_snapshot is distinct from old.currency_snapshot
    or new.price_version_at is distinct from old.price_version_at
    or new.departure_date is distinct from old.departure_date
    or new.departure_option_snapshot is distinct from old.departure_option_snapshot
  then
    raise exception 'booking price and package snapshot is immutable';
  end if;

  return new;
end;
$$;

revoke all on function private.protect_booking_snapshot() from public;

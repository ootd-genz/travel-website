-- Phase 6: preserve the exact CMS departure option chosen for a booking draft.

alter table public.bookings
  add column departure_option_snapshot text
  check (
    departure_option_snapshot is null
    or char_length(btrim(departure_option_snapshot)) between 1 and 200
  );

comment on column public.bookings.departure_option_snapshot is
  'Immutable display snapshot of the package departure option selected when the draft was created.';

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
    or new.departure_option_snapshot is distinct from old.departure_option_snapshot
  then
    raise exception 'booking price and package snapshot is immutable';
  end if;

  return new;
end;
$$;

revoke all on function private.protect_booking_snapshot() from public;

begin;

create extension if not exists pgtap with schema extensions;
select plan(17);

select has_table('public', 'destinations', 'content schema exists');
select has_table('public', 'bookings', 'private booking schema exists');

select is(
  (
    select count(*)::integer
    from pg_class
    where relnamespace = 'public'::regnamespace
      and relname in (
        'admin_users', 'site_settings', 'homepage_content', 'usp_items',
        'destinations', 'activities', 'trip_types', 'trips',
        'trip_destinations', 'trip_activities', 'trip_trip_types',
        'promotions', 'promotion_trips', 'blog_posts',
        'blog_post_destinations', 'blog_post_activities', 'blog_post_trips',
        'bookings', 'booking_participants', 'booking_events',
        'notification_deliveries'
      )
      and relrowsecurity
  ),
  21,
  'RLS is enabled on every exposed Phase 2 table'
);

select is(
  (select public from storage.buckets where id = 'booking-transfer-proofs'),
  false,
  'transfer-proof bucket is private'
);

select is(
  (select file_size_limit from storage.buckets where id = 'booking-transfer-proofs'),
  5242880::bigint,
  'transfer-proof bucket enforces the 5 MiB limit'
);

select ok(
  (
    select allowed_mime_types @> array['image/jpeg', 'image/png', 'application/pdf']::text[]
    from storage.buckets
    where id = 'booking-transfer-proofs'
  ),
  'transfer-proof bucket has the documented MIME allowlist'
);

select ok(
  not has_table_privilege('anon', 'public.bookings', 'SELECT'),
  'anon has no direct booking-table read privilege'
);

select is(
  (
    select count(*)::integer
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'booking_transfer_proofs_admin_read'
  ),
  0,
  'transfer proofs have no direct authenticated object policy; server authorization uses service role'
);

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values (
  '00000000-0000-0000-0000-000000000000',
  '10000000-0000-0000-0000-000000000001',
  'authenticated',
  'authenticated',
  'phase2-admin@example.test',
  '',
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb,
  now(),
  now()
);

insert into public.admin_users (auth_user_id, display_name)
values ('10000000-0000-0000-0000-000000000001', 'Phase 2 Admin');

insert into public.destinations (
  id, name, slug, short_description, description, country, status, published_at
)
values
  (
    '20000000-0000-0000-0000-000000000001',
    'Published Destination',
    'published-destination',
    'Published fixture',
    'Published fixture content',
    'Indonesia',
    'published',
    now()
  ),
  (
    '20000000-0000-0000-0000-000000000002',
    'Draft Destination',
    'draft-destination',
    'Draft fixture',
    'Draft fixture content',
    'Indonesia',
    'draft',
    null
  );

insert into public.trips (
  id,
  name,
  slug,
  short_description,
  description,
  base_price,
  currency,
  price_unit,
  duration_days,
  duration_nights,
  min_participants,
  max_participants,
  status,
  published_at
)
values (
  '30000000-0000-0000-0000-000000000001',
  'Phase 2 Trip',
  'phase-2-trip',
  'Trip fixture',
  'Trip fixture content',
  1000000,
  'IDR',
  'per_person',
  2,
  1,
  1,
  10,
  'published',
  now()
);

insert into public.bookings (
  id,
  booking_code,
  public_token_hash,
  status,
  draft_expires_at,
  package_id,
  package_name_snapshot,
  unit_price_snapshot,
  price_unit_snapshot,
  subtotal_amount_snapshot,
  discount_snapshot,
  traveler_count,
  total_amount_snapshot,
  currency_snapshot,
  price_version_at
)
values (
  '40000000-0000-0000-0000-000000000001',
  'TRV-20260729-ABC123',
  repeat('a', 64),
  'draft',
  now() + interval '60 minutes',
  '30000000-0000-0000-0000-000000000001',
  'Phase 2 Trip',
  1000000,
  'per_person',
  2000000,
  0,
  2,
  2000000,
  'IDR',
  now()
);

set local role anon;

select results_eq(
  $$select count(*)::bigint from public.destinations$$,
  $$values (1::bigint)$$,
  'anon reads published content only'
);

select results_eq(
  $$select count(*)::bigint from public.destinations where status = 'draft'$$,
  $$values (0::bigint)$$,
  'anon cannot see draft content'
);

reset role;
set local role authenticated;
set local request.jwt.claims =
  '{"sub":"10000000-0000-0000-0000-000000000002","role":"authenticated"}';

select is((select private.is_active_admin()), false, 'non-admin JWT is not authorized as admin');
select results_eq(
  $$select count(*)::bigint from public.bookings$$,
  $$values (0::bigint)$$,
  'authenticated non-admin cannot read bookings'
);
select results_eq(
  $$select count(*)::bigint from public.admin_users$$,
  $$values (0::bigint)$$,
  'authenticated non-admin cannot enumerate admins'
);

reset role;
set local role authenticated;
set local request.jwt.claims =
  '{"sub":"10000000-0000-0000-0000-000000000001","role":"authenticated"}';

select is((select private.is_active_admin()), true, 'active allowlisted admin is authorized');
select results_eq(
  $$select count(*)::bigint from public.bookings$$,
  $$values (1::bigint)$$,
  'active admin can read private bookings'
);
select results_eq(
  $$select count(*)::bigint from public.destinations where status = 'draft'$$,
  $$values (1::bigint)$$,
  'active admin can read draft content'
);

select throws_ok(
  $$update public.bookings set total_amount_snapshot = 1 where id = '40000000-0000-0000-0000-000000000001'$$,
  'P0001',
  'booking price and package snapshot is immutable',
  'booking commercial snapshot cannot be changed after creation'
);

select * from finish();
rollback;

-- Phase 2: least-privilege grants, RLS policies, and private transfer-proof storage.

alter table public.admin_users enable row level security;
alter table public.site_settings enable row level security;
alter table public.homepage_content enable row level security;
alter table public.usp_items enable row level security;
alter table public.destinations enable row level security;
alter table public.activities enable row level security;
alter table public.trip_types enable row level security;
alter table public.trips enable row level security;
alter table public.trip_destinations enable row level security;
alter table public.trip_activities enable row level security;
alter table public.trip_trip_types enable row level security;
alter table public.promotions enable row level security;
alter table public.promotion_trips enable row level security;
alter table public.blog_posts enable row level security;
alter table public.blog_post_destinations enable row level security;
alter table public.blog_post_activities enable row level security;
alter table public.blog_post_trips enable row level security;
alter table public.bookings enable row level security;
alter table public.booking_participants enable row level security;
alter table public.booking_events enable row level security;
alter table public.notification_deliveries enable row level security;

revoke all on table
  public.admin_users,
  public.site_settings,
  public.homepage_content,
  public.usp_items,
  public.destinations,
  public.activities,
  public.trip_types,
  public.trips,
  public.trip_destinations,
  public.trip_activities,
  public.trip_trip_types,
  public.promotions,
  public.promotion_trips,
  public.blog_posts,
  public.blog_post_destinations,
  public.blog_post_activities,
  public.blog_post_trips,
  public.bookings,
  public.booking_participants,
  public.booking_events,
  public.notification_deliveries
from anon, authenticated;

grant select on table
  public.homepage_content,
  public.usp_items,
  public.destinations,
  public.activities,
  public.trip_types,
  public.trips,
  public.trip_destinations,
  public.trip_activities,
  public.trip_trip_types,
  public.promotions,
  public.promotion_trips,
  public.blog_posts,
  public.blog_post_destinations,
  public.blog_post_activities,
  public.blog_post_trips
to anon, authenticated;

grant select, insert, update, delete on table
  public.admin_users,
  public.site_settings,
  public.homepage_content,
  public.usp_items,
  public.destinations,
  public.activities,
  public.trip_types,
  public.trips,
  public.trip_destinations,
  public.trip_activities,
  public.trip_trip_types,
  public.promotions,
  public.promotion_trips,
  public.blog_posts,
  public.blog_post_destinations,
  public.blog_post_activities,
  public.blog_post_trips,
  public.bookings,
  public.booking_participants,
  public.booking_events,
  public.notification_deliveries
to authenticated;

-- Make this migration safe to rerun after a SQL client partially committed it.
-- Dropping only project-owned policies avoids changing unrelated policies.
drop policy if exists admin_users_read_self on public.admin_users;
drop policy if exists admin_users_admin_insert on public.admin_users;
drop policy if exists admin_users_admin_update on public.admin_users;
drop policy if exists admin_users_admin_delete on public.admin_users;
drop policy if exists homepage_content_public_read on public.homepage_content;
drop policy if exists usp_items_public_read on public.usp_items;
drop policy if exists destinations_public_read on public.destinations;
drop policy if exists activities_public_read on public.activities;
drop policy if exists trip_types_public_read on public.trip_types;
drop policy if exists trips_public_read on public.trips;
drop policy if exists trip_destinations_public_read on public.trip_destinations;
drop policy if exists trip_activities_public_read on public.trip_activities;
drop policy if exists trip_trip_types_public_read on public.trip_trip_types;
drop policy if exists promotions_public_read on public.promotions;
drop policy if exists promotion_trips_public_read on public.promotion_trips;
drop policy if exists blog_posts_public_read on public.blog_posts;
drop policy if exists blog_post_destinations_public_read on public.blog_post_destinations;
drop policy if exists blog_post_activities_public_read on public.blog_post_activities;
drop policy if exists blog_post_trips_public_read on public.blog_post_trips;
drop policy if exists site_settings_admin_all on public.site_settings;
drop policy if exists homepage_content_admin_all on public.homepage_content;
drop policy if exists usp_items_admin_all on public.usp_items;
drop policy if exists destinations_admin_all on public.destinations;
drop policy if exists activities_admin_all on public.activities;
drop policy if exists trip_types_admin_all on public.trip_types;
drop policy if exists trips_admin_all on public.trips;
drop policy if exists trip_destinations_admin_all on public.trip_destinations;
drop policy if exists trip_activities_admin_all on public.trip_activities;
drop policy if exists trip_trip_types_admin_all on public.trip_trip_types;
drop policy if exists promotions_admin_all on public.promotions;
drop policy if exists promotion_trips_admin_all on public.promotion_trips;
drop policy if exists blog_posts_admin_all on public.blog_posts;
drop policy if exists blog_post_destinations_admin_all on public.blog_post_destinations;
drop policy if exists blog_post_activities_admin_all on public.blog_post_activities;
drop policy if exists blog_post_trips_admin_all on public.blog_post_trips;
drop policy if exists bookings_admin_all on public.bookings;
drop policy if exists booking_participants_admin_all on public.booking_participants;
drop policy if exists booking_events_admin_select on public.booking_events;
drop policy if exists booking_events_admin_insert on public.booking_events;
drop policy if exists notification_deliveries_admin_all on public.notification_deliveries;

create policy admin_users_read_self
on public.admin_users
for select
to authenticated
using (
  auth_user_id = (select auth.uid())
  and is_active
);

create policy admin_users_admin_insert
on public.admin_users
for insert
to authenticated
with check ((select private.is_active_admin()));
create policy admin_users_admin_update
on public.admin_users
for update
to authenticated
using ((select private.is_active_admin()))
with check ((select private.is_active_admin()));
create policy admin_users_admin_delete
on public.admin_users
for delete
to authenticated
using ((select private.is_active_admin()));

create policy homepage_content_public_read
on public.homepage_content
for select
to anon, authenticated
using (is_published);

create policy usp_items_public_read
on public.usp_items
for select
to anon, authenticated
using (is_active);

create policy destinations_public_read
on public.destinations
for select
to anon, authenticated
using (status = 'published');

create policy activities_public_read
on public.activities
for select
to anon, authenticated
using (status = 'published');

create policy trip_types_public_read
on public.trip_types
for select
to anon, authenticated
using (status = 'published');

create policy trips_public_read
on public.trips
for select
to anon, authenticated
using (status = 'published');

create policy trip_destinations_public_read
on public.trip_destinations
for select
to anon, authenticated
using (
  exists (
    select 1 from public.trips
    where trips.id = trip_destinations.trip_id
      and trips.status = 'published'
  )
  and exists (
    select 1 from public.destinations
    where destinations.id = trip_destinations.destination_id
      and destinations.status = 'published'
  )
);

create policy trip_activities_public_read
on public.trip_activities
for select
to anon, authenticated
using (
  exists (
    select 1 from public.trips
    where trips.id = trip_activities.trip_id
      and trips.status = 'published'
  )
  and exists (
    select 1 from public.activities
    where activities.id = trip_activities.activity_id
      and activities.status = 'published'
  )
);

create policy trip_trip_types_public_read
on public.trip_trip_types
for select
to anon, authenticated
using (
  exists (
    select 1 from public.trips
    where trips.id = trip_trip_types.trip_id
      and trips.status = 'published'
  )
  and exists (
    select 1 from public.trip_types
    where trip_types.id = trip_trip_types.trip_type_id
      and trip_types.status = 'published'
  )
);

create policy promotions_public_read
on public.promotions
for select
to anon, authenticated
using (
  is_active
  and starts_at <= now()
  and (ends_at is null or ends_at > now())
);

create policy promotion_trips_public_read
on public.promotion_trips
for select
to anon, authenticated
using (
  exists (
    select 1 from public.promotions
    where promotions.id = promotion_trips.promotion_id
      and promotions.is_active
      and promotions.starts_at <= now()
      and (promotions.ends_at is null or promotions.ends_at > now())
  )
  and exists (
    select 1 from public.trips
    where trips.id = promotion_trips.trip_id
      and trips.status = 'published'
  )
);

create policy blog_posts_public_read
on public.blog_posts
for select
to anon, authenticated
using (status = 'published' and published_at <= now());

create policy blog_post_destinations_public_read
on public.blog_post_destinations
for select
to anon, authenticated
using (
  exists (
    select 1 from public.blog_posts
    where blog_posts.id = blog_post_destinations.blog_post_id
      and blog_posts.status = 'published'
      and blog_posts.published_at <= now()
  )
  and exists (
    select 1 from public.destinations
    where destinations.id = blog_post_destinations.destination_id
      and destinations.status = 'published'
  )
);

create policy blog_post_activities_public_read
on public.blog_post_activities
for select
to anon, authenticated
using (
  exists (
    select 1 from public.blog_posts
    where blog_posts.id = blog_post_activities.blog_post_id
      and blog_posts.status = 'published'
      and blog_posts.published_at <= now()
  )
  and exists (
    select 1 from public.activities
    where activities.id = blog_post_activities.activity_id
      and activities.status = 'published'
  )
);

create policy blog_post_trips_public_read
on public.blog_post_trips
for select
to anon, authenticated
using (
  exists (
    select 1 from public.blog_posts
    where blog_posts.id = blog_post_trips.blog_post_id
      and blog_posts.status = 'published'
      and blog_posts.published_at <= now()
  )
  and exists (
    select 1 from public.trips
    where trips.id = blog_post_trips.trip_id
      and trips.status = 'published'
  )
);

-- All content/settings mutations are limited to the allowlisted active admin.
create policy site_settings_admin_all on public.site_settings
for all to authenticated
using ((select private.is_active_admin()))
with check ((select private.is_active_admin()));
create policy homepage_content_admin_all on public.homepage_content
for all to authenticated
using ((select private.is_active_admin()))
with check ((select private.is_active_admin()));
create policy usp_items_admin_all on public.usp_items
for all to authenticated
using ((select private.is_active_admin()))
with check ((select private.is_active_admin()));
create policy destinations_admin_all on public.destinations
for all to authenticated
using ((select private.is_active_admin()))
with check ((select private.is_active_admin()));
create policy activities_admin_all on public.activities
for all to authenticated
using ((select private.is_active_admin()))
with check ((select private.is_active_admin()));
create policy trip_types_admin_all on public.trip_types
for all to authenticated
using ((select private.is_active_admin()))
with check ((select private.is_active_admin()));
create policy trips_admin_all on public.trips
for all to authenticated
using ((select private.is_active_admin()))
with check ((select private.is_active_admin()));
create policy trip_destinations_admin_all on public.trip_destinations
for all to authenticated
using ((select private.is_active_admin()))
with check ((select private.is_active_admin()));
create policy trip_activities_admin_all on public.trip_activities
for all to authenticated
using ((select private.is_active_admin()))
with check ((select private.is_active_admin()));
create policy trip_trip_types_admin_all on public.trip_trip_types
for all to authenticated
using ((select private.is_active_admin()))
with check ((select private.is_active_admin()));
create policy promotions_admin_all on public.promotions
for all to authenticated
using ((select private.is_active_admin()))
with check ((select private.is_active_admin()));
create policy promotion_trips_admin_all on public.promotion_trips
for all to authenticated
using ((select private.is_active_admin()))
with check ((select private.is_active_admin()));
create policy blog_posts_admin_all on public.blog_posts
for all to authenticated
using ((select private.is_active_admin()))
with check ((select private.is_active_admin()));
create policy blog_post_destinations_admin_all on public.blog_post_destinations
for all to authenticated
using ((select private.is_active_admin()))
with check ((select private.is_active_admin()));
create policy blog_post_activities_admin_all on public.blog_post_activities
for all to authenticated
using ((select private.is_active_admin()))
with check ((select private.is_active_admin()));
create policy blog_post_trips_admin_all on public.blog_post_trips
for all to authenticated
using ((select private.is_active_admin()))
with check ((select private.is_active_admin()));

-- Booking-domain tables have no anon grants or policies. The public booking flow
-- must use validated server code with the service role. Active admins can read and
-- operate on them through an authenticated server client.
create policy bookings_admin_all on public.bookings
for all to authenticated
using ((select private.is_active_admin()))
with check ((select private.is_active_admin()));
create policy booking_participants_admin_all on public.booking_participants
for all to authenticated
using ((select private.is_active_admin()))
with check ((select private.is_active_admin()));
create policy booking_events_admin_select on public.booking_events
for select to authenticated
using ((select private.is_active_admin()));
create policy booking_events_admin_insert on public.booking_events
for insert to authenticated
with check (
  (select private.is_active_admin())
  and actor_type = 'admin'
  and actor_id = (select auth.uid())
);
create policy notification_deliveries_admin_all on public.notification_deliveries
for all to authenticated
using ((select private.is_active_admin()))
with check ((select private.is_active_admin()));

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'booking-transfer-proofs',
  'booking-transfer-proofs',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'application/pdf']::text[]
)
on conflict (id) do update
set
  name = excluded.name,
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Intentionally do not create a policy on storage.objects here. That relation is
-- owned by Supabase's managed supabase_storage_admin role, so a normal migration
-- connection is not guaranteed to be allowed to CREATE POLICY on it.
--
-- With a private bucket and no object policy, anon/authenticated clients cannot
-- list, read, upload, update, or delete transfer proofs. The application must use
-- the server-only service role after requireAdmin() to create a short-lived signed
-- URL. Customer uploads and retention deletes also use validated server-only code.

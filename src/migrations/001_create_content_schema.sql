-- Phase 2: database foundations and public content schema.
-- This migration is intentionally idempotent only at the object-definition level;
-- once applied to a shared environment it must not be edited.

create extension if not exists pgcrypto with schema extensions;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function private.set_updated_at() from public;

create table public.admin_users (
  id uuid primary key default extensions.gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete restrict,
  display_name text not null check (char_length(btrim(display_name)) between 2 and 100),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.admin_users is
  'Controlled allowlist for the single application administrator. No public signup.';

create unique index admin_users_one_active_idx
  on public.admin_users ((is_active))
  where is_active;

create index admin_users_auth_user_active_idx
  on public.admin_users (auth_user_id)
  where is_active;

create or replace function private.is_active_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_users
    where auth_user_id = (select auth.uid())
      and is_active
  );
$$;

revoke all on function private.is_active_admin() from public;
grant usage on schema private to authenticated;
grant execute on function private.is_active_admin() to authenticated;

create table public.site_settings (
  id boolean primary key default true check (id),
  brand_name text not null check (char_length(btrim(brand_name)) between 2 and 100),
  logo_path text,
  public_whatsapp text,
  email text,
  address text,
  bank_name text not null default 'BCA' check (char_length(btrim(bank_name)) between 2 and 50),
  bank_account_number text not null default '87654321'
    check (bank_account_number ~ '^[0-9]{6,30}$'),
  bank_account_holder text not null
    check (char_length(btrim(bank_account_holder)) between 2 and 100),
  admin_whatsapp_number text not null default '6282261060675'
    check (admin_whatsapp_number ~ '^[1-9][0-9]{7,14}$'),
  footer_text text,
  social_links jsonb not null default '{}'::jsonb
    check (jsonb_typeof(social_links) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.site_settings is
  'Singleton non-secret business configuration. Provider credentials must remain in environment variables.';

create table public.homepage_content (
  id boolean primary key default true check (id),
  hero_title text not null check (char_length(btrim(hero_title)) between 2 and 160),
  hero_subtitle text not null check (char_length(btrim(hero_subtitle)) between 2 and 500),
  hero_image_path text,
  primary_cta_label text not null check (char_length(btrim(primary_cta_label)) between 1 and 80),
  primary_cta_href text not null check (
    primary_cta_href like '/%' and primary_cta_href not like '//%'
  ),
  secondary_cta_label text,
  secondary_cta_href text check (
    secondary_cta_href is null
    or (secondary_cta_href like '/%' and secondary_cta_href not like '//%')
  ),
  section_visibility jsonb not null default '{}'::jsonb
    check (jsonb_typeof(section_visibility) = 'object'),
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.usp_items (
  id uuid primary key default extensions.gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 2 and 100),
  description text not null check (char_length(btrim(description)) between 2 and 500),
  icon_key text,
  sort_order integer not null default 0 check (sort_order >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.destinations (
  id uuid primary key default extensions.gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  short_description text not null check (char_length(btrim(short_description)) between 2 and 500),
  description text not null,
  country text not null check (char_length(btrim(country)) between 2 and 100),
  region text,
  city text,
  hero_image_path text,
  gallery jsonb not null default '[]'::jsonb check (jsonb_typeof(gallery) = 'array'),
  highlights jsonb not null default '[]'::jsonb check (jsonb_typeof(highlights) = 'array'),
  best_time_to_visit text,
  latitude numeric(9,6) check (latitude between -90 and 90),
  longitude numeric(9,6) check (longitude between -180 and 180),
  is_popular boolean not null default false,
  popular_rank integer check (popular_rank is null or popular_rank >= 0),
  status text not null default 'draft'
    check (status in ('draft', 'published', 'archived')),
  seo_title text check (seo_title is null or char_length(seo_title) <= 70),
  seo_description text check (seo_description is null or char_length(seo_description) <= 170),
  og_image_path text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((latitude is null) = (longitude is null)),
  check (not is_popular or popular_rank is not null),
  check (status <> 'published' or published_at is not null)
);

create table public.activities (
  id uuid primary key default extensions.gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  short_description text not null check (char_length(btrim(short_description)) between 2 and 500),
  description text not null,
  icon_key text,
  image_path text,
  gallery jsonb not null default '[]'::jsonb check (jsonb_typeof(gallery) = 'array'),
  difficulty text,
  duration_text text,
  show_on_home boolean not null default false,
  home_rank integer check (home_rank is null or home_rank >= 0),
  status text not null default 'draft'
    check (status in ('draft', 'published', 'archived')),
  seo_title text check (seo_title is null or char_length(seo_title) <= 70),
  seo_description text check (seo_description is null or char_length(seo_description) <= 170),
  og_image_path text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (not show_on_home or home_rank is not null),
  check (status <> 'published' or published_at is not null)
);

create table public.trip_types (
  id uuid primary key default extensions.gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  short_description text check (short_description is null or char_length(short_description) <= 500),
  description text not null,
  icon_key text,
  image_path text,
  sort_order integer not null default 0 check (sort_order >= 0),
  is_featured boolean not null default false,
  status text not null default 'draft'
    check (status in ('draft', 'published', 'archived')),
  seo_title text check (seo_title is null or char_length(seo_title) <= 70),
  seo_description text check (seo_description is null or char_length(seo_description) <= 170),
  og_image_path text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status <> 'published' or published_at is not null)
);

create table public.trips (
  id uuid primary key default extensions.gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 160),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  short_description text not null check (char_length(btrim(short_description)) between 2 and 500),
  description text not null,
  base_price numeric(14,2) not null check (base_price >= 0),
  sale_price numeric(14,2) check (sale_price is null or (sale_price >= 0 and sale_price <= base_price)),
  currency text not null default 'IDR' check (currency ~ '^[A-Z]{3}$'),
  price_unit text not null check (price_unit in ('per_person', 'per_package')),
  duration_days integer not null check (duration_days >= 1),
  duration_nights integer not null default 0 check (duration_nights >= 0 and duration_nights <= duration_days),
  min_participants integer not null default 1 check (min_participants >= 1),
  max_participants integer not null check (max_participants >= 1),
  departure_options jsonb not null default '[]'::jsonb check (jsonb_typeof(departure_options) = 'array'),
  cover_image_path text,
  gallery jsonb not null default '[]'::jsonb check (jsonb_typeof(gallery) = 'array'),
  highlights jsonb not null default '[]'::jsonb check (jsonb_typeof(highlights) = 'array'),
  itinerary jsonb not null default '[]'::jsonb check (jsonb_typeof(itinerary) = 'array'),
  included jsonb not null default '[]'::jsonb check (jsonb_typeof(included) = 'array'),
  excluded jsonb not null default '[]'::jsonb check (jsonb_typeof(excluded) = 'array'),
  meeting_point text,
  accommodation_info text,
  transportation_info text,
  notes text,
  terms text,
  cancellation_note text,
  faq jsonb not null default '[]'::jsonb check (jsonb_typeof(faq) = 'array'),
  is_popular boolean not null default false,
  popular_rank integer check (popular_rank is null or popular_rank >= 0),
  is_featured boolean not null default false,
  featured_rank integer check (featured_rank is null or featured_rank >= 0),
  status text not null default 'draft'
    check (status in ('draft', 'published', 'archived')),
  seo_title text check (seo_title is null or char_length(seo_title) <= 70),
  seo_description text check (seo_description is null or char_length(seo_description) <= 170),
  og_image_path text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (min_participants <= max_participants),
  check (not is_popular or popular_rank is not null),
  check (not is_featured or featured_rank is not null),
  check (status <> 'published' or published_at is not null)
);

create table public.trip_destinations (
  trip_id uuid not null references public.trips(id) on delete cascade,
  destination_id uuid not null references public.destinations(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (trip_id, destination_id)
);

create table public.trip_activities (
  trip_id uuid not null references public.trips(id) on delete cascade,
  activity_id uuid not null references public.activities(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (trip_id, activity_id)
);

create table public.trip_trip_types (
  trip_id uuid not null references public.trips(id) on delete cascade,
  trip_type_id uuid not null references public.trip_types(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (trip_id, trip_type_id)
);

create table public.promotions (
  id uuid primary key default extensions.gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 120),
  discount_type text not null check (discount_type in ('percentage', 'fixed')),
  discount_value numeric(14,2) not null check (discount_value >= 0),
  starts_at timestamptz not null,
  ends_at timestamptz,
  is_active boolean not null default false,
  terms text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or starts_at < ends_at),
  check (discount_type <> 'percentage' or discount_value <= 100)
);

create table public.promotion_trips (
  promotion_id uuid not null references public.promotions(id) on delete cascade,
  trip_id uuid not null references public.trips(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (promotion_id, trip_id)
);

create table public.blog_posts (
  id uuid primary key default extensions.gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 2 and 180),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  excerpt text not null check (char_length(btrim(excerpt)) between 2 and 500),
  content jsonb not null default '{}'::jsonb check (jsonb_typeof(content) in ('object', 'array')),
  cover_image_path text,
  author_label text not null check (char_length(btrim(author_label)) between 2 and 100),
  category text,
  tags text[] not null default '{}',
  status text not null default 'draft'
    check (status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  show_on_home boolean not null default false,
  home_rank integer check (home_rank is null or home_rank >= 0),
  seo_title text check (seo_title is null or char_length(seo_title) <= 70),
  seo_description text check (seo_description is null or char_length(seo_description) <= 170),
  og_image_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (not show_on_home or home_rank is not null),
  check (status <> 'published' or published_at is not null)
);

create table public.blog_post_destinations (
  blog_post_id uuid not null references public.blog_posts(id) on delete cascade,
  destination_id uuid not null references public.destinations(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (blog_post_id, destination_id)
);

create table public.blog_post_activities (
  blog_post_id uuid not null references public.blog_posts(id) on delete cascade,
  activity_id uuid not null references public.activities(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (blog_post_id, activity_id)
);

create table public.blog_post_trips (
  blog_post_id uuid not null references public.blog_posts(id) on delete cascade,
  trip_id uuid not null references public.trips(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (blog_post_id, trip_id)
);

create index destinations_public_popular_idx
  on public.destinations (popular_rank, published_at desc)
  where status = 'published' and is_popular;
create index activities_public_home_idx
  on public.activities (home_rank, published_at desc)
  where status = 'published' and show_on_home;
create index trip_types_public_order_idx
  on public.trip_types (sort_order, name)
  where status = 'published';
create index trips_public_featured_idx
  on public.trips (featured_rank, published_at desc)
  where status = 'published' and is_featured;
create index trips_public_popular_idx
  on public.trips (popular_rank, published_at desc)
  where status = 'published' and is_popular;
create index trips_status_published_idx
  on public.trips (status, published_at desc);
create index promotions_active_period_idx
  on public.promotions (starts_at, ends_at)
  where is_active;
create index promotion_trips_trip_idx
  on public.promotion_trips (trip_id, promotion_id);
create index blog_posts_public_published_idx
  on public.blog_posts (published_at desc)
  where status = 'published';
create index blog_posts_public_home_idx
  on public.blog_posts (home_rank, published_at desc)
  where status = 'published' and show_on_home;
create index trip_destinations_destination_idx
  on public.trip_destinations (destination_id, trip_id);
create index trip_activities_activity_idx
  on public.trip_activities (activity_id, trip_id);
create index trip_trip_types_type_idx
  on public.trip_trip_types (trip_type_id, trip_id);

create trigger admin_users_set_updated_at
before update on public.admin_users
for each row execute function private.set_updated_at();
create trigger site_settings_set_updated_at
before update on public.site_settings
for each row execute function private.set_updated_at();
create trigger homepage_content_set_updated_at
before update on public.homepage_content
for each row execute function private.set_updated_at();
create trigger usp_items_set_updated_at
before update on public.usp_items
for each row execute function private.set_updated_at();
create trigger destinations_set_updated_at
before update on public.destinations
for each row execute function private.set_updated_at();
create trigger activities_set_updated_at
before update on public.activities
for each row execute function private.set_updated_at();
create trigger trip_types_set_updated_at
before update on public.trip_types
for each row execute function private.set_updated_at();
create trigger trips_set_updated_at
before update on public.trips
for each row execute function private.set_updated_at();
create trigger promotions_set_updated_at
before update on public.promotions
for each row execute function private.set_updated_at();
create trigger blog_posts_set_updated_at
before update on public.blog_posts
for each row execute function private.set_updated_at();

-- Phase 4: public CMS media and append-only content mutation audit.

create table public.content_change_events (
  id uuid primary key default extensions.gen_random_uuid(),
  resource_type text not null check (
    resource_type in (
      'trip', 'destination', 'activity', 'trip_type', 'blog_post',
      'promotion', 'homepage_content', 'usp_item', 'site_settings'
    )
  ),
  resource_id text,
  action text not null check (action in ('create', 'update', 'delete', 'publish', 'archive')),
  actor_id uuid references auth.users(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now()
);

comment on table public.content_change_events is
  'Append-only audit trail for Phase 4 CMS mutations. Metadata must not contain secrets.';

create index content_change_events_resource_idx
  on public.content_change_events (resource_type, resource_id, created_at desc);
create index content_change_events_actor_idx
  on public.content_change_events (actor_id, created_at desc);

alter table public.content_change_events enable row level security;
alter table public.content_change_events force row level security;

revoke all on table public.content_change_events from public, anon, authenticated;
grant select, insert on table public.content_change_events to authenticated;

create policy content_change_events_admin_select
on public.content_change_events
for select to authenticated
using ((select private.is_active_admin()));

create policy content_change_events_admin_insert
on public.content_change_events
for insert to authenticated
with check (
  (select private.is_active_admin())
  and actor_id = (select auth.uid())
);

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'content-media',
  'content-media',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update
set
  name = excluded.name,
  public = true,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Public reads are intentional for published website media. Upload/update/delete
-- remain server-only via the service role after requireAdmin(); no storage.objects
-- mutation policy is granted to anon or authenticated users.

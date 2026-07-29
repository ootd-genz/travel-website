-- Phase 5: expose only non-sensitive branding/contact fields needed by the
-- public layout. The underlying site_settings table remains admin-only.

create or replace function public.get_public_site_settings()
returns table (
  brand_name text,
  logo_path text,
  public_whatsapp text,
  email text,
  address text,
  footer_text text,
  social_links jsonb
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    settings.brand_name,
    settings.logo_path,
    settings.public_whatsapp,
    settings.email,
    settings.address,
    settings.footer_text,
    settings.social_links
  from public.site_settings as settings
  where settings.id = true
  limit 1;
$$;

revoke all on function public.get_public_site_settings() from public;
grant execute on function public.get_public_site_settings() to anon, authenticated;

comment on function public.get_public_site_settings() is
  'Read-only public projection for brand and footer data; payment and internal notification settings are intentionally omitted.';

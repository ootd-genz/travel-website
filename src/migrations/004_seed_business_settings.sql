-- Phase 2: deterministic non-secret business defaults locked by Phase 0.
-- Production still needs an environment-specific APP_URL and credential review.

insert into public.site_settings (
  id,
  brand_name,
  bank_name,
  bank_account_number,
  bank_account_holder,
  admin_whatsapp_number,
  social_links
)
values (
  true,
  'Travel Bali',
  'BCA',
  '87654321',
  'Muhammad Fulan',
  '6282261060675',
  '{}'::jsonb
)
on conflict (id) do nothing;

comment on table public.site_settings is
  'Singleton non-secret business configuration seeded with Phase 0 defaults. Provider credentials remain environment-only.';

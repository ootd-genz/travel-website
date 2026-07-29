# Model Data Konseptual — Supabase

Ini adalah rancangan skema konseptual, bukan file migration SQL.

## Entitas Utama

### `admin_users`

- id
- auth_user_id (unique)
- display_name
- is_active
- created_at
- updated_at

Hanya satu row aktif pada scope versi pertama.

### `site_settings`

Singleton/config bisnis non-secret:

- brand_name
- logo_path
- public_whatsapp
- email
- address
- bank_name (`BCA`)
- bank_account_number (`87654321`)
- bank_account_holder
- admin_whatsapp_number (`6282261060675`)
- footer_text
- social_links JSON tervalidasi

API token tidak disimpan di sini.

### `homepage_content`

- hero_title
- hero_subtitle
- hero_image_path
- primary_cta_label
- primary_cta_href
- secondary_cta_label
- secondary_cta_href
- section_visibility config yang tervalidasi

### `usp_items`

- id
- title
- description
- icon_key
- sort_order
- is_active

### `destinations`

- id
- name
- slug unique
- short_description
- description
- country
- region/city
- hero_image_path
- gallery metadata
- best_time_to_visit
- latitude/longitude optional
- is_popular
- popular_rank
- status
- seo fields
- timestamps

### `activities`

- id
- name
- slug
- short_description
- description
- icon_key/image_path
- difficulty optional
- duration_text optional
- show_on_home
- home_rank
- status
- seo fields
- timestamps

### `trip_types`

- id
- name
- slug
- description
- image/icon
- sort_order
- is_featured
- status
- seo fields

### `trips`

- id
- name
- slug
- short_description
- description
- base_price
- sale_price nullable
- currency (`IDR`)
- price_unit
- duration_days
- duration_nights
- min_participants
- max_participants
- cover_image_path
- gallery metadata
- itinerary structured data
- included structured data
- excluded structured data
- meeting_point
- terms
- is_popular
- popular_rank
- is_featured
- featured_rank
- status
- seo fields
- timestamps

### Relasi many-to-many

- `trip_destinations`
- `trip_activities`
- `trip_trip_types`

Gunakan foreign key dan unique composite key untuk mencegah relation duplicate.

### `promotions`

- id
- name
- type (`percentage`/`fixed`)
- value
- starts_at
- ends_at
- is_active
- terms
- timestamps

### `promotion_trips`

Relasi promo ke paket.

### `blog_posts`

- id
- title
- slug
- excerpt
- content representation yang aman
- cover_image_path
- author_label
- category
- tags
- status
- published_at
- show_on_home
- home_rank
- seo fields
- timestamps

Relasi opsional ke destinations/activities/trips dibuat dengan junction table atau model relasi yang konsisten.

## Booking

### `bookings`

- id (UUID)
- booking_code unique
- public_token_hash / secure token reference
- status
- draft_expires_at
- package_id
- package_name_snapshot
- unit_price_snapshot
- discount_snapshot
- traveler_count
- total_amount_snapshot
- currency_snapshot
- departure_date
- customer_name
- customer_whatsapp
- customer_email
- customer_city nullable
- sender_bank_name nullable
- sender_account_name
- declared_transfer_amount
- transferred_at nullable
- transfer_proof_path private
- customer_notes nullable
- admin_notes nullable
- submitted_at
- confirmed_at nullable
- created_at
- updated_at

Jangan mengandalkan `package_id` saja untuk history; snapshot komersial wajib ada.

### `booking_participants` (bila detail peserta dibutuhkan)

- id
- booking_id
- full_name
- additional fields hanya yang benar-benar diperlukan.

### `booking_events`

Append-style audit:

- id
- booking_id
- event_type
- from_status
- to_status
- actor_type
- actor_id nullable
- note sanitized
- created_at

### `notification_deliveries`

- id
- booking_id
- channel
- event_type
- destination
- provider_message_id nullable
- status
- attempt_count
- last_error_code nullable
- sent_at nullable
- created_at
- updated_at

## Index Penting

Berdasarkan pola query:

- bookings(status, created_at)
- bookings(booking_code)
- bookings(customer_whatsapp) bila sering dicari
- trips(status, is_featured, featured_rank)
- trips(status, is_popular, popular_rank)
- destinations(status, is_popular, popular_rank)
- blog_posts(status, published_at)

Index final harus mengikuti query nyata dan measurement.

## Data Sensitif

Booking/customer data, transfer proof, audit, dan notification record adalah private. Public client tidak memiliki query bebas ke tabel ini.

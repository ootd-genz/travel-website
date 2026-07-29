# SEO, Accessibility & Performance

## SEO Public

Setiap route publik memiliki:

- title unik;
- meta description unik;
- canonical bila relevan;
- Open Graph image;
- satu H1 utama yang logis;
- alt image deskriptif;
- internal link deskriptif.

## Indexing

### Index

- Home
- Blog published
- Activities active
- Destination active
- Trip Types active
- Package published

### Noindex

- `/admin/*`
- `/admin/login`
- `/booking/*`
- preview/draft
- error/private pages

## Sitemap

Hanya URL canonical yang published/active dan memang boleh diindeks.

## Robots

Block crawler dari private/admin flow sebagai tambahan, tetapi jangan menganggap robots.txt sebagai security.

## Structured Data

Gunakan JSON-LD hanya jika data benar dan schema relevan, misalnya Article pada blog atau Breadcrumb. Jangan menambah schema yang tidak sesuai hanya untuk SEO.

## Content SEO

Destination detail mencakup konteks yang benar-benar bermanfaat:

- apa yang menarik;
- aktivitas;
- waktu terbaik;
- paket terkait;
- FAQ bila relevan.

Blog harus internal-link ke entity/paket relevan secara natural.

## Accessibility

Target WCAG 2.2 AA untuk flow utama:

- navigation keyboard;
- focus visible;
- label field;
- error announced bila relevan;
- semantic landmark (`header`, `nav`, `main`, `footer`);
- contrast memadai;
- reduced motion;
- dialog/dropdown dari primitive aksesibel.

## Performance

- Server Component default;
- `next/image` + dimensions/aspect ratio;
- lazy load bagian berat seperti map/chart;
- minimalkan client JS;
- public content cache/revalidate;
- admin/private data tidak shared cache;
- pagination untuk list besar;
- jangan fetch data yang tidak dipakai.

## Core Web Vitals

Audit:

- LCP: hero image/text;
- INP: menu/filter/form;
- CLS: image/card skeleton/layout.

Tetapkan performance budget pada QA setelah baseline aplikasi tersedia.

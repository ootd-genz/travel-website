import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

function loadLocalEnvironment() {
  const source = readFileSync(new URL("../.env.local", import.meta.url), "utf8").replace(/^\uFEFF/, "");
  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator < 1) continue;
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim().replace(/^(['\"])(.*)\1$/, "$2");
    if (!process.env[key]) process.env[key] = value;
  }
}

loadLocalEnvironment();

const isDryRun = process.argv.includes("--dry-run");
const requiredEnv = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"];
for (const key of requiredEnv) {
  if (!process.env[key]) throw new Error(`${key} wajib tersedia di environment.`);
}

const client = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const publicClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const image = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1600&q=82`;
const IMAGES = {
  riceTerrace: image("1557093793-d149a38a1be8"),
  nusaPenida: image("1533669955142-6a73332af4db"),
  temple: image("1537996194471-e657df975ab4"),
  tropical: image("1544644181-1484b3fdfc62"),
  sunset: image("1539367628448-4bc5c9d171c8"),
  baliNature: image("1573790387438-4da905039392"),
  beach: image("1507525428034-b723cf961d3e"),
  mountain: image("1469474968028-56623f02e42e"),
};

const now = new Date().toISOString();

const destinations = [
  { name: "Ubud", slug: "ubud", short_description: "Jantung budaya Bali dengan sawah berundak, galeri seni, dan suasana hijau yang menenangkan.", description: "Ubud mempertemukan lanskap sawah, tradisi, seni, dan kuliner dalam ritme yang lebih pelan. Destinasi ini cocok untuk traveler yang ingin mengenal Bali lebih dekat, berjalan di tengah alam, dan menikmati pengalaman budaya yang autentik.", country: "Indonesia", region: "Bali", city: "Gianyar", hero_image_path: IMAGES.riceTerrace, gallery: [IMAGES.riceTerrace, IMAGES.baliNature], highlights: ["Tegallalang Rice Terrace", "Pasar Seni Ubud", "Pura Tirta Empul", "Kuliner dan kerajinan lokal"], best_time_to_visit: "April–Oktober", latitude: -8.5069, longitude: 115.2625, is_popular: true, popular_rank: 1, status: "published", published_at: now, seo_title: "Wisata Ubud: Alam, Budaya, dan Paket Terbaik", seo_description: "Jelajahi Ubud, waktu terbaik berkunjung, aktivitas budaya, dan paket perjalanan pilihan di jantung Bali." },
  { name: "Nusa Penida", slug: "nusa-penida", short_description: "Pulau dengan tebing dramatis, laut biru, dan spot snorkeling yang menjadi ikon Bali.", description: "Nusa Penida menawarkan panorama pesisir yang kuat dan pengalaman laut yang beragam. Mulai dari Kelingking Beach hingga perairan Crystal Bay, setiap sudutnya cocok untuk traveler yang menyukai petualangan dan pemandangan spektakuler.", country: "Indonesia", region: "Bali", city: "Klungkung", hero_image_path: IMAGES.nusaPenida, gallery: [IMAGES.nusaPenida, IMAGES.beach], highlights: ["Kelingking Beach", "Broken Beach", "Angel’s Billabong", "Crystal Bay"], best_time_to_visit: "April–Oktober", latitude: -8.7275, longitude: 115.5444, is_popular: true, popular_rank: 2, status: "published", published_at: now, seo_title: "Paket Wisata Nusa Penida dan Panduan Perjalanan", seo_description: "Temukan pantai, snorkeling, dan paket Nusa Penida dengan itinerary serta harga yang jelas." },
  { name: "Uluwatu", slug: "uluwatu", short_description: "Tebing selatan Bali, pura di atas laut, pertunjukan Kecak, dan matahari terbenam yang ikonik.", description: "Uluwatu adalah pilihan tepat untuk menikmati garis pantai dari ketinggian. Pura Luhur Uluwatu, tari Kecak, dan deretan pantai selatan menciptakan kombinasi budaya dan panorama yang berkesan.", country: "Indonesia", region: "Bali", city: "Badung", hero_image_path: IMAGES.temple, gallery: [IMAGES.temple, IMAGES.sunset], highlights: ["Pura Luhur Uluwatu", "Tari Kecak", "Pantai Padang Padang", "Sunset di tebing"], best_time_to_visit: "Mei–Oktober", latitude: -8.8291, longitude: 115.0849, is_popular: true, popular_rank: 3, status: "published", published_at: now, seo_title: "Wisata Uluwatu: Pura, Pantai, dan Sunset", seo_description: "Nikmati pesona Uluwatu melalui pura, tari Kecak, pantai selatan, dan paket perjalanan terkurasi." },
  { name: "Munduk", slug: "munduk", short_description: "Desa pegunungan sejuk dengan air terjun, perkebunan, dan jalur trekking yang masih tenang.", description: "Munduk menghadirkan sisi Bali yang hijau dan sejuk. Jalur air terjun, perkebunan kopi, dan pemandangan danau menjadikannya tempat ideal untuk nature escape tanpa keramaian berlebih.", country: "Indonesia", region: "Bali", city: "Buleleng", hero_image_path: IMAGES.tropical, gallery: [IMAGES.tropical, IMAGES.mountain], highlights: ["Air Terjun Munduk", "Perkebunan kopi", "Danau Tamblingan", "Pemandangan pegunungan"], best_time_to_visit: "April–November", latitude: -8.2687, longitude: 115.0797, is_popular: false, popular_rank: null, status: "published", published_at: now, seo_title: "Munduk Bali: Air Terjun dan Nature Escape", seo_description: "Temukan trekking air terjun, perkebunan, dan perjalanan alam di Munduk, Bali Utara." },
  { name: "Kintamani", slug: "kintamani", short_description: "Kawasan pegunungan dengan Gunung Batur, danau kaldera, dan sunrise yang layak dikejar.", description: "Kintamani menjadi rumah bagi salah satu pengalaman sunrise paling populer di Bali. Udara sejuk, lanskap kaldera, dan pemandian air panas cocok dipadukan dalam perjalanan singkat yang aktif.", country: "Indonesia", region: "Bali", city: "Bangli", hero_image_path: IMAGES.mountain, gallery: [IMAGES.mountain, IMAGES.baliNature], highlights: ["Sunrise Gunung Batur", "Danau Batur", "Pemandian air panas", "Kopi Kintamani"], best_time_to_visit: "April–Oktober", latitude: -8.2422, longitude: 115.3759, is_popular: true, popular_rank: 4, status: "published", published_at: now, seo_title: "Kintamani dan Pendakian Sunrise Gunung Batur", seo_description: "Rencanakan pendakian Gunung Batur, pemandian air panas, dan wisata Kintamani dengan itinerary terkurasi." },
  { name: "Seminyak", slug: "seminyak", short_description: "Pantai, restoran, butik, dan suasana sunset yang cocok untuk liburan santai maupun romantis.", description: "Seminyak memadukan pantai yang mudah dinikmati dengan restoran, butik, spa, dan pilihan akomodasi nyaman. Kawasan ini pas untuk traveler yang ingin mengisi liburan dengan tempo santai.", country: "Indonesia", region: "Bali", city: "Badung", hero_image_path: IMAGES.sunset, gallery: [IMAGES.sunset, IMAGES.beach], highlights: ["Sunset di Pantai Seminyak", "Kuliner pilihan", "Spa dan wellness", "Butik lokal"], best_time_to_visit: "April–Oktober", latitude: -8.6913, longitude: 115.1682, is_popular: false, popular_rank: null, status: "published", published_at: now, seo_title: "Liburan Seminyak: Pantai, Kuliner, dan Wellness", seo_description: "Nikmati paket santai di Seminyak dengan pantai, kuliner, spa, dan sunset khas Bali." },
];

const activities = [
  { name: "Snorkeling", slug: "snorkeling", short_description: "Melihat kehidupan bawah laut Bali di perairan jernih bersama pemandu lokal.", description: "Snorkeling menjadi cara menyenangkan untuk menikmati warna-warni bawah laut tanpa memerlukan sertifikasi menyelam. Peralatan dasar dan briefing keselamatan disiapkan dalam paket terkait.", icon_key: "waves", image_path: IMAGES.beach, gallery: [IMAGES.beach, IMAGES.nusaPenida], difficulty: "Mudah–Menengah", duration_text: "2–4 jam", show_on_home: true, home_rank: 1, status: "published", published_at: now, seo_title: "Aktivitas Snorkeling di Bali", seo_description: "Temukan paket snorkeling Bali dan Nusa Penida dengan pemandu serta itinerary yang jelas." },
  { name: "Sunrise Trekking", slug: "sunrise-trekking", short_description: "Mengejar cahaya pagi dari jalur pegunungan dengan panorama kaldera Bali.", description: "Pendakian dimulai dini hari dengan pemandu berpengalaman. Ritme perjalanan disesuaikan agar traveler dapat mencapai titik pandang sebelum matahari terbit.", icon_key: "mountain", image_path: IMAGES.mountain, gallery: [IMAGES.mountain], difficulty: "Menengah", duration_text: "5–7 jam", show_on_home: true, home_rank: 2, status: "published", published_at: now, seo_title: "Sunrise Trekking Gunung Batur", seo_description: "Ikuti pendakian sunrise Gunung Batur dengan pemandu, briefing, dan itinerary terencana." },
  { name: "Jelajah Sawah", slug: "jelajah-sawah", short_description: "Berjalan santai di antara persawahan dan mengenal kehidupan desa Bali.", description: "Aktivitas ini mengajak traveler menikmati lanskap hijau, sistem subak, dan ritme desa melalui rute jalan kaki yang ramah pemula.", icon_key: "sprout", image_path: IMAGES.riceTerrace, gallery: [IMAGES.riceTerrace], difficulty: "Mudah", duration_text: "2–3 jam", show_on_home: true, home_rank: 3, status: "published", published_at: now, seo_title: "Jelajah Sawah dan Desa di Ubud", seo_description: "Nikmati walking tour sawah Ubud dan pelajari budaya subak bersama pemandu lokal." },
  { name: "Tur Pura & Budaya", slug: "tur-pura-budaya", short_description: "Mengenal pura, tradisi, dan pertunjukan Bali dengan konteks yang mudah dipahami.", description: "Pemandu membantu traveler memahami etika berkunjung, kisah lokal, dan makna tradisi agar perjalanan budaya terasa lebih bernilai.", icon_key: "landmark", image_path: IMAGES.temple, gallery: [IMAGES.temple], difficulty: "Mudah", duration_text: "4–6 jam", show_on_home: false, home_rank: null, status: "published", published_at: now, seo_title: "Tur Pura dan Budaya Bali", seo_description: "Pelajari tradisi Bali melalui kunjungan pura dan pertunjukan budaya yang terkurasi." },
  { name: "Waterfall Trekking", slug: "waterfall-trekking", short_description: "Menyusuri jalur hijau menuju air terjun tersembunyi di Bali Utara.", description: "Rute melewati kebun, lembah, dan jalur alami. Sepatu nyaman dan kondisi fisik dasar diperlukan untuk menikmati pengalaman dengan aman.", icon_key: "footprints", image_path: IMAGES.tropical, gallery: [IMAGES.tropical], difficulty: "Menengah", duration_text: "4–5 jam", show_on_home: false, home_rank: null, status: "published", published_at: now, seo_title: "Waterfall Trekking di Bali Utara", seo_description: "Jelajahi air terjun Munduk dan jalur hijau Bali Utara dalam paket trekking terencana." },
  { name: "Sunset & Wellness", slug: "sunset-wellness", short_description: "Menikmati spa, waktu santai, dan matahari terbenam dalam satu hari yang ringan.", description: "Cocok untuk honeymoon maupun traveler yang ingin memperlambat ritme. Aktivitas dapat mencakup spa, makan malam, dan waktu bebas di pantai.", icon_key: "sunset", image_path: IMAGES.sunset, gallery: [IMAGES.sunset], difficulty: "Santai", duration_text: "Setengah hari", show_on_home: false, home_rank: null, status: "published", published_at: now, seo_title: "Sunset dan Wellness di Seminyak", seo_description: "Pilih pengalaman spa, pantai, dan sunset Seminyak untuk liburan santai di Bali." },
];

const tripTypes = [
  { name: "Adventure", slug: "adventure", short_description: "Untuk traveler yang menikmati jalur aktif, alam terbuka, dan pengalaman baru.", description: "Adventure menggabungkan aktivitas fisik, lanskap alam, dan itinerary yang dinamis tanpa mengabaikan waktu istirahat.", icon_key: "mountain", image_path: IMAGES.mountain, sort_order: 1, is_featured: true, status: "published", published_at: now, seo_title: "Paket Adventure Bali", seo_description: "Temukan trekking, snorkeling, dan perjalanan adventure terbaik di Bali." },
  { name: "Cultural Journey", slug: "cultural-journey", short_description: "Mendekatkan traveler pada seni, pura, tradisi, dan kehidupan lokal Bali.", description: "Cultural Journey dirancang untuk traveler yang ingin memahami cerita di balik tempat, bukan sekadar mengambil foto.", icon_key: "landmark", image_path: IMAGES.temple, sort_order: 2, is_featured: true, status: "published", published_at: now, seo_title: "Paket Wisata Budaya Bali", seo_description: "Jelajahi pura, seni, desa, dan tradisi Bali melalui perjalanan budaya terkurasi." },
  { name: "Beach Escape", slug: "beach-escape", short_description: "Laut biru, pasir, snorkeling, dan waktu santai untuk mengisi ulang energi.", description: "Beach Escape memadukan pantai ikonik dengan pengalaman laut dan waktu bebas yang cukup.", icon_key: "waves", image_path: IMAGES.beach, sort_order: 3, is_featured: true, status: "published", published_at: now, seo_title: "Paket Liburan Pantai Bali", seo_description: "Pilih paket pantai, island hopping, dan snorkeling untuk liburan tropis di Bali." },
  { name: "Honeymoon", slug: "honeymoon", short_description: "Perjalanan romantis dengan tempo santai, pengalaman privat, dan momen sunset.", description: "Paket honeymoon mengutamakan kenyamanan, waktu berdua, dan detail perjalanan yang tidak terasa terburu-buru.", icon_key: "heart", image_path: IMAGES.sunset, sort_order: 4, is_featured: true, status: "published", published_at: now, seo_title: "Paket Honeymoon Bali", seo_description: "Temukan paket honeymoon Bali dengan sunset, spa, dan itinerary romantis." },
  { name: "Family Trip", slug: "family-trip", short_description: "Itinerary seimbang untuk keluarga dengan aktivitas ramah berbagai usia.", description: "Family Trip menjaga perjalanan tetap menarik tanpa jadwal terlalu padat, dengan pilihan aktivitas yang fleksibel untuk keluarga.", icon_key: "users", image_path: IMAGES.riceTerrace, sort_order: 5, is_featured: false, status: "published", published_at: now, seo_title: "Paket Liburan Keluarga di Bali", seo_description: "Pilih paket keluarga Bali dengan itinerary santai dan aktivitas untuk berbagai usia." },
];

const trips = [
  { name: "Nusa Penida Blue Escape", slug: "nusa-penida-blue-escape", short_description: "Island hopping satu hari menuju ikon Nusa Penida dengan opsi snorkeling di perairan biru.", description: "Perjalanan ringkas untuk menikmati sisi terbaik Nusa Penida. Penjemputan, fast boat, transport lokal, makan siang, dan pemandu sudah disusun agar kamu dapat fokus pada pengalaman.", base_price: 975000, sale_price: 875000, currency: "IDR", price_unit: "per_person", duration_days: 1, duration_nights: 0, min_participants: 2, max_participants: 12, departure_options: ["Setiap hari — 06.30 WITA"], cover_image_path: IMAGES.nusaPenida, gallery: [IMAGES.nusaPenida, IMAGES.beach], highlights: ["Kelingking Beach", "Broken Beach dan Angel’s Billabong", "Makan siang lokal", "Opsi snorkeling Crystal Bay"], itinerary: [{ day: 1, title: "Eksplorasi Nusa Penida Barat", description: "Fast boat, Kelingking Beach, Broken Beach, Angel’s Billabong, makan siang, lalu Crystal Bay." }], included: ["Tiket fast boat pulang-pergi", "Mobil dan pengemudi lokal", "Makan siang", "Tiket masuk destinasi", "Air mineral"], excluded: ["Pengeluaran pribadi", "Snorkeling opsional", "Tip pemandu"], meeting_point: "Pelabuhan Sanur", accommodation_info: null, transportation_info: "Fast boat dan mobil ber-AC di Nusa Penida", notes: "Gunakan alas kaki nyaman dan bawa pelindung matahari.", terms: "Harga berlaku untuk minimum dua traveler dan mengikuti ketersediaan fast boat.", cancellation_note: "Perubahan cuaca dapat menyebabkan penyesuaian rute demi keselamatan.", faq: [{ question: "Apakah cocok untuk anak?", answer: "Cocok untuk anak yang nyaman bepergian dengan fast boat dan berjalan di area bertangga." }], is_popular: true, popular_rank: 1, is_featured: true, featured_rank: 2, status: "published", published_at: now, seo_title: "Paket Nusa Penida 1 Hari + Snorkeling", seo_description: "Jelajahi Kelingking Beach, Broken Beach, dan Crystal Bay dalam paket Nusa Penida satu hari." },
  { name: "Ubud Culture & Nature", slug: "ubud-culture-nature", short_description: "Tiga hari menyelami sawah, pura, seni, dan kuliner Ubud dengan tempo seimbang.", description: "Paket ini mempertemukan landmark Ubud dengan pengalaman lokal yang hangat. Itinerary memberi ruang untuk menikmati suasana, bukan sekadar berpindah tempat.", base_price: 3450000, sale_price: 3190000, currency: "IDR", price_unit: "per_person", duration_days: 3, duration_nights: 2, min_participants: 2, max_participants: 8, departure_options: ["14 Agustus 2026", "11 September 2026", "16 Oktober 2026"], cover_image_path: IMAGES.riceTerrace, gallery: [IMAGES.riceTerrace, IMAGES.temple], highlights: ["Tegallalang Rice Terrace", "Pura Tirta Empul", "Workshop kerajinan lokal", "Kuliner khas Ubud"], itinerary: [{ day: 1, title: "Tiba dan mengenal Ubud", description: "Penjemputan, check-in, Pasar Seni, dan makan malam lokal." }, { day: 2, title: "Sawah, pura, dan desa", description: "Walking tour Tegallalang, Tirta Empul, dan workshop kerajinan." }, { day: 3, title: "Pagi santai dan kepulangan", description: "Waktu bebas, check-out, dan pengantaran." }], included: ["Hotel 2 malam", "Sarapan", "Transport selama tur", "Pemandu", "Tiket masuk", "Satu workshop"], excluded: ["Tiket pesawat", "Makan di luar program", "Pengeluaran pribadi"], meeting_point: "Bandara Ngurah Rai atau hotel area Bali Selatan", accommodation_info: "Hotel butik setara bintang 3 di Ubud", transportation_info: "Mobil privat ber-AC", notes: "Bawa pakaian sopan untuk kunjungan pura.", terms: "Harga per orang untuk minimum dua traveler dalam satu pemesanan.", cancellation_note: "Pembatalan mengikuti ketentuan pada konfirmasi pemesanan.", faq: [{ question: "Apakah itinerary bisa disesuaikan?", answer: "Penyesuaian kecil dapat didiskusikan sebelum keberangkatan." }], is_popular: true, popular_rank: 2, is_featured: true, featured_rank: 1, status: "published", published_at: now, seo_title: "Paket Ubud 3 Hari 2 Malam", seo_description: "Nikmati sawah, pura, seni, dan kuliner melalui paket Ubud 3 hari 2 malam." },
  { name: "Batur Sunrise Adventure", slug: "batur-sunrise-adventure", short_description: "Pendakian sunrise Gunung Batur, sarapan di puncak, dan relaksasi di pemandian air panas.", description: "Mulai perjalanan sebelum fajar bersama pemandu lokal. Setelah menikmati matahari terbit dan kaldera, tubuh diajak rileks di pemandian air panas sebelum kembali ke hotel.", base_price: 1450000, sale_price: null, currency: "IDR", price_unit: "per_person", duration_days: 2, duration_nights: 1, min_participants: 2, max_participants: 10, departure_options: ["Setiap Jumat dan Minggu"], cover_image_path: IMAGES.mountain, gallery: [IMAGES.mountain, IMAGES.baliNature], highlights: ["Sunrise Gunung Batur", "Sarapan ringan di puncak", "Pemandian air panas", "Kopi Kintamani"], itinerary: [{ day: 1, title: "Tiba di Kintamani", description: "Check-in, kunjungan kebun kopi, dan briefing pendakian." }, { day: 2, title: "Sunrise dan hot spring", description: "Pendakian dini hari, sunrise, turun gunung, pemandian air panas, dan kepulangan." }], included: ["Penginapan 1 malam", "Pemandu pendakian", "Senter", "Sarapan ringan", "Tiket hot spring", "Transport lokal"], excluded: ["Tiket pesawat", "Perlengkapan pribadi", "Makan malam"], meeting_point: "Hotel area Kintamani", accommodation_info: "Guesthouse pegunungan", transportation_info: "Mobil privat dan transfer trailhead", notes: "Tidak direkomendasikan bagi traveler dengan kondisi medis tertentu tanpa persetujuan dokter.", terms: "Traveler wajib mengikuti arahan keselamatan pemandu.", cancellation_note: "Pendakian dapat dibatalkan bila kondisi cuaca atau gunung tidak aman.", faq: [{ question: "Apakah pemula bisa ikut?", answer: "Bisa, selama memiliki kebugaran dasar dan mengikuti tempo pemandu." }], is_popular: true, popular_rank: 3, is_featured: false, featured_rank: null, status: "published", published_at: now, seo_title: "Paket Sunrise Trekking Gunung Batur", seo_description: "Pendakian sunrise Gunung Batur lengkap dengan pemandu dan pemandian air panas." },
  { name: "Uluwatu Sunset & Kecak", slug: "uluwatu-sunset-kecak", short_description: "Perjalanan dua hari menyusuri pantai selatan, Pura Uluwatu, dan tari Kecak saat senja.", description: "Paket singkat yang memadukan waktu santai di pantai dengan pengalaman budaya paling ikonik di Bali Selatan.", base_price: 2350000, sale_price: 2150000, currency: "IDR", price_unit: "per_person", duration_days: 2, duration_nights: 1, min_participants: 2, max_participants: 10, departure_options: ["Setiap hari"], cover_image_path: IMAGES.temple, gallery: [IMAGES.temple, IMAGES.sunset], highlights: ["Pantai Padang Padang", "Pura Luhur Uluwatu", "Tari Kecak saat sunset", "Makan malam seafood"], itinerary: [{ day: 1, title: "Pantai dan sunset Uluwatu", description: "Pantai, Pura Uluwatu, pertunjukan Kecak, dan makan malam." }, { day: 2, title: "Pagi santai", description: "Sarapan, waktu bebas, lalu pengantaran." }], included: ["Hotel 1 malam", "Sarapan", "Transport", "Tiket pura dan Kecak", "Makan malam"], excluded: ["Tiket pesawat", "Pengeluaran pribadi", "Aktivitas tambahan"], meeting_point: "Hotel area Bali Selatan", accommodation_info: "Hotel setara bintang 3 area Uluwatu", transportation_info: "Mobil privat ber-AC", notes: "Jaga barang pribadi dari monyet di area pura.", terms: "Jadwal pertunjukan mengikuti operasional venue.", cancellation_note: "Cuaca dapat memengaruhi pertunjukan luar ruang.", faq: [{ question: "Apakah tiket Kecak sudah termasuk?", answer: "Ya, tiket pertunjukan sudah termasuk dalam paket." }], is_popular: false, popular_rank: null, is_featured: true, featured_rank: 3, status: "published", published_at: now, seo_title: "Paket Uluwatu Sunset dan Tari Kecak", seo_description: "Nikmati pantai selatan, Pura Uluwatu, sunset, dan Tari Kecak dalam paket dua hari." },
  { name: "Munduk Hidden Waterfalls", slug: "munduk-hidden-waterfalls", short_description: "Nature escape tiga hari ke air terjun, danau, serta perkebunan Bali Utara.", description: "Munduk cocok untuk traveler yang ingin menjauh sejenak dari keramaian. Jalur trekking dipadukan dengan penginapan bernuansa alam dan waktu istirahat yang cukup.", base_price: 3790000, sale_price: null, currency: "IDR", price_unit: "per_person", duration_days: 3, duration_nights: 2, min_participants: 2, max_participants: 8, departure_options: ["21 Agustus 2026", "18 September 2026"], cover_image_path: IMAGES.tropical, gallery: [IMAGES.tropical, IMAGES.baliNature], highlights: ["Trekking tiga air terjun", "Danau Tamblingan", "Perkebunan kopi", "Eco lodge pegunungan"], itinerary: [{ day: 1, title: "Perjalanan menuju Bali Utara", description: "Penjemputan, perjalanan scenic, check-in, dan waktu bebas." }, { day: 2, title: "Waterfall trekking", description: "Trekking air terjun bersama pemandu dan makan siang lokal." }, { day: 3, title: "Danau dan kepulangan", description: "Danau Tamblingan, kebun kopi, lalu kembali ke Bali Selatan." }], included: ["Eco lodge 2 malam", "Sarapan", "Pemandu trekking", "Transport", "Tiket masuk", "Makan siang hari kedua"], excluded: ["Tiket pesawat", "Jas hujan pribadi", "Pengeluaran pribadi"], meeting_point: "Hotel area Ubud atau Bali Selatan", accommodation_info: "Eco lodge area Munduk", transportation_info: "Mobil privat ber-AC", notes: "Jalur dapat licin setelah hujan; gunakan sepatu trekking.", terms: "Aktivitas mengikuti kondisi cuaca dan jalur.", cancellation_note: "Rute air terjun dapat disesuaikan untuk keselamatan.", faq: [{ question: "Seberapa sulit trekkingnya?", answer: "Tingkat menengah dengan beberapa tanjakan dan anak tangga." }], is_popular: false, popular_rank: null, is_featured: false, featured_rank: null, status: "published", published_at: now, seo_title: "Paket Munduk Waterfall 3 Hari", seo_description: "Jelajahi air terjun, Danau Tamblingan, dan perkebunan melalui paket Munduk tiga hari." },
  { name: "Seminyak Romantic Escape", slug: "seminyak-romantic-escape", short_description: "Tiga hari untuk sunset, spa, kuliner, dan waktu berdua di Seminyak.", description: "Paket romantis dengan jadwal ringan untuk pasangan. Nikmati villa nyaman, perawatan spa, makan malam, dan waktu bebas tanpa itinerary yang terlalu padat.", base_price: 6850000, sale_price: 6250000, currency: "IDR", price_unit: "per_package", duration_days: 3, duration_nights: 2, min_participants: 2, max_participants: 2, departure_options: ["Setiap hari sesuai ketersediaan"], cover_image_path: IMAGES.sunset, gallery: [IMAGES.sunset, IMAGES.beach], highlights: ["Private villa 2 malam", "Couple spa", "Sunset dinner", "Private airport transfer"], itinerary: [{ day: 1, title: "Tiba dan sunset", description: "Private transfer, check-in, dan sunset dinner." }, { day: 2, title: "Wellness dan waktu bebas", description: "Couple spa dilanjutkan waktu bebas di Seminyak." }, { day: 3, title: "Sarapan dan kepulangan", description: "Sarapan santai, check-out, dan private transfer." }], included: ["Private villa 2 malam", "Sarapan", "Couple spa", "Satu makan malam", "Airport transfer"], excluded: ["Tiket pesawat", "Makan di luar program", "Pengeluaran pribadi"], meeting_point: "Bandara Ngurah Rai", accommodation_info: "Private pool villa area Seminyak", transportation_info: "Private car ber-AC", notes: "Beri tahu admin bila ada kebutuhan dekorasi atau dietary khusus.", terms: "Harga berlaku per paket untuk dua traveler.", cancellation_note: "Perubahan tanggal mengikuti ketersediaan villa.", faq: [{ question: "Apakah bisa menambah dekorasi honeymoon?", answer: "Bisa, admin akan membantu menyiapkan opsi tambahan sesuai budget." }], is_popular: true, popular_rank: 4, is_featured: true, featured_rank: 4, status: "published", published_at: now, seo_title: "Paket Honeymoon Seminyak 3 Hari", seo_description: "Paket romantis Seminyak dengan private villa, couple spa, dan sunset dinner." },
];

const tripRelations = {
  "nusa-penida-blue-escape": { destinations: ["nusa-penida"], activities: ["snorkeling"], tripTypes: ["adventure", "beach-escape"] },
  "ubud-culture-nature": { destinations: ["ubud"], activities: ["jelajah-sawah", "tur-pura-budaya"], tripTypes: ["cultural-journey", "family-trip"] },
  "batur-sunrise-adventure": { destinations: ["kintamani"], activities: ["sunrise-trekking"], tripTypes: ["adventure"] },
  "uluwatu-sunset-kecak": { destinations: ["uluwatu"], activities: ["tur-pura-budaya", "sunset-wellness"], tripTypes: ["cultural-journey", "beach-escape"] },
  "munduk-hidden-waterfalls": { destinations: ["munduk"], activities: ["waterfall-trekking"], tripTypes: ["adventure"] },
  "seminyak-romantic-escape": { destinations: ["seminyak"], activities: ["sunset-wellness"], tripTypes: ["honeymoon", "beach-escape"] },
};

const posts = [
  { title: "Panduan Pertama Kali ke Nusa Penida", slug: "panduan-pertama-kali-ke-nusa-penida", excerpt: "Apa yang perlu disiapkan, kapan waktu terbaik, dan bagaimana menikmati Nusa Penida tanpa terburu-buru.", content: { type: "plain_text", text: "Nusa Penida punya lanskap dramatis, tetapi jarak antar lokasi dan kondisi jalannya perlu diperhitungkan. Mulailah perjalanan lebih pagi agar waktu di setiap destinasi terasa cukup.\n\nGunakan alas kaki yang nyaman, bawa pelindung matahari, dan simpan air minum. Bila ingin snorkeling, pilih operator yang memberi briefing keselamatan dan peralatan yang terawat.\n\nUntuk kunjungan pertama, rute barat seperti Kelingking Beach, Broken Beach, dan Angel’s Billabong menjadi pilihan paling mudah dipadukan dalam satu hari." }, cover_image_path: IMAGES.nusaPenida, author_label: "Tim Travel Bali", category: "Panduan Destinasi", tags: ["Nusa Penida", "Tips Bali", "Island Hopping"], status: "published", published_at: now, show_on_home: true, home_rank: 1, seo_title: "Panduan Nusa Penida untuk Kunjungan Pertama", seo_description: "Pelajari rute, waktu terbaik, perlengkapan, dan tips aman untuk perjalanan pertama ke Nusa Penida." },
  { title: "Waktu Terbaik Menikmati Ubud", slug: "waktu-terbaik-menikmati-ubud", excerpt: "Panduan musim, jam kunjungan, dan ritme perjalanan agar sawah serta budaya Ubud terasa lebih berkesan.", content: { type: "plain_text", text: "Musim kering antara April dan Oktober biasanya menawarkan cuaca yang lebih nyaman untuk berjalan kaki di Ubud. Namun, pagi hari tetap menjadi waktu terbaik untuk menikmati sawah dan pura dengan suasana lebih tenang.\n\nSusun maksimal dua hingga tiga area utama dalam satu hari. Beri ruang untuk berhenti di kafe lokal, melihat galeri, atau berbincang dengan perajin.\n\nSaat mengunjungi pura, gunakan pakaian sopan dan ikuti aturan setempat. Sarung biasanya tersedia, tetapi membawa sendiri dapat membuat perjalanan lebih praktis." }, cover_image_path: IMAGES.riceTerrace, author_label: "Made Pramana", category: "Inspirasi", tags: ["Ubud", "Budaya", "Travel Tips"], status: "published", published_at: now, show_on_home: true, home_rank: 2, seo_title: "Kapan Waktu Terbaik Berkunjung ke Ubud?", seo_description: "Ketahui musim, jam terbaik, dan cara menyusun itinerary Ubud yang nyaman." },
  { title: "Checklist Sunrise Trekking Gunung Batur", slug: "checklist-sunrise-trekking-gunung-batur", excerpt: "Daftar perlengkapan dan persiapan sederhana sebelum mendaki Gunung Batur saat dini hari.", content: { type: "plain_text", text: "Pendakian Gunung Batur dimulai ketika udara masih dingin dan gelap. Gunakan pakaian berlapis, sepatu dengan grip baik, dan tas ringan.\n\nTidur cukup pada malam sebelumnya dan makan ringan sebelum mulai. Pemandu akan menyesuaikan tempo, jadi sampaikan kondisi tubuh dengan jujur.\n\nBawa kamera seperlunya, tetapi jangan mengorbankan keamanan demi foto. Setelah turun, pemandian air panas dapat menjadi penutup perjalanan yang nyaman." }, cover_image_path: IMAGES.mountain, author_label: "Tim Travel Bali", category: "Tips Aktivitas", tags: ["Gunung Batur", "Trekking", "Checklist"], status: "published", published_at: now, show_on_home: true, home_rank: 3, seo_title: "Checklist Pendakian Sunrise Gunung Batur", seo_description: "Siapkan pakaian, alas kaki, kondisi fisik, dan perlengkapan penting sebelum trekking Gunung Batur." },
  { title: "Etika Berkunjung ke Pura di Bali", slug: "etika-berkunjung-ke-pura-di-bali", excerpt: "Panduan singkat berpakaian, bersikap, dan menghormati ruang ibadah saat mengunjungi pura.", content: { type: "plain_text", text: "Pura adalah ruang ibadah yang aktif. Gunakan sarung dan selendang sesuai aturan, berbicara dengan tenang, dan jangan menghalangi prosesi.\n\nPerhatikan area yang tidak boleh dimasuki pengunjung. Bila ragu, tanyakan kepada pemandu atau petugas pura sebelum mengambil foto.\n\nSikap menghormati tradisi membuat kunjungan lebih nyaman bagi traveler sekaligus masyarakat lokal." }, cover_image_path: IMAGES.temple, author_label: "Ayu Lestari", category: "Budaya", tags: ["Pura Bali", "Etika", "Budaya"], status: "published", published_at: now, show_on_home: false, home_rank: null, seo_title: "Etika Mengunjungi Pura di Bali", seo_description: "Pelajari aturan pakaian, fotografi, dan sikap yang tepat saat berkunjung ke pura Bali." },
  { title: "Memilih Paket Bali Sesuai Gaya Liburan", slug: "memilih-paket-bali-sesuai-gaya-liburan", excerpt: "Adventure, budaya, pantai, keluarga, atau honeymoon—temukan pola perjalanan yang paling cocok untukmu.", content: { type: "plain_text", text: "Mulailah dari pengalaman yang paling ingin kamu rasakan. Bila suka aktivitas fisik, paket adventure dengan trekking atau snorkeling dapat menjadi pilihan.\n\nTraveler yang ingin mengenal cerita lokal dapat memilih cultural journey di Ubud atau Uluwatu. Untuk ritme santai, beach escape dan honeymoon memberi lebih banyak waktu bebas.\n\nPeriksa durasi, jumlah aktivitas per hari, harga yang termasuk, dan kebutuhan transportasi sebelum menentukan paket." }, cover_image_path: IMAGES.sunset, author_label: "Tim Travel Bali", category: "Perencanaan", tags: ["Paket Bali", "Trip Types", "Perencanaan"], status: "published", published_at: now, show_on_home: false, home_rank: null, seo_title: "Cara Memilih Paket Travel Bali", seo_description: "Bandingkan paket adventure, budaya, pantai, keluarga, dan honeymoon sesuai gaya liburanmu." },
];

const postRelations = {
  "panduan-pertama-kali-ke-nusa-penida": { destinations: ["nusa-penida"], activities: ["snorkeling"], trips: ["nusa-penida-blue-escape"] },
  "waktu-terbaik-menikmati-ubud": { destinations: ["ubud"], activities: ["jelajah-sawah", "tur-pura-budaya"], trips: ["ubud-culture-nature"] },
  "checklist-sunrise-trekking-gunung-batur": { destinations: ["kintamani"], activities: ["sunrise-trekking"], trips: ["batur-sunrise-adventure"] },
  "etika-berkunjung-ke-pura-di-bali": { destinations: ["ubud", "uluwatu"], activities: ["tur-pura-budaya"], trips: ["ubud-culture-nature", "uluwatu-sunset-kecak"] },
  "memilih-paket-bali-sesuai-gaya-liburan": { destinations: ["ubud", "nusa-penida", "seminyak"], activities: [], trips: ["ubud-culture-nature", "nusa-penida-blue-escape", "seminyak-romantic-escape"] },
};

const promotions = [
  { id: "20000000-0000-4000-8000-000000000001", name: "Blue Escape Deal", discount_type: "percentage", discount_value: 10, starts_at: "2026-07-01T00:00:00.000Z", ends_at: "2026-12-31T23:59:59.000Z", is_active: true, terms: "Berlaku untuk Nusa Penida Blue Escape selama kuota tersedia.", tripSlugs: ["nusa-penida-blue-escape"] },
  { id: "20000000-0000-4000-8000-000000000002", name: "Romantic Bali Saving", discount_type: "fixed", discount_value: 600000, starts_at: "2026-07-01T00:00:00.000Z", ends_at: "2026-11-30T23:59:59.000Z", is_active: true, terms: "Potongan per paket untuk Seminyak Romantic Escape.", tripSlugs: ["seminyak-romantic-escape"] },
];

const uspItems = [
  { id: "30000000-0000-4000-8000-000000000001", title: "Pilihan Terkurasi", description: "Paket disusun agar pengalaman, waktu, dan budget terasa seimbang.", icon_key: "sparkles", sort_order: 1, is_active: true },
  { id: "30000000-0000-4000-8000-000000000002", title: "Harga Transparan", description: "Lihat harga, itinerary, dan benefit sebelum melanjutkan pemesanan.", icon_key: "wallet", sort_order: 2, is_active: true },
  { id: "30000000-0000-4000-8000-000000000003", title: "Proses Mudah", description: "Pilih paket, kirim detail, lalu admin membantu proses verifikasi.", icon_key: "route", sort_order: 3, is_active: true },
  { id: "30000000-0000-4000-8000-000000000004", title: "Dukungan Lokal", description: "Tim yang memahami Bali siap membantu detail perjalananmu.", icon_key: "headphones", sort_order: 4, is_active: true },
];

async function assertTable(table) {
  const { count, error } = await client.from(table).select("*", { count: "exact", head: true });
  if (error) throw new Error(`${table} tidak siap (${error.code}).`);
  return count ?? 0;
}

async function upsertBy(table, rows, onConflict, columns = "id,slug") {
  const { data, error } = await client.from(table).upsert(rows, { onConflict }).select(columns);
  if (error) throw new Error(`Upsert ${table} gagal (${error.code}): ${error.message}`);
  return data ?? [];
}

function idMap(rows) {
  return new Map(rows.map((row) => [row.slug, row.id]));
}

async function insertRelations(table, rows, onConflict) {
  if (!rows.length) return;
  const { error } = await client.from(table).upsert(rows, { onConflict, ignoreDuplicates: true });
  if (error) throw new Error(`Relasi ${table} gagal (${error.code}): ${error.message}`);
}

async function verifyPublicData() {
  const queries = {
    destinations: publicClient.from("destinations").select("id", { count: "exact", head: true }).eq("status", "published"),
    activities: publicClient.from("activities").select("id", { count: "exact", head: true }).eq("status", "published"),
    tripTypes: publicClient.from("trip_types").select("id", { count: "exact", head: true }).eq("status", "published"),
    trips: publicClient.from("trips").select("id", { count: "exact", head: true }).eq("status", "published"),
    blogPosts: publicClient.from("blog_posts").select("id", { count: "exact", head: true }).eq("status", "published"),
    promotions: publicClient.from("promotions").select("id", { count: "exact", head: true }).eq("is_active", true),
    uspItems: publicClient.from("usp_items").select("id", { count: "exact", head: true }).eq("is_active", true),
    homepage: publicClient.from("homepage_content").select("id", { count: "exact", head: true }).eq("is_published", true),
  };
  const results = {};
  for (const [label, query] of Object.entries(queries)) {
    const { count, error } = await query;
    if (error) throw new Error(`Verifikasi akses publik ${label} gagal (${error.code}): ${error.message}`);
    results[label] = count ?? 0;
  }
  return results;
}

async function main() {
  const requiredTables = ["destinations", "activities", "trip_types", "trips", "trip_destinations", "trip_activities", "trip_trip_types", "blog_posts", "blog_post_destinations", "blog_post_activities", "blog_post_trips", "promotions", "promotion_trips", "homepage_content", "usp_items", "site_settings"];
  const counts = {};
  for (const table of requiredTables) counts[table] = await assertTable(table);
  console.log("Schema Supabase siap. Data saat ini:");
  console.log(JSON.stringify(Object.fromEntries(Object.entries(counts).filter(([table]) => ["destinations", "activities", "trip_types", "trips", "blog_posts", "promotions"].includes(table))), null, 2));
  if (isDryRun) {
    console.log(`Dry run selesai. Seed akan menulis ${destinations.length} destinasi, ${activities.length} aktivitas, ${tripTypes.length} trip types, ${trips.length} paket, ${posts.length} blog, dan ${promotions.length} promo.`);
    return;
  }

  const destinationRows = await upsertBy("destinations", destinations, "slug");
  const activityRows = await upsertBy("activities", activities, "slug");
  const tripTypeRows = await upsertBy("trip_types", tripTypes, "slug");
  const tripRows = await upsertBy("trips", trips, "slug");
  const destinationIds = idMap(destinationRows);
  const activityIds = idMap(activityRows);
  const tripTypeIds = idMap(tripTypeRows);
  const tripIds = idMap(tripRows);

  const tripDestinationRows = [];
  const tripActivityRows = [];
  const tripTypeRelationRows = [];
  for (const [tripSlug, relation] of Object.entries(tripRelations)) {
    const tripId = tripIds.get(tripSlug);
    for (const slug of relation.destinations) tripDestinationRows.push({ trip_id: tripId, destination_id: destinationIds.get(slug) });
    for (const slug of relation.activities) tripActivityRows.push({ trip_id: tripId, activity_id: activityIds.get(slug) });
    for (const slug of relation.tripTypes) tripTypeRelationRows.push({ trip_id: tripId, trip_type_id: tripTypeIds.get(slug) });
  }
  await insertRelations("trip_destinations", tripDestinationRows, "trip_id,destination_id");
  await insertRelations("trip_activities", tripActivityRows, "trip_id,activity_id");
  await insertRelations("trip_trip_types", tripTypeRelationRows, "trip_id,trip_type_id");

  const postRows = await upsertBy("blog_posts", posts, "slug");
  const postIds = idMap(postRows);
  const postDestinationRows = [];
  const postActivityRows = [];
  const postTripRows = [];
  for (const [postSlug, relation] of Object.entries(postRelations)) {
    const postId = postIds.get(postSlug);
    for (const slug of relation.destinations) postDestinationRows.push({ blog_post_id: postId, destination_id: destinationIds.get(slug) });
    for (const slug of relation.activities) postActivityRows.push({ blog_post_id: postId, activity_id: activityIds.get(slug) });
    for (const slug of relation.trips) postTripRows.push({ blog_post_id: postId, trip_id: tripIds.get(slug) });
  }
  await insertRelations("blog_post_destinations", postDestinationRows, "blog_post_id,destination_id");
  await insertRelations("blog_post_activities", postActivityRows, "blog_post_id,activity_id");
  await insertRelations("blog_post_trips", postTripRows, "blog_post_id,trip_id");

  const promotionRows = promotions.map((promotion) => ({
    id: promotion.id,
    name: promotion.name,
    discount_type: promotion.discount_type,
    discount_value: promotion.discount_value,
    starts_at: promotion.starts_at,
    ends_at: promotion.ends_at,
    is_active: promotion.is_active,
    terms: promotion.terms,
  }));
  await upsertBy("promotions", promotionRows, "id", "id,name");
  const promotionTripRows = promotions.flatMap((promotion) => promotion.tripSlugs.map((slug) => ({ promotion_id: promotion.id, trip_id: tripIds.get(slug) })));
  await insertRelations("promotion_trips", promotionTripRows, "promotion_id,trip_id");

  const { error: homepageError } = await client.from("homepage_content").upsert({ id: true, hero_title: "Bali Punya Banyak Cerita. Mulai Perjalananmu di Sini.", hero_subtitle: "Temukan paket Bali pilihan, destinasi ikonik, dan pengalaman lokal yang sudah kami kurasi agar kamu tinggal menikmati setiap momennya.", hero_image_path: IMAGES.riceTerrace, primary_cta_label: "Temukan Perjalananmu", primary_cta_href: "/trips", secondary_cta_label: "Lihat Paket Favorit", secondary_cta_href: "/trips", section_visibility: { booking: true, popular: true, usp: true, featured: true, deals: true, destinations: true, activities: true, blog: true }, is_published: true });
  if (homepageError) throw new Error(`Homepage gagal disimpan (${homepageError.code}): ${homepageError.message}`);
  await upsertBy("usp_items", uspItems, "id", "id,title");

  const { data: currentSettings, error: settingsReadError } = await client.from("site_settings").select("bank_name,bank_account_number,bank_account_holder,admin_whatsapp_number,public_whatsapp").eq("id", true).maybeSingle();
  if (settingsReadError) throw new Error(`Site settings tidak dapat dibaca (${settingsReadError.code}).`);
  const { error: settingsError } = await client.from("site_settings").upsert({ id: true, brand_name: "Travel Bali", logo_path: null, public_whatsapp: currentSettings?.public_whatsapp ?? null, email: "halo@travelbali.example", address: "Jl. Raya Ubud No. 88, Gianyar, Bali", bank_name: currentSettings?.bank_name ?? "BCA", bank_account_number: currentSettings?.bank_account_number ?? "87654321", bank_account_holder: currentSettings?.bank_account_holder ?? "Muhammad Fulan", admin_whatsapp_number: currentSettings?.admin_whatsapp_number ?? "6282261060675", footer_text: "Perjalanan Bali terkurasi untuk cerita yang lebih berkesan.", social_links: {} });
  if (settingsError) throw new Error(`Site settings gagal disimpan (${settingsError.code}): ${settingsError.message}`);

  console.log("Seed Bali berhasil dimasukkan ke Supabase:");
  console.log(JSON.stringify({ destinations: destinationRows.length, activities: activityRows.length, tripTypes: tripTypeRows.length, trips: tripRows.length, blogPosts: postRows.length, promotions: promotionRows.length, uspItems: uspItems.length, homepage: 1 }, null, 2));
  console.log("Data yang dapat dibaca pengunjung anonim:");
  console.log(JSON.stringify(await verifyPublicData(), null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Seed gagal dijalankan.");
  process.exit(1);
});

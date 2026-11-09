# Bore & Barrel

A dummy gunshop storefront built as a Progressive Web App. It runs offline
with an app shell, a web app manifest, and a service worker, and uses React +
Vite + Tailwind CSS.

## Setup

```bash
npm install
npm run dev      # dev server with HMR
```

Other scripts:

```bash
npm run build    # production build to dist/
npm run preview  # serve the production build
npm run lint     # oxlint
```

## Structure

```
.
├── index.html              # HTML shell
├── vite.config.js          # Vite + vite-plugin-pwa (manifest + service worker)
├── public/                 # static assets served at /
│   ├── icon-192.png / icon-512.png / icon.svg
│   └── guns/               # product images
└── src/
    ├── main.jsx            # entry, mounts <App/>
    ├── App.jsx             # app shell: tab state, header/nav/content/footer
    ├── App.css             # app shell styles
    ├── index.css           # global styles
    ├── components/
    │   ├── Header.jsx      # brand + nav
    │   ├── gun/
    │   │   ├── GunCard.jsx
    │   │   └── GunDetail.jsx
    │   └── Footer.jsx
    ├── hooks/
    │   ├── useGuns.js      # cached product queries
    │   └── useReviews.js   # review queries and actions
    ├── services/
    │   ├── archiveService.js # local archive/restore state
    │   ├── gunService.js
    │   └── reviewService.js
    ├── pages/
        ├── Catalog.jsx     # product grid
        ├── ProfilePage.jsx # profile, drafts, archive, about, and contact
        ├── EditProfilePage.jsx
        ├── DemoCartPage.jsx
        ├── About.jsx
        └── Contact.jsx
    ├── data/
    │   └── guns.js         # dummy product data
    └── utils/
        ├── draftStorage.js
        └── queryCache.js
```

## Features

- Catalog items load progressively, and product/review queries are cached for
  30 seconds.
- Product detail links can be shared with the `?gun=<id>` URL parameter.
- Profile sections include drafts, archived items, About, and Contact. Archive
  state, review reactions, and the demo cart are stored in the current browser.
- Reviews can be created, edited, removed, and rated with thumbs up/down.
- The demo cart is local-only and intentionally has no checkout or order flow.
- WhatsApp contact from the demo cart is for general app questions only and does not include cart details.

## Tugas 6.6

### 6.6.1 Sharelink Button

Setiap kartu katalog dan halaman detail memiliki tombol **Share link**. Tautan
menggunakan URL `?gun=<id>` yang membuka item yang sama; browser dengan Web
Share API menampilkan menu berbagi, sedangkan browser lain menyalin tautan.
Tautan ID lokal untuk katalog cadangan juga dapat dibuka kembali.

**Analisis:** Parameter ID membuat tautan mengarah ke produk tertentu, bukan
hanya halaman katalog. Tombol pada kartu menghentikan event klik agar detail
tidak terbuka saat pengguna hanya ingin membagikan tautan.

**Link Vercel:** [https://modul5-pwa-2-kel03.vercel.app/](https://modul5-pwa-2-kel03.vercel.app/).

### 6.6.2 Lazy Load

Gambar katalog memakai `loading="lazy"` dan `decoding="async"`. Katalog
menampilkan 12 item terlebih dahulu dan menambahkan item saat area bawah layar
mendekati viewport; tombol **Load more items** tetap tersedia.

**Analisis:** Gambar dan kartu berikutnya tidak dimuat sekaligus. Verifikasi
melalui DevTools > Network > Img: muat ulang halaman, buka katalog, lalu scroll
dan amati permintaan gambar muncul bertahap.

**Link Vercel:** [https://modul5-pwa-2-kel03.vercel.app/](https://modul5-pwa-2-kel03.vercel.app/).

### 6.6.3 Query Caching

Hasil query katalog, detail produk, dan review disimpan selama 30 detik di
memori serta `localStorage`. Perubahan produk/review menginvalidasi cache terkait.
Service worker menyimpan maksimal 100 gambar di cache `product-images` hingga
30 hari dengan strategi Cache First.

**Analisis:** Query yang sama dapat digunakan kembali tanpa meminta API selama
masa cache, termasuk setelah reload. Gambar yang sudah pernah diminta dapat
diambil dari cache service worker; periksa Network > Img setelah reload dan
lihat kolom Size/Transferred untuk indikator cache.

**Link Vercel:** [https://modul5-pwa-2-kel03.vercel.app/](https://modul5-pwa-2-kel03.vercel.app/).

### 6.6.4 Profile

Navbar menampilkan halaman Profile sebagai tempat section Profile, Drafts,
Archive, About, dan Contact. Draft dapat dilanjutkan atau dihapus. Tombol edit
profil membuka halaman terpisah untuk memperbarui nama dan bio.

**Analisis:** Informasi bantuan dan kontak tetap tersedia tanpa menjadi menu
navbar tersendiri, sementara pengeditan profil memiliki alur dan halaman fokus.
Draft disimpan lokal di browser.

**Link Vercel:** [https://modul5-pwa-2-kel03.vercel.app/](https://modul5-pwa-2-kel03.vercel.app/).

### 6.6.5 Soft delete atau arsip

Katalog dapat diarsipkan, dipulihkan dari Profile > Archive, atau dihapus
permanen. Produk server dihapus melalui API; produk lokal ditandai terhapus pada
browser ini.

**Analisis:** Arsip menyembunyikan produk dari katalog tanpa menghapusnya,
sehingga pengguna dapat memulihkan produk. Hapus permanen meminta konfirmasi
dan tidak dapat dipulihkan. Penanda arsip produk lokal disimpan di browser.

**Link Vercel:** [https://modul5-pwa-2-kel03.vercel.app/](https://modul5-pwa-2-kel03.vercel.app/).

### 6.6.6 Review

Pemilik review dapat mengedit atau menghapus review sendiri. Pengguna dapat
memberi thumbs up atau thumbs down pada review yang tersedia.

**Analisis:** Aksi edit/hapus hanya ditampilkan pada review dengan ID pengguna
yang sama. Reaksi dapat diubah atau dibatalkan dan disimpan lokal di browser.

**Link Vercel:** [https://modul5-pwa-2-kel03.vercel.app/](https://modul5-pwa-2-kel03.vercel.app/).

### 6.6.7 Gambar pada katalog

Form tambah dan edit produk menerima beberapa gambar sekaligus, menyediakan
preview dan kontrol hapus per gambar, lalu mengunggah setiap file. Gambar
pertama menjadi cover katalog; gambar lainnya tersedia sebagai thumbnail pada
detail produk. Array `image_urls` dikirim bersama payload API dan galerinya
disimpan lokal sebagai fallback untuk backend yang belum mendukung array gambar.

**Analisis:** Galeri dapat diperiksa dari detail produk dengan memilih
thumbnail. Simpanan lokal membuat gambar tambahan terlihat kembali pada browser
yang sama; sinkronisasi ke pengguna/perangkat lain membutuhkan backend yang
menerima dan menyimpan field `image_urls`.

**Link Vercel:** [https://modul5-pwa-2-kel03.vercel.app/](https://modul5-pwa-2-kel03.vercel.app/).

### Hosting Vercel dan bukti

Proyek menyertakan [vercel.json](./vercel.json) dengan build command
`npm run build` dan output directory `dist`. Deployment tersedia di
[https://modul5-pwa-2-kel03.vercel.app/](https://modul5-pwa-2-kel03.vercel.app/);
dashboard proyek: [Vercel](https://vercel.com/responsipbb/modul5-pwa-2-kel03).
Sertakan screenshot hasil UI, galeri gambar, serta panel Network sebagai bukti
tugas.

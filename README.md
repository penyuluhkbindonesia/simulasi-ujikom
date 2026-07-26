# Simulasi 9 Kompetensi ASN — PWA

Aplikasi latihan mandiri berbasis **Situational Judgement Test (SJT)** untuk:

1. Integritas
2. Kerja Sama
3. Komunikasi
4. Orientasi pada Hasil
5. Pelayanan Publik
6. Pengembangan Diri dan Orang Lain
7. Mengelola Perubahan
8. Pengambilan Keputusan
9. Perekat Bangsa

## Fitur

- Bank 200 soal pilihan ganda dengan satu jawaban terbaik.
- Setiap tes mengambil 100 soal secara acak dan berimbang: 12 soal Integritas serta masing-masing 11 soal untuk delapan kompetensi lainnya.
- Durasi 120 menit dan pengumpulan otomatis ketika waktu habis.
- Urutan soal diacak pada setiap tes baru.
- Urutan pilihan A–E juga diacak dan tetap konsisten selama sesi disimpan atau dilanjutkan.
- Pilihan pengecoh disusun lebih berdekatan secara substansi dan panjang teks agar jawaban terbaik tidak mudah dikenali dari tampilan.
- Autosave progres di `localStorage`.
- Navigasi 100 soal dan penanda soal untuk ditinjau.
- Skor akhir, jawaban benar/salah/kosong, dan waktu pengerjaan.
- Profil skor per kompetensi.
- Pembahasan jawaban dan analisis untuk seluruh soal.
- Filter pembahasan berdasarkan status dan kompetensi.
- PWA responsif, dapat dipasang, dan dapat digunakan luring setelah kunjungan pertama.
- Tidak memakai framework atau layanan eksternal.

## Batas penggunaan

Aplikasi ini dirancang untuk **latihan**, bukan ujian resmi. GitHub Pages adalah hosting statis, sehingga bank soal dan kunci jawaban dikirim ke peramban dan secara teknis dapat dilihat melalui source code. Sistem ujian resmi memerlukan backend, autentikasi, penyimpanan hasil terpusat, pengamanan bank soal, audit log, dan kontrol sesi.

Data nama, progres, dan hasil hanya disimpan pada `localStorage` perangkat pengguna. Tidak ada data yang dikirim ke server.

## Publikasi ke GitHub Pages

1. Buat repository baru, misalnya `simulasi-9-kompetensi-asn`.
2. Ekstrak ZIP ini, lalu unggah **seluruh isi folder proyek** ke root repository. Pastikan folder `.github/workflows/pages.yml` ikut terunggah.
3. Gunakan branch `main`.
4. Buka **Settings → Pages**.
5. Pada **Build and deployment → Source**, pilih **GitHub Actions**.
6. Buka tab **Actions** dan tunggu workflow **Deploy PWA to GitHub Pages** selesai.
7. Situs akan tersedia pada:
   `https://USERNAME.github.io/simulasi-9-kompetensi-asn/`

Setiap `push` ke branch `main` akan menerbitkan versi terbaru secara otomatis.

Dokumentasi resmi:
- GitHub Pages: https://docs.github.com/en/pages
- Custom workflow Pages: https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages

## Menjalankan secara lokal

Service worker memerlukan HTTP/HTTPS. Jangan membuka `index.html` langsung melalui `file://`.

Contoh dari Command Prompt pada folder proyek:

```bash
python -m http.server 8080
```

Lalu buka:

```text
http://localhost:8080
```

## Mekanisme pemilihan soal

Bank terdiri atas 24 soal Integritas dan masing-masing 22 soal untuk delapan kompetensi lain. Pada setiap tes baru, aplikasi memilih:

- 12 dari 24 soal Integritas;
- 11 dari 22 soal pada masing-masing kompetensi lain;
- total tetap 100 soal.

Pemilihan dilakukan ulang pada tes baru. Soal dan urutan pilihan tetap sama ketika halaman dimuat ulang atau tes dilanjutkan dari perangkat yang sama.

## Pengaturan utama

Durasi tes berada di `app.js`:

```js
durationMinutes: 120
```

Versi cache PWA berada di `sw.js`:

```js
const CACHE_NAME = "asn9-kompetensi-v1.1.0";
```

Saat memperbarui file aplikasi, naikkan nama cache agar perangkat mengambil aset terbaru.

## Struktur

```text
.
├── .github/workflows/pages.yml
├── icons/
│   ├── icon-192.png
│   └── icon-512.png
├── .nojekyll
├── index.html
├── styles.css
├── app.js
├── questions.js
├── manifest.webmanifest
├── sw.js
└── README.md
```

## Lisensi konten

Soal merupakan materi simulasi orisinal untuk pembelajaran. Materi bukan instrumen resmi BKN, Kementerian PANRB, atau Kemendukbangga/BKKBN.

## Perubahan versi 1.1.0

- Bank soal ditingkatkan dari 100 menjadi 200.
- Setiap sesi tetap menggunakan 100 soal dengan pengambilan acak berimbang.
- Urutan pilihan jawaban diacak per sesi.
- Distraktor diperhalus agar lebih masuk akal dan tidak mudah dibedakan hanya dari panjang atau kelengkapan kalimat.
- Penyimpanan sesi memakai format baru `asn9-kompetensi-test-v2`.

DOSMOS VIP V14.1 FINAL

URUTAN PASANG:

1. Supabase:
   - Buka SQL Editor.
   - Copy isi file supabase-v14-1.sql.
   - Klik Run.
   - Pastikan muncul Success.

2. GitHub:
   Replace file berikut pada lokasi yang sama:
   - index.html
   - admin/index.html
   - assets/css/style.css
   - assets/js/admin.js
   - assets/js/public.js
   - assets/js/config.js

3. Commit changes.

4. Tunggu Cloudflare Pages selesai deploy.

5. Buka website dan tekan Ctrl + F5.

6. Login Admin > Branding:
   - Upload Hero Background
   - Upload Hero Background Mobile
   - Upload Background Login
   - Upload Background Footer
   - Atur tingkat gelap dan posisi
   - Klik Simpan Branding

CATATAN:
- Bucket Supabase harus bernama dosmos-media dan Public.
- Jangan ubah nama folder/file.
- File config.js berisi publishable key, bukan service-role key.


DOSMOS VIP V14.2 — CONTENT MANAGER

1. Jalankan supabase-v14-2.sql di Supabase SQL Editor.
2. Replace file:
   - index.html
   - admin/index.html
   - assets/css/style.css
   - assets/js/admin.js
   - assets/js/public.js
3. Commit dan tunggu Cloudflare deploy.
4. Login Admin > Website Text.
5. Ubah tulisan lalu klik Simpan Kata-Kata Website.


DOSMOS VIP V14.3 — LIVE CENTER
1. Jalankan supabase-v14-3.sql di Supabase SQL Editor.
2. Replace index.html, admin/index.html, style.css, admin.js, dan public.js.
3. Commit, tunggu Cloudflare deploy, lalu Ctrl+F5.
4. Masuk Admin > Live Center.

YouTube, Twitch, Facebook, dan Kick bisa dibuat embed otomatis.
TikTok biasanya membatasi iframe; gunakan tombol Watch Now atau URL Embed resmi.


DOSMOS VIP V14.4 — ANNOUNCEMENT CENTER

FITUR:
- Top Bar
- Popup
- Floating Banner
- Running Text
- Side Notification
- Publish / Draft
- Smart Scheduler tanggal mulai dan selesai
- Priority
- Auto Hide
- Tombol dan link
- Tema Gold, Red, Blue, Green, Purple
- Animasi Fade, Slide, Zoom, Glow
- Dismiss per session
- Emergency Mode
- Preview langsung di admin
- Multi announcement untuk ticker dan toast

CARA PASANG:
1. Jalankan supabase-v14-4.sql di Supabase SQL Editor.
2. Replace file:
   - index.html
   - admin/index.html
   - assets/css/style.css
   - assets/js/admin.js
   - assets/js/public.js
3. Commit ke GitHub.
4. Tunggu Cloudflare deploy.
5. Tekan Ctrl + F5.
6. Login Admin > Announcement.

CATATAN:
- Emergency Mode akan mengambil prioritas dan tampil sebagai popup utama.
- Tanggal memakai timezone browser admin, lalu disimpan sebagai UTC di Supabase.
- Pengumuman yang ditutup pengunjung disembunyikan selama sesi browser tersebut.


=========================================================
DOSMOS VIP V14.5 — TOURNAMENT BRACKET CENTER
=========================================================

FITUR UTAMA:
- Bracket bercabang native seperti platform turnamen profesional.
- Single Elimination.
- Slot 4, 8, 16, atau 32 tim.
- Best of 1, 3, 5, atau 7.
- Manual seeding atau random seeding.
- BYE otomatis jika slot belum penuh.
- Logo tim opsional.
- Input skor dari Admin.
- Pemenang otomatis maju ke ronde berikutnya.
- Status Upcoming, Live, Finished, dan Bye.
- Jadwal setiap pertandingan.
- Grand Final dengan efek emas.
- Champion otomatis ketika final selesai.
- Draft, Published, dan Finished.
- Bracket publik dengan garis bercabang.
- Drag untuk menggeser bracket.
- Zoom 50% sampai 150%.
- Responsif untuk desktop dan HP.

CARA PASANG:
1. Jalankan migration lama sampai V14.4 jika belum pernah.
2. Buka `supabase-v14-5.sql`.
3. Copy seluruh SQL ke Supabase SQL Editor lalu klik Run.
4. Upload/replace semua file paket V14.5 ke GitHub.
5. Commit changes.
6. Tunggu Cloudflare Pages selesai deploy.
7. Tekan Ctrl + F5.
8. Login Admin > Tournament Bracket.
9. Buat bracket, isi daftar tim, lalu Generate Bracket.
10. Publish bracket agar muncul di website publik.

FORMAT DAFTAR TIM:
DOSMOS | https://domain.com/dosmos.png
RRQ | https://domain.com/rrq.png
EVOS
ONIC

CATATAN:
- Gunakan URL gambar langsung untuk logo tim.
- Bracket pertama fokus pada Single Elimination agar engine stabil.
- Jangan mengubah hasil match ronde lama setelah ronde berikutnya sudah dimainkan,
  karena dapat menyebabkan jalur pemenang tidak konsisten.


=========================================================
DOSMOS VIP V14.6 — MEDIA LIBRARY PRO
=========================================================

FITUR:
- Semua upload baru otomatis tercatat di Media Library.
- Upload gambar langsung dari tab Media Library.
- Status Active, Hidden, dan Archive.
- Hidden/Archive tidak menghapus file dari Supabase Storage.
- Search, filter kategori, filter status, dan sorting.
- Statistik total media, status, dan penggunaan storage.
- Rename nama tampilan tanpa mengubah URL.
- Copy URL.
- Media Picker untuk Branding, Event, Champion, News, Gallery,
  Sponsor, dan Live Center.
- Safe Delete: file tidak bisa dihapus jika URL masih dipakai
  oleh modul website yang terdeteksi.
- Hapus permanen membersihkan database dan file Storage.
- Mobile responsive.

CARA PASANG:
1. Pastikan V14.5 sudah terpasang.
2. Jalankan `supabase-v14-6.sql` di Supabase SQL Editor.
3. Replace seluruh file paket V14.6 ke repository GitHub.
4. Commit dan tunggu Cloudflare Pages selesai deploy.
5. Tekan Ctrl + F5.
6. Login Admin > Media Library.

CATATAN PENTING:
- Gambar yang sudah ada sebelum V14.6 belum otomatis masuk ke library.
  Upload baru setelah V14.6 akan tercatat otomatis.
- Untuk gambar yang tidak dipakai sementara, pilih HIDDEN atau ARCHIVE.
  Jangan Delete.
- Status media mengatur pengelolaan aset di admin. Modul website tetap memakai
  URL yang sudah dipilih sampai URL tersebut diganti dari modul terkait.
- Safe Delete mengecek pemakaian URL pada Branding, Live, Events, Champions,
  News, Gallery, Sponsors, dan Tournament Bracket.

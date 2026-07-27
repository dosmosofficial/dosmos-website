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

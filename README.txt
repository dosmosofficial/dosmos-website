DOSMOS VIP — BRAND MANAGER

FITUR BARU:
- Menu Branding di DOSMOS VIP.
- Upload logo utama langsung dari HP atau komputer.
- Upload logo hero.
- Upload favicon.
- Nama website dan slogan dapat diganti.
- Warna utama dan background dapat diganti.
- Live preview sebelum disimpan.
- Branding otomatis tampil di navbar, hero, footer, tab browser, login, dan sidebar admin.
- Tampilan HP tetap lega dan responsif.
- Logo DOSMOS yang diberikan sudah disertakan sebagai fallback lokal.

LANGKAH PEMASANGAN:
1. Extract ZIP.
2. Upload seluruh file ke repository GitHub.
3. Commit changes dan tunggu Cloudflare selesai deploy.
4. Buka Supabase > SQL Editor.
5. Jalankan file setup-branding.sql SATU KALI.
6. Buka /admin lalu masuk ke menu Branding.
7. Upload logo dan klik Simpan Branding.

FILE UTAMA YANG DIGANTI:
- index.html
- admin/index.html
- assets/css/style.css
- assets/js/admin.js
- assets/js/public.js
- dosmos-logo.png

PENTING:
Menu Branding memerlukan setup-branding.sql karena ada kolom database baru.
Tidak perlu menghapus tabel atau data lama.

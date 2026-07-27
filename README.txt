DOSMOS V6 — WEBSITE + ADMIN PANEL

ISI:
- index.html
- admin/index.html
- assets/css/style.css
- assets/js/config.js
- assets/js/app.js
- assets/js/admin.js
- setup.sql

LANGKAH:
1. Supabase > SQL Editor:
   Paste semua isi setup.sql, lalu Run.

2. Supabase > Authentication > Users:
   Buat user admin dengan email dan password.
   Copy UUID user tersebut.

3. Supabase > SQL Editor:
   Jalankan:
   insert into public.admin_users (user_id) values ('UUID_USER_ADMIN');

4. GitHub:
   Upload seluruh isi folder ini dengan struktur tetap.
   Jangan upload ZIP langsung.

5. Cloudflare deploy otomatis.

6. Panel admin:
   https://ALAMAT-WEBSITE-KAMU.pages.dev/admin/

7. Login memakai email/password yang dibuat di Supabase Authentication.

CATATAN:
- Publishable key boleh berada di frontend karena RLS aktif.
- Jangan pernah masukkan Secret Key atau service_role ke file website.
- Logo opsional: upload dosmos-logo.png sejajar dengan index.html.

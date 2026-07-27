DOSMOS V8

FITUR:
- Website dinamis premium
- Events
- Hall of Champions
- News
- Gallery
- Contact & social media
- Admin dashboard
- Upload gambar langsung ke Supabase Storage
- Edit dan hapus konten
- RLS dan akses khusus admin
- Responsive HP/Desktop

LANGKAH:
1. Supabase > SQL Editor
   Paste isi setup-v8.sql lalu Run.

2. GitHub
   Upload seluruh isi folder ini dengan struktur tetap:
   index.html
   admin/index.html
   assets/css/style.css
   assets/js/config.js
   assets/js/public.js
   assets/js/admin.js

3. Jangan upload ZIP langsung.

4. Tunggu Cloudflare deploy.

5. Buka:
   https://dosmos.pages.dev/admin/

6. Login dengan akun admin Supabase.

7. Upload logo DOSMOS bernama:
   dosmos-logo.png
   letakkan sejajar dengan index.html.

KEAMANAN:
- Publishable key boleh berada di frontend karena RLS aktif.
- Jangan pernah memasukkan Secret Key/service_role ke website.

# Deploy admin-users

Supabase CLI:

```bash
supabase functions deploy admin-users
```

Edge Function memakai environment bawaan Supabase:
- SUPABASE_URL
- SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY

Jangan pernah menaruh service-role key di `assets/js/config.js`.

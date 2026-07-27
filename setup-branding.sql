-- DOSMOS VIP — BRAND MANAGER
-- WAJIB dijalankan satu kali di Supabase SQL Editor sebelum memakai menu Branding.

alter table public.site_settings
  add column if not exists site_name text default 'DOSMOS',
  add column if not exists slogan text default 'Every Gamer Deserves a Chance.',
  add column if not exists main_logo_url text,
  add column if not exists hero_logo_url text,
  add column if not exists favicon_url text,
  add column if not exists primary_color text default '#f6c744',
  add column if not exists background_color text default '#080808';

update public.site_settings
set
  site_name = coalesce(nullif(site_name,''),'DOSMOS'),
  slogan = coalesce(nullif(slogan,''),'Every Gamer Deserves a Chance.'),
  primary_color = coalesce(nullif(primary_color,''),'#f6c744'),
  background_color = coalesce(nullif(background_color,''),'#080808')
where id = 1;

-- Pastikan data pengaturan tetap dapat dibaca publik dan hanya admin yang dapat mengubahnya.
alter table public.site_settings enable row level security;

drop policy if exists "Public read settings" on public.site_settings;
create policy "Public read settings"
on public.site_settings for select
to anon, authenticated
using (true);

drop policy if exists "Admin all settings" on public.site_settings;
create policy "Admin all settings"
on public.site_settings for all
to authenticated
using (exists(select 1 from public.admin_users a where a.user_id=auth.uid()))
with check (exists(select 1 from public.admin_users a where a.user_id=auth.uid()));

-- Bucket media yang sama dipakai untuk logo, hero logo, dan favicon.
insert into storage.buckets(id,name,public)
values('dosmos-media','dosmos-media',true)
on conflict(id) do update set public=true;

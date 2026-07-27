
-- DOSMOS VIP V11
-- Jalankan sekali di Supabase SQL Editor.

create extension if not exists pgcrypto;

alter table public.events enable row level security;
alter table public.events add column if not exists updated_at timestamptz default now();

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);
alter table public.admin_users enable row level security;

create table if not exists public.champions (
  id uuid primary key default gen_random_uuid(), team_name text not null, rank text default 'Champion',
  event_name text, mvp text, prize text, story text, photo text, created_at timestamptz default now()
);
alter table public.champions enable row level security;

create table if not exists public.news (
  id uuid primary key default gen_random_uuid(), title text not null, summary text, content text,
  cover text, published_at timestamptz default now(), created_at timestamptz default now()
);
alter table public.news enable row level security;

create table if not exists public.gallery (
  id uuid primary key default gen_random_uuid(), caption text, event_name text,
  image_url text not null, created_at timestamptz default now()
);
alter table public.gallery enable row level security;

create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(), event_name text not null, team_name text not null,
  captain_name text not null, whatsapp text not null, roster text not null, notes text,
  status text default 'pending', created_at timestamptz default now()
);
alter table public.registrations enable row level security;

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(), event_name text, round_name text not null,
  team_a text, team_b text, score_a integer default 0, score_b integer default 0,
  winner text, sort_order integer default 0, created_at timestamptz default now()
);
alter table public.matches enable row level security;

create table if not exists public.sponsors (
  id uuid primary key default gen_random_uuid(), name text not null, website text,
  logo text, sort_order integer default 0, created_at timestamptz default now()
);
alter table public.sponsors enable row level security;

create table if not exists public.site_settings (
  id integer primary key default 1 check (id=1), whatsapp text default '6281288836205',
  email text default 'dosmosid@gmail.com', instagram text default 'https://instagram.com/dosmos.id',
  tiktok text, discord text, youtube_live_url text, updated_at timestamptz default now()
);
alter table public.site_settings enable row level security;
alter table public.site_settings add column if not exists youtube_live_url text;
insert into public.site_settings(id) values(1) on conflict(id) do nothing;

-- helper policies for content tables
do $$
declare t text;
begin
  foreach t in array array['events','champions','news','gallery','matches','sponsors'] loop
    execute format('drop policy if exists "Public read %s" on public.%I',t,t);
    execute format('create policy "Public read %s" on public.%I for select to anon, authenticated using (true)',t,t);
    execute format('drop policy if exists "Admin insert %s" on public.%I',t,t);
    execute format('create policy "Admin insert %s" on public.%I for insert to authenticated with check (exists(select 1 from public.admin_users a where a.user_id=auth.uid()))',t,t);
    execute format('drop policy if exists "Admin update %s" on public.%I',t,t);
    execute format('create policy "Admin update %s" on public.%I for update to authenticated using (exists(select 1 from public.admin_users a where a.user_id=auth.uid())) with check (exists(select 1 from public.admin_users a where a.user_id=auth.uid()))',t,t);
    execute format('drop policy if exists "Admin delete %s" on public.%I',t,t);
    execute format('create policy "Admin delete %s" on public.%I for delete to authenticated using (exists(select 1 from public.admin_users a where a.user_id=auth.uid()))',t,t);
  end loop;
end $$;

drop policy if exists "Public submit registration" on public.registrations;
create policy "Public submit registration" on public.registrations for insert to anon, authenticated with check (status='pending');
drop policy if exists "Admin read registrations" on public.registrations;
create policy "Admin read registrations" on public.registrations for select to authenticated using (exists(select 1 from public.admin_users a where a.user_id=auth.uid()));
drop policy if exists "Admin update registrations" on public.registrations;
create policy "Admin update registrations" on public.registrations for update to authenticated using (exists(select 1 from public.admin_users a where a.user_id=auth.uid())) with check (exists(select 1 from public.admin_users a where a.user_id=auth.uid()));
drop policy if exists "Admin delete registrations" on public.registrations;
create policy "Admin delete registrations" on public.registrations for delete to authenticated using (exists(select 1 from public.admin_users a where a.user_id=auth.uid()));

drop policy if exists "Public read settings" on public.site_settings;
create policy "Public read settings" on public.site_settings for select to anon, authenticated using (true);
drop policy if exists "Admin all settings" on public.site_settings;
create policy "Admin all settings" on public.site_settings for all to authenticated
using (exists(select 1 from public.admin_users a where a.user_id=auth.uid()))
with check (exists(select 1 from public.admin_users a where a.user_id=auth.uid()));

insert into storage.buckets(id,name,public) values('dosmos-media','dosmos-media',true)
on conflict(id) do update set public=true;

drop policy if exists "Public read dosmos media" on storage.objects;
create policy "Public read dosmos media" on storage.objects for select to anon, authenticated using(bucket_id='dosmos-media');
drop policy if exists "Admin insert dosmos media" on storage.objects;
create policy "Admin insert dosmos media" on storage.objects for insert to authenticated
with check(bucket_id='dosmos-media' and exists(select 1 from public.admin_users a where a.user_id=auth.uid()));
drop policy if exists "Admin update dosmos media" on storage.objects;
create policy "Admin update dosmos media" on storage.objects for update to authenticated
using(bucket_id='dosmos-media' and exists(select 1 from public.admin_users a where a.user_id=auth.uid()))
with check(bucket_id='dosmos-media' and exists(select 1 from public.admin_users a where a.user_id=auth.uid()));
drop policy if exists "Admin delete dosmos media" on storage.objects;
create policy "Admin delete dosmos media" on storage.objects for delete to authenticated
using(bucket_id='dosmos-media' and exists(select 1 from public.admin_users a where a.user_id=auth.uid()));

-- Supabase initialization for the 600-day anniversary site.
-- Run this in the Supabase SQL editor after creating the project.

create extension if not exists pgcrypto;

create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  chapter_id text not null,
  title text,
  caption text,
  date text,
  location text,
  image_url text not null,
  storage_path text not null,
  sort_order integer not null,
  display_type text,
  animation text,
  mood text,
  color_tone text,
  created_at timestamptz default now()
);

alter table public.photos enable row level security;

drop policy if exists "photos public read" on public.photos;
create policy "photos public read"
on public.photos
for select
to anon
using (true);

drop policy if exists "photos public insert" on public.photos;
create policy "photos public insert"
on public.photos
for insert
to anon
with check (
  chapter_id in (
    'growing-clear',
    'nanjing',
    'announcement',
    'good-times-1',
    'good-times-2',
    'now'
  )
  and image_url <> ''
  and storage_path <> ''
  and sort_order >= 1
);

create index if not exists photos_chapter_id_idx on public.photos (chapter_id);
create index if not exists photos_sort_order_idx on public.photos (sort_order);
create index if not exists photos_created_at_idx on public.photos (created_at);

-- Create the public Storage bucket used by the frontend.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'love-photos',
  'love-photos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "love photos public read" on storage.objects;
create policy "love photos public read"
on storage.objects
for select
to anon
using (bucket_id = 'love-photos');

drop policy if exists "love photos public upload" on storage.objects;
create policy "love photos public upload"
on storage.objects
for insert
to anon
with check (
  bucket_id = 'love-photos'
  and (storage.foldername(name))[1] in (
    'growing-clear',
    'nanjing',
    'announcement',
    'good-times-1',
    'good-times-2',
    'now'
  )
);

-- Deletion and updates are intentionally not open to anon users.
-- For real access control, use Supabase Auth or an Edge Function instead of a shared editor password.

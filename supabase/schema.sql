-- ============================================================
-- OOUMPH GURUKUL LMS — Supabase Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. PROFILES (extends auth.users)
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  full_name    text not null,
  email        text unique not null,
  phone        text,
  qualification text,
  role         text not null check (role in ('super_admin', 'teacher', 'student')),
  track        text,
  created_at   timestamptz default now()
);
alter table public.profiles enable row level security;

-- Profiles: users can read own row; admins can read all
create policy "Own profile read" on public.profiles
  for select using (auth.uid() = id);

create policy "Super admin read all profiles" on public.profiles
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'super_admin')
  );

create policy "Super admin insert profiles" on public.profiles
  for insert with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'super_admin')
  );

create policy "Super admin update profiles" on public.profiles
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'super_admin')
  );

create policy "Super admin delete profiles" on public.profiles
  for delete using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'super_admin')
  );

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'User'),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'student')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 2. CONTENT
create table if not exists public.content (
  id           bigserial primary key,
  title        text not null,
  description  text,
  category     text,
  type         text not null check (type in ('video', 'pdf', 'image', 'csv')),
  url          text not null,
  thumbnail_url text,
  duration     text,
  track        text not null,
  views        integer default 0,
  teacher_id   uuid references public.profiles(id) on delete set null,
  upload_date  date default current_date,
  created_at   timestamptz default now()
);
alter table public.content enable row level security;

-- Students can read content for their track
create policy "Student read own track content" on public.content
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and track = public.content.track)
  );

-- Teachers can read & manage their track content
create policy "Teacher read own track" on public.content
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'teacher' and track = public.content.track)
  );

create policy "Teacher insert content" on public.content
  for insert with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'teacher' and track = public.content.track)
  );

create policy "Teacher delete own content" on public.content
  for delete using (teacher_id = auth.uid());

-- Super admin full access to content
create policy "Super admin content full" on public.content
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'super_admin')
  );

-- Increment views function
create or replace function public.increment_views(content_id bigint)
returns void language plpgsql security definer as $$
begin
  update public.content set views = views + 1 where id = content_id;
end;
$$;


-- 3. USER CONTENT ACTIONS (watchlist, history, liked, downloads)
create table if not exists public.user_content_actions (
  id         bigserial primary key,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  content_id bigint not null references public.content(id) on delete cascade,
  action     text not null check (action in ('watchlist', 'history', 'liked', 'download')),
  created_at timestamptz default now(),
  unique(user_id, content_id, action)
);
alter table public.user_content_actions enable row level security;

create policy "User own actions" on public.user_content_actions
  for all using (user_id = auth.uid());


-- 4. STORAGE BUCKETS
-- Run in Supabase dashboard Storage tab, or via API:
-- Create bucket "content" (public: false, max file size: 500MB)
-- Create bucket "thumbnails" (public: true)

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('content', 'content', false, 524288000, null),
  ('thumbnails', 'thumbnails', true, 5242880, array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do nothing;

-- Storage policies
create policy "Authenticated upload content" on storage.objects
  for insert with check (bucket_id = 'content' and auth.role() = 'authenticated');

create policy "Owner delete content" on storage.objects
  for delete using (bucket_id = 'content' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Authenticated read content" on storage.objects
  for select using (bucket_id = 'content' and auth.role() = 'authenticated');

create policy "Public thumbnails" on storage.objects
  for select using (bucket_id = 'thumbnails');

create policy "Authenticated upload thumbnail" on storage.objects
  for insert with check (bucket_id = 'thumbnails' and auth.role() = 'authenticated');


-- ============================================================
-- SEED: Super Admins
-- After creating auth users via Supabase dashboard for each,
-- run this to set their roles:
-- UPDATE public.profiles SET role='super_admin', full_name='Super Admin', phone='+91 99999 00000' WHERE email='admin@ooumph.com';
-- UPDATE public.profiles SET role='super_admin', full_name='Praveen Mishra', phone='+91 88888 11111' WHERE email='praveen@ooumph.com';
-- ============================================================

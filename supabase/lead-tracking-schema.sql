-- Abhi Scientific Instruments: visitor tracking and lead CRM
-- Run once in Supabase SQL Editor for project lkeemgjfnmgymuvklyhs.
create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create table if not exists public.visitor_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  event_name text not null check (length(event_name) between 1 and 80),
  page_path text,
  page_title text,
  product_name text,
  source text,
  session_id text,
  referrer_host text,
  metadata jsonb not null default '{}'::jsonb
);
create index if not exists visitor_events_created_at_idx on public.visitor_events(created_at desc);
create index if not exists visitor_events_product_idx on public.visitor_events(product_name);
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null check (length(trim(name)) between 1 and 160),
  email text,
  phone text,
  company text,
  product text,
  requirement text not null check (length(trim(requirement)) between 1 and 6000),
  source text not null default 'website_form',
  status text not null default 'New' check (status in ('New','Contacted','Quotation Sent','Follow-up','Converted','Not Relevant')),
  notes text
);
create index if not exists leads_created_at_idx on public.leads(created_at desc);

alter table public.admin_users enable row level security;
alter table public.visitor_events enable row level security;
alter table public.leads enable row level security;

revoke all on public.admin_users from anon, authenticated;
revoke all on public.visitor_events from anon, authenticated;
revoke all on public.leads from anon, authenticated;
grant select on public.admin_users to authenticated;
grant insert on public.visitor_events to anon, authenticated;
grant select, insert, update on public.visitor_events to authenticated;
grant insert on public.leads to anon, authenticated;
grant select, update on public.leads to authenticated;

drop policy if exists "Admins can verify their own membership" on public.admin_users;
create policy "Admins can verify their own membership" on public.admin_users
for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists "Public can record anonymous visitor events" on public.visitor_events;
create policy "Public can record anonymous visitor events" on public.visitor_events
for insert to anon with check (
  event_name in ('page_view','product_view','product_search','whatsapp_click','inquiry_form_submit','phone_click','email_click')
);
drop policy if exists "Admins can read visitor events" on public.visitor_events;
create policy "Admins can read visitor events" on public.visitor_events
for select to authenticated using (exists(select 1 from public.admin_users a where a.user_id=(select auth.uid())));
drop policy if exists "Admins can add visitor events" on public.visitor_events;
create policy "Admins can add visitor events" on public.visitor_events
for insert to authenticated with check (exists(select 1 from public.admin_users a where a.user_id=(select auth.uid())));
drop policy if exists "Admins can update visitor events" on public.visitor_events;
create policy "Admins can update visitor events" on public.visitor_events
for update to authenticated using (exists(select 1 from public.admin_users a where a.user_id=(select auth.uid()))) with check (exists(select 1 from public.admin_users a where a.user_id=(select auth.uid())));

drop policy if exists "Public can submit inquiry leads" on public.leads;
create policy "Public can submit inquiry leads" on public.leads
for insert to anon with check (
  length(trim(name)) between 1 and 160 and length(trim(requirement)) between 1 and 6000
  and source in ('website_form','whatsapp','phone','email','other')
);
drop policy if exists "Admins can read leads" on public.leads;
create policy "Admins can read leads" on public.leads
for select to authenticated using (exists(select 1 from public.admin_users a where a.user_id=(select auth.uid())));
drop policy if exists "Admins can update leads" on public.leads;
create policy "Admins can update leads" on public.leads
for update to authenticated using (exists(select 1 from public.admin_users a where a.user_id=(select auth.uid()))) with check (
  exists(select 1 from public.admin_users a where a.user_id=(select auth.uid()))
);

-- After creating your first user under Authentication > Users, add them as an admin:
-- insert into public.admin_users(user_id) values ('YOUR-AUTH-USER-UUID');
-- IMPORTANT: do not create a public SELECT policy on leads or visitor_events.

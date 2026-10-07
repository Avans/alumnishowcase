-- Avans ICT Alumni Showcase: schema, row level security and storage.
--
-- Privacy model
--   * public.showcases          approved rows are readable by everyone
--   * public.showcase_contacts  holds the alumni's private email, admins only
--   * public.admins             allow-list of admin emails (not exposed via API)
-- Submissions are written by the Nuxt server route with the service role key,
-- so anonymous visitors never get direct INSERT access.

create type public.showcase_status as enum ('pending', 'approved', 'rejected');
create type public.contact_method  as enum ('linkedin', 'website', 'email');

-- Admins -------------------------------------------------------------------

create table public.admins (
  email text primary key check (email = lower(email))
);
alter table public.admins enable row level security;
revoke all on public.admins from anon, authenticated;

insert into public.admins (email) values ('s.vandockum@avans.nl');

-- A user is an admin when their *confirmed* email is on the allow-list.
create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from auth.users u
    join public.admins a on a.email = lower(u.email)
    where u.id = auth.uid()
      and u.email_confirmed_at is not null
  );
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- Showcases ----------------------------------------------------------------

create function public.links_are_valid(l jsonb)
returns boolean
language sql
immutable
as $$
  select case
    when jsonb_typeof(l) <> 'array' then false
    when jsonb_array_length(l) > 6 then false
    else not exists (
      select 1
      from jsonb_array_elements(l) e
      where jsonb_typeof(e) <> 'object'
         or coalesce(e ->> 'url', '') !~* '^https?://[^[:space:]]+$'
         or char_length(coalesce(e ->> 'label', '')) not between 1 and 40
    )
  end;
$$;

create table public.showcases (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  status          public.showcase_status not null default 'pending',
  featured        boolean not null default false,

  title           text not null check (char_length(title) between 3 and 100),
  summary         text not null check (char_length(summary) between 10 and 280),
  image_url       text not null check (image_url ~ '^(https?://|/[^/])'),
  image_path      text,
  links           jsonb not null default '[]' check (public.links_are_valid(links)),
  tags            text[] not null default '{}' check (cardinality(tags) <= 5),

  company         text not null check (char_length(btrim(company)) between 1 and 80),
  alumni_name     text not null check (char_length(btrim(alumni_name)) between 2 and 80),
  alumni_role     text check (char_length(alumni_role) <= 80),
  programme       text check (char_length(programme) <= 80),
  graduation_year smallint check (graduation_year between 1990 and 2100),

  -- Public contact preference. For 'email' the address itself stays private.
  contact_method  public.contact_method not null,
  contact_url     text check (contact_url ~* '^https?://[^[:space:]]+$'),

  created_at      timestamptz not null default now(),
  approved_at     timestamptz,

  constraint contact_url_matches_method check (
    (contact_method = 'email' and contact_url is null)
    or (contact_method <> 'email' and contact_url is not null)
  )
);

create index showcases_listing_idx
  on public.showcases (status, featured desc, approved_at desc);

create function public.showcases_set_approved_at()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'approved' then
    if tg_op = 'INSERT' or old.status <> 'approved' then
      new.approved_at := now();
    end if;
  else
    new.approved_at := null;
  end if;
  return new;
end;
$$;

create trigger showcases_approved_at
  before insert or update of status on public.showcases
  for each row execute function public.showcases_set_approved_at();

-- Private contact emails ---------------------------------------------------

create table public.showcase_contacts (
  showcase_id uuid primary key references public.showcases (id) on delete cascade,
  email       text not null check (
                char_length(email) <= 254
                and email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
              ),
  created_at  timestamptz not null default now()
);

-- Row level security -------------------------------------------------------

alter table public.showcases         enable row level security;
alter table public.showcase_contacts enable row level security;

revoke all on public.showcases, public.showcase_contacts from anon, authenticated;
grant select on public.showcases to anon, authenticated;
grant update, delete on public.showcases to authenticated;
grant select, delete on public.showcase_contacts to authenticated;

create policy "Approved showcases are public, admins see everything"
  on public.showcases for select
  to anon, authenticated
  using (status = 'approved' or (select public.is_admin()));

create policy "Admins can moderate showcases"
  on public.showcases for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Admins can delete showcases"
  on public.showcases for delete
  to authenticated
  using ((select public.is_admin()));

create policy "Only admins can read contact emails"
  on public.showcase_contacts for select
  to authenticated
  using ((select public.is_admin()));

create policy "Admins can delete contact emails"
  on public.showcase_contacts for delete
  to authenticated
  using ((select public.is_admin()));

-- Storage ------------------------------------------------------------------
-- Public read (via public URLs). Uploads happen server-side with the service
-- role; only admins may delete.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'showcase-images', 'showcase-images', true, 5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "Admins can delete showcase images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'showcase-images' and (select public.is_admin()));

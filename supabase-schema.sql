-- =============================================================================
-- Marketplace: complete Supabase schema
--
-- Run this whole file once in Supabase Dashboard → SQL Editor → New query.
-- It is idempotent: running it again will not duplicate tables, indexes,
-- policies or the storage bucket.
--
-- Security model (no user accounts):
--   * Everyone may READ listings and listing images.
--   * Everyone may CREATE listings and messages, but only rows that pass the
--     CHECK constraints below. The constraints are enforced by Postgres, so
--     they hold no matter which client talks to the database.
--   * Nobody but the server (service role) may read messages, because they
--     contain buyer email addresses.
--   * Nobody but the server (service role) may write to the listing-images
--     bucket. The Next.js API validates the file (type, magic bytes, size)
--     before uploading it.
--   * No one may UPDATE or DELETE through the public API.
-- =============================================================================

create extension if not exists pg_trgm;

-- -----------------------------------------------------------------------------
-- listings
-- -----------------------------------------------------------------------------
create table if not exists public.listings (
  id           uuid primary key default gen_random_uuid(),
  title        text          not null,
  description  text          not null,
  price        numeric(12,2) not null,
  category     text          not null,
  seller_email text          not null,
  image_url    text          not null,
  created_at   timestamptz   not null default now(),

  constraint listings_title_length
    check (char_length(btrim(title)) between 3 and 100),
  constraint listings_description_length
    check (char_length(btrim(description)) between 10 and 2000),
  constraint listings_price_range
    check (price > 0 and price <= 100000000),
  constraint listings_category_allowed
    check (category in (
      'Electronics', 'Furniture', 'Clothing', 'Home & Garden',
      'Sports & Outdoors', 'Vehicles', 'Books', 'Other'
    )),
  constraint listings_seller_email_format
    check (char_length(seller_email) <= 254
           and seller_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  constraint listings_image_url_bucket
    check (char_length(image_url) <= 1000
           and image_url like 'https://%/storage/v1/object/public/listing-images/%')
);

create index if not exists listings_created_at_idx
  on public.listings (created_at desc);
create index if not exists listings_category_created_at_idx
  on public.listings (category, created_at desc);
-- Trigram indexes make the ILIKE keyword search on title/description fast.
create index if not exists listings_title_trgm_idx
  on public.listings using gin (title gin_trgm_ops);
create index if not exists listings_description_trgm_idx
  on public.listings using gin (description gin_trgm_ops);

-- -----------------------------------------------------------------------------
-- messages
-- -----------------------------------------------------------------------------
create table if not exists public.messages (
  id           uuid primary key default gen_random_uuid(),
  listing_id   uuid        not null references public.listings (id) on delete cascade,
  buyer_email  text        not null,
  seller_email text        not null,
  message      text        not null,
  created_at   timestamptz not null default now(),

  constraint messages_buyer_email_format
    check (char_length(buyer_email) <= 254
           and buyer_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  constraint messages_seller_email_format
    check (char_length(seller_email) <= 254
           and seller_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  constraint messages_message_length
    check (char_length(btrim(message)) between 1 and 1000)
);

create index if not exists messages_listing_id_created_at_idx
  on public.messages (listing_id, created_at desc);

-- The seller email on a message must be the seller email of its listing,
-- so a client cannot attach a message to a listing but address someone else.
create or replace function public.messages_set_seller_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  listing_seller text;
begin
  select l.seller_email into listing_seller
  from public.listings l
  where l.id = new.listing_id;

  if listing_seller is null then
    raise exception 'Listing % does not exist', new.listing_id
      using errcode = '23503';
  end if;

  new.seller_email := listing_seller;
  return new;
end;
$$;

revoke all on function public.messages_set_seller_email() from public, anon, authenticated;

drop trigger if exists messages_set_seller_email on public.messages;
create trigger messages_set_seller_email
  before insert on public.messages
  for each row execute function public.messages_set_seller_email();

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
alter table public.listings enable row level security;
alter table public.messages enable row level security;

-- Table privileges: read + insert only. No update/delete for public roles.
revoke all on public.listings from anon, authenticated;
revoke all on public.messages from anon, authenticated;
grant select, insert on public.listings to anon, authenticated;
grant insert on public.messages to anon, authenticated;

drop policy if exists "Listings are publicly readable" on public.listings;
create policy "Listings are publicly readable"
  on public.listings for select
  to anon, authenticated
  using (true);

drop policy if exists "Anyone can create a valid listing" on public.listings;
create policy "Anyone can create a valid listing"
  on public.listings for insert
  to anon, authenticated
  with check (created_at >= now() - interval '1 minute'
              and created_at <= now() + interval '1 minute');

drop policy if exists "Anyone can send a valid message" on public.messages;
create policy "Anyone can send a valid message"
  on public.messages for insert
  to anon, authenticated
  with check (created_at >= now() - interval '1 minute'
              and created_at <= now() + interval '1 minute');

-- Intentionally NO select policy on messages: buyer emails stay private.

-- -----------------------------------------------------------------------------
-- Storage: listing-images bucket
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'listing-images',
  'listing-images',
  true,
  4194304, -- 4 MB, stays under Vercel's 4.5 MB request body limit
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Public bucket: objects are served from the public URL without a policy.
-- This policy additionally allows listing/reading object metadata via the API.
drop policy if exists "Listing images are publicly readable" on storage.objects;
create policy "Listing images are publicly readable"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'listing-images');

-- Intentionally NO insert/update/delete policies for anon/authenticated on
-- storage.objects: only the server (service role) uploads, after validation.

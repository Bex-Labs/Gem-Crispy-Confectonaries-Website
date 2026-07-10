-- ============================================================
-- 0001_create_enquiries_table.sql
-- Stores contact form + product enquiry submissions from the
-- GEM Crispy Confectonaries public website.
-- ============================================================

create extension if not exists "pgcrypto";

create table if not exists public.enquiries (
  id             uuid primary key default gen_random_uuid(),
  type           text not null default 'contact' check (type in ('contact', 'product_enquiry')),
  name           text not null,
  email          text not null,
  phone          text,
  subject        text,
  message        text not null,
  product_name   text,
  status         text not null default 'new' check (status in ('new', 'contacted', 'closed')),
  created_at     timestamptz not null default now()
);

comment on table public.enquiries is 'Contact form and product enquiry submissions from the public GEM website.';
comment on column public.enquiries.type is 'contact = general contact form, product_enquiry = "Enquire Now" from the Products page';
comment on column public.enquiries.status is 'Lead triage status: new -> contacted -> closed';

-- Helpful index for the (future) admin lead-management view
create index if not exists enquiries_created_at_idx on public.enquiries (created_at desc);
create index if not exists enquiries_status_idx on public.enquiries (status);

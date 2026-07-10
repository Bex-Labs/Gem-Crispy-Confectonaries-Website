-- ============================================================
-- 0003_create_newsletter_subscribers_table.sql
-- Stores newsletter sign-ups from the "Subscribe" forms across
-- the Home, About, and Products pages.
-- ============================================================

create table if not exists public.newsletter_subscribers (
  id              uuid primary key default gen_random_uuid(),
  email           text not null unique,
  status          text not null default 'active' check (status in ('active', 'unsubscribed')),
  brevo_synced_at timestamptz,
  subscribed_at   timestamptz not null default now()
);

comment on table public.newsletter_subscribers is 'Newsletter subscribers captured from the public GEM website, mirrored into Brevo.';
comment on column public.newsletter_subscribers.brevo_synced_at is 'Set by the subscribe-newsletter Edge Function once the contact is successfully pushed to Brevo.';

create index if not exists newsletter_subscribers_status_idx on public.newsletter_subscribers (status);

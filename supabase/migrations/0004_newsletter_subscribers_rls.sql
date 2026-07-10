-- ============================================================
-- 0004_newsletter_subscribers_rls.sql
-- Public visitors may INSERT (subscribe) but may never read,
-- update, or delete subscriber records directly.
-- ============================================================

alter table public.newsletter_subscribers enable row level security;

create policy "Public can insert newsletter subscribers"
  on public.newsletter_subscribers
  for insert
  to anon, authenticated
  with check (true);

-- No select/update/delete policies for anon/authenticated -> denied by default.
-- The subscribe-newsletter Edge Function uses the service role key to
-- upsert (so re-subscribing an existing email doesn't error) and to
-- record brevo_synced_at after a successful Brevo API call.

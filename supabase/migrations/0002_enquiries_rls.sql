-- ============================================================
-- 0002_enquiries_rls.sql
-- Public visitors may INSERT (submit a form) but may never
-- read, update, or delete enquiries. Only the service role
-- (used by the submit-enquiry Edge Function, and the Supabase
-- dashboard) can read/manage leads.
-- ============================================================

alter table public.enquiries enable row level security;

-- Anyone (anon or authenticated) may submit an enquiry.
create policy "Public can insert enquiries"
  on public.enquiries
  for insert
  to anon, authenticated
  with check (true);

-- No select/update/delete policies are defined for anon/authenticated,
-- so those actions are denied by default under RLS.
-- The service role key (used server-side only, e.g. in Edge Functions
-- or the Supabase Table Editor) bypasses RLS entirely.

# GEM Crispy Confectonaries — Website

A static, multi-page marketing website for **GEM Crispy Confectonaries** (legal entity: Gemcrispy Foods and Beverages Limited), built from the approved Stitch UI concepts and the GCW Jira backlog.

Vanilla HTML/CSS/JS, no build step. Backend (contact + newsletter forms) runs on Supabase, with **Brevo** handling both transactional notification emails and the newsletter subscriber list.

---

## 1. Folder structure

```
├── index.html              Home
├── about.html               About Us
├── products.html             Products
├── contact.html               Contact
├── css/
│   └── styles.css             Design system + all page styles
├── js/
│   ├── config.js               ← put your Supabase URL/anon key here
│   ├── main.js                  Nav toggle, active link, footer year
│   ├── enquiry-form.js            Contact + product enquiry form logic
│   └── newsletter.js               Newsletter signup logic
├── assets/
│   ├── logo/                       Logo + favicons (extracted from LOGO.pdf)
│   └── products/                     8 product photos (compressed, renamed)
├── supabase/
│   ├── config.toml                    Supabase CLI project config
│   ├── migrations/                     4 SQL migrations (tables + RLS)
│   └── functions/
│       ├── submit-enquiry/               Edge Function — Brevo email notifications
│       └── subscribe-newsletter/           Edge Function — Brevo sync
├── .env.example                              Reference list of required secrets
└── README.md                                  This file
```

---

## 2. Important — read before launch

**The product catalog was built from your real product photography, not the Stitch mockup's stock images.** The Stitch mockups displayed placeholder products (a Chin Chin bag, spiced peanuts, a gift box) that came from generic stock photography baked into the design tool — they aren't real GEM products. Your actual uploaded photos show **Plantain Chips** (snack pack + family jar) and **Kuli Kuli**, so that's what's live on the Products page. If you have real packaging shots for other flavors (Chin Chin, spiced peanuts, seasonal boxes, etc.), send them over and I'll add them as real product cards.

**No prices are shown anywhere.** Per your Jira stories (GCW-10), ordering is enquiry-based, not checkout-based — every "Enquire Now" button routes to the Contact form with the product pre-filled. If you'd rather show indicative pricing, let me know and I'll add a `price` field to the product cards.

**Testimonials on the Home page are placeholders** (clearly marked with an HTML comment in `index.html`). Swap in real customer names and quotes before launch — using fabricated reviews on a live site isn't something you want to ship long-term.

**The map pin on the Contact page** is centered on central Kaduna as an approximation. Open `contact.html`, find the `<script>` block near the bottom, and update the `[10.5222, 7.4383]` coordinates to the exact office location (search the address on Google Maps, right-click the pin, and copy the lat/lng).

---

## 3. Frontend setup

1. Open `js/config.js` and replace the placeholders with your real Supabase project values (Supabase Dashboard → **Project Settings → API**):
   ```js
   window.GEM_CONFIG = {
     SUPABASE_URL: "https://xxxxxxxx.supabase.co",
     SUPABASE_ANON_KEY: "eyJhbGciOi...",
   };
   ```
2. That's it — no build step. Open `index.html` directly in a browser to preview, or deploy as-is (see §6).

---

## 4. Supabase backend setup

### 4.1 Create the tables

Install the Supabase CLI if you haven't already, then from the project root:

```bash
supabase login
supabase link --project-ref YOUR-PROJECT-REF
supabase db push
```

This runs all 4 migrations in `supabase/migrations/`:

| Migration | Purpose |
|---|---|
| `0001_create_enquiries_table.sql` | Creates `public.enquiries` (contact + product enquiries) |
| `0002_enquiries_rls.sql` | RLS: public can INSERT only, never read |
| `0003_create_newsletter_subscribers_table.sql` | Creates `public.newsletter_subscribers` |
| `0004_newsletter_subscribers_rls.sql` | RLS: public can INSERT only, never read |

Alternatively, paste each file's contents into the Supabase Dashboard → **SQL Editor** and run them in order (0001 → 0004).

### 4.2 Set Edge Function secrets

```bash
supabase secrets set BREVO_API_KEY=xkeysib-xxxxxxxxxxxx
supabase secrets set NOTIFY_FROM_EMAIL=notifications@gemcrispy.com
supabase secrets set NOTIFY_FROM_NAME="GEM Website"
supabase secrets set NOTIFY_TO_EMAIL=hello@gemcrispy.com
supabase secrets set BREVO_LIST_ID=1
```

Notes:
- **Brevo is used for both functions** — `submit-enquiry` sends transactional notification emails via Brevo's Transactional Email API, and `subscribe-newsletter` adds contacts to a Brevo list. Same `BREVO_API_KEY` for both.
- `NOTIFY_FROM_EMAIL`'s domain must be a verified sending domain in your Brevo account, or notification emails will fail to send (the lead is still saved in Supabase either way — email is best-effort).
- `BREVO_LIST_ID` is the numeric ID of the list you want new newsletter subscribers added to (Brevo Dashboard → Contacts → Lists → click the list → the ID is in the URL).
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` do **not** need to be set manually — the Edge Runtime injects them automatically.

### 4.3 Deploy the Edge Functions

```bash
supabase functions deploy submit-enquiry
supabase functions deploy subscribe-newsletter
```

Both functions have `verify_jwt = false` (see `supabase/config.toml`) since the public site calls them with the anon key, not a logged-in user's JWT.

### 4.4 Verify

- Submit the Contact form on `contact.html` → check **Table Editor → enquiries** for the new row, and check the `NOTIFY_TO_EMAIL` inbox for the notification.
- Submit a newsletter signup → check **Table Editor → newsletter_subscribers**, and check your Brevo list for the new contact.
- If something doesn't arrive, check **Edge Functions → Logs** in the Supabase Dashboard for the specific error.

---

## 5. Viewing leads

There's no admin dashboard in this build (not in the current Jira scope). For now, view and triage enquiries directly in **Supabase → Table Editor → enquiries**, using the `status` column (`new` / `contacted` / `closed`) to track follow-up. If you want a simple lead-management screen later, the same `/bex-access.html` + TOTP pattern from DistroIQ's Bex Admin can be adapted here.

---

## 6. Deployment (Vercel)

This is a static site — any static host works, but to match your existing setup:

```bash
npm i -g vercel
vercel
```

Or connect the GitHub repo to Vercel and deploy on push. No build command or environment variables are needed on Vercel itself — `js/config.js` already holds the Supabase credentials, and Vercel just serves the static files.

---

## 7. Jira story coverage (GCW-1 → GCW-17)

| Story | Where it's addressed |
|---|---|
| GCW-1 Clear navigation | Sticky header nav on every page, active-state underline, mobile hamburger menu |
| GCW-2 Homepage intro | Hero section, `index.html` |
| GCW-3 Highlight product | Featured Snacks grid, `index.html` |
| GCW-4 Reasons to trust | "Our Mission & Vision" + quality feature list, `about.html` |
| GCW-5 Company background | Heritage intro section, `about.html` |
| GCW-6 Mission & vision | Dedicated section, `about.html` |
| GCW-7 Product quality process | "How we keep every batch consistent" section, `about.html` |
| GCW-8 View products | Full product grid with filters, `products.html` |
| GCW-9 Product details | Each product card has name, size, and description |
| GCW-10 Order enquiry | "Enquire Now" on every product card → pre-filled Contact form |
| GCW-11 Contact details | Phone, email, address block, `contact.html` |
| GCW-12 Contact form | Full validated form, `contact.html`, wired to Supabase + Brevo |
| GCW-13 Location | Address block + Leaflet map, `contact.html` |
| GCW-14 Mobile responsive | Fluid grid + mobile nav across all breakpoints |
| GCW-15 Footer info | Consistent footer with nav, contact, and socials on every page |
| GCW-16 SEO titles/descriptions | Unique `<title>` + meta description per page |
| GCW-17 Fast, easy to use | No frameworks, compressed images (~230KB avg, down from ~1.7MB), lazy-loaded below-the-fold images |
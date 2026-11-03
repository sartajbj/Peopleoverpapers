# People Over Papers Map

Website: **https://peopleoverpapersmap.com/**  
Contact: **peopleoverpapersmap@gmail.com**

A mobile-first U.S. community information map with moderated report submissions, approximate map locations, public report delay and curated support resources.

## Features
- Leaflet map with U.S. report markers, category filters, place search and mobile layout.
- Report submission form with category, city/state, a map-selected approximate area, date, optional time and non-identifying description.
- Cloudflare Pages Functions API backed by D1.
- Submissions remain private and pending until a moderator approves them.
- Public reports are delayed at least 24 hours and coordinates are rounded to one decimal degree (roughly 10–11 km).
- No names, faces, phone numbers, email addresses, street addresses, license plates or other identifying details are allowed. Photo uploads are not enabled; do not submit identifying images.
- Private moderation screen at `/admin/`, protected by a secret token.
- Legal resources, Privacy, Terms, sitemap, robots.txt and security headers.

This map is **not** a live incident tracker, emergency alert system or a tool for identifying, following, targeting or confronting individuals. Reports may be inaccurate or outdated. Never approach anyone to verify a report.

## Cloudflare Pages deployment

### 1. Connect GitHub
1. Cloudflare Dashboard → **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**.
2. Select `sartajbj/Peopleoverpapers`, production branch `main`.
3. Build command: leave blank.
4. Build output directory: `.` (repository root).
5. Deploy.

### 2. Create the D1 database
1. Cloudflare Dashboard → **Storage & databases** → **D1 SQL Database** → **Create**.
2. Name it `peopleoverpapers-reports`.
3. Open the database → **Console**.
4. Run `migrations/0001_init.sql` first, then run `migrations/0002_add_observed_time.sql` in the same D1 database.

### 3. Bind D1 to Pages
1. Open Workers & Pages → your Pages project → **Settings** → **Functions**.
2. Under **D1 database bindings**, add a binding:
   - Variable name: `DB`
   - D1 database: `peopleoverpapers-reports`
3. Save and redeploy the latest deployment so Functions receive the binding.

### 4. Set the moderation secret
1. In the same Pages project, open **Settings** → **Variables and Secrets**.
2. Add a secret named `MODERATION_TOKEN`.
3. Use a long, random secret (at least 32 random characters); do not put it in GitHub, README, or browser code.
4. Save and redeploy.

### 5. Add submission abuse protection
Create a Cloudflare rate-limiting rule for `POST /api/reports` (for example, a low per-IP request threshold over 10 minutes) and monitor it after launch. Keep the moderation token private and rotate it if exposed.

### 6. Connect the custom domain
Open Pages → **Custom domains** → **Set up a custom domain** → add `peopleoverpapersmap.com`, then follow the DNS instructions Cloudflare displays. Confirm HTTPS.

### 7. First-run verification
- Open the homepage and confirm the map tiles load.
- Submit one harmless test report using a broad city-area location and non-identifying text.
- Open `/admin/`, enter the moderation token and approve the test report.
- Confirm it is not public immediately; public API only releases approved records after the 24-hour delay.
- Delete the test record from D1 after verification.
- Test filters, map search, mobile form, Privacy, Terms and resources pages.

## API
- `GET /api/reports`: returns approved reports after the 24-hour delay.
- `POST /api/reports`: accepts a submission into pending moderation.
- `GET /api/admin/reports`: lists pending submissions; requires `Authorization: Bearer <MODERATION_TOKEN>`.
- `PATCH /api/admin/reports`: approve or reject a pending report; requires the same secret.

## SEO
- Canonical homepage: https://peopleoverpapersmap.com/
- Sitemap: https://peopleoverpapersmap.com/sitemap.xml
- Robots: https://peopleoverpapersmap.com/robots.txt
- Submit the sitemap in Google Search Console after the domain is live and verified.
- Ranking is not guaranteed; prioritize useful original content, technical quality and visitor safety.

## Contact
For corrections, privacy questions or feedback: **peopleoverpapersmap@gmail.com**.

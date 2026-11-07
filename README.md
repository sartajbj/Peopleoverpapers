# People Over Papers Map

Website: **https://www.peopleoverpapersmap.com/**  
Contact: **peopleoverpapersmap@gmail.com**

A mobile-first U.S. community information map with moderated report submissions, approximate map locations, public report delay and curated support resources.

## Features
- Leaflet map with U.S. report markers, category filters, place search and mobile layout.
- Report submission form with category, city/state, a map-selected approximate area, date, optional time and non-identifying description.
- Cloudflare Pages Functions API backed by D1.
- Submissions remain private and pending until a moderator approves them.
- Public reports are delayed at least 24 hours and coordinates are rounded to one decimal degree (roughly 10–11 km).
- Optional single photo upload: JPG, PNG or WebP is resized and re-encoded in the browser as WebP (target 50 KB; hard maximum 100 KB), which removes embedded EXIF metadata. The image is stored as a BLOB in D1 and remains private while pending moderation.
- Only non-identifying public resource notices, legal-help flyers and community information signs are allowed; never upload people, vehicles, enforcement scenes, faces, plates, private documents or addresses. Rejected photos are deleted from D1. Approved photos are served only after the same 24-hour public delay as their report.
- Photo upload uses the existing D1 database; no R2 bucket or R2 binding is required. D1 storage and request quotas still apply, so monitor usage and keep uploads optional.
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
4. Run `migrations/0001_init.sql` first, then run `migrations/0002_add_observed_time.sql`, `migrations/0003_add_report_photos.sql` (legacy column; retained for compatibility) and `migrations/0004_d1_report_photos.sql` in the same D1 database.

### 3. Bind D1 to Pages
1. Open Workers & Pages → your Pages project → **Settings** → **Functions**.
2. Under **D1 database bindings**, add a binding:
   - Variable name: `DB`
   - D1 database: `peopleoverpapers-reports`
3. Save and redeploy the latest deployment so Functions receive the binding.

### 4. Photo storage
Photo images are stored in the D1 `report_photos` table. No R2 bucket or `REPORT_PHOTOS` binding is needed.

### 5. Set the moderation secret
1. In the same Pages project, open **Settings** → **Variables and Secrets**.
2. Add a secret named `MODERATION_TOKEN`.
3. Use a long, random secret (at least 32 random characters); do not put it in GitHub, README, or browser code.
4. Save and redeploy.

### 6. Add submission abuse protection
Create a Cloudflare rate-limiting rule for `POST /api/reports` (for example, a low per-IP request threshold over 10 minutes) and monitor it after launch. Keep the moderation token private and rotate it if exposed.

### 7. Connect the custom domain
Open Pages → **Custom domains** → **Set up a custom domain** → add `peopleoverpapersmap.com`, then follow the DNS instructions Cloudflare displays. Confirm HTTPS.

### 8. First-run verification
- Open the homepage and confirm the map tiles load.
- Submit one harmless test report using a broad city-area location and non-identifying text.
- Open `/admin/`, enter the moderation token and approve the test report.
- Confirm it is not public immediately; public API only releases approved records after the 24-hour delay.
- Delete the test record from D1 after verification.
- Test filters, map search, mobile form, Privacy, Terms and resources pages.
- Test an optional WebP photo submission, inspect it in `/admin/`, reject one test photo and verify its row is removed; approve a separate harmless resource image and confirm it is not public until after the 24-hour delay. Test a submission without a photo too.

## API
- `GET /api/reports`: returns approved reports after the 24-hour delay.
- `POST /api/reports`: accepts a submission into pending moderation.
- `GET /api/admin/reports`: lists pending submissions; requires `Authorization: Bearer <MODERATION_TOKEN>`.
- `PATCH /api/admin/reports`: approve or reject a pending report; rejecting also deletes its photo; requires the same secret.
- `GET /api/admin/report-photo/:id`: serves a pending photo to an authenticated moderator.
- `GET /api/report-photo/:id`: serves an approved photo only after the 24-hour delay.



## Contact
For corrections, privacy questions or feedback: **peopleoverpapersmap@gmail.com**.

# People Over Papers

Mobile-first community information website inspired by the broad interaction patterns in the reference screenshots, with original branding, layout and copy.

## Current implementation
- Responsive homepage, navigation, resources, FAQ, rights information and family preparedness guide.
- Leaflet map with OpenStreetMap tiles, category filters and location search.
- No invented/sample reports. The map displays only records returned by the public API.
- Report form submits records as **pending**; pending submissions are never returned by the public map endpoint.
- Cloudflare Pages Functions API and D1 migration.
- Starter privacy and terms pages that require operator/legal review.

## Deploy to Cloudflare Pages
1. Connect this GitHub repository to Cloudflare Pages. Use the repository root as the build output directory; no build command is needed for this static version.
2. Create a D1 database named `people-over-papers`.
3. Update `wrangler.toml` with the actual D1 database ID and keep the `DB` binding name unchanged.
4. Apply the schema: `npx wrangler d1 migrations apply people-over-papers --remote`.
5. In Cloudflare Pages project settings, add the D1 binding named `DB` and select the database.
6. Redeploy. Test `GET /api/reports` (should return an empty list initially) and submit a test report (should return HTTP 201 with status pending).
7. Do not publish reports until a secure, authenticated moderation workflow is implemented and tested. The current starter API intentionally has no public approval endpoint.

## Important before real launch
- Implement authenticated moderator access, review/audit history, report correction/deletion, abuse throttling, spam protection and an operational contact process.
- Decide and document retention, backups, incident response and privacy request procedures.
- Have privacy, terms, community safety and legal-resource content reviewed by qualified people.
- Publish a verified, monitored contact email and a process for privacy, correction and deletion requests. No contact address has been confirmed in this repository.
- Consider an approved resource directory with verified organizations, last-checked dates and clear service-area information.
- The initial form deliberately accepts text and approximate location only; it does not upload images/video or expose contributor identities.
- This project is not an emergency service or a substitute for legal advice.

## Map data and third-party services
Leaflet and OpenStreetMap tiles are loaded from public CDNs/services. Location search uses the public Nominatim service only after a visitor submits a search. Review provider usage policies, attribution and privacy implications before scaling traffic.

## Local preview
Serve the repository root with a local static server. Pages Functions and D1 require the Cloudflare Pages/Wrangler development environment to test the API end-to-end.


## Secure moderation (Cloudflare Access)
A moderator queue is included at `/admin.html`. It is not safe to expose until Cloudflare Access is configured:
1. In Cloudflare Zero Trust, create an Access self-hosted application protecting both `peopleoverpapersmap.com/admin.html` and `peopleoverpapersmap.com/api/admin/*` (include the www hostname if it serves the site).
2. Create an allow policy for the specific moderator email addresses only. Do not use an Everyone/Any-email policy.
3. Set Pages Functions environment variables (Production and Preview separately): `ACCESS_TEAM_DOMAIN` = your Cloudflare Access team issuer, e.g. `https://YOUR-TEAM.cloudflareaccess.com`; `ACCESS_AUD` = the application AUD tag shown in the Access application.
4. Apply the new migration: `npx wrangler d1 migrations apply people-over-papers --remote`.
5. Test access with an allowed moderator and a signed-out/unauthorized browser. The API independently validates the Cloudflare Access JWT; hiding the page alone is not security.
6. Review and test the audit log table. Each approve/reject action records moderator email and timestamp. The moderator can edit the public location label and description before approving, so identifying details can be redacted before publication.

The reporting form includes a basic honeypot, server-side validation and approximate coordinates. This is not a complete anti-abuse system. Before accepting public submissions, configure Cloudflare rate limiting/WAF rules for `POST /api/reports`, monitor abuse, and consider Turnstile with server-side token validation. Do not claim the honeypot prevents spam.

## Go-live blockers
The repository changes do not create or configure your Cloudflare account, D1 database, Access policy, domain DNS, or production deployment. Those account-side steps and real-device/browser tests must be completed before the site can be called live or production-ready. Verify the contact email before launch.


## Curated public resources
`resources.html` links to the U.S. Department of Justice EOIR legal representation and accreditation pages, the National Immigration Legal Services Directory, and ILRC know-your-rights/family-preparedness materials. These are external sources, not endorsements; visitors are told to verify current provider availability and credentials.

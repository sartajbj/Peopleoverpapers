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
- Verify the contact email and publish a real, monitored support channel.
- Consider an approved resource directory with verified organizations, last-checked dates and clear service-area information.
- The initial form deliberately accepts text and approximate location only; it does not upload images/video or expose contributor identities.
- This project is not an emergency service or a substitute for legal advice.

## Map data and third-party services
Leaflet and OpenStreetMap tiles are loaded from public CDNs/services. Location search uses the public Nominatim service only after a visitor submits a search. Review provider usage policies, attribution and privacy implications before scaling traffic.

## Local preview
Serve the repository root with a local static server. Pages Functions and D1 require the Cloudflare Pages/Wrangler development environment to test the API end-to-end.

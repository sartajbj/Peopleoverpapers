# People Over Papers Map Guide

Independent, mobile-first informational guide for people searching for the People Over Papers community map. This website is **not** the official People Over Papers project, ICEOUT, Pueblo Project, or an affiliate. It does not collect sightings, mirror live reports, issue alerts, or provide legal advice.

## Current implementation
- Homepage clearly identifies the site as an independent guide.
- Direct link to the community project's map at https://iceout.org/en/ and its public link page.
- Original explanatory content about reading crowdsourced reports cautiously and protecting privacy.
- Curated legal-help directory linking to the US Department of Justice, DOJ accreditation roster, National Immigration Legal Services Directory and ILRC.
- Mobile-first layout, accessible navigation, semantic headings, metadata, canonical URLs, Open Graph metadata, FAQ and WebSite JSON-LD, sitemap, robots rules and security headers.
- No duplicate map, sighting submission form, public report API, or moderator dashboard. This avoids confusion with the original community service.

## Deploy to Cloudflare Pages
1. Connect this GitHub repository to Cloudflare Pages.
2. Set production branch to `main`.
3. Leave build command blank and set build output directory to `/` (repository root).
4. Add custom domain `peopleoverpapersmap.com` and follow Cloudflare DNS instructions.
5. Deploy and test homepage, /resources.html, /privacy.html, /terms.html, mobile navigation and every external destination.
6. Confirm HTTPS and canonical redirects. Choose one canonical host (apex or www) and redirect the other.

This is a static guide and does not need D1, Pages Functions, a report database, or Wrangler configuration.

## SEO and search visibility
- Homepage title, description and H1 include the searched phrase while the visible disclaimer prevents affiliation confusion.
- Canonical, Open Graph, FAQPage and WebSite structured data, internal links, sitemap and robots.txt are included.
- Verify the domain in Google Search Console, submit `https://peopleoverpapersmap.com/sitemap.xml`, inspect the canonical homepage and request indexing once.
- No one can guarantee a #1 Google position. Rankings depend on competition, site trust, links, content quality, user satisfaction, crawl/indexing and time. Avoid copied content, fake reviews, paid link schemes and misleading claims.

## Before launch
- Confirm the domain is controlled by the site operator.
- Publish a monitored contact address and a correction/privacy request process.
- Have privacy and terms reviewed for the actual hosting, analytics and contact tools.
- Test on real iOS/Android devices and major browsers.
- Re-check external project links and legal directories periodically. Update the visible editorial review date only after a real review.

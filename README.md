# People Over Papers Map Guide

Independent, mobile-first informational guide for people searching for the People Over Papers community map. This website is **not** the external project, ICEOUT, Pueblo Project, or an affiliate. It does not collect sightings, mirror live reports, issue alerts, or provide legal advice.

## Current implementation
- Homepage clearly identifies the site as an independent guide.
- Homepage guide, practical explanations, privacy guidance and curated legal-help resources.
- Original explanatory content about reading crowdsourced reports cautiously and protecting privacy.
- Curated legal-help directory linking to the US Department of Justice, DOJ accreditation roster, National Immigration Legal Services Directory and ILRC.
- Mobile-first layout, accessible navigation, semantic headings, metadata, canonical URLs, Open Graph metadata, FAQ and WebSite JSON-LD, sitemap, robots rules and security headers.
- No duplicate map, sighting submission form, public report API, or moderator dashboard. This avoids confusion with the original community service.

## Deploy to Cloudflare Pages
1. In Cloudflare, open **Workers & Pages → Create application → Pages → Connect to Git**.
2. Authorize GitHub if prompted and select `sartajbj/Peopleoverpapers`.
3. Set production branch to `main`.
4. This is plain static HTML: leave the build command blank; set the build output directory to `.` (the repository root). Keep the root directory as `/` or default.
5. Deploy. Cloudflare should provide a `*.pages.dev` preview URL.
6. In the Pages project, open **Custom domains → Set up a custom domain**, add `peopleoverpapersmap.com`, and follow Cloudflare's DNS instructions. Add `www.peopleoverpapersmap.com` too only if you want it to redirect to the chosen canonical host.
7. Test homepage, /resources.html, /privacy.html, /terms.html, mobile navigation and external destinations. Confirm HTTPS and canonical redirects.

This is a static guide and does not need D1, Pages Functions, a report database, or Wrangler configuration. Git integration automatically deploys new commits pushed to the connected production branch.

## SEO and search visibility
- Homepage title, description and H1 include the searched phrase while the visible disclaimer prevents affiliation confusion.
- Canonical, Open Graph, FAQPage and WebSite structured data, internal links, sitemap and robots.txt are included.
- Verify the domain in Google Search Console, submit `https://peopleoverpapersmap.com/sitemap.xml`, inspect the canonical homepage and request indexing once.
- No one can guarantee a #1 Google position. Rankings depend on competition, site trust, links, content quality, user satisfaction, crawl/indexing and time. Avoid copied content, fake reviews, paid link schemes and misleading claims.

## Before launch
- Confirm the domain is controlled by the site operator.
- Publish a monitored contact address and a process for handling privacy questions and correction requests.
- Have privacy and terms reviewed for the actual hosting, analytics and contact tools.
- Test on real iOS/Android devices and major browsers.
- Re-check external project links and legal directories periodically. Update the visible editorial review date only after a real review.

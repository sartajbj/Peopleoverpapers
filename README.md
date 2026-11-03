# People Over Papers Map

Website: **https://peopleoverpapersmap.com/**  
Contact: **peopleoverpapersmap@gmail.com**

A mobile-first information website with a homepage, practical map-reading guidance, community privacy information and a directory of immigration legal-help resources.

## Website features
- Responsive homepage focused on People Over Papers map and community information.
- Practical guidance for understanding crowdsourced reports and protecting privacy.
- Curated legal-help directory with government and nonprofit resources.
- Mobile navigation, semantic HTML, page metadata, canonical URLs, Open Graph metadata and FAQ/WebSite structured data.
- Sitemap, robots.txt and security headers.
- Static HTML/CSS/JavaScript. No database, report submission API, user accounts or moderation dashboard.

## Cloudflare Pages deployment
1. Open Cloudflare Dashboard → **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**.
2. Connect GitHub and select `sartajbj/Peopleoverpapers`.
3. Production branch: `main`.
4. Build command: leave blank.
5. Build output directory: `.` (repository root).
6. Deploy the project.
7. In the Pages project, open **Custom domains** → **Set up a custom domain** and add `peopleoverpapersmap.com`.
8. Follow the DNS instructions shown by Cloudflare. Enable HTTPS and test the homepage and all internal pages.

Cloudflare Pages automatically deploys future commits pushed to the connected `main` branch. This static website does not need D1, Pages Functions or Wrangler.

## SEO checklist
- Canonical homepage: https://peopleoverpapersmap.com/
- Sitemap: https://peopleoverpapersmap.com/sitemap.xml
- Robots: https://peopleoverpapersmap.com/robots.txt
- Submit the sitemap in Google Search Console after the custom domain is live and verified.
- Check canonical URLs, mobile rendering, internal navigation and page indexing after deployment.
- Search ranking is not guaranteed; focus on useful original content, technical quality and a good visitor experience.

## Contact
For website corrections, privacy questions or general feedback: [peopleoverpapersmap@gmail.com](mailto:peopleoverpapersmap@gmail.com).

## Before public launch
- Confirm the custom domain is connected to this Cloudflare Pages project.
- Test on real mobile devices and desktop browsers.
- Review the privacy notice against the actual hosting and any analytics/advertising services enabled.
- Keep the contact inbox monitored.
- Review resource links periodically and update editorial review dates only after a real review.

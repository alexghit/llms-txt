# llms-txt

Paste a website URL → the site is crawled, page titles and meta descriptions are read, and you get a ready-to-download `llms.txt` draft.

Live at **llms.hey5.studio**. Design language matches the other hey5.studio tools.

## Stack

- **Cloudflare Worker** (`worker.js`) — crawls the target site (no CORS limits), fetches pages in parallel, builds the `llms.txt`, and serves the frontend.
- **Static frontend** (`index.html`, `style.css`, `script.js`, `favicon.svg`) — vanilla, no build step.

## Deploy

```bash
npm install
npx wrangler login
npx wrangler deploy
```

Publishes the Worker + static files together. To attach `llms.hey5.studio`, add a custom domain under the Worker's Settings → Domains & Routes in the Cloudflare dashboard.

## Local dev

```bash
npm run dev
```

## Files (all in repo root)

| File | Purpose |
|------|---------|
| `worker.js` | Crawler + API (`POST /api/generate`) + serves static files |
| `index.html` · `style.css` · `script.js` | Frontend |
| `favicon.svg` | Icon (white slash on black) |
| `preview.html` | Standalone single-file preview (mock data, no server needed) |
| `wrangler.toml` | Worker + assets config |
| `.assetsignore` | Keeps non-web files from being served publicly |

## Notes

- Crawls up to 40 same-origin pages linked from the homepage, 8 at a time.
- Skips login / signup / search / api / admin / cart / account routes and asset files.
- **Rate limited** to 5 generations per minute per IP (Cloudflare's native rate-limit binding — free, no database). Protects the crawl endpoint from abuse. Adjust `limit`/`period` in `wrangler.toml`.
- Output is a **draft** — review descriptions before publishing at `yoursite.com/llms.txt`.
- Heavily JS-rendered sites may expose fewer links in raw HTML, so fewer pages are found.

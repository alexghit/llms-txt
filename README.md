# llms.txt Generator

Enter a website URL, get a ready-to-download `llms.txt` draft. A Cloudflare Worker crawls the site's homepage, follows same-origin links, and pulls each page's title and meta description into a clean markdown index.

Live at [llms.hey5.studio](https://llms.hey5.studio).

## Features

- Type anywhere on the page to start — the URL field focuses automatically
- Crawls up to 40 same-origin pages linked from the homepage, 8 at a time
- Skips login / signup / search / api / admin / cart / account routes and asset files, so the output is content pages only
- Copy to clipboard or download the `llms.txt` file directly
- Output is a **draft** — descriptions come straight from each page's meta tags, meant to be reviewed before publishing at `yoursite.com/llms.txt`
- Rate limited to 5 generations per minute per IP to keep the crawl endpoint from being abused

### Shortcuts

| Key | Action |
|---|---|
| `Enter` | Generate |
| `Esc` | Clear |
| Click `LLMS.TXT` | Clear |

## How it's built

Vanilla HTML/CSS/JS, no framework or build step. The Worker serves the whole app from a single inlined page and handles the crawl itself — there's no static-assets directory.

```
worker.js       the whole app — crawler, API, and frontend inlined
wrangler.toml   Worker and rate-limit config
package.json    pins Wrangler 4 for local dev
```

Any path other than `/api/generate` serves the app, so a wrong URL lands on the tool rather than a 404.

## Notes

Heavily JS-rendered sites expose fewer links in raw HTML, so fewer pages may be found — the crawler reads the HTML the server returns, not the rendered DOM.

## Credits

Made with ♥ by Alex Ghit — <alex@hey5.studio>

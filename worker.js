// llms.txt generator — self-contained Cloudflare Worker.
// Frontend is inlined below; no static-assets directory needed.

const PAGE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>llms.txt · generator</title>
  <meta name="description" content="Draft an llms.txt file for any website." />
  <link rel="icon" href="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHJ4PSIxNCIgZmlsbD0iIzAwMDAwMCIvPgogIDxwYXRoIGQ9Ik0zOSAxNiBMMjUgNDgiIHN0cm9rZT0iI2ZmZmZmZiIgc3Ryb2tlLXdpZHRoPSI2IiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KPC9zdmc+Cg==" type="image/svg+xml" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet" />
  <style>
:root {
  --bg: #060606;
  --surface: #141416;
  --surface-2: #1c1c1f;
  --line: #242427;
  --text: #e8e8ea;
  --muted: #6a6a70;
  --faint: #3f3f45;
  --ghost: #202024;
  --radius: 12px;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  background: var(--bg);
  color: var(--text);
  font-family: "Geist Mono", ui-monospace, monospace;
  font-size: 15px;
  line-height: 1.5;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  -webkit-font-smoothing: antialiased;
}

/* Topbar */
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.75rem clamp(1.5rem, 4vw, 3rem);
}
.wordmark, .label-r {
  font-size: 0.78rem;
  letter-spacing: 0.22em;
  color: var(--muted);
  text-decoration: none;
}
.wordmark:hover { color: var(--text); }

/* Stage */
.stage {
  flex: 1;
  width: 100%;
  max-width: 620px;
  margin: 0 auto;
  padding: 2rem clamp(1.5rem, 4vw, 3rem);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.display {
  font-family: "Instrument Serif", Georgia, serif;
  font-weight: 400;
  font-style: italic;
  font-size: clamp(3.5rem, 11vw, 6rem);
  line-height: 1;
  color: var(--ghost);
  letter-spacing: -0.01em;
  margin-bottom: 3.5rem;
  user-select: none;
  transition: color 0.3s;
}
.display.on { color: var(--faint); }
.display em { font-style: italic; }

/* Field */
.field {
  width: 100%;
  max-width: 420px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-bottom: 1px solid var(--line);
  padding: 0.75rem 0.25rem;
  transition: border-color 0.2s;
}
.field:focus-within { border-color: var(--muted); }
.prefix { color: var(--faint); font-size: 1rem; }
#url {
  flex: 1;
  background: transparent;
  border: 0;
  outline: 0;
  color: var(--text);
  font-family: inherit;
  font-size: 1.15rem;
  letter-spacing: 0.02em;
}
#url::placeholder { color: var(--faint); }

/* Buttons */
.btn-row {
  display: flex;
  gap: 0.6rem;
  justify-content: center;
  margin-top: 2rem;
}
.btn {
  background: var(--surface-2);
  border: 0;
  border-radius: 999px;
  color: var(--text);
  font-family: inherit;
  font-size: 0.85rem;
  letter-spacing: 0.02em;
  padding: 0.7rem 1.6rem;
  cursor: pointer;
  transition: background 0.15s, transform 0.05s;
}
.btn:hover { background: #26262a; }
.btn:active { transform: scale(0.98); }
.btn:disabled { opacity: 0.4; cursor: default; }
.btn-primary { background: #e8e8ea; color: #060606; }
.btn-primary:hover { background: #fff; }

.status {
  min-height: 1.4rem;
  margin-top: 1.5rem;
  font-size: 0.78rem;
  letter-spacing: 0.04em;
  color: var(--muted);
}
.status.error { color: #d98a8a; }

/* Result */
.result {
  width: 100%;
  margin-top: 2.5rem;
  animation: rise 0.35s ease;
}
@keyframes rise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }

.output-wrap {
  position: relative;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--surface);
  text-align: left;
  overflow: hidden;
}
.meta {
  display: block;
  padding: 0.85rem 1.1rem;
  font-size: 0.68rem;
  letter-spacing: 0.18em;
  color: var(--muted);
  border-bottom: 1px solid var(--line);
}
.output {
  font-family: inherit;
  font-size: 0.8rem;
  line-height: 1.65;
  color: var(--text);
  padding: 1.1rem;
  max-height: 46vh;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-word;
}

/* Hint */
.hint {
  margin-top: 2.5rem;
  font-size: 0.72rem;
  letter-spacing: 0.05em;
  color: var(--faint);
}
kbd {
  background: var(--surface-2);
  border: 1px solid var(--line);
  border-radius: 5px;
  padding: 0.15rem 0.45rem;
  font-family: inherit;
  font-size: 0.7rem;
  color: var(--muted);
}

/* Footer */
.foot {
  padding: 2rem clamp(1.5rem, 4vw, 3rem);
  text-align: center;
  font-size: 0.72rem;
  letter-spacing: 0.03em;
  color: var(--faint);
}
.foot a { color: var(--muted); text-decoration: underline; text-underline-offset: 2px; }
.foot a:hover { color: var(--text); }
.heart { color: #6a6a70; }

@media (max-width: 560px) {
  .topbar { padding: 1.25rem 1.25rem; }
  .wordmark, .label-r { font-size: 0.7rem; letter-spacing: 0.16em; }
  .stage { padding-top: 2.5rem; }
  .display { margin-bottom: 2.5rem; }
  .foot { font-size: 0.66rem; line-height: 1.9; }
}

@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; transition: none !important; }
}

</style>
</head>
<body>
  <header class="topbar">
    <a href="#" class="wordmark" id="wordmark" role="button">LLMS.TXT</a>
    <span class="label-r">FOR LLMS</span>
  </header>

  <main class="stage">
    <h1 class="display" id="display"><em>llms.txt</em></h1>

    <div class="field">
      <span class="prefix">↳</span>
      <input id="url" type="url" inputmode="url" autocomplete="off" spellcheck="false"
             placeholder="example.com" aria-label="Website URL" />
    </div>

    <div class="btn-row">
      <button class="btn" id="go">Generate</button>
    </div>

    <p class="status" id="status" role="status"></p>

    <section class="result" id="result" hidden>
      <div class="output-wrap">
        <span class="meta" id="resultMeta">LLMS.TXT</span>
        <pre id="output" class="output" tabindex="0"></pre>
      </div>
      <div class="btn-row">
        <button class="btn" id="copy">Copy</button>
        <button class="btn btn-primary" id="download">Download</button>
      </div>
    </section>

    <p class="hint">
      <kbd>Esc</kbd> clear
    </p>
  </main>

  <footer class="foot">
    Made with <span class="heart">♥</span> by Alex Ghit · <a href="mailto:alex@hey5.studio">alex@hey5.studio</a> · llms.txt generator · v1.0
  </footer>

  <script>
const $ = (id) => document.getElementById(id);
const urlInput = $("url");
const go = $("go");
const status = $("status");
const result = $("result");
const output = $("output");
const resultMeta = $("resultMeta");
const display = $("display");
let current = "";

function setStatus(msg, isError = false) {
  status.textContent = msg;
  status.classList.toggle("error", isError);
}

urlInput.addEventListener("input", () => {
  display.classList.toggle("on", urlInput.value.trim().length > 0);
});

async function generate() {
  const value = urlInput.value.trim();
  if (!value) { setStatus("Enter a website URL.", true); urlInput.focus(); return; }

  go.disabled = true;
  setStatus("Crawling site…");
  result.hidden = true;

  try {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: value }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Something went wrong.");

    current = data.llmstxt;
    output.textContent = current;
    resultMeta.textContent = \`LLMS.TXT · \${data.pages} PAGES\`;
    result.hidden = false;
    setStatus("Done. Review the descriptions before publishing.");
  } catch (e) {
    setStatus(e.message, true);
  } finally {
    go.disabled = false;
  }
}

$("copy").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(current);
    $("copy").textContent = "Copied";
    setTimeout(() => ($("copy").textContent = "Copy"), 1400);
  } catch { setStatus("Couldn't copy.", true); }
});

$("download").addEventListener("click", () => {
  const blob = new Blob([current], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "llms.txt";
  a.click();
  URL.revokeObjectURL(a.href);
});

function reset() {
  urlInput.value = "";
  result.hidden = true;
  current = "";
  setStatus("");
  display.classList.remove("on");
  urlInput.focus();
}

go.addEventListener("click", generate);
urlInput.addEventListener("keydown", (e) => { if (e.key === "Enter") generate(); });
$("wordmark").addEventListener("click", (e) => { e.preventDefault(); reset(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") reset(); });
urlInput.focus();

</script>
</body>
</html>
`;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/generate") {
      return handleGenerate(request, env);
    }

    // Serve the inlined single-page app for everything else.
    return new Response(PAGE, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  },
};

const MAX_PAGES = 40;
const FETCH_TIMEOUT = 8000;
const CONCURRENCY = 8; // pages fetched in parallel per batch

async function handleGenerate(request, env) {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
  if (request.method === "OPTIONS") return new Response(null, { headers: cors });
  if (request.method !== "POST")
    return json({ error: "POST only" }, 405, cors);

  // Rate limit per client IP. Generous for humans, tight against abuse
  // (each generate fans out to many subrequests).
  if (env.RATE_LIMITER) {
    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    const { success } = await env.RATE_LIMITER.limit({ key: ip });
    if (!success)
      return json(
        { error: "Too many requests. Wait a minute and try again." },
        429,
        { ...cors, "Retry-After": "60" }
      );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid request body." }, 400, cors);
  }

  const input = (body.url || "").trim();
  if (!input) return json({ error: "Enter a website URL." }, 400, cors);

  let root;
  try {
    root = new URL(input.startsWith("http") ? input : `https://${input}`);
  } catch {
    return json({ error: "That doesn't look like a valid URL." }, 400, cors);
  }

  try {
    const result = await crawl(root);
    if (!result.pages.length)
      return json({ error: "Couldn't read any pages from that site." }, 502, cors);
    const text = buildLlmsTxt(root, result);
    return json({ llmstxt: text, pages: result.pages.length, site: result.site }, 200, cors);
  } catch (e) {
    return json({ error: "Failed to reach that site. It may block bots or be offline." }, 502, cors);
  }
}

async function crawl(root) {
  const origin = root.origin;
  const home = origin + "/";
  const homeHtml = await fetchText(home);
  const site = {
    title: extractTitle(homeHtml) || root.hostname,
    description: extractMeta(homeHtml) || "",
  };

  // Homepage is always the first page.
  const pages = [
    {
      url: home,
      title: (extractTitle(homeHtml) || root.hostname).slice(0, 120),
      description: (extractMeta(homeHtml) || "").slice(0, 200),
    },
  ];

  // Collect same-origin links from the homepage (home already covered).
  const links = [];
  const seen = new Set([home.replace(/\/$/, "")]);
  for (const href of extractLinks(homeHtml, origin)) {
    const key = href.replace(/\/$/, "");
    if (seen.has(key)) continue;
    seen.add(key);
    links.push(href);
    if (links.length >= MAX_PAGES - 1) break;
  }

  // Fetch remaining pages in parallel batches to stay fast and within limits.
  for (let i = 0; i < links.length; i += CONCURRENCY) {
    const batch = links.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      batch.map(async (href) => {
        try {
          const html = await fetchText(href);
          const title = extractTitle(html);
          if (!title) return null;
          return {
            url: href,
            title: title.slice(0, 120),
            description: (extractMeta(html) || "").slice(0, 200),
          };
        } catch {
          return null;
        }
      })
    );
    for (const r of results) if (r) pages.push(r);
  }

  return { site, pages };
}

async function fetchText(href) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT);
  try {
    const res = await fetch(href, {
      signal: ctrl.signal,
      headers: { "User-Agent": "llms-txt-generator/1.0 (+https://github.com)" },
      cf: { cacheTtl: 300 },
    });
    if (!res.ok) throw new Error(res.status);
    const type = res.headers.get("content-type") || "";
    if (!type.includes("text/html")) throw new Error("not html");
    return await res.text();
  } finally {
    clearTimeout(t);
  }
}

function extractTitle(html) {
  const og = /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i.exec(html);
  if (og) return decode(og[1].trim());
  const t = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  return t ? decode(t[1].replace(/\s+/g, " ").trim()) : "";
}

function extractMeta(html) {
  const patterns = [
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i,
    /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']*)["']/i,
  ];
  for (const p of patterns) {
    const m = p.exec(html);
    if (m && m[1].trim()) return decode(m[1].replace(/\s+/g, " ").trim());
  }
  return "";
}

function extractLinks(html, origin) {
  const out = [];
  const seen = new Set();
  const re = /<a[^>]+href=["']([^"'#]+)["']/gi;
  let m;
  while ((m = re.exec(html))) {
    let href = m[1].trim();
    if (!href || href.startsWith("mailto:") || href.startsWith("tel:")) continue;
    try {
      const u = new URL(href, origin);
      if (u.origin !== origin) continue;
      if (/\.(png|jpe?g|gif|svg|webp|pdf|zip|css|js|ico|xml|json|woff2?)$/i.test(u.pathname))
        continue;
      // skip auth / utility / non-content routes
      if (/^\/(login|signin|signup|register|logout|auth|api|admin|cart|checkout|account|search)\b/i.test(u.pathname))
        continue;
      // dedupe on path alone — ignore query strings and trailing slash
      const key = u.pathname.replace(/\/$/, "") || "/";
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(origin + (u.pathname.replace(/\/$/, "") || "/"));
    } catch {
      // ignore bad href
    }
  }
  return out;
}

function buildLlmsTxt(root, { site, pages }) {
  const lines = [];
  lines.push(`# ${site.title}`);
  lines.push("");
  if (site.description) {
    lines.push(`> ${site.description}`);
    lines.push("");
  }
  lines.push(
    "This file was drafted automatically from the site's pages. Review and edit the descriptions before publishing."
  );
  lines.push("");
  lines.push("## Pages");
  lines.push("");
  for (const p of pages) {
    const desc = p.description ? `: ${p.description}` : "";
    lines.push(`- [${p.title}](${p.url})${desc}`);
  }
  lines.push("");
  return lines.join("\n");
}

function decode(s) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function json(obj, status = 200, extra = {}) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", ...extra },
  });
}

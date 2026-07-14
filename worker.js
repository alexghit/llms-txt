// llms.txt generator — Cloudflare Worker
// Crawls a site, extracts page titles/descriptions, assembles a draft llms.txt.

const MAX_PAGES = 40;
const FETCH_TIMEOUT = 8000;
const CONCURRENCY = 8; // pages fetched in parallel per batch

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/generate") {
      return handleGenerate(request, env);
    }

    // Static assets (frontend) served from the build/[assets] binding
    return env.ASSETS.fetch(request);
  },
};

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

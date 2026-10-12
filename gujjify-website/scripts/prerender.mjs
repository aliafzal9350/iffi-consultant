/**
 * Static prerender: turns the client build in dist/ into one HTML file per route.
 * Run after `vite build` and `vite build --ssr src/entry-server.tsx --outDir dist-server`
 * (npm run build does all three). Crawlers and link previews (WhatsApp, Facebook) get real
 * content, titles and Open Graph tags; the browser then hydrates the same markup.
 *
 *   /                      -> dist/index.html
 *   /programmes            -> dist/programmes.html
 *   /programmes/b-04-...   -> dist/programmes/b-04-....html
 *   unknown URLs           -> dist/404.html (served with status 404 by .htaccess)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, process.env.DIST || 'dist');
const serverDir = path.join(root, 'dist-server');

const template = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
if (!template.includes('<!--app-html-->') || !template.includes('<!--head:start-->')) {
  throw new Error('dist/index.html is missing the <!--app-html--> or <!--head:start--> markers');
}

const { render, allRoutes, siteUrl } = await import(pathToFileURL(path.join(serverDir, 'entry-server.js')).href);

const routes = allRoutes();
const started = Date.now();
let bytes = 0;

async function writePage(url, file) {
  const { html, head } = await render(url);
  const page = template.replace(/<!--head:start-->[\s\S]*?<!--head:end-->/, head).replace('<!--app-html-->', html);
  const out = path.join(dist, file);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, page);
  bytes += page.length;
}

for (const url of routes) {
  await writePage(url, url === '/' ? 'index.html' : `${url.slice(1)}.html`);
}
await writePage('/__not-found__', '404.html');

// sitemap.xml generated from the same route list, so it can never drift from the router
const today = new Date().toISOString().slice(0, 10);
const priority = (u) =>
  u === '/' ? '1.0' : ['/programmes', '/tools/cost-calculator', '/tools/eligibility-checker'].includes(u) ? '0.9'
    : ['/tools', '/services'].includes(u) ? '0.8'
    : /^\/(privacy|terms|cookies)$/.test(u) ? '0.2'
    : /^\/(provinces|blog|faq|contact)/.test(u) ? '0.7'
    : '0.6';
const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...routes.map((u) => `  <url><loc>${siteUrl}${u === '/' ? '/' : u}</loc><lastmod>${today}</lastmod><priority>${priority(u)}</priority></url>`),
  '</urlset>',
  '',
].join('\n');
fs.writeFileSync(path.join(dist, 'sitemap.xml'), sitemap);

fs.rmSync(serverDir, { recursive: true, force: true });
console.log(`Prerendered ${routes.length + 1} pages (${(bytes / 1024).toFixed(0)} KB) and sitemap.xml in ${((Date.now() - started) / 1000).toFixed(1)} s`);

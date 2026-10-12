/**
 * After `npm run build`: checks every main route's prerendered HTML for the SEO basics and reports whether
 * its top-ranked keyword (src/data/seo-keywords.json) actually appears where Google looks: the <title>,
 * the H1 and the meta description. Meta keywords alone do not rank a page.
 *
 *   npm run build && npm run seo:audit
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const app = path.join(root, '.next/server/app');
const { routes } = JSON.parse(fs.readFileSync(path.join(root, 'src/data/seo-keywords.json'), 'utf8'));
const site = JSON.parse(fs.readFileSync(path.join(root, 'src/data/site.json'), 'utf8'));

const file = (route) => path.join(app, route === '/' ? 'index.html' : `${route.slice(1)}.html`);
const pick = (html, re) => (html.match(re)?.[1] ?? '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const words = (k) => k.toLowerCase().split(/\s+/).filter((w) => w.length > 2 && !['for', 'the', 'and', 'with'].includes(w));
// a keyword "appears" when most of its meaningful words are there, in any order
const covers = (text, k) => {
  const t = text.toLowerCase();
  const w = words(k);
  return w.filter((x) => t.includes(x.replace(/s$/, ''))).length >= Math.ceil(w.length * 0.75);
};

let problems = 0;
for (const [route, keywords] of Object.entries(routes)) {
  const f = file(route);
  if (!fs.existsSync(f)) {
    console.log(`${route.padEnd(28)} (no prerendered HTML)`);
    continue;
  }
  const html = fs.readFileSync(f, 'utf8');
  const title = pick(html, /<title>(.*?)<\/title>/s);
  const h1 = pick(html, /<h1[^>]*>(.*?)<\/h1>/s);
  const desc = html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? '';
  const canonical = html.match(/<link rel="canonical" href="([^"]*)"/)?.[1] ?? '';
  const metaKw = html.match(/<meta name="keywords" content="([^"]*)"/)?.[1] ?? '';
  const top = keywords[0];
  const checks = {
    title: title.length > 0 && title.length <= 70,
    desc: desc.length >= 70 && desc.length <= 160,
    h1: !!h1,
    canonical: canonical.startsWith(site.seo.siteUrl),
    'meta kw': metaKw.length > 0,
    [`"${top}" in title/H1/desc`]: covers(`${title} ${h1} ${desc}`, top),
  };
  const failed = Object.entries(checks).filter(([, ok]) => !ok).map(([k]) => k);
  problems += failed.length;
  console.log(`${route.padEnd(28)} ${failed.length ? 'CHECK: ' + failed.join(', ') : 'ok'}`);
  if (failed.length) console.log(`${''.padEnd(28)} title (${title.length}): ${title}\n${''.padEnd(28)} h1: ${h1}`);
}
console.log(problems ? `\n${problems} item(s) to review` : '\nall routes pass');

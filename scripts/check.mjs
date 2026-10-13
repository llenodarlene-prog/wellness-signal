import { access, readFile } from 'node:fs/promises';

for (const file of ['dist/index.html', 'dist/robots.txt', 'dist/sitemap.xml', 'dist/build-manifest.json', 'dist/assets/css/site.css']) {
  await access(file);
}

const site = JSON.parse(await readFile('data/site.json', 'utf8'));
const canonical = site.url.replace(/\/$/, '');
const manifest = JSON.parse(await readFile('dist/build-manifest.json', 'utf8'));
const html = await readFile('dist/index.html', 'utf8');

if (!html.includes(site.name)) throw new Error('Built homepage is missing the site name');
if (!html.includes(`<link rel="canonical" href="${canonical}/">`)) {
  throw new Error('Built homepage canonical does not match data/site.json');
}

const expectedRobots = manifest.indexable ? 'index,follow' : 'noindex,nofollow,noarchive';
for (const { slug } of manifest.pages) {
  const file = `dist${slug}index.html`;
  const page = await readFile(file, 'utf8');
  if (!page.includes(`<meta name="robots" content="${expectedRobots}">`)) throw new Error(`${file}: wrong robots directive`);
  if (!page.includes(`<link rel="canonical" href="${canonical}${slug}">`)) throw new Error(`${file}: canonical mismatch`);
  if ((page.match(/<h1[\s>]/g) || []).length !== 1) throw new Error(`${file}: expected exactly one h1`);
  if (/\[(Confirmed|Before publication|Confirm actual)/.test(page)) throw new Error(`${file}: unresolved copy placeholder`);
  for (const [, asset] of page.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)) {
    await access(`dist${asset}`).catch(() => { throw new Error(`${file}: missing asset ${asset}`); });
  }
  for (const [, link] of page.matchAll(/href="(\/[a-z-]*\/?)(?:#[^"]*)?"/g)) {
    await access(`dist${link}${link.endsWith('/') ? '' : '/'}index.html`).catch(() => { throw new Error(`${file}: broken internal link ${link}`); });
  }
}

console.log(`Repository checks passed (${manifest.pages.length} pages).`);

import { access, readFile } from 'node:fs/promises';

for (const file of ['dist/index.html', 'dist/robots.txt', 'dist/sitemap.xml', 'dist/build-manifest.json']) {
  await access(file);
}

const site = JSON.parse(await readFile('data/site.json', 'utf8'));
const html = await readFile('dist/index.html', 'utf8');

if (!html.includes(site.name)) throw new Error('Built homepage is missing the site name');
if (!html.includes(`<link rel="canonical" href="${site.url.replace(/\/$/, '')}/">`)) {
  throw new Error('Built homepage canonical does not match data/site.json');
}

console.log('Repository checks passed.');

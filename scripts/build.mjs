import { mkdir, readFile, writeFile } from 'node:fs/promises';

const site = JSON.parse(await readFile('data/site.json', 'utf8'));
const environment = process.env.BUILD_ENV || 'local';
const production = environment === 'production';
const robots = production ? 'index,follow' : 'noindex,nofollow,noarchive';
const canonical = site.url.replace(/\/$/, '');

await mkdir('dist', { recursive: true });

const html = `<!doctype html>
<html lang="${site.locale}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${site.name}</title>
  <meta name="description" content="${site.description}">
  <meta name="robots" content="${robots}">
  <link rel="canonical" href="${canonical}/">
</head>
<body>
  <main>
    <h1>${site.name}</h1>
    <p>The publishing platform is being prepared.</p>
  </main>
</body>
</html>
`;

await writeFile('dist/index.html', html);
await writeFile('dist/404.html', '<!doctype html><title>Page Not Found</title><h1>Page Not Found</h1>');
await writeFile('dist/robots.txt', production
  ? `User-agent: *\nAllow: /\nSitemap: ${canonical}/sitemap.xml\n`
  : 'User-agent: *\nDisallow: /\n'
);
await writeFile('dist/sitemap.xml', production
  ? `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${canonical}/</loc></url></urlset>`
  : '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>'
);
await writeFile('dist/build-manifest.json', JSON.stringify({
  environment,
  indexable: production,
  pages: [{ slug: '/', draft: false }]
}, null, 2));

console.log(`Built Wellness Signal (${environment}; indexable=${production})`);

import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { categories, pages } from '../content/pages.mjs';

const site = JSON.parse(await readFile('data/site.json', 'utf8'));
const environment = process.env.BUILD_ENV || 'local';
const production = environment === 'production';
const robots = production ? 'index,follow' : 'noindex,nofollow,noarchive';
const canonical = site.url.replace(/\/$/, '');
const year = new Date().getUTCFullYear();

const esc = value => String(value)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const inline = value => esc(value).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
const path = slug => (slug ? `/${slug}/` : '/');

// Unconfirmed operational details render as visible markers outside production.
const pending = [];
const pendingMarker = (page, note) => {
  pending.push(`${path(page.slug)}: ${note}`);
  return `<span class="pending">To confirm before launch: ${esc(note)}</span>`;
};
const emailLine = (page, label, address, note) => address
  ? `<strong>${label}:</strong> <a href="mailto:${esc(address)}">${esc(address)}</a>`
  : `<strong>${label}:</strong> ${pendingMarker(page, note)}`;

const paragraph = (page, text) => {
  if (text === '{{editorial_email_line}}') return `<p>${emailLine(page, 'Email', site.editorial_email, 'editorial email address')}</p>`;
  if (text === '{{privacy_email_line}}') return `<p>${emailLine(page, 'Email', site.privacy_email, 'privacy contact email')}</p>`;
  if (text.includes('{{site_link}}')) return `<p>${inline(text.replace('{{site_link}}', '')).trim()} <a href="${canonical}/">${canonical}/</a></p>`;
  return `<p>${inline(text)}</p>`;
};
const paragraphs = (page, list = []) => list.map(text => paragraph(page, text)).join('\n');

const picture = (name, alt, { eager = false, sizes = '(max-width: 860px) 100vw, 50vw' } = {}) =>
  `<img src="/assets/images/${name}.webp" srcset="/assets/images/${name}-800.webp 800w, /assets/images/${name}.webp 1672w" sizes="${sizes}" width="1672" height="941" alt="${esc(alt)}"${eager ? ' fetchpriority="high"' : ' loading="lazy"'} decoding="async">`;

const navItems = [
  ...categories.map(category => ({ href: path(category.slug), label: category.name })),
  { href: '/about/', label: 'About' },
  { href: '/contact/', label: 'Contact' },
];

const header = page => `<a class="skip" href="#main">Skip to content</a>
<header class="site-header">
  <div class="wrap">
    <a class="brand" href="/"><img src="/assets/brand/logo-horizontal.png" width="1294" height="259" alt="${esc(site.name)}"></a>
    <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav">Menu</button>
    <nav class="nav" id="site-nav" aria-label="Main">
      <ul>${navItems.map(item => `<li><a href="${item.href}"${item.href === path(page.slug) ? ' aria-current="page"' : ''}>${esc(item.label)}</a></li>`).join('')}</ul>
    </nav>
  </div>
</header>`;

const footer = `<footer class="site-footer">
  <div class="wrap">
    <div>
      <img src="/assets/brand/logo-horizontal-light.png" width="1294" height="259" alt="${esc(site.name)}" loading="lazy">
      <p>Independent coverage of wellness research, consumer behaviour, and industry developments.</p>
    </div>
    <div>
      <h2>Coverage</h2>
      <ul>${categories.map(category => `<li><a href="${path(category.slug)}">${esc(category.name)}</a></li>`).join('')}</ul>
    </div>
    <div>
      <h2>Publication</h2>
      <ul>
        <li><a href="/about/">About Us</a></li>
        <li><a href="/about/#editorial-standards">Editorial Standards</a></li>
        <li><a href="/contact/">Contact</a></li>
        <li><a href="/privacy-policy/">Privacy Policy</a></li>
        <li><a href="/terms/">Terms and Conditions</a></li>
      </ul>
    </div>
    <p class="fine">&copy; ${year} ${esc(site.name)}. Editorial content is for general information and is not medical advice.</p>
  </div>
</footer>
<script>
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('site-nav');
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });
</script>`;

const heroAlt = name => ({
  'desk-sea-view': 'Sunlit marble desk with a notebook, tea, and laptop overlooking the sea',
  'sage-leaf': 'Close-up of sage leaves with morning dew',
  'nutrition-table': 'Herbal tea, fresh fruit, and supplements on a marble table by the coast',
  'pilates-stretch': 'Person stretching beside a Pilates reformer in a bright coastal studio',
  'sleep-journal': 'Open journal and chamomile tea on white bedding',
  'sauna-terrace': 'Towels, foam roller, and infused water beside a sauna on a seaside terrace',
  'skincare-counter': 'Skincare bottles, jade roller, and gua sha on a marble counter',
  'workplace-lounge': 'Bright office lounge with armchairs, a wooden table, and a city view',
  'retreat-pool-terrace': 'Open book and tea on a daybed beside an infinity pool overlooking the sea',
  'bedroom-sunset': 'Bedroom at sunset with a tray of tea and a candle on the bed',
  'breakfast-bowl': 'Breakfast bowl with berries and herbal tea on a marble counter',
  'pilates-studio': 'Yoga mat, dumbbells, and water bottle in a sunlit Pilates studio',
  'recovery-bench': 'Foam roller, towels, and cucumber water on a wooden recovery bench',
  'skincare-vanity': 'Skincare oils, jade roller, and gua sha on a bathroom vanity',
}[name] || '');

const renderSection = (page, section) => {
  const tone = section.tone || 'cream';
  const level = section.headingLevel === 2 ? 'h2' : 'h3';
  const cardClass = tone === 'cream' ? 'card on-cream' : 'card';
  const head = section.h2 || section.p
    ? `<div class="section-head">${section.h2 ? `<h2>${esc(section.h2)}</h2>` : ''}${paragraphs(page, section.p)}${section.pending ? `<p>${pendingMarker(page, section.pending)}</p>` : ''}</div>`
    : '';
  const cta = section.cta ? `<p><a class="btn" href="${section.cta.href}">${esc(section.cta.label)}</a></p>` : '';

  if (page.legal) {
    return `<section class="section"><div class="wrap narrow">${head}</div></section>`;
  }

  let body = '';
  if (section.categoryCards) {
    body = `<div class="cat-grid">${categories.map(category => `<a class="cat" href="${path(category.slug)}">
      ${picture(category.image, '', { sizes: '(max-width: 600px) 100vw, 380px' })}
      <div><h3>${esc(category.name)}</h3><p>${esc(category.summary)}</p><span class="more">Read coverage &rarr;</span></div>
    </a>`).join('')}</div>`;
  }
  if (section.cards) {
    body += `<div class="cards">${section.cards.map(card => `<div class="${cardClass}"><${level}>${esc(card.h3)}</${level}>${paragraphs(page, card.p)}</div>`).join('')}</div>`;
  }
  if (section.list) {
    body += `<ul class="ticks">${section.list.map(item => `<li>${inline(item)}</li>`).join('')}</ul>`;
  }
  if (section.empty) {
    body += `<p class="empty">New articles will appear here as they are published.</p>`;
  }

  // A text-only section with an image becomes a two-column split.
  if (section.image && !section.cards && !section.categoryCards) {
    return `<section class="section tone-${tone}"${section.id ? ` id="${section.id}"` : ''}><div class="wrap split">
      <div>${head.replace('class="section-head"', 'class="section-head lead"')}${cta}</div>
      <figure style="margin:0">${picture(section.image, heroAlt(section.image))}</figure>
    </div></section>`;
  }
  const band = section.image ? `<div class="media-band">${picture(section.image, heroAlt(section.image), { sizes: '100vw' })}</div>` : '';
  return `<section class="section tone-${tone}"${section.id ? ` id="${section.id}"` : ''}><div class="wrap">${band}${head}${body}${cta}</div></section>`;
};

const renderPage = page => {
  const url = `${canonical}${path(page.slug)}`;
  const hero = page.hero;
  const heroImage = hero.image ? `<figure>${picture(hero.image, heroAlt(hero.image), { eager: true })}</figure>` : '';
  const ogImage = `${canonical}/assets/images/${hero.image || 'desk-sea-view'}.webp`;
  return `<!doctype html>
<html lang="${site.locale}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${esc(page.title)}</title>
  <meta name="description" content="${esc(page.description)}">
  <meta name="robots" content="${robots}">
  <link rel="canonical" href="${url}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${esc(site.name)}">
  <meta property="og:title" content="${esc(page.title)}">
  <meta property="og:description" content="${esc(page.description)}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${ogImage}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="theme-color" content="#1F6B4F">
  <link rel="icon" type="image/png" sizes="32x32" href="/assets/brand/mark-32.png">
  <link rel="icon" type="image/png" sizes="192x192" href="/assets/brand/mark-192.png">
  <link rel="apple-touch-icon" href="/assets/brand/apple-touch-icon.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=Source+Sans+3:wght@400;500;600&display=swap">
  <link rel="stylesheet" href="/assets/css/site.css">
</head>
<body${page.legal ? ' class="legal"' : ''}>
${header(page)}
<main id="main">
  <section class="hero${heroImage ? '' : ' no-image'}">
    <div class="wrap">
      <div class="hero-text">
        ${hero.eyebrow ? `<span class="eyebrow">${esc(hero.eyebrow)}</span>` : page.category ? '<span class="eyebrow">Coverage</span>' : ''}
        <h1>${esc(hero.h1)}</h1>
        ${page.updated ? `<p class="updated">Last Updated: ${esc(page.updated)}</p>` : ''}
        <div class="lead">${paragraphs(page, hero.p)}</div>
        ${hero.cta ? `<a class="btn" href="${hero.cta.href}">${esc(hero.cta.label)}</a>` : ''}
      </div>
      ${heroImage}
    </div>
  </section>
  ${page.sections.map(section => renderSection(page, section)).join('\n')}
</main>
${footer}
</body>
</html>
`;
};

await mkdir('dist', { recursive: true });
await cp('assets', 'dist/assets', { recursive: true });

for (const page of pages) {
  const dir = page.slug ? `dist/${page.slug}` : 'dist';
  await mkdir(dir, { recursive: true });
  await writeFile(`${dir}/index.html`, renderPage(page));
}

if (production && pending.length) {
  throw new Error(`Production build blocked; confirm these details first:\n- ${[...new Set(pending)].join('\n- ')}`);
}

await writeFile('dist/404.html', `<!doctype html><html lang="${site.locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Page Not Found | ${esc(site.name)}</title><link rel="stylesheet" href="/assets/css/site.css"></head><body><main class="hero no-image"><div class="wrap"><div class="hero-text"><h1>Page Not Found</h1><p>The page you were looking for has moved or no longer exists.</p><a class="btn" href="/">Back to Wellness Signal</a></div></div></main></body></html>`);
await writeFile('dist/robots.txt', production
  ? `User-agent: *\nAllow: /\nSitemap: ${canonical}/sitemap.xml\n`
  : 'User-agent: *\nDisallow: /\n'
);
await writeFile('dist/sitemap.xml', production
  ? `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${pages.map(page => `<url><loc>${canonical}${path(page.slug)}</loc></url>`).join('')}</urlset>`
  : '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>'
);
await writeFile('dist/build-manifest.json', JSON.stringify({
  environment,
  indexable: production,
  pending: [...new Set(pending)],
  pages: pages.map(page => ({ slug: path(page.slug), draft: false })),
}, null, 2));

console.log(`Built Wellness Signal (${environment}; indexable=${production}; ${pages.length} pages)`);
if (pending.length) console.log(`Pending details (block production): ${new Set(pending).size}`);

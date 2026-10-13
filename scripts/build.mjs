import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { categories, pages } from '../content/pages.mjs';
import {
  categoryIcons, categoryLens, economy, evidenceLadder, icon, readingSteps, separations, sprig, standardIcons,
} from '../content/features.mjs';

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
const pad = n => String(n).padStart(2, '0');

// Unconfirmed operational details render as visible markers and block production.
const pending = [];
const pendingMarker = (page, note) => {
  pending.push(`${path(page.slug)}: ${note}`);
  return `<span class="pending">To confirm before launch: ${esc(note)}</span>`;
};
const emailLine = (page, address, note) => address
  ? `<strong>Email:</strong> <a href="mailto:${esc(address)}">${esc(address)}</a>`
  : `<strong>Email:</strong> ${pendingMarker(page, note)}`;

const paragraph = (page, text) => {
  if (text === '{{editorial_email_line}}') return `<p>${emailLine(page, site.editorial_email, 'editorial email address')}</p>`;
  if (text === '{{privacy_email_line}}') return `<p>${emailLine(page, site.privacy_email, 'privacy contact email')}</p>`;
  if (text.includes('{{site_link}}')) return `<p>${inline(text.replace('{{site_link}}', '')).trim()} <a href="${canonical}/">${canonical}/</a></p>`;
  return `<p>${inline(text)}</p>`;
};
const paragraphs = (page, list = []) => list.map(text => paragraph(page, text)).join('\n');

const alts = {
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
};
const picture = (name, { eager = false, sizes = '(max-width: 860px) 100vw, 50vw', alt = alts[name] || '' } = {}) =>
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
    <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav"><span></span>Menu</button>
    <nav class="nav" id="site-nav" aria-label="Main">
      <ul>${navItems.map(item => `<li><a href="${item.href}"${item.href === path(page.slug) ? ' aria-current="page"' : ''}>${esc(item.label)}</a></li>`).join('')}</ul>
    </nav>
  </div>
  <div class="progress" aria-hidden="true"></div>
</header>`;

const footer = `<footer class="site-footer">
  ${sprig}
  <div class="wrap">
    <div>
      <img src="/assets/brand/logo-horizontal-light.png" width="1294" height="259" alt="${esc(site.name)}" loading="lazy">
      <p>Independent coverage of wellness research, consumer behaviour, and industry developments.</p>
      ${site.editorial_email ? `<p><a class="foot-mail" href="mailto:${esc(site.editorial_email)}">${icon('mail', 18)} ${esc(site.editorial_email)}</a></p>` : ''}
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
<button class="to-top" type="button" aria-label="Back to top">${icon('arrow', 18)}</button>
<script src="/assets/js/site.js" defer></script>`;

// ---------- Feature blocks ----------

const factsBlock = () => `<section class="facts-band reveal" aria-label="Wellness economy at a glance">
  <div class="wrap">
    <dl class="facts">
      ${economy.facts.map(fact => `<div><dt>${esc(fact.label)}</dt><dd>${esc(fact.value)}</dd></div>`).join('')}
    </dl>
    <p class="source">Source: <a href="${economy.sourceUrl}" rel="noopener" target="_blank">${esc(economy.source)}</a></p>
  </div>
</section>`;

const chartBlock = () => {
  const max = 10;
  const ticks = [0, 2, 4, 6, 8, 10];
  return `<section class="section tone-cream" id="market-context">
  <div class="wrap split chart-split">
    <div class="reveal">
      <span class="eyebrow">Data in context</span>
      <h2>A Measurement and a Forecast Are Not the Same Number</h2>
      <p>The wellness economy is often quoted as a single figure. In practice, the latest measured value and a five-year projection come from different methods and carry different levels of certainty.</p>
      <p>We report them side by side and label each one, so readers can see what has been recorded and what is still an estimate.</p>
      <div class="toggle" role="group" aria-label="Chart view">
        <button type="button" class="chip" data-chart-view="measured" aria-pressed="false">Measured only</button>
        <button type="button" class="chip" data-chart-view="all" aria-pressed="true">Include projection</button>
      </div>
    </div>
    <figure class="chart reveal" data-chart>
      <figcaption>Global wellness economy, US$ trillions</figcaption>
      <div class="chart-plot">
        <div class="chart-axis">${ticks.slice().reverse().map(t => `<span>${t}</span>`).join('')}</div>
        <div class="chart-bars">
          ${ticks.map(t => `<i class="gridline" style="bottom:${(t / max) * 100}%"></i>`).join('')}
          ${economy.bars.map(bar => `<button type="button" class="bar ${bar.kind}" style="--h:${(bar.value / max) * 100}%" aria-label="${bar.label}: $${bar.value.toFixed(1)} trillion, ${esc(bar.note)}">
            <span class="bar-fill"></span>
            <span class="bar-value">$${bar.value.toFixed(1)}T</span>
            <span class="bar-label">${bar.label}</span>
            <span class="tip">${esc(bar.note)}</span>
          </button>`).join('')}
        </div>
      </div>
      <div class="legend"><span><i class="key measured"></i>Measured</span><span><i class="key projected"></i>Projection</span></div>
      <p class="source">Source: <a href="${economy.sourceUrl}" rel="noopener" target="_blank">${esc(economy.source)}</a>. The 2028 value is a forecast.</p>
    </figure>
  </div>
</section>`;
};

const stepsBlock = () => `<ol class="steps">
  ${readingSteps.map((step, i) => `<li class="step reveal" style="--d:${i}">
    <span class="step-num">${pad(i + 1)}</span>
    <span class="icon-badge">${icon(step.icon)}</span>
    <h3>${esc(step.h)}</h3>
    <p>${esc(step.p)}</p>
  </li>`).join('')}
</ol>`;

const separationsBlock = () => `<div class="table-wrap reveal">
  <table class="compare">
    <thead><tr><th scope="col">We report</th><th scope="col" aria-label="kept separate from"></th><th scope="col">Kept separate from</th></tr></thead>
    <tbody>${separations.map(([a, b]) => `<tr><td>${esc(a)}</td><td class="divider" aria-hidden="true">${icon('scale', 20)}</td><td>${esc(b)}</td></tr>`).join('')}</tbody>
  </table>
</div>`;

const ladderBlock = () => `<section class="section tone-cream" id="evidence-ladder">
  <div class="wrap">
    <div class="section-head reveal">
      <span class="eyebrow">How we weigh evidence</span>
      <h2>The Evidence Ladder</h2>
      <p>Not every source carries the same weight. Select a level to see what it can and cannot tell us.</p>
    </div>
    <div class="ladder reveal" data-ladder>
      <div class="ladder-steps" role="tablist" aria-label="Levels of evidence" aria-orientation="vertical">
        ${evidenceLadder.map((level, i) => `<button type="button" role="tab" id="lad-tab-${i}" aria-controls="lad-panel-${i}" aria-selected="${i === evidenceLadder.length - 1}" tabindex="${i === evidenceLadder.length - 1 ? 0 : -1}" style="--w:${55 + i * 11.25}%">
          <span class="rung">${pad(i + 1)}</span>${esc(level.h)}
        </button>`).reverse().join('')}
      </div>
      <div class="ladder-panels">
        ${evidenceLadder.map((level, i) => `<div role="tabpanel" id="lad-panel-${i}" aria-labelledby="lad-tab-${i}"${i === evidenceLadder.length - 1 ? '' : ' hidden'}>
          <span class="eyebrow">Level ${pad(i + 1)} of ${pad(evidenceLadder.length)}</span>
          <h3>${esc(level.h)}</h3>
          <p>${esc(level.p)}</p>
          <div class="meter" aria-hidden="true"><span style="width:${((i + 1) / evidenceLadder.length) * 100}%"></span></div>
        </div>`).join('')}
      </div>
    </div>
  </div>
</section>`;

const lensBlock = page => {
  const rows = categoryLens[page.slug] || [];
  const category = categories.find(c => c.slug === page.slug);
  return `<section class="section tone-cream">
  <div class="wrap split lens">
    <div class="reveal">
      <span class="eyebrow">Our lens</span>
      <h2>How We Read ${esc(category.name)} Claims</h2>
      <p>The figures that travel furthest are rarely the full picture. For each common claim in this area, this is what we check before reporting it.</p>
    </div>
    <div class="table-wrap reveal">
      <table class="lens-table">
        <thead><tr><th scope="col">Often cited</th><th scope="col">What we check</th></tr></thead>
        <tbody>${rows.map(([a, b]) => `<tr><td>${esc(a)}</td><td>${icon('check', 18)}<span>${esc(b)}</span></td></tr>`).join('')}</tbody>
      </table>
    </div>
  </div>
</section>`;
};

const categoryCard = (category, i) => `<a class="cat reveal" href="${path(category.slug)}" style="--d:${i % 4}">
  <span class="cat-media">${picture(category.image, { sizes: '(max-width: 600px) 100vw, 380px', alt: '' })}<span class="icon-badge on-image">${icon(categoryIcons[category.slug])}</span></span>
  <span class="cat-body"><span class="cat-num">${pad(i + 1)}</span><h3>${esc(category.name)}</h3><span class="cat-text">${esc(category.summary)}</span><span class="more">Read coverage ${icon('arrow', 16)}</span></span>
</a>`;

const coverageIconsBlock = () => `<ul class="icon-list">${categories.map((category, i) => `<li class="reveal" style="--d:${i % 4}">
  <a href="${path(category.slug)}"><span class="icon-badge">${icon(categoryIcons[category.slug])}</span>
  <span><strong>${esc(category.name)}</strong><span>${esc(category.summary)}</span></span></a></li>`).join('')}</ul>`;

// ---------- Sections ----------

const renderSection = (page, section, index) => {
  if (section.type === 'facts') return factsBlock();
  if (section.type === 'chart') return chartBlock();
  if (section.type === 'ladder') return ladderBlock();
  if (section.type === 'lens') return lensBlock(page);

  const tone = section.tone || 'cream';
  const level = section.headingLevel === 2 ? 'h2' : 'h3';
  const head = section.h2 || section.p
    ? `<div class="section-head reveal">${section.h2 ? `<h2>${esc(section.h2)}</h2>` : ''}${paragraphs(page, section.p)}</div>`
    : '';
  const cta = section.cta ? `<p class="reveal"><a class="btn" href="${section.cta.href}">${esc(section.cta.label)}${icon('arrow', 18)}</a></p>` : '';
  const id = section.id ? ` id="${section.id}"` : '';

  if (page.legal) return `<section class="section"${id}><div class="wrap narrow">${head}</div></section>`;

  let body = '';
  if (section.categoryCards) body = `<div class="cat-grid bento">${categories.map(categoryCard).join('')}</div>`;
  if (section.cards) {
    const numbered = !section.cards.some(card => standardIcons[card.h3]);
    body += `<div class="cards">${section.cards.map((card, i) => `<div class="card reveal" id="${slugify(card.h3)}" style="--d:${i % 4}">
      ${numbered ? `<span class="card-num">${pad(i + 1)}</span>` : `<span class="icon-badge">${icon(standardIcons[card.h3])}</span>`}
      <${level}>${esc(card.h3)}</${level}>${paragraphs(page, card.p)}</div>`).join('')}</div>`;
  }
  if (section.coverageIcons) body += coverageIconsBlock();
  else if (section.list) body += `<ul class="ticks">${section.list.map(item => `<li>${inline(item)}</li>`).join('')}</ul>`;
  if (section.empty) body += `<div class="empty reveal">${sprig}<p>New articles will appear here as they are published.</p></div>`;
  if (section.separations) body += separationsBlock();

  if (section.image && !section.cards && !section.categoryCards) {
    return `<section class="section tone-${tone}"${id}><div class="wrap">
      <div class="split">
        <div>${head.replace('section-head', 'section-head lead')}${cta}</div>
        <figure class="framed reveal">${picture(section.image)}</figure>
      </div>
      ${section.steps ? stepsBlock() : ''}
    </div></section>`;
  }
  const band = section.image ? `<figure class="media-band reveal">${picture(section.image, { sizes: '100vw' })}</figure>` : '';
  const deco = tone === 'forest' ? sprig : '';
  return `<section class="section tone-${tone}"${id}>${deco}<div class="wrap">${band}${head}${body}${cta}</div></section>`;
};

const slugify = text => text.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// The hero keeps one short line; the remaining intro copy moves into a section below it.
const heroSplit = page => {
  const hero = page.hero;
  if (page.legal) return { deck: null, intro: [] };
  if (hero.deck) return { deck: hero.deck, intro: hero.p };
  return { deck: hero.p[0], intro: hero.p.slice(1) };
};

const evidenceCard = () => `<aside class="evidence-card" aria-label="Our evidence check">
  <span class="eyebrow">Evidence check</span>
  <ul>${readingSteps.map((step, i) => `<li style="--d:${i}"><span class="icon-badge">${icon(step.icon, 20)}</span><span><strong>${esc(step.h)}</strong><span>${esc(step.p)}</span></span></li>`).join('')}</ul>
</aside>`;

const introBlock = page => {
  const { intro } = heroSplit(page);
  if (!intro.length) return '';
  // Short intros read better as one centred statement than as a quote beside a single line.
  if (intro.join(' ').length < 420) {
    return `<section class="section intro tone-white">
  <div class="wrap statement reveal">${sprig}${intro.map((text, i) => `<p${i === intro.length - 1 ? ' class="statement-main"' : ''}>${inline(text)}</p>`).join('')}</div>
</section>`;
  }
  const quote = intro[intro.length - 1];
  const body = intro.slice(0, -1);
  return `<section class="section intro tone-white">
  <div class="wrap intro-grid">
    <blockquote class="pull reveal"><span aria-hidden="true">&ldquo;</span>${inline(quote)}</blockquote>
    <div class="intro-body reveal" style="--d:1">${paragraphs(page, body)}</div>
  </div>
</section>`;
};

const heroBlock = page => {
  const hero = page.hero;
  const { deck } = heroSplit(page);
  const categoryIndex = categories.findIndex(c => c.slug === page.slug);
  const eyebrow = hero.eyebrow
    ? esc(hero.eyebrow)
    : categoryIndex >= 0 ? `${icon(categoryIcons[page.slug], 16)} Coverage &middot; ${pad(categoryIndex + 1)} / ${pad(categories.length)}` : '';
  const topics = page.category
    ? (page.sections.find(s => s.cards)?.cards || []).map(card => `<a class="chip" href="#${slugify(card.h3)}">${esc(card.h3)}</a>`).join('')
    : '';
  const actions = hero.cta || hero.secondary
    ? `<div class="hero-actions">${hero.cta ? `<a class="btn" href="${hero.cta.href}">${esc(hero.cta.label)}${icon('arrow', 18)}</a>` : ''}${hero.secondary ? `<a class="btn-ghost" href="${hero.secondary.href}">${esc(hero.secondary.label)}</a>` : ''}</div>`
    : '';
  const text = `<div class="hero-text">
        ${eyebrow ? `<span class="eyebrow">${eyebrow}</span>` : ''}
        <h1>${esc(hero.h1)}</h1>
        ${page.updated ? `<p class="updated">Last Updated: ${esc(page.updated)}</p>` : ''}
        <div class="lead">${deck ? `<p>${inline(deck)}</p>` : paragraphs(page, hero.p)}</div>
        ${actions}
        ${topics ? `<nav class="topics" aria-label="On this page">${topics}</nav>` : ''}
      </div>`;

  if (page.slug === '') {
    return `<section class="hero hero-full">
    <div class="hero-bg">${picture(hero.image, { eager: true, sizes: '100vw' })}</div>
    <div class="wrap hero-full-grid">${text.replace('hero-text', 'hero-text hero-panel')}${evidenceCard()}</div>
  </section>`;
  }
  if (!hero.image) return `<section class="hero no-image">${sprig}<div class="wrap">${text}</div></section>`;
  return `<section class="hero">
    <div class="wrap">
      ${text}
      <figure class="hero-figure">${picture(hero.image, { eager: true })}</figure>
    </div>
  </section>`;
};

const renderPage = page => {
  const url = `${canonical}${path(page.slug)}`;
  const ogImage = `${canonical}/assets/images/${page.hero.image || 'desk-sea-view'}.webp`;
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
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Source+Sans+3:wght@400;500;600&display=swap">
  <link rel="stylesheet" href="/assets/css/site.css">
  <script>document.documentElement.classList.add('js')</script>
</head>
<body class="${page.legal ? 'legal' : ''}${page.slug === '' ? ' home' : ''}">
${header(page)}
<main id="main">
  ${heroBlock(page)}
  ${page.sections[0]?.type === 'facts' ? renderSection(page, page.sections[0], 0) : ''}
  ${introBlock(page)}
  ${page.sections.map((section, i) => (i === 0 && section.type === 'facts' ? '' : renderSection(page, section, i))).join('\n')}
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

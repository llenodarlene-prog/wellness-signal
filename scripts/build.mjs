import { createHash } from 'node:crypto';
import { cp, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { categories, pages } from '../content/pages.mjs';
import { inline as mdInline, plain, renderBlock } from './lib/markdown.mjs';
import { loadPosts } from './lib/posts.mjs';
import { charts } from '../content/charts.mjs';
import {
  categoryIcons, categoryLens, economy, partnerRules, evidenceLadder, icon, readingSteps, separations, sprig, standardIcons,
} from '../content/features.mjs';

const site = JSON.parse(await readFile('data/site.json', 'utf8'));
const environment = process.env.BUILD_ENV || 'local';
const production = environment === 'production';
const robots = production ? 'index,follow' : 'noindex,nofollow,noarchive';
const canonical = site.url.replace(/\/$/, '');
const year = new Date().getUTCFullYear();
const buildDate = process.env.BUILD_DATE || new Date().toISOString().slice(0, 10);
const posts = await loadPosts(buildDate);
const assetVersion = createHash('sha256')
  .update(await readFile('assets/css/site.css'))
  .update(await readFile('assets/js/site.js'))
  .digest('hex').slice(0, 10);

// Width and height of each WebP image, read from its file header.
const imageSize = {};
for (const name of (await readdir('assets/images')).filter(n => n.endsWith('.webp'))) {
  const b = await readFile(`assets/images/${name}`);
  const kind = b.toString('ascii', 12, 16);
  let size;
  if (kind === 'VP8X') size = [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)];
  else if (kind === 'VP8 ') size = [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
  else if (kind === 'VP8L') { const v = b.readUInt32LE(21); size = [(v & 0x3fff) + 1, ((v >> 14) & 0x3fff) + 1]; }
  if (size) imageSize[name.replace(/\.webp$/, '')] = size;
}
const dims = name => imageSize[name] || [1600, 900];

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
// Fold a one-sentence paragraph into its neighbour so short sections read as
// one paragraph. Placeholders and bold label lines (contact blocks) stay separate.
const sentenceCount = text => (text.match(/[.!?](\s|$)/g) || []).length;
const keepSeparate = text => text.includes('{{') || text.startsWith('**');
const mergeShort = (list = []) => list.reduce((out, text) => {
  const prev = out[out.length - 1];
  if (prev !== undefined && !keepSeparate(prev) && !keepSeparate(text)
    && (sentenceCount(prev) === 1 || sentenceCount(text) === 1)
    && prev.length + text.length <= 380) {
    out[out.length - 1] = `${prev} ${text}`;
  } else {
    out.push(text);
  }
  return out;
}, []);
const paragraphs = (page, list = []) => mergeShort(list).map(text => paragraph(page, text)).join('\n');

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
        <li><a href="/partner-with-us/">Partner With Us</a></li>
        <li><a href="/terms/">Terms and Conditions</a></li>
      </ul>
    </div>
    <p class="fine">&copy; ${year} ${esc(site.name)}. Editorial content is for general information and is not medical advice.</p>
  </div>
</footer>
<button class="to-top" type="button" aria-label="Back to top">${icon('arrow', 18)}</button>
<script src="/assets/js/site.js?v=${assetVersion}" defer></script>`;

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
      <h2>An Estimate and a Forecast Are Not the Same Number</h2>
      <p>The wellness economy is often quoted as a single figure. In practice, the latest annual estimate and a five-year projection come from different methods and carry different levels of certainty.</p>
      <p>We report them side by side and label each one, so readers can see which figure describes past activity and which is still a forecast.</p>
      <div class="toggle" role="group" aria-label="Chart view">
        <button type="button" class="chip" data-chart-view="measured" aria-pressed="false">Latest estimate only</button>
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
      <div class="legend"><span><i class="key measured"></i>Annual estimate</span><span><i class="key projected"></i>Projection</span></div>
      <p class="source">Source: <a href="${economy.sourceUrl}" rel="noopener" target="_blank">${esc(economy.source)}</a>. The ${economy.bars[1].label} value is a forecast.</p>
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

const ladderBlock = () => `<section class="section tone-white" id="evidence-ladder">
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
  if (section.type === 'partnerTable') return `<section class="section tone-cream">
  <div class="wrap">
    <div class="section-head reveal"><span class="eyebrow">Our standards</span><h2>What We Publish</h2><p>Partner content sits alongside our editorial coverage, so it has to meet the same bar.</p></div>
    <div class="table-wrap reveal">
      <table class="lens-table partner-table">
        <thead><tr><th scope="col">We accept</th><th scope="col">We decline</th></tr></thead>
        <tbody>${partnerRules.accept.map((a, i) => `<tr><td>${icon('check', 18)}<span>${esc(a)}</span></td><td><span class="x" aria-hidden="true">&times;</span><span>${esc(partnerRules.decline[i])}</span></td></tr>`).join('')}</tbody>
      </table>
    </div>
  </div>
</section>`;

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
  // Latest-article listings sit full width below the panel, three per row.
  let wide = '';
  if (section.empty) {
    const list = page.category ? posts.filter(post => post.category === page.slug) : posts;
    if (list.length) wide = postGrid(list.slice(0, 3));
    else body += `<div class="empty reveal">${sprig}<p>New articles will appear here as they are published.</p></div>`;
  }
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
  if (section.bg) {
    return `<section class="section has-bg bg-${section.bgStyle || 'dark'}"${id}>
      <div class="section-bg reveal">${picture(section.bg, { sizes: '100vw', alt: '' })}</div>
      <div class="wrap"><div class="bg-panel${wide ? ' bg-panel-wide' : ''}">${wide ? `<div class="panel-top">${head}${cta}</div>${body}<div class="bg-posts">${wide}</div>` : `${head}${body}${cta}`}</div></div>
    </section>${section.steps ? `<section class="section tone-white steps-band"><div class="wrap">${stepsBlock()}</div></section>` : ''}`;
  }
  const band = section.image ? `<figure class="media-band reveal">${picture(section.image, { sizes: '100vw' })}</figure>` : '';
  const deco = tone === 'forest' ? sprig : '';
  return `<section class="section tone-${tone}"${id}>${deco}<div class="wrap">${band}${head}${body}${wide}${cta}</div></section>`;
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
  <div class="wrap statement reveal">${sprig}<p class="statement-main">${inline(intro.join(' '))}</p></div>
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

const docHead = ({ title, description, url, image, type = 'website', jsonLd = [], preload, extra = '' }) => `<!doctype html>
<html lang="${site.locale}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <meta name="robots" content="${robots}">
  <link rel="canonical" href="${url}">
  <meta property="og:type" content="${type}">
  <meta property="og:site_name" content="${esc(site.name)}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${canonical}/assets/images/${image}.webp">
  <meta property="og:image:width" content="${dims(image)[0]}">
  <meta property="og:image:height" content="${dims(image)[1]}">
  <meta property="og:image:alt" content="${esc(alts[image] || title)}">
  <meta property="og:locale" content="${site.locale.replace('-', '_')}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image" content="${canonical}/assets/images/${image}.webp">
  <meta name="theme-color" content="#1F6B4F">
  <meta name='impact-site-verification' value='a1f2c282-b0f5-44f1-861f-af5420f81cdd'>
  ${extra}
  <link rel="icon" type="image/png" sizes="32x32" href="/assets/brand/mark-32.png">
  <link rel="icon" type="image/png" sizes="192x192" href="/assets/brand/mark-192.png">
  <link rel="apple-touch-icon" href="/assets/brand/apple-touch-icon.png">
  ${preload ? `<link rel="preload" as="image" type="image/webp" href="/assets/images/${preload}.webp" imagesrcset="/assets/images/${preload}-800.webp 800w, /assets/images/${preload}.webp 1672w" imagesizes="(max-width: 860px) 100vw, 50vw" fetchpriority="high">` : ''}
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Source+Sans+3:wght@400;500;600&display=swap">
  <link rel="stylesheet" href="/assets/css/site.css?v=${assetVersion}">
  ${jsonLd.map(data => `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`).join('\n  ')}
  <script>document.documentElement.classList.add('js')</script>
</head>`;

const organization = {
  '@type': 'Organization',
  '@id': `${canonical}/#organization`,
  name: site.name,
  url: `${canonical}/`,
  logo: { '@type': 'ImageObject', url: `${canonical}/assets/brand/mark-512.png`, width: 512, height: 512 },
  email: site.editorial_email || undefined,
  slogan: site.tagline,
  description: site.description,
};
const websiteId = `${canonical}/#website`;
const website = {
  '@type': 'WebSite',
  '@id': websiteId,
  url: `${canonical}/`,
  name: site.name,
  description: site.description,
  publisher: { '@id': organization['@id'] },
  inLanguage: site.locale,
};
const crumbs = (url, trail) => ({
  '@type': 'BreadcrumbList',
  '@id': `${url}#breadcrumb`,
  itemListElement: [{ name: 'Home', item: `${canonical}/` }, ...trail]
    .map((step, i) => ({ '@type': 'ListItem', position: i + 1, ...step })),
});
// Topic hubs: each category page is a CollectionPage whose hasPart lists its live posts.
const hubId = slug => `${canonical}/${slug}/#collection`;
const pageGraph = page => {
  const url = `${canonical}${path(page.slug)}`;
  const id = `${url}#webpage`;
  if (page.slug === '') {
    return [organization, website, { '@type': 'WebPage', '@id': id, url, name: page.title, description: page.description, isPartOf: { '@id': websiteId }, about: { '@id': organization['@id'] }, inLanguage: site.locale }];
  }
  const breadcrumb = crumbs(url, [{ name: page.nav || page.footerOnly || page.hero?.title || page.title, item: url }]);
  if (page.category) {
    const live = posts.filter(post => post.category === page.slug);
    return [organization, website, breadcrumb, {
      '@type': 'CollectionPage', '@id': hubId(page.slug), url, name: page.title, description: page.description,
      isPartOf: { '@id': websiteId }, breadcrumb: { '@id': breadcrumb['@id'] }, inLanguage: site.locale,
      ...(live.length ? { hasPart: live.map(post => ({ '@id': `${canonical}${post.url}#article` })) } : {}),
    }];
  }
  return [organization, website, breadcrumb, { '@type': 'WebPage', '@id': id, url, name: page.title, description: page.description, isPartOf: { '@id': websiteId }, breadcrumb: { '@id': breadcrumb['@id'] }, inLanguage: site.locale }];
};

const renderPage = page => {
  const url = `${canonical}${path(page.slug)}`;
  const jsonLd = [{ '@context': 'https://schema.org', '@graph': pageGraph(page) }];
  return `${docHead({ title: page.title, description: page.description, url, image: page.hero.image || 'desk-sea-view', jsonLd, preload: page.hero.image })}
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

// ---------- Articles ----------

const categoryName = slug => categories.find(c => c.slug === slug)?.name || slug;
const longDate = iso => new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });

const postCard = (post, i = 0) => `<a class="post-card reveal" href="${post.url}" style="--d:${i % 3}">
  <span class="post-media">${picture(post.image, { sizes: '(max-width: 640px) 100vw, 400px', alt: '' })}</span>
  <span class="post-body">
    <span class="post-meta">${icon(categoryIcons[post.category], 15)} ${esc(categoryName(post.category))} &middot; ${esc(post.type || 'Article')} &middot; ${post.readingMinutes} min read</span>
    <h3>${esc(post.title)}</h3>
    <span class="post-excerpt">${esc(post.description)}</span>
    <span class="more">Read ${post.type === 'Blog' ? 'blog' : 'article'} ${icon('arrow', 16)}</span>
  </span>
</a>`;
const postGrid = list => `<div class="post-grid">${list.map(postCard).join('')}</div>`;

const takeawaysBlock = section => {
  const list = section.blocks.find(block => block.type === 'ul' || block.type === 'ol');
  return `<section class="takeaways" id="${section.id}" aria-labelledby="${section.id}-h">
    <h2 id="${section.id}-h">${esc(section.title)}</h2>
    <ul>${(list?.items || []).map(item => `<li>${icon('check', 18)}<span>${mdInline(item)}</span></li>`).join('')}</ul>
  </section>`;
};

const faqBlock = (post, section) => `<section class="faq" id="${section.id}">
  <h2>${esc(section.title)}</h2>
  ${post.faqs.map((faq, i) => `<details${i === 0 ? ' open' : ''}><summary>${esc(faq.q)}<span class="faq-icon" aria-hidden="true"></span></summary><div class="faq-a">${faq.a.map(renderBlock).join('')}</div></details>`).join('')}
</section>`;

const sourcesBlock = section => `<section class="sources" id="${section.id}">
  <h2>${esc(section.title)}</h2>
  ${section.blocks.map(block => (block.type === 'ul' ? `<ol>${block.items.map(item => `<li>${mdInline(item)}</li>`).join('')}</ol>` : renderBlock(block))).join('')}
</section>`;

const renderPost = post => {
  const url = `${canonical}${post.url}`;
  const category = categories.find(c => c.slug === post.category);
  const others = posts.filter(other => other !== post);
  const related = [...others.filter(o => o.category === post.category), ...others.filter(o => o.category !== post.category)].slice(0, 3);
  const toc = post.sections.filter(section => !/^Sources$/i.test(section.title));
  const imageUrl = `${canonical}/assets/images/${post.image}.webp`;
  const pageId = `${url}#webpage`;
  const articleId = `${url}#article`;
  const webpage = {
    '@type': 'WebPage',
    '@id': pageId,
    url,
    name: post.title,
    description: post.description,
    isPartOf: { '@id': websiteId },
    breadcrumb: { '@id': `${url}#breadcrumb` },
    mainEntity: { '@id': articleId },
    primaryImageOfPage: { '@type': 'ImageObject', url: imageUrl, width: dims(post.image)[0], height: dims(post.image)[1] },
    inLanguage: site.locale,
  };
  const article = {
    '@type': post.type === 'Blog' ? 'BlogPosting' : 'Article',
    '@id': articleId,
    headline: post.title,
    description: post.description,
    image: [imageUrl],
    datePublished: post.published,
    dateModified: post.updated,
    mainEntityOfPage: { '@id': pageId },
    isPartOf: { '@id': hubId(post.category) },
    wordCount: post.words,
    articleSection: categoryName(post.category),
    keywords: post.keywords,
    author: { '@id': organization['@id'] },
    publisher: { '@id': organization['@id'] },
    inLanguage: site.locale,
  };
  const breadcrumb = crumbs(url, [
    { name: categoryName(post.category), item: `${canonical}/${post.category}/` },
    { name: post.title, item: url },
  ]);
  const graph = [organization, website, webpage, article, breadcrumb];
  if (post.faqs.length) {
    graph.push({
      '@type': 'FAQPage',
      '@id': `${url}#faq`,
      mainEntity: post.faqs.map(faq => ({
        '@type': 'Question',
        name: faq.q,
        acceptedAnswer: { '@type': 'Answer', text: plain(faq.a.map(block => block.text || '').join(' ')) },
      })),
    });
  }
  const jsonLd = [{ '@context': 'https://schema.org', '@graph': graph }];
  const extra = `<meta property="article:published_time" content="${post.published}">
  <meta property="article:modified_time" content="${post.updated}">
  <meta property="article:section" content="${esc(categoryName(post.category))}">`;

  const body = post.sections.map(section => {
    if (/^Key Takeaways$/i.test(section.title)) return takeawaysBlock(section);
    if (section.title === post.faqTitle) return faqBlock(post, section);
    if (/^Sources$/i.test(section.title)) return sourcesBlock(section);
    return `<section id="${section.id}"><h2>${esc(section.title)}</h2>${section.blocks.map(block => renderBlock(block, charts)).join('\n')}</section>`;
  }).join('\n');

  return `${docHead({ title: post.seo_title || post.title, description: post.description, url, image: post.image, type: 'article', jsonLd, preload: post.image, extra })}
<body class="post-page">
${header({ slug: post.category })}
<main id="main">
  <header class="post-hero">
    <div class="wrap">
      <nav class="breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><a href="/${post.category}/">${esc(categoryName(post.category))}</a><span aria-hidden="true">/</span><span aria-current="page">${esc(post.type || 'Article')}</span></nav>
      <span class="eyebrow">${icon(categoryIcons[post.category], 16)} ${esc(categoryName(post.category))} &middot; ${esc(post.type || 'Article')}</span>
      <h1>${esc(post.title)}</h1>
      <p class="post-deck">${esc(post.description)}</p>
      <p class="post-byline"><span>By ${esc(site.name)} Editorial</span><span><time datetime="${post.published}">${longDate(post.published)}</time></span><span>${post.readingMinutes} min read</span></p>
    </div>
    <figure class="wrap post-figure">${picture(post.image, { eager: true, sizes: '(max-width: 1240px) 100vw, 1200px', alt: post.image_alt || '' })}</figure>
  </header>
  <div class="wrap post-layout">
    <aside class="toc" aria-label="On this page">
      <p class="toc-title">On this page</p>
      <ol>${toc.map(section => `<li><a href="#${section.id}">${esc(section.title)}</a></li>`).join('')}</ol>
    </aside>
    <article class="prose">
      <div class="post-intro">${post.intro.map(block => renderBlock(block, charts)).join('\n')}</div>
      ${body}
    </article>
  </div>
  ${related.length ? `<section class="section tone-white related"><div class="wrap"><div class="section-head"><span class="eyebrow">Keep reading</span><h2>More From Wellness Signal</h2></div>${postGrid(related)}</div></section>` : ''}
  <section class="section has-bg bg-light">
    <div class="section-bg">${picture(category?.image || 'desk-sea-view', { sizes: '100vw', alt: '' })}</div>
    <div class="wrap"><div class="bg-panel"><div class="section-head"><h2>More ${esc(categoryName(post.category))} Coverage</h2><p>${esc(category?.summary || '')}</p></div><p><a class="btn" href="/${post.category}/">Explore ${esc(categoryName(post.category))}${icon('arrow', 18)}</a></p></div></div>
  </section>
</main>
${footer}
</body>
</html>
`;
};

const articlesPage = {
  slug: 'articles',
  title: 'Wellness Articles, Research & Analysis | Wellness Signal',
  description: 'Browse Wellness Signal articles and analysis on wellness statistics, fitness, sleep, longevity, beauty, workplace wellbeing, and wellness travel.',
};
const renderArticlesIndex = () => {
  const url = `${canonical}/articles/`;
  const filters = categories.filter(c => posts.some(p => p.category === c.slug));
  const breadcrumb = crumbs(url, [{ name: 'Articles', item: url }]);
  const jsonLd = [{ '@context': 'https://schema.org', '@graph': [organization, website, breadcrumb, {
    '@type': 'CollectionPage', '@id': `${url}#collection`, url, name: articlesPage.title, description: articlesPage.description,
    isPartOf: { '@id': websiteId }, breadcrumb: { '@id': breadcrumb['@id'] }, inLanguage: site.locale,
    ...(posts.length ? { hasPart: posts.map(post => ({ '@id': `${canonical}${post.url}#article` })) } : {}),
  }] }];
  return `${docHead({ title: articlesPage.title, description: articlesPage.description, url, image: posts[0]?.image || 'desk-sea-view', jsonLd })}
<body>
${header({ slug: 'articles' })}
<main id="main">
  <section class="hero no-image articles-hero">${sprig}
    <div class="wrap"><div class="hero-text">
      <span class="eyebrow">Latest research</span>
      <h1>Articles and Analysis</h1>
      <div class="lead"><p>Research, statistics, and industry analysis across seven areas of wellness, with every figure traced to its source.</p></div>
      ${filters.length > 1 ? `<div class="topics" role="group" aria-label="Filter by category"><button type="button" class="chip" data-filter="all" aria-pressed="true">All</button>${filters.map(c => `<button type="button" class="chip" data-filter="${c.slug}" aria-pressed="false">${esc(c.name)}</button>`).join('')}</div>` : ''}
    </div></div>
  </section>
  <section class="section tone-white"><div class="wrap">
    ${posts.length ? `<div class="post-grid" data-filterable>${posts.map((post, i) => postCard(post, i).replace('class="post-card reveal"', `class="post-card reveal" data-category="${post.category}"`)).join('')}</div>` : `<div class="empty">${sprig}<p>New articles will appear here as they are published.</p></div>`}
  </div></section>
</main>
${footer}
</body>
</html>
`;
};

await mkdir('dist', { recursive: true });
await cp('assets', 'dist/assets', { recursive: true });
// Server config (.htaccess) and other root files.
await cp('static', 'dist', { recursive: true });

for (const page of pages) {
  const dir = page.slug ? `dist/${page.slug}` : 'dist';
  await mkdir(dir, { recursive: true });
  await writeFile(`${dir}/index.html`, renderPage(page));
}

for (const post of posts) {
  await mkdir(`dist${post.url}`, { recursive: true });
  await writeFile(`dist${post.url}index.html`, renderPost(post));
}
await mkdir('dist/articles', { recursive: true });
await writeFile('dist/articles/index.html', renderArticlesIndex());

if (production && pending.length) {
  throw new Error(`Production build blocked; confirm these details first:\n- ${[...new Set(pending)].join('\n- ')}`);
}

await writeFile('dist/404.html', `<!doctype html><html lang="${site.locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Page Not Found | ${esc(site.name)}</title><script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'WebPage', name: 'Page Not Found', isPartOf: { '@id': websiteId } })}</script><link rel="stylesheet" href="/assets/css/site.css?v=${assetVersion}"></head><body><main class="hero no-image"><div class="wrap"><div class="hero-text"><h1>Page Not Found</h1><p>The page you were looking for has moved or no longer exists.</p><a class="btn" href="/">Back to Wellness Signal</a></div></div></main></body></html>`);
await writeFile('dist/robots.txt', production
  ? `User-agent: *\nAllow: /\nSitemap: ${canonical}/sitemap.xml\n`
  : 'User-agent: *\nDisallow: /\n'
);
await writeFile('dist/sitemap.xml', production
  ? `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${pages.map(page => `<url><loc>${canonical}${path(page.slug)}</loc></url>`).join('')}<url><loc>${canonical}/articles/</loc></url>${posts.map(post => `<url><loc>${canonical}${post.url}</loc><lastmod>${post.updated}</lastmod></url>`).join('')}</urlset>`
  : '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>'
);
// llms.txt: live posts grouped by silo, from the same set as the sitemap.
const silo = slug => posts.filter(post => post.category === slug)
  .sort((a, b) => (a.role === 'hub' ? -1 : b.role === 'hub' ? 1 : a.title.localeCompare(b.title)));
await writeFile('dist/llms.txt', production
  ? [`# ${site.name}`, '', `> ${site.description}`, '',
    `${site.name} publishes sourced research and analysis on the business and evidence behind wellness. Every statistic links to its primary source.`, '',
    '## Site', '', `- [About](${canonical}/about/): Who we are and our editorial standards`, `- [All articles](${canonical}/articles/): Every published article and blog`, `- [Contact](${canonical}/contact/): Editorial contact`, '',
    ...categories.filter(c => posts.some(p => p.category === c.slug)).flatMap(c => [
      `## ${c.name}`, '', `- [${c.name} hub](${canonical}/${c.slug}/): ${c.summary}`,
      ...silo(c.slug).map(post => `- [${post.title}](${canonical}${post.url}): ${plain(post.description)}`), '',
    ]),
  ].join('\n')
  : `# ${site.name}\n\n> Staging preview. Not for indexing.\n`);

await writeFile('dist/build-manifest.json', JSON.stringify({
  environment,
  indexable: production,
  pending: [...new Set(pending)],
  pages: [
    ...pages.map(page => ({ slug: path(page.slug), draft: false })),
    { slug: '/articles/', draft: false },
    ...posts.map(post => ({ slug: post.url, draft: false, published: post.published })),
  ],
}, null, 2));

console.log(`Built Wellness Signal (${environment}; indexable=${production}; ${pages.length} pages, ${posts.length} posts)`);
if (pending.length) console.log(`Pending details (block production): ${new Set(pending).size}`);

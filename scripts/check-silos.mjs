// Silo and content checks (SEO, AEO and GEO SOP, steps 1 to 5).
// Hub-and-spoke rules count only links inside the post body, never menus,
// cards or "related" lists, because only body links carry topical context.
import { readdir } from 'node:fs/promises';
import { categories, pages } from '../content/pages.mjs';
import { loadPosts } from './lib/posts.mjs';
import { toBlocks } from './lib/markdown.mjs';

const today = process.env.BUILD_DATE || new Date().toISOString().slice(0, 10);
const posts = await loadPosts(today);
const byUrl = new Map(posts.map(post => [post.url, post]));
const scheduled = new Set((await loadPosts('9999-12-31')).map(post => post.url).filter(url => !byUrl.has(url)));
const pageUrls = new Set([...pages.map(page => (page.slug ? `/${page.slug}/` : '/')), '/articles/']);
const images = new Set((await readdir('assets/images')).map(name => name.replace(/\.webp$/, '')));
const failures = [];
const fail = (post, message) => failures.push(`${post.url}: ${message}`);

// Body text without the Sources list, so source links are not counted as internal.
const bodyOf = post => post.body.split(/\n## Sources\b/)[0];
const links = post => [...bodyOf(post).matchAll(/\]\(([^)\s]+)\)/g)].map(m => m[1]);
// Links to scheduled posts are hidden by the build until their date, so they do not count yet.
const internal = post => [...new Set(links(post).filter(href => href.startsWith('/')).map(href => href.split('#')[0]))].filter(href => !scheduled.has(href));

const inbound = new Map(posts.map(post => [post.url, new Set()]));
// A post that opens a new silo cannot have inbound links on day one. Within its
// first 7 days, links from posts already scheduled in that window also count.
const all = await loadPosts('9999-12-31');
const addDays = (iso, n) => new Date(Date.parse(`${iso}T00:00:00Z`) + n * 864e5).toISOString().slice(0, 10);
for (const post of posts) {
  for (const later of all.filter(p => !byUrl.has(p.url) && p.published <= addDays(post.published, 7))) {
    if ([...later.body.split(/\n## Sources\b/)[0].matchAll(/\]\((\/[^)\s#]*)/g)].some(m => m[1] === post.url)) inbound.get(post.url).add(later.url);
  }
}
for (const post of posts) {
  for (const href of internal(post)) {
    if (byUrl.has(href)) { if (href !== post.url) inbound.get(href).add(post.url); }
    else if (!pageUrls.has(href)) fail(post, `body links to ${href}, which is not a live page`);
  }
}

for (const category of categories) {
  const silo = posts.filter(post => post.category === category.slug);
  if (!silo.length) continue;
  const hubs = silo.filter(post => post.role === 'hub');
  if (hubs.length !== 1) { failures.push(`/${category.slug}/: silo needs exactly one live hub post, found ${hubs.length}`); continue; }
  const [hub] = hubs;
  for (const spoke of silo.filter(post => post !== hub)) {
    if (!internal(spoke).includes(hub.url)) fail(spoke, `spoke must link up to its pillar ${hub.url}`);
    if (!internal(hub).includes(spoke.url)) fail(hub, `pillar must link down to spoke ${spoke.url}`);
  }
}

const seen = { title: new Map(), seo: new Map(), description: new Map(), image: new Map() };
const unique = (post, kind, value) => {
  if (seen[kind].has(value)) fail(post, `duplicate ${kind} (also on ${seen[kind].get(value)})`);
  seen[kind].set(value, post.url);
};

for (const post of posts) {
  if (!['hub', 'supporting', 'bridge'].includes(post.role)) fail(post, `unknown role "${post.role}"`);
  if (inbound.get(post.url).size < 2) fail(post, `needs 2 body links from other posts, has ${inbound.get(post.url).size}`);
  // Planned links to scheduled posts count toward the total; they go live on their date.
  const count = [...new Set(links(post).filter(href => href.startsWith('/')).map(href => href.split('#')[0]))].length;
  if (post.role !== 'hub' && (count < 2 || count > 4)) fail(post, `spokes need 2 to 3 internal body links, has ${count}`);

  unique(post, 'title', post.title);
  unique(post, 'seo', post.seo_title || post.title);
  unique(post, 'description', post.description);
  unique(post, 'image', post.image);
  if (post.description.length > 160) fail(post, `meta description is ${post.description.length} characters (max 160)`);
  if (!post.image_alt) fail(post, 'featured image needs alt text');
  if (!images.has(post.image)) fail(post, `missing image ${post.image}`);
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(post.slug)) fail(post, `slug "${post.slug}" must be lowercase words joined by hyphens`);

  const keyword = String(post.primary_keyword || '').toLowerCase();
  if (!keyword) fail(post, 'missing primary_keyword');
  else {
    if (!`${post.title} ${post.seo_title || ''}`.toLowerCase().includes(keyword)) fail(post, `primary keyword "${keyword}" not in title`);
    const opening = post.intro.filter(block => block.type === 'p' && !block.text.startsWith('{{')).slice(0, 3).map(block => block.text).join(' ').toLowerCase();
    if (!opening.includes(keyword)) fail(post, `primary keyword "${keyword}" not in the opening paragraphs`);
  }

  const blocks = toBlocks(post.body);
  if (blocks.filter(block => block.type === 'h' && block.level === 1).length !== 1) fail(post, 'needs exactly one H1');
  let level = 1;
  for (const block of blocks.filter(b => b.type === 'h')) {
    if (block.level > level + 1) fail(post, `heading "${block.text}" skips from H${level} to H${block.level}`);
    level = block.level;
  }
  // Headings use title case: every word starts with a capital except short minor words.
  const minor = new Set(['a', 'an', 'the', 'and', 'but', 'or', 'nor', 'for', 'so', 'yet', 'as', 'at', 'by', 'in', 'of', 'off', 'on', 'per', 'to', 'up', 'via', 'vs', 'vs.']);
  for (const block of blocks.filter(b => b.type === 'h')) {
    const words = block.text.split(/\s+/).filter(Boolean);
    words.forEach((word, i) => {
      const bare = word.replace(/^[\u201c\u2018"'(\[]+/, '');
      const first = i === 0 || /[:]$/.test(words[i - 1] || '') || /^\d+[.)]$/.test(words[i - 1] || '');
      if (!/^[a-z]/.test(bare)) return;
      if (!first && i !== words.length - 1 && minor.has(bare.replace(/[?:.,!]+$/, ''))) return;
      fail(post, `heading "${block.text}" is not in title case ("${word}")`);
    });
  }
  if (post.faqs.length < 3) fail(post, `needs at least 3 FAQs, has ${post.faqs.length}`);
  const external = new Set(links(post).filter(href => /^https?:\/\//.test(href)));
  const sources = (post.body.split(/\n## Sources\b/)[1] || '').match(/\]\(https?:/g) || [];
  if (external.size + sources.length < 3) fail(post, 'needs at least 3 links to primary sources');
  if (/—/.test(post.body)) fail(post, 'contains an em dash');
}

if (failures.length) {
  console.error(`Silo checks failed:\n- ${failures.join('\n- ')}`);
  process.exit(1);
}
console.log(`Silo checks passed (${posts.length} live posts across ${new Set(posts.map(p => p.category)).size} silos, as of ${today}).`);

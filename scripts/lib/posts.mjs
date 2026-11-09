import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { parsePost, plain, slugify, toBlocks } from './markdown.mjs';

// Loads approved posts from content/posts. A post is included when it is not a
// draft and its publish moment is on or before the cutoff. The publish moment is
// `published` (YYYY-MM-DD) plus optional `publish_time` (HH:MM, UTC, default 00:00).
// The cutoff is either a date (meaning the end of that day) or an ISO date-time.
export const publishMoment = meta => `${String(meta.published || '')}T${/^\d{2}:\d{2}$/.test(String(meta.publish_time || '')) ? meta.publish_time : '00:00'}`;
export const cutoffKey = cutoff => (String(cutoff).length === 10 ? `${cutoff}T23:59` : String(cutoff).slice(0, 16));
export const loadPosts = async (today = new Date().toISOString().slice(0, 16)) => {
  const cutoff = cutoffKey(today);
  let names = [];
  try {
    names = (await readdir('content/posts')).filter(name => name.endsWith('.md')).sort();
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }

  const posts = [];
  for (const name of names) {
    const { meta, body } = parsePost(await readFile(path.join('content/posts', name), 'utf8'));
    const published = String(meta.published || '');
    if (meta.draft === true || !/^\d{4}-\d{2}-\d{2}$/.test(published) || publishMoment(meta) > cutoff) continue;
    if (meta.publish_time !== undefined && !/^\d{2}:\d{2}$/.test(String(meta.publish_time))) throw new Error(`${name}: publish_time must be HH:MM (UTC)`);
    for (const key of ['title', 'description', 'category', 'slug', 'image']) {
      if (!meta[key]) throw new Error(`${name}: missing front matter "${key}"`);
    }

    // Drop the Markdown H1; the template renders the title.
    const blocks = toBlocks(body).filter(block => !(block.type === 'h' && block.level === 1));

    // Group blocks into an intro plus one section per H2.
    const intro = [];
    const sections = [];
    for (const block of blocks) {
      if (block.type === 'h' && block.level === 2) {
        sections.push({ title: block.text, id: slugify(block.text), blocks: [] });
      } else if (sections.length) {
        sections[sections.length - 1].blocks.push(block);
      } else {
        intro.push(block);
      }
    }

    const faqSection = sections.find(section => /^FAQs?\b/i.test(section.title));
    const faqs = [];
    if (faqSection) {
      let current = null;
      for (const block of faqSection.blocks) {
        if (block.type === 'h' && block.level === 3) {
          current = { q: block.text, a: [] };
          faqs.push(current);
        } else if (current) {
          current.a.push(block);
        }
      }
    }

    const words = body.split(/\s+/).filter(Boolean).length;
    posts.push({
      ...meta,
      published,
      publishAt: publishMoment(meta),
      updated: String(meta.updated || published),
      url: `/${meta.category}/${meta.slug}/`,
      intro,
      sections,
      faqs,
      faqTitle: faqSection?.title,
      words,
      role: String(meta.role || 'supporting'),
      body,
      readingMinutes: Math.max(1, Math.round(words / 230)),
      keywords: String(meta.keywords || ''),
      plainDescription: plain(meta.description),
    });
  }
  return posts.sort((a, b) => (a.publishAt < b.publishAt ? 1 : a.publishAt > b.publishAt ? -1 : a.title.localeCompare(b.title)));
};

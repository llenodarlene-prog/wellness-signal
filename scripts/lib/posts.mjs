import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { parsePost, plain, slugify, toBlocks } from './markdown.mjs';

// Loads approved posts from content/posts. A post is included when it is not a
// draft and its `published` date (YYYY-MM-DD) is on or before the build date.
export const loadPosts = async (today = new Date().toISOString().slice(0, 10)) => {
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
    if (meta.draft === true || !/^\d{4}-\d{2}-\d{2}$/.test(published) || published > today) continue;
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
      updated: String(meta.updated || published),
      url: `/${meta.category}/${meta.slug}/`,
      intro,
      sections,
      faqs,
      faqTitle: faqSection?.title,
      readingMinutes: Math.max(1, Math.round(words / 230)),
      keywords: String(meta.keywords || ''),
      plainDescription: plain(meta.description),
    });
  }
  return posts.sort((a, b) => (a.published < b.published ? 1 : a.published > b.published ? -1 : a.title.localeCompare(b.title)));
};

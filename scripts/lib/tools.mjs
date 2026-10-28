import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { parsePost, slugify, toBlocks } from './markdown.mjs';

// Standalone calculator pages from content/tools, served at /<slug>/.
export const loadTools = async () => {
  let names = [];
  try {
    names = (await readdir('content/tools')).filter(name => name.endsWith('.md')).sort();
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  const tools = [];
  for (const name of names) {
    const { meta, body } = parsePost(await readFile(path.join('content/tools', name), 'utf8'));
    for (const key of ['title', 'seo_title', 'description', 'slug', 'calc', 'updated']) {
      if (!meta[key]) throw new Error(`${name}: missing front matter "${key}"`);
    }
    const intro = [];
    const sections = [];
    for (const block of toBlocks(body).filter(b => !(b.type === 'h' && b.level === 1))) {
      if (block.type === 'h' && block.level === 2) sections.push({ title: block.text, id: slugify(block.text), blocks: [] });
      else if (sections.length) sections[sections.length - 1].blocks.push(block);
      else intro.push(block);
    }
    const faqSection = sections.find(section => /^FAQs?\b/i.test(section.title));
    const faqs = [];
    let current = null;
    for (const block of faqSection?.blocks || []) {
      if (block.type === 'h' && block.level === 3) faqs.push(current = { q: block.text, a: [] });
      else if (current) current.a.push(block);
    }
    tools.push({ ...meta, url: `/${meta.slug}/`, intro, sections, faqs, faqTitle: faqSection?.title, body });
  }
  return tools;
};

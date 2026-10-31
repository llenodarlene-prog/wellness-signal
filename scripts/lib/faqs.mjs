import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { parsePost, slugify, toBlocks } from './markdown.mjs';

// FAQ hubs from content/faq: index.md is /faq/, x.md is /faq/x/, a/index.md is /faq/a/.
const walk = async dir => (await Promise.all((await readdir(dir, { withFileTypes: true })).map(e => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)])))).flat();

export const loadFaqs = async () => {
  let files = [];
  try {
    files = (await walk('content/faq')).filter(f => f.endsWith('.md')).sort();
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  const pages = [];
  for (const file of files) {
    const { meta, body } = parsePost(await readFile(file, 'utf8'));
    for (const key of ['title', 'seo_title', 'description', 'updated']) {
      if (!meta[key]) throw new Error(`${file}: missing front matter "${key}"`);
    }
    const rel = path.relative('content/faq', file).replace(/\\/g, '/').replace(/(^|\/)index\.md$/, '').replace(/\.md$/, '');
    const intro = [];
    const sections = [];
    for (const block of toBlocks(body).filter(b => !(b.type === 'h' && b.level === 1))) {
      if (block.type === 'h' && block.level === 2) sections.push({ title: block.text, id: slugify(block.text), lead: [], questions: [] });
      else if (!sections.length) intro.push(block);
      else {
        const section = sections[sections.length - 1];
        if (block.type === 'h' && block.level === 3) section.questions.push({ q: block.text, id: slugify(block.text), a: [] });
        else if (section.questions.length) section.questions[section.questions.length - 1].a.push(block);
        else section.lead.push(block);
      }
    }
    pages.push({ ...meta, url: rel ? `/faq/${rel}/` : '/faq/', depth: rel ? rel.split('/').length : 0, intro, sections, body });
  }
  return pages;
};

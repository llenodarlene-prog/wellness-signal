import { renderCalculator } from './calculators.mjs';
// Small Markdown renderer for editorial posts: headings, paragraphs, emphasis,
// links, ordered/unordered lists, pipe tables, and blockquotes. It returns
// structured blocks so the post template can style sections (Key Takeaways,
// FAQs, Sources) and build a table of contents and FAQ schema.

const esc = value => String(value)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const slugify = text => text.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const inline = text => {
  let html = esc(text);
  html = html.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, href) => {
    const external = /^https?:\/\//.test(href);
    return `<a href="${href}"${external ? ' rel="noopener" target="_blank"' : ''}>${label}</a>`;
  });
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/(^|[^*])\*(?!\s)(.+?)\*(?!\*)/g, '$1<em>$2</em>');
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  return html;
};

export const plain = text => text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/[*`]/g, '');

const splitRow = line => line.trim().replace(/^\||\|$/g, '').split('|').map(cell => cell.trim());

// Parse front matter (key: value) and body.
export const parsePost = raw => {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  const meta = {};
  if (!match) return { meta, body: raw };
  for (const line of match[1].split(/\r?\n/)) {
    const colon = line.indexOf(':');
    if (colon < 1) continue;
    let value = line.slice(colon + 1).trim().replace(/^["']|["']$/g, '');
    if (value === 'true') value = true;
    if (value === 'false') value = false;
    meta[line.slice(0, colon).trim()] = value;
  }
  return { meta, body: match[2] };
};

// Turn Markdown into a flat list of blocks.
export const toBlocks = markdown => {
  const lines = markdown.replace(/\r/g, '').split('\n');
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i += 1; continue; }
    const heading = line.match(/^(#{1,4})\s+(.*)$/);
    if (heading) {
      blocks.push({ type: 'h', level: heading[1].length, text: heading[2].trim() });
      i += 1;
      continue;
    }
    if (/^\s*\|/.test(line) && lines[i + 1] && /^\s*\|?\s*:?-{3,}/.test(lines[i + 1])) {
      const head = splitRow(line);
      const rows = [];
      i += 2;
      while (i < lines.length && /^\s*\|/.test(lines[i])) { rows.push(splitRow(lines[i])); i += 1; }
      blocks.push({ type: 'table', head, rows });
      continue;
    }
    if (/^\s*[-*]\s+/.test(line) || /^\s*\d+\.\s+/.test(line)) {
      const ordered = /^\s*\d+\./.test(line);
      const items = [];
      while (i < lines.length && (ordered ? /^\s*\d+\.\s+/ : /^\s*[-*]\s+/).test(lines[i])) {
        items.push(lines[i].replace(/^\s*(?:[-*]|\d+\.)\s+/, ''));
        i += 1;
      }
      blocks.push({ type: ordered ? 'ol' : 'ul', items });
      continue;
    }
    if (/^>\s?/.test(line)) {
      const quote = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) { quote.push(lines[i].replace(/^>\s?/, '')); i += 1; }
      blocks.push({ type: 'quote', text: quote.join(' ') });
      continue;
    }
    const para = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,4}\s|\s*\||\s*[-*]\s|\s*\d+\.\s|>)/.test(lines[i])) {
      para.push(lines[i].replace(/\\$/, '').trim());
      i += 1;
    }
    blocks.push({ type: 'p', text: para.join(' ') });
  }
  return blocks;
};

const fmt = (chart, row, key) => {
  const value = row[key];
  const prefix = row.prefix?.[key] || '';
  const digits = chart.decimals ?? (Number.isInteger(value) ? 0 : 1);
  const number = value.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
  return `${prefix}${chart.currency || ''}${number}${chart.unit || ''}`;
};

// Animated horizontal bar chart; bars grow when the figure scrolls into view.
export const renderChart = (chart, id) => {
  if (!chart) throw new Error(`Unknown chart "${id}"`);
  const multi = chart.series.length > 1;
  return `<figure class="bar-chart reveal" data-bars>
  <figcaption>${esc(chart.title)}</figcaption>
  ${multi ? `<div class="bc-legend">${chart.series.map((s, i) => `<span><i class="bc-key s${i}"></i>${esc(s.label)}</span>`).join('')}</div>` : ''}
  <div class="bc-rows">
    ${chart.rows.map(row => `<div class="bc-row">
      <span class="bc-label">${esc(row.label)}</span>
      <span class="bc-bars">${chart.series.map((s, i) => `<span class="bc-bar s${i}${row.projected ? ' projected' : ''}" style="--w:${Math.max((row[s.key] / chart.max) * 100, row[s.key] ? 2 : 0)}%" title="${esc(`${s.label}: ${fmt(chart, row, s.key)}`)}"><span class="bc-fill"></span><span class="bc-val">${esc(fmt(chart, row, s.key))}</span></span>`).join('')}</span>
    </div>`).join('')}
  </div>
  <p class="bc-source">Source: ${esc(chart.source)}${chart.note ? ` ${esc(chart.note)}` : ''}</p>
</figure>`;
};

export const renderBlock = (block, charts = {}, calcs = {}) => {
  if (block.type === 'p') {
    const marker = block.text.match(/^\{\{chart:([a-z0-9-]+)\}\}$/);
    if (marker) return renderChart(charts[marker[1]], marker[1]);
    const calc = block.text.match(/^\{\{calc:([a-z0-9-]+)\}\}$/);
    if (calc) return renderCalculator(calcs[calc[1]], calc[1]);
  }
  switch (block.type) {
    case 'h': return `<h${block.level}>${inline(block.text)}</h${block.level}>`;
    case 'p': {
      const caption = /^\*[^*].*\*$/.test(block.text);
      return caption ? `<p class="table-note">${inline(block.text)}</p>` : `<p>${inline(block.text)}</p>`;
    }
    case 'ul': return `<ul>${block.items.map(item => `<li>${inline(item)}</li>`).join('')}</ul>`;
    case 'ol': return `<ol>${block.items.map(item => `<li>${inline(item)}</li>`).join('')}</ol>`;
    case 'quote': return `<aside class="note">${inline(block.text)}</aside>`;
    case 'table': return `<div class="table-wrap"><table class="data-table">
      <thead><tr>${block.head.map(cell => `<th scope="col">${inline(cell)}</th>`).join('')}</tr></thead>
      <tbody>${block.rows.map(row => `<tr>${row.map((cell, c) => (c === 0 ? `<th scope="row">${inline(cell)}</th>` : `<td>${inline(cell)}</td>`)).join('')}</tr>`).join('')}</tbody>
    </table></div>`;
    default: return '';
  }
};

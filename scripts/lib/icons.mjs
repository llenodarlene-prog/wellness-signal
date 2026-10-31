import { readdir, readFile } from 'node:fs/promises';

// Tabler Icons (MIT, assets/icons/tabler/LICENSE) as one inline SVG sprite.
// Pages reference them with <svg><use href="#ti-name"></use></svg>.
const dir = 'assets/icons/tabler';
const inner = svg => svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/<path stroke="none" d="M0 0h24v24H0z" fill="none"\s*\/>/, '').replace(/\s+/g, ' ').trim();

export const tablerSprite = async () => {
  const names = (await readdir(dir)).filter(n => n.endsWith('.svg')).sort();
  const symbols = await Promise.all(names.map(async n => `<symbol id="ti-${n.slice(0, -4)}" viewBox="0 0 24 24">${inner(await readFile(`${dir}/${n}`, 'utf8'))}</symbol>`));
  return `<svg class="ti-sprite" aria-hidden="true" style="display:none" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${symbols.join('')}</svg>`;
};

export const ti = (name, cls = '') => (name ? `<svg class="ti${cls ? ` ${cls}` : ''}" aria-hidden="true" focusable="false"><use href="#ti-${name}"></use></svg>` : '');

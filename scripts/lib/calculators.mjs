// Server-rendered calculator markup. The maths lives in assets/js/calculators.js.
// Icons come from the Tabler sprite injected once per page (scripts/lib/icons.mjs).
import { ti } from './icons.mjs';

const esc = value => String(value ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const field = (id, input) => {
  const fid = `${id}-${input.name}`;
  const help = input.help ? `<span class="calc-help" id="${fid}-help">${esc(input.help)}</span>` : '';
  const described = input.help ? ` aria-describedby="${fid}-help ${fid}-err"` : ` aria-describedby="${fid}-err"`;
  const control = input.type === 'select'
    ? `<span class="calc-input is-select">${ti(input.icon, 'calc-field-icon')}<select id="${fid}" name="${input.name}">${input.options.map(([v, l]) => `<option value="${esc(v)}"${String(input.value) === v ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select></span>`
    : `<span class="calc-input">${ti(input.icon, 'calc-field-icon')}${input.prefix ? `<span class="calc-prefix" aria-hidden="true">${esc(input.prefix)}</span>` : ''}<input id="${fid}" name="${input.name}" type="number" inputmode="decimal"${input.min !== undefined ? ` min="${input.min}"` : ''}${input.step ? ` step="${input.step}"` : ''}${input.value !== undefined ? ` value="${input.value}"` : ''}${input.required ? ' required' : ''}${described}></span>`;
  // Optional slider mirrors the number box; it is hidden from assistive tech because the box carries the label.
  const slider = input.slider
    ? `<input class="calc-range" type="range" min="${input.slider[0]}" max="${input.slider[1]}" step="${input.step || 1}" value="${input.value ?? input.slider[0]}" data-for="${input.name}" aria-hidden="true" tabindex="-1">`
    : '';
  return `<div class="calc-field"><label for="${fid}">${esc(input.label)}${input.required ? '' : ' <span class="calc-opt">(optional)</span>'}</label>${control}${slider}${help}<span class="calc-error" id="${fid}-err" role="alert"></span></div>`;
};

export const renderCalculator = (calc, id) => {
  if (!calc) throw new Error(`Unknown calculator "${id}"`);
  return `<section class="calc" data-calc="${id}" aria-labelledby="${id}-title">
  <div class="calc-head"><span class="calc-badge">${ti(calc.icon)}</span><div><span class="calc-kicker">${ti('calculator')} Free interactive calculator</span><h2 class="calc-title" id="${id}-title">${esc(calc.title)}</h2><p>${esc(calc.intro)}</p></div></div>
  <form class="calc-grid" novalidate>
    <div class="calc-inputs">
      <p class="calc-example">${ti('info-circle')} Example values are filled in. Replace them with your own; results update as you type.</p>
      <div class="calc-fields">${calc.inputs.map(input => field(id, input)).join('\n      ')}</div>
      <div class="calc-actions">
        <button type="submit" class="btn calc-btn">${ti('calculator')} Calculate</button>
        <button type="reset" class="calc-link">${ti('refresh')} Reset</button>
        <button type="button" class="calc-link" data-copy>${ti('copy')} Copy results</button>
        <span class="calc-status" role="status" aria-live="polite"></span>
      </div>
    </div>
    <div class="calc-results" aria-live="polite"><p class="calc-empty">Results appear here.</p></div>
  </form>
  <details class="calc-method"><summary>${ti('info-circle')} How this is calculated</summary><ul>${calc.formulas.map(f => `<li>${esc(f)}</li>`).join('')}</ul></details>
  <p class="calc-disclaimer">${esc(calc.disclaimer)}</p>
</section>`;
};

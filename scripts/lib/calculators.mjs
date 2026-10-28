// Server-rendered calculator markup. The maths lives in assets/js/calculators.js.
const esc = value => String(value ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const field = (id, input) => {
  const fid = `${id}-${input.name}`;
  const help = input.help ? `<span class="calc-help" id="${fid}-help">${esc(input.help)}</span>` : '';
  const described = input.help ? ` aria-describedby="${fid}-help ${fid}-err"` : ` aria-describedby="${fid}-err"`;
  const control = input.type === 'select'
    ? `<select id="${fid}" name="${input.name}">${input.options.map(([v, l]) => `<option value="${esc(v)}"${String(input.value) === v ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select>`
    : `<span class="calc-input${input.prefix ? ' has-prefix' : ''}">${input.prefix ? `<span class="calc-prefix" aria-hidden="true">${esc(input.prefix)}</span>` : ''}<input id="${fid}" name="${input.name}" type="number" inputmode="decimal"${input.min !== undefined ? ` min="${input.min}"` : ''}${input.step ? ` step="${input.step}"` : ''}${input.value !== undefined ? ` value="${input.value}"` : ''}${input.required ? ' required' : ''}${described}></span>`;
  return `<div class="calc-field"><label for="${fid}">${esc(input.label)}${input.required ? '' : ' <span class="calc-opt">(optional)</span>'}</label>${control}${help}<span class="calc-error" id="${fid}-err" role="alert"></span></div>`;
};

export const renderCalculator = (calc, id) => {
  if (!calc) throw new Error(`Unknown calculator "${id}"`);
  return `<section class="calc" data-calc="${id}" aria-labelledby="${id}-title">
  <div class="calc-head"><h2 class="calc-title" id="${id}-title">${esc(calc.title)}</h2><p>${esc(calc.intro)}</p></div>
  <form class="calc-grid" novalidate>
    <div class="calc-inputs">
      <p class="calc-example">Example values are filled in. Replace them with your own.</p>
      ${calc.inputs.map(input => field(id, input)).join('\n      ')}
      <div class="calc-actions">
        <button type="submit" class="btn calc-btn">Calculate</button>
        <button type="reset" class="calc-link">Reset</button>
        <button type="button" class="calc-link" data-copy>Copy results</button>
        <span class="calc-status" role="status" aria-live="polite"></span>
      </div>
    </div>
    <div class="calc-results" aria-live="polite"><p class="calc-empty">Results appear here.</p></div>
  </form>
  <details class="calc-method"><summary>How this is calculated</summary><ul>${calc.formulas.map(f => `<li>${esc(f)}</li>`).join('')}</ul></details>
  <p class="calc-disclaimer">${esc(calc.disclaimer)}</p>
</section>`;
};

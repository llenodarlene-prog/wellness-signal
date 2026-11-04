// Server-rendered calculator markup. The maths lives in assets/js/calculators.js.
// Icons come from the Tabler sprite injected once per page (scripts/lib/icons.mjs).
import { ti } from './icons.mjs';

const esc = value => String(value ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const numberBox = (fid, input, described) => `<input id="${fid}" name="${input.name}" type="number" inputmode="decimal"${input.min !== undefined ? ` min="${input.min}"` : ''}${input.max !== undefined ? ` max="${input.max}"` : ''}${input.step ? ` step="${input.step}"` : ''}${input.value !== undefined ? ` value="${input.value}"` : ''}${input.required ? ' required' : ''}${described}>`;

// Radio group shown as a segmented toggle (units) or as icon cards (choices).
const radios = (id, input, kind) => `<fieldset class="calc-field calc-${kind}"><legend>${ti(input.icon, 'calc-field-icon')}${esc(input.label)}</legend><div class="calc-${kind}-set">${input.options.map(([v, l, icon, sub]) => `<label class="calc-${kind}-opt"><input type="radio" name="${input.name}" value="${esc(v)}"${String(input.value) === v ? ' checked' : ''}>${kind === 'choice' ? `<span class="calc-choice-card">${ti(icon)}<strong>${esc(l)}</strong>${sub ? `<small>${esc(sub)}</small>` : ''}</span>` : `<span>${esc(l)}</span>`}</label>`).join('')}</div></fieldset>`;

const field = (id, input) => {
  if (input.type === 'unit') return radios(id, input, 'unit');
  if (input.type === 'choice') return radios(id, input, 'choice');
  const fid = `${id}-${input.name}`;
  const help = input.help ? `<span class="calc-help" id="${fid}-help">${esc(input.help)}</span>` : '';
  const described = input.help ? ` aria-describedby="${fid}-help ${fid}-err"` : ` aria-describedby="${fid}-err"`;
  let control;
  if (input.type === 'select') {
    control = `<span class="calc-input is-select">${ti(input.icon, 'calc-field-icon')}<select id="${fid}" name="${input.name}">${input.options.map(([v, l]) => `<option value="${esc(v)}"${String(input.value) === v ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select></span>`;
  } else if (input.type === 'time' || input.type === 'clock') {
    // 'time' is a duration typed as h:mm:ss or mm:ss; 'clock' is a time of day.
    control = `<span class="calc-input">${ti(input.icon, 'calc-field-icon')}<input id="${fid}" name="${input.name}" ${input.type === 'clock' ? 'type="time"' : `type="text" inputmode="numeric" placeholder="${esc(input.placeholder || 'mm:ss')}" autocomplete="off"`}${input.value !== undefined ? ` value="${esc(input.value)}"` : ''}${input.required ? ' required' : ''}${described}></span>`;
  } else if (input.type === 'stepper') {
    control = `<span class="calc-input calc-stepper">${ti(input.icon, 'calc-field-icon')}<button type="button" class="calc-step" data-step="-1" aria-label="Decrease ${esc(input.label)}">${ti('minus')}</button>${numberBox(fid, input, described)}${input.suffix ? `<span class="calc-suffix" aria-hidden="true">${esc(input.suffix)}</span>` : ''}<button type="button" class="calc-step" data-step="1" aria-label="Increase ${esc(input.label)}">${ti('plus')}</button></span>`;
  } else {
    control = `<span class="calc-input">${ti(input.icon, 'calc-field-icon')}${input.prefix ? `<span class="calc-prefix" aria-hidden="true">${esc(input.prefix)}</span>` : ''}${numberBox(fid, input, described)}${input.suffix ? `<span class="calc-suffix" aria-hidden="true">${esc(input.suffix)}</span>` : ''}</span>`;
  }
  // Optional slider mirrors the number box; it is hidden from assistive tech because the box carries the label.
  const slider = input.slider
    ? `<input class="calc-range" type="range" min="${input.slider[0]}" max="${input.slider[1]}" step="${input.step || 1}" value="${input.value ?? input.slider[0]}" data-for="${input.name}" aria-hidden="true" tabindex="-1">`
    : '';
  return `<div class="calc-field${input.wide ? ' is-wide' : ''}"${input.showIf ? ` data-show-if="${esc(input.showIf)}"` : ''}><label for="${fid}">${esc(input.label)}${input.required ? '' : ' <span class="calc-opt">(optional)</span>'}</label>${control}${slider}${help}<span class="calc-error" id="${fid}-err" role="alert"></span></div>`;
};

const fields = (id, inputs) => {
  const basic = inputs.filter(input => !input.advanced);
  const advanced = inputs.filter(input => input.advanced);
  return `<div class="calc-fields">${basic.map(input => field(id, input)).join('\n      ')}</div>${advanced.length ? `<details class="calc-advanced"><summary>${ti('plus')} Advanced options</summary><div class="calc-fields">${advanced.map(input => field(id, input)).join('')}</div></details>` : ''}`;
};

export const renderCalculator = (calc, id) => {
  if (!calc) throw new Error(`Unknown calculator "${id}"`);
  return `<section class="calc" data-calc="${id}" aria-labelledby="${id}-title">
  <div class="calc-head"><span class="calc-badge">${ti(calc.icon)}</span><div><span class="calc-kicker">${ti('calculator')} Free interactive calculator</span><h2 class="calc-title" id="${id}-title">${esc(calc.title)}</h2><p>${esc(calc.intro)}</p></div></div>
  <form class="calc-grid" novalidate>
    <div class="calc-inputs">
      <p class="calc-example">${ti('info-circle')} Example values are filled in. Replace them with your own; results update as you type.</p>
      ${fields(id, calc.inputs)}
      <div class="calc-actions">
        <button type="submit" class="btn calc-btn">${ti('calculator')} Calculate</button>
        <button type="reset" class="calc-link">${ti('refresh')} Reset</button>
        <button type="button" class="calc-link" data-copy>${ti('copy')} Copy results</button>
        <span class="calc-status" role="status" aria-live="polite"></span>
      </div>
    </div>
    <div class="calc-results" aria-live="polite"><div class="calc-empty">${ti(calc.icon, 'ti calc-empty-icon')}<p>${esc(calc.empty || 'Enter your details to see your estimate.')}</p></div></div>
  </form>
  <details class="calc-method"><summary>${ti('book')} How this calculation works</summary><ul>${calc.formulas.map(f => `<li>${esc(f)}</li>`).join('')}</ul>${calc.sources ? `<p class="calc-sources"><strong>Sources:</strong> ${calc.sources.map(([label, href]) => `<a href="${esc(href)}" rel="noopener" target="_blank">${esc(label)}</a>`).join('; ')}</p>` : ''}${calc.reviewed ? `<p class="calc-reviewed">Last reviewed ${esc(calc.reviewed)}</p>` : ''}</details>
  <p class="calc-disclaimer">${esc(calc.disclaimer)}</p>
</section>`;
};

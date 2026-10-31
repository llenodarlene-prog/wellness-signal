// Wellness Signal calculators. Runs entirely in the browser: nothing entered is
// stored, sent to a server, or passed to analytics.
(() => {
  const money = n => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const num = (n, d = 1) => n.toLocaleString('en-US', { maximumFractionDigits: d });
  const pct = n => `${num(n, 1)}%`;

  // Each calculator returns { rows: [[label, value, emphasis?]], note? } or { errors: {field: message} }.
  const calcs = {
    'pilates-cost': v => {
      const errors = {};
      if (!(v.perWeek > 0)) errors.perWeek = 'Enter classes per week above zero.';
      if (!(v.dropIn >= 0) || v.dropIn === null) errors.dropIn = 'Enter the drop-in price.';
      if (v.pkgPrice && !(v.pkgClasses > 0)) errors.pkgClasses = 'Enter how many classes the package includes.';
      if (Object.keys(errors).length) return { errors };
      const extras = v.extras || 0;
      const mc = v.perWeek * 52 / 12;
      const options = [['Drop-in', mc * v.dropIn + extras]];
      if (v.pkgPrice) options.push(['Class package', mc * (v.pkgPrice / v.pkgClasses) + extras]);
      if (v.memPrice) {
        const over = v.memIncluded ? Math.max(0, mc - v.memIncluded) : 0;
        options.push(['Membership', v.memPrice + over * v.dropIn + extras]);
      }
      const rows = [['Classes per month', num(mc, 1)]];
      options.forEach(([name, monthly]) => {
        rows.push([`${name}: cost per class`, money(monthly / mc)]);
        rows.push([`${name}: monthly / annual`, `${money(monthly)} / ${money(monthly * 12)}`]);
      });
      const best = options.reduce((a, b) => (b[1] < a[1] ? b : a));
      rows.push(['Lowest estimated cost', `${best[0]} (${money(best[1])} a month)`, true]);
      if (v.memPrice && v.dropIn > 0) rows.push(['Membership break-even', `${num(v.memPrice / v.dropIn, 1)} drop-in classes a month`]);
      return { rows, bars: { title: 'Monthly cost by payment option', items: options, best: best[0] } };
    },

    'classpass-cost': v => {
      const errors = {};
      if (!(v.membership >= 0) || v.membership === null) errors.membership = 'Enter your monthly price.';
      if (!(v.credits > 0)) errors.credits = 'Enter credits above zero.';
      if (!(v.perClass > 0)) errors.perClass = 'Enter credits per class above zero.';
      if (Object.keys(errors).length) return { errors };
      const perCredit = v.membership / v.credits;
      const classCost = v.perClass * perCredit;
      const total = v.credits + (v.extraCredits || 0);
      const classes = Math.floor(total / v.perClass);
      const rows = [
        ['Estimated cost per class', money(classCost), true],
        ['Cost per credit', money(perCredit)],
        ['Classes per month', String(classes)],
        ['Credits left over', num(total - classes * v.perClass, 0)],
        ['Total monthly spend', money(v.membership + (v.extraCost || 0))],
      ];
      if (v.direct) {
        const diff = v.direct - classCost;
        rows.push(['Compared with direct booking', diff >= 0 ? `${money(diff)} less per class on ClassPass` : `${money(-diff)} more per class on ClassPass`]);
        rows.push(['Break-even credits per class', num(v.direct / perCredit, 1)]);
      }
      const bars = v.direct ? { title: 'Cost per class', items: [['ClassPass', classCost], ['Direct drop-in', v.direct]] } : null;
      return { rows, bars, note: 'Extra credits are counted at their own price in total spend, not in the cost per credit.' };
    },

    'whoop-oura-cost': (v, form) => {
      const tier = form.elements.tier.value;
      if (tier !== 'custom' && v.whoopAnnual !== Number(tier)) { form.elements.whoopAnnual.value = tier; v.whoopAnnual = Number(tier); }
      const years = form.elements.years.value === 'custom' ? v.customYears : Number(form.elements.years.value);
      const errors = {};
      if (!(v.ring >= 0) || v.ring === null) errors.ring = 'Enter the ring price.';
      if (!(v.ouraAnnual >= 0) || v.ouraAnnual === null) errors.ouraAnnual = 'Enter the Oura membership price.';
      if (!(v.whoopAnnual >= 0) || v.whoopAnnual === null) errors.whoopAnnual = 'Enter the WHOOP membership price.';
      if (!(years > 0)) errors.customYears = 'Enter the number of years.';
      if (Object.keys(errors).length) return { errors };
      const oura = y => v.ring + v.ouraAnnual * y;
      const whoop = y => v.whoopAnnual * y;
      const rows = [1, 3, 5].map(y => [`${y}-year total`, `Oura ${money(oura(y))} · WHOOP ${money(whoop(y))}`]);
      const o = oura(years), w = whoop(years), d = o - w;
      rows.push([`Your ${num(years, 0)}-year total`, `Oura ${money(o)} · WHOOP ${money(w)}`, true]);
      rows.push(['Difference', d === 0 ? 'The same' : `${d > 0 ? 'Oura' : 'WHOOP'} costs ${money(Math.abs(d))} more`]);
      if (w > 0) rows.push(['Percentage difference', `${pct(Math.abs(d) / w * 100)} ${d >= 0 ? 'more' : 'less'} for Oura than WHOOP`]);
      return { rows, bars: { title: `Total cost over ${num(years, 0)} ${years === 1 ? 'year' : 'years'}`, items: [['Oura', o], ['WHOOP', w]] } };
    },

    'sauna-electricity': v => {
      const errors = {};
      if (!(v.rate >= 0) || v.rate === null) errors.rate = 'Enter your electricity rate.';
      if (!(v.minutes > 0)) errors.minutes = 'Enter session length.';
      if (!(v.perWeek > 0)) errors.perWeek = 'Enter sessions per week.';
      if (!v.infraredKw && !v.traditionalKw) errors.traditionalKw = 'Enter at least one heater rating.';
      if (Object.keys(errors).length) return { errors };
      const rows = [];
      const annual = {};
      [['Infrared', v.infraredKw], ['Traditional', v.traditionalKw]].forEach(([name, kw]) => {
        if (!kw) return;
        const kwh = kw * v.minutes / 60;
        const session = kwh * v.rate;
        annual[name] = session * v.perWeek * 52;
        rows.push([`${name}: per session`, `${num(kwh, 2)} kWh · ${money(session)}`]);
        rows.push([`${name}: monthly / annual`, `${money(annual[name] / 12)} / ${money(annual[name])}`, true]);
      });
      if (annual.Infrared !== undefined && annual.Traditional !== undefined) {
        const d = annual.Traditional - annual.Infrared;
        rows.push(['Annual difference', d === 0 ? 'The same' : `${d > 0 ? 'Traditional' : 'Infrared'} costs ${money(Math.abs(d))} more a year`]);
      }
      return { rows, bars: { title: 'Estimated electricity cost per year', items: Object.entries(annual) } };
    },

    'wellness-cost-participant': v => {
      const errors = {};
      if (!(v.programme >= 0) || v.programme === null) errors.programme = 'Enter the program cost.';
      if (!(v.eligible > 0)) errors.eligible = 'Enter eligible employees above zero.';
      if (!(v.participants >= 0) || v.participants === null) errors.participants = 'Enter participants.';
      else if (v.participants > v.eligible) errors.participants = 'Participants cannot exceed eligible employees.';
      if (!(v.completed >= 0) || v.completed === null) errors.completed = 'Enter completions.';
      else if (v.completed > v.participants) errors.completed = 'Completions cannot exceed participants.';
      if (Object.keys(errors).length) return { errors };
      const total = v.programme + (v.implementation || 0);
      return { rows: [
        ['Total program cost', money(total), true],
        ['Cost per eligible employee', money(total / v.eligible)],
        ['Cost per participant', v.participants ? money(total / v.participants) : 'No participants'],
        ['Cost per completion', v.completed ? money(total / v.completed) : 'No completions'],
        ['Participation rate', pct(v.participants / v.eligible * 100)],
        ['Completion rate', v.participants ? pct(v.completed / v.participants * 100) : 'n/a'],
      ], bars: { title: 'Participation funnel', unit: 'count', items: [['Eligible', v.eligible], ['Participated', v.participants], ['Completed', v.completed]] } };
    },

    'retreat-budget': (v, form) => {
      const mode = form.elements.accMode.value;
      const errors = {};
      if (!(v.programme >= 0) || v.programme === null) errors.programme = 'Enter the program fee.';
      if (!(v.nights >= 0) || v.nights === null) errors.nights = 'Enter the number of nights.';
      if (!(v.travellers >= 1)) errors.travellers = 'Enter at least one traveler.';
      if (mode === 'nightly' && !(v.nightly >= 0 && v.nightly !== null)) errors.nightly = 'Enter the nightly rate.';
      if (mode === 'package' && !(v.accPackage >= 0 && v.accPackage !== null)) errors.accPackage = 'Enter the package price.';
      if (Object.keys(errors).length) return { errors };
      const acc = mode === 'nightly' ? v.nightly * v.nights : mode === 'package' ? v.accPackage : 0;
      const travel = (v.flights || 0) + (v.ground || 0);
      const extras = (v.meals || 0) + (v.treatments || 0) + (v.other || 0);
      const total = v.programme + acc + travel + extras;
      return { rows: [
        ['Program fee', money(v.programme)],
        ['Accommodation', mode === 'included' ? 'Included' : money(acc)],
        ['Travel', money(travel)],
        ['Extras', money(extras)],
        ['Total trip cost', money(total), true],
        ['Cost per traveler', money(total / v.travellers)],
        ['Cost per day', money(total / (v.nights + 1))],
      ], bars: { title: 'Where the budget goes', items: [['Program', v.programme], ['Accommodation', acc], ['Travel', travel], ['Extras', extras]].filter(([, n]) => n > 0) } };
    },

    'app-subscription': v => {
      const errors = {};
      if (!(v.monthly >= 0) || v.monthly === null) errors.monthly = 'Enter the monthly price.';
      if (!(v.annual >= 0) || v.annual === null) errors.annual = 'Enter the annual price.';
      if (!(v.years >= 1)) errors.years = 'Enter at least one year.';
      if (Object.keys(errors).length) return { errors };
      const fee = v.signup || 0;
      const yearMonthly = v.monthly * 12;
      const saving = yearMonthly - v.annual;
      const rows = [
        ['Monthly billing per year', money(yearMonthly)],
        ['Annual plan per year', money(v.annual)],
        ['Annual plan per month', money(v.annual / 12)],
        ['Annual savings', saving >= 0 ? money(saving) : `Annual plan costs ${money(-saving)} more`, true],
      ];
      if (yearMonthly > 0) rows.push(['Savings percentage', pct(saving / yearMonthly * 100)]);
      rows.push([`${num(v.years, 0)}-year totals`, `Monthly ${money(yearMonthly * v.years + fee)} · Annual ${money(v.annual * v.years + fee)}`]);
      rows.push([`${num(v.years, 0)}-year difference`, money(Math.abs(saving * v.years))]);
      return { rows, bars: { title: `Total over ${num(v.years, 0)} ${v.years === 1 ? 'year' : 'years'}`, items: [['Monthly billing', yearMonthly * v.years + fee], ['Annual plan', v.annual * v.years + fee]] }, note: v.trialDays ? `A ${num(v.trialDays, 0)}-day free trial delays your first charge but is not deducted here.` : '' };
    },
  };

  const ICONS = [
    [/lowest/i, 'trophy'], [/break-even/i, 'scale'], [/difference|compared/i, 'arrows-diff'], [/percent|rate$/i, 'percentage'],
    [/saving/i, 'discount'], [/credit/i, 'coins'], [/per class/i, 'ticket'], [/kwh|session/i, 'bolt'], [/travel/i, 'plane'],
    [/accommodation/i, 'home'], [/extras/i, 'sparkles'], [/per day/i, 'calendar'], [/per (participant|traveler|eligible|completion)/i, 'user'],
    [/total/i, 'wallet'], [/year|annual/i, 'calendar-week'], [/month/i, 'calendar'], [/fee/i, 'receipt'],
  ];
  const icon = (name, cls = 'ti') => `<svg class="${cls}" aria-hidden="true" focusable="false"><use href="#ti-${name}"></use></svg>`;
  const iconFor = label => (ICONS.find(([re]) => re.test(label)) || [0, 'chart-bar'])[1];
  const fmtBar = (unit, n) => (unit === 'count' ? num(n, 0) : money(n));

  const renderBars = bars => {
    if (!bars || bars.items.length < 2) return '';
    const max = Math.max(...bars.items.map(([, n]) => n), 0) || 1;
    const low = Math.min(...bars.items.map(([, n]) => n));
    return `<figure class="calc-bars"><figcaption>${icon('chart-bar')} ${bars.title}</figcaption>${bars.items.map(([label, n]) => {
      const top = bars.unit !== 'count' && n === low && bars.items.length > 1;
      return `<div class="calc-bar${top ? ' is-best' : ''}"><span class="calc-bar-label">${label}${top ? ` ${icon('trophy')}` : ''}</span><span class="calc-bar-track"><span class="calc-bar-fill" style="--w:${Math.max(n / max * 100, n ? 3 : 0)}%"></span></span><span class="calc-bar-val">${fmtBar(bars.unit, n)}</span></div>`;
    }).join('')}</figure>`;
  };

  // Count-up animation for the headline figure; skipped for reduced motion.
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const countUp = el => {
    const text = el.textContent;
    const m = text.match(/^\$([\d,]+\.\d{2})$/);
    if (!m || reduce) return;
    const target = Number(m[1].replace(/,/g, ''));
    const start = performance.now();
    const step = t => {
      const k = Math.min((t - start) / 600, 1);
      el.textContent = money(target * (1 - (1 - k) ** 3));
      if (k < 1) requestAnimationFrame(step); else el.textContent = text;
    };
    requestAnimationFrame(step);
  };

  const read = form => {
    const v = {};
    form.querySelectorAll('input[type=number]').forEach(input => {
      v[input.name] = input.value.trim() === '' ? null : Number(input.value);
    });
    return v;
  };

  const run = root => {
    const form = root.querySelector('form');
    const out = root.querySelector('.calc-results');
    root.querySelectorAll('.calc-error').forEach(e => { e.textContent = ''; });
    root.querySelectorAll('[aria-invalid]').forEach(e => e.removeAttribute('aria-invalid'));
    const result = calcs[root.dataset.calc](read(form), form);
    if (result.errors) {
      Object.entries(result.errors).forEach(([name, message]) => {
        const err = root.querySelector(`#${root.dataset.calc}-${name}-err`);
        if (err) err.textContent = message;
        const field = form.elements[name];
        if (field) field.setAttribute('aria-invalid', 'true');
      });
      out.innerHTML = '<p class="calc-empty">Check the highlighted fields.</p>';
      root.dataset.copy = '';
      return;
    }
    const hero = result.rows.find(r => r[2]) || result.rows[0];
    const rest = result.rows.filter(r => r !== hero);
    const changed = root.dataset.copy !== result.rows.map(([k, val]) => `${k}: ${val}`).join('\n');
    out.innerHTML = `<div class="calc-hero">${icon(iconFor(hero[0]), 'ti calc-hero-icon')}<div><span class="calc-hero-label">${hero[0]}</span><span class="calc-hero-val">${hero[1]}</span></div></div>
      ${renderBars(result.bars)}
      <dl class="calc-tiles">${rest.map(([k, val]) => `<div class="calc-tile">${icon(iconFor(k))}<dt>${k}</dt><dd>${val}</dd></div>`).join('')}</dl>${result.note ? `<p class="calc-note">${icon('info-circle')} ${result.note}</p>` : ''}`;
    if (changed) {
      countUp(out.querySelector('.calc-hero-val'));
      requestAnimationFrame(() => out.querySelectorAll('.calc-bar-fill').forEach(b => b.classList.add('is-in')));
    } else {
      out.querySelectorAll('.calc-bar-fill').forEach(b => b.classList.add('is-in'));
    }
    root.dataset.copy = result.rows.map(([k, val]) => `${k}: ${val}`).join('\n');
  };

  document.querySelectorAll('[data-calc]').forEach(root => {
    const form = root.querySelector('form');
    form.addEventListener('submit', e => { e.preventDefault(); run(root); });
    form.addEventListener('reset', () => setTimeout(() => run(root), 0));
    form.addEventListener('change', () => run(root));
    // Live updates while typing or dragging; sliders and number boxes stay in sync.
    let timer;
    form.addEventListener('input', e => {
      const t = e.target;
      if (t.classList.contains('calc-range')) form.elements[t.dataset.for].value = t.value;
      else if (t.name) { const r = form.querySelector(`.calc-range[data-for="${t.name}"]`); if (r && t.value !== '') r.value = t.value; }
      clearTimeout(timer);
      timer = setTimeout(() => run(root), 150);
    });
    form.addEventListener('reset', () => setTimeout(() => form.querySelectorAll('.calc-range').forEach(r => { r.value = form.elements[r.dataset.for].value || r.min; }), 0));
    root.querySelector('[data-copy]').addEventListener('click', async () => {
      const status = root.querySelector('.calc-status');
      try {
        await navigator.clipboard.writeText(`${root.querySelector('.calc-title').textContent}\n${root.dataset.copy || ''}`);
        status.textContent = 'Copied';
      } catch {
        status.textContent = 'Copy is not available in this browser';
      }
      setTimeout(() => { status.textContent = ''; }, 2500);
    });
    run(root);
  });
})();

// Wellness Signal calculators. Runs entirely in the browser: nothing entered is
// stored, sent to a server, or passed to analytics.
(() => {
  const money = n => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const num = (n, d = 1) => n.toLocaleString('en-US', { maximumFractionDigits: d });
  const pct = n => `${num(n, 1)}%`;

  const KM_PER_MI = 1.609344;
  const OZ_PER_L = 33.814;
  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  // National Academies Adequate Intake for total water (drinks and food), adults 19+.
  const WATER_AI = { men: 3.7, women: 2.7 };
  const toKg = (w, unit) => (unit === 'kg' ? w : w * 0.45359237);
  // ACSM walking equation: VO2 (mL/kg/min) = 0.1 × speed + 1.8 × speed × grade + 3.5, speed in m/min.
  const walkVO2 = (mph, grade) => { const s = mph * 26.8224; return 0.1 * s + 1.8 * s * grade + 3.5; };
  // About 5 kcal per litre of oxygen consumed.
  const walkKcalMin = (kg, mph, grade) => walkVO2(mph, grade) * kg / 1000 * 5;
  const intensity = mets => (mets < 3 ? 'below moderate' : mets < 6 ? 'moderate' : 'vigorous');
  const parseDur = text => {
    const parts = String(text || '').trim().split(':').map(Number);
    if (!parts.length || parts.some(n => !Number.isFinite(n) || n < 0) || parts.length > 3) return null;
    const [h, m, s] = parts.length === 3 ? parts : parts.length === 2 ? [0, ...parts] : [0, parts[0], 0];
    return h * 60 + m + s / 60;
  };
  const fmtDur = mins => {
    const total = Math.round(mins * 60);
    const h = Math.floor(total / 3600), m = Math.floor((total % 3600) / 60), s = total % 60;
    return h ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`;
  };
  const parseClock = text => { const m = /^(\d{1,2}):(\d{2})/.exec(text || ''); return m ? Number(m[1]) * 60 + Number(m[2]) : null; };
  const fmtClock = mins => {
    const t = ((Math.round(mins) % 1440) + 1440) % 1440;
    const h = Math.floor(t / 60), m = t % 60;
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
  };
  // Step length in inches: measured, or a rough height-based rule of thumb (about 41% of height).
  const strideInches = (v, errors) => {
    if (v.method === 'measured') {
      if (!(v.stride > 0)) { errors.stride = 'Enter your measured step length.'; return 0; }
      return v.hunit === 'cm' ? v.stride / 2.54 : v.stride;
    }
    if (!(v.height > 0)) { errors.height = 'Enter your height.'; return 0; }
    return (v.hunit === 'cm' ? v.height / 2.54 : v.height) * 0.414;
  };

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
    // ---------- Phase 1 tools ----------

    'walking-calories': v => {
      const errors = {};
      if (!(v.weight > 0)) errors.weight = 'Enter your body weight.';
      if (!(v.minutes > 0)) errors.minutes = 'Enter a duration greater than zero.';
      if (!(v.grade >= 0 && v.grade <= 25)) errors.grade = 'Enter an incline from 0% to 25%.';
      if (Object.keys(errors).length) return { errors };
      const kg = toKg(v.weight, v.wunit);
      const mph = Number(v.pace);
      const kcalMin = walkKcalMin(kg, mph, v.grade / 100);
      const total = kcalMin * v.minutes;
      const mets = walkVO2(mph, v.grade / 100) / 3.5;
      const miles = mph * v.minutes / 60;
      return {
        hero: { icon: 'flame', value: num(total, 0), label: 'estimated calories burned' },
        rows: [
          ['Estimated calories', `${num(total, 0)} kcal`],
          ['Distance', `${num(miles, 2)} mi (${num(miles * KM_PER_MI, 2)} km)`, 'route'],
          ['Pace', `${num(mph, 1)} mph · ${fmtDur(60 / mph)} per mile`, 'gauge'],
          ['Calories per hour', `${num(kcalMin * 60, 0)} kcal`, 'clock'],
          ['Intensity', `${num(mets, 1)} METs · ${intensity(mets)}`, 'activity'],
        ],
        range: { title: 'Intensity on the MET scale', min: 1, max: 10, value: mets, fmt: n => `${num(n, 1)} MET${n === 1 ? '' : 's'}`, bands: [['Below moderate', 1, 3], ['Moderate', 3, 6], ['Vigorous', 6, 10]] },
        insight: `At ${num(mph, 1)} mph${v.grade ? ` on a ${num(v.grade, 1)}% incline` : ''}, ${num(v.minutes, 0)} minutes works out to about ${num(total, 0)} calories, or roughly ${num(kcalMin * 60, 0)} an hour. This is a gross estimate that includes the energy you burn at rest.`,
        note: mph > 3.7 ? 'The ACSM walking equation was developed for speeds of about 1.9 to 3.7 mph, so treat faster results as rougher estimates.' : '',
      };
    },

    'steps-to-miles': v => {
      const errors = {};
      if (!(v.steps > 0)) errors.steps = 'Enter a step count greater than zero.';
      const stepIn = strideInches(v, errors);
      if (Object.keys(errors).length) return { errors };
      const miles = v.steps * stepIn / 63360;
      return {
        hero: { icon: 'map-route', value: num(miles, 2), label: `miles from ${num(v.steps, 0)} steps` },
        rows: [
          ['Miles', num(miles, 2)],
          ['Kilometers', num(miles * KM_PER_MI, 2), 'map-pin'],
          ['Step length', `${num(stepIn, 1)} in (${num(stepIn * 2.54, 1)} cm)`, 'ruler'],
          ['Steps per mile', num(63360 / stepIn, 0), 'walk'],
          ['Steps per kilometer', num(100000 / (stepIn * 2.54), 0), 'flag'],
        ],
        route: { distance: miles, unit: 'mi' },
        insight: `Based on a step length of ${num(stepIn, 1)} inches, ${num(v.steps, 0)} steps is about ${num(miles, 2)} miles. Measuring your own step length over a known distance gives a closer figure than a height-based estimate.`,
      };
    },

    'running-pace': v => {
      const errors = {};
      const mins = parseDur(v.time);
      if (!(v.distance > 0)) errors.distance = 'Enter a distance greater than zero.';
      if (!(mins > 0)) errors.time = 'Enter your time as h:mm:ss or mm:ss.';
      if (Object.keys(errors).length) return { errors };
      const miles = v.dunit === 'km' ? v.distance / KM_PER_MI : v.distance;
      const perMile = mins / miles;
      const perKm = perMile / KM_PER_MI;
      const races = [['5K', 5 / KM_PER_MI], ['10K', 10 / KM_PER_MI], ['Half marathon', 13.1094], ['Marathon', 26.2188]];
      const unitMiles = v.dunit === 'km' ? 1 / KM_PER_MI : 1;
      const count = Math.min(Math.floor(v.distance), 12);
      const splits = Array.from({ length: count }, (_, i) => [`${v.dunit === 'km' ? 'Km' : 'Mile'} ${i + 1}`, fmtDur(perMile * unitMiles * (i + 1)), i === count - 1 ? 'flag' : 'run']);
      return {
        hero: { icon: 'stopwatch', value: `${fmtDur(perMile)} /mi`, label: `${fmtDur(perKm)} per kilometer` },
        rows: [
          ['Pace per mile', fmtDur(perMile)],
          ['Pace per kilometer', fmtDur(perKm), 'stopwatch'],
          ['Speed', `${num(60 / perMile, 2)} mph · ${num(60 / perKm, 2)} km/h`, 'gauge'],
          ...races.map(([name, mi]) => [`${name} at this pace`, fmtDur(perMile * mi), 'flag']),
        ],
        timeline: splits.length > 1 ? { title: 'Cumulative splits at an even pace', items: splits } : null,
        insight: `Holding ${fmtDur(perMile)} per mile, a 5K would take ${fmtDur(perMile * races[0][1])}. Race times at this pace are arithmetic, not predictions: longer races usually run slower.`,
      };
    },

    'one-rep-max': v => {
      const errors = {};
      if (!(v.lift > 0)) errors.lift = 'Enter the weight you lifted.';
      if (!(v.reps >= 1)) errors.reps = 'Enter at least one rep.';
      else if (v.reps > 15) errors.reps = 'Use a set of 15 reps or fewer; estimates become unreliable at higher reps.';
      if (Object.keys(errors).length) return { errors };
      const w = v.lift, r = Math.round(v.reps), u = v.wunit;
      const f = { epley: w * (1 + r / 30), brzycki: w * 36 / (37 - r) };
      if (r === 1) { f.epley = w; f.brzycki = w; }
      f.average = (f.epley + f.brzycki) / 2;
      const max = f[v.formula] ?? f.average;
      const names = { average: 'Average of Epley and Brzycki', epley: 'Epley', brzycki: 'Brzycki' };
      return {
        hero: { icon: 'barbell', value: `${num(max, 0)} ${u}`, label: `estimated 1RM (${names[v.formula] || names.average})` },
        rows: [
          ['Estimated 1RM', `${num(max, 0)} ${u}`],
          ['Epley', `${num(f.epley, 0)} ${u}`, 'chart-bar'],
          ['Brzycki', `${num(f.brzycki, 0)} ${u}`, 'chart-bar'],
        ],
        bars: { title: 'Training percentage ladder', highlight: 'first', items: [100, 90, 80, 70, 60, 50].map(p => [`${p}%`, max * p / 100, `${num(max * p / 100, 0)} ${u}`]) },
        insight: `Your estimated one-rep max is ${num(max, 0)} ${u}. An 80% training load is about ${num(max * 0.8, 0)} ${u}.${r > 10 ? ' Sets above 10 reps make every equation less accurate.' : ''}`,
      };
    },

    'water-intake': v => {
      const total = WATER_AI[v.group] ?? WATER_AI.women;
      const drinks = total * 0.8;
      const L = n => `${num(n, 1)} L`;
      return {
        hero: { icon: 'droplet', value: L(total), label: 'total daily water reference, from drinks and food' },
        rows: [
          ['Total water reference', `${L(total)} a day`],
          ['About 80% from drinks', `${L(drinks)} (${num(drinks * OZ_PER_L, 0)} oz, about ${num(drinks * OZ_PER_L / 8, 0)} cups)`, 'bottle'],
          ['About 20% from food', L(total - drinks), 'salad'],
          ['Exercise today', v.exercise ? `${num(v.exercise, 1)} h: add fluid to replace sweat` : 'None entered', 'activity'],
        ],
        fill: { title: 'Daily total, split by source', parts: [['Drinks', drinks], ['Food', total - drinks]], max: 4.5, fmt: L },
        insight: 'This is a population reference intake from the National Academies, not a personal prescription. Most healthy people meet their needs by drinking to thirst and with meals; heat and exercise raise them.',
        note: v.climate === 'hot' ? 'Hot or humid weather raises sweat losses. If you have a heart or kidney condition or have been told to limit fluids, follow your clinician\'s advice.' : '',
      };
    },

    'sleep-cycle': v => {
      const errors = {};
      const t = parseClock(v.clock);
      if (t === null) errors.clock = 'Choose a time.';
      if (!(v.latency >= 0 && v.latency <= 90)) errors.latency = 'Enter 0 to 90 minutes.';
      if (Object.keys(errors).length) return { errors };
      const cycles = [6, 5, 4, 3];
      const wake = v.mode === 'wake';
      const opts = cycles.map(c => [c, wake ? t - v.latency - c * 90 : t + v.latency + c * 90]);
      const best = opts[1];
      return {
        hero: { icon: wake ? 'moon-stars' : 'sunrise', value: fmtClock(opts[0][1]), label: wake ? `bedtime for 6 cycles (9 hours of sleep), or ${fmtClock(best[1])} for 5 cycles` : `wake time after 6 cycles, or ${fmtClock(best[1])} after 5 cycles` },
        rows: opts.map(([c, m]) => [`${c} cycles (${num(c * 1.5, 1)} hours asleep)`, `${wake ? 'Go to bed' : 'Wake'} at ${fmtClock(m)}`, wake ? 'bed' : 'alarm']),
        timeline: { title: wake ? `Bedtimes for a ${fmtClock(t)} wake-up` : `Wake times after a ${fmtClock(t)} bedtime`, items: (wake ? opts : [...opts].reverse()).map(([c, m]) => [fmtClock(m), `${c} cycles · ${num(c * 1.5, 1)} h`, c >= 5 ? 'moon-stars' : 'clock', c === 5]) },
        insight: 'These times assume cycles of about 90 minutes plus the time you take to fall asleep. Real cycles vary in length through the night and between people, so treat them as a guide.',
      };
    },

    'steps-to-calories': v => {
      const errors = {};
      if (!(v.steps > 0)) errors.steps = 'Enter a step count greater than zero.';
      if (!(v.weight > 0)) errors.weight = 'Enter your body weight.';
      const stepIn = strideInches(v, errors);
      if (Object.keys(errors).length) return { errors };
      const kg = toKg(v.weight, v.wunit);
      const miles = v.steps * stepIn / 63360;
      const at = mph => walkKcalMin(kg, mph, 0) * (miles / mph * 60);
      const mph = Number(v.pace);
      const kcal = at(mph);
      return {
        hero: { icon: 'flame', value: num(kcal, 0), label: `estimated calories from ${num(v.steps, 0)} steps` },
        rows: [
          ['Estimated calories', `${num(kcal, 0)} kcal`],
          ['Distance', `${num(miles, 2)} mi (${num(miles * KM_PER_MI, 2)} km)`, 'route'],
          ['Walking time', fmtDur(miles / mph * 60), 'clock'],
          ['Calories per 1,000 steps', num(kcal / v.steps * 1000, 0), 'walk'],
        ],
        bars: { title: 'Same steps at different paces', highlight: 'none', items: [2, 2.5, 3, 3.5].map(s => [`${s} mph`, at(s), `${num(at(s), 0)} kcal`]) },
        insight: `Walking ${num(v.steps, 0)} steps at ${num(mph, 1)} mph burns roughly ${num(kcal, 0)} calories in total, including resting energy. Because the estimate includes resting energy, slower walks show slightly more calories for the same distance.`,
      };
    },

    'heart-rate-zones': v => {
      const errors = {};
      if (!(v.age >= 15 && v.age <= 90)) errors.age = 'Enter an age from 15 to 90.';
      if (v.resting !== null && !(v.resting >= 30 && v.resting <= 110)) errors.resting = 'Enter a resting heart rate from 30 to 110 bpm, or leave it blank.';
      if (Object.keys(errors).length) return { errors };
      const max = v.formula === 'tanaka' ? 208 - 0.7 * v.age : 220 - v.age;
      const rest = v.resting;
      const bpm = p => Math.round(rest ? rest + (max - rest) * p : max * p);
      const zones = [[1, 0.5, 0.6, 'Very light: warm-ups and recovery'], [2, 0.6, 0.7, 'Light: easy, conversational effort'], [3, 0.7, 0.8, 'Moderate: steady aerobic work'], [4, 0.8, 0.9, 'Hard: tempo and threshold efforts'], [5, 0.9, 1, 'Maximum: short, all-out intervals']];
      return {
        hero: { icon: 'heartbeat', value: `${num(max, 0)} bpm`, label: `estimated maximum heart rate (${v.formula === 'tanaka' ? '208 − 0.7 × age' : '220 − age'})` },
        rows: [
          ['Estimated max heart rate', `${num(max, 0)} bpm`],
          ...zones.map(([z, a, b]) => [`Zone ${z} (${a * 100}–${b * 100}%)`, `${bpm(a)}–${bpm(b)} bpm`, 'heart', 'copy-only']),
        ],
        zones: { title: rest ? 'Five training zones (heart rate reserve method)' : 'Five training zones', items: zones.map(([z, a, b, d]) => [`Zone ${z}`, `${bpm(a)}–${bpm(b)} bpm`, d, b]) },
        insight: `Age-based formulas estimate an average maximum for people your age; your own maximum can be noticeably higher or lower. ${rest ? 'Zones use your resting heart rate (heart rate reserve).' : 'Add a resting heart rate under Advanced options to personalize the zones.'}`,
      };
    },

    'sleep-debt': v => {
      const errors = {};
      if (!(v.target >= 4 && v.target <= 12)) errors.target = 'Enter a nightly target from 4 to 12 hours.';
      const nights = DAYS.map(d => v[`n${d}`]);
      DAYS.forEach((d, i) => { if (!(nights[i] >= 0 && nights[i] <= 16)) errors[`n${d}`] = 'Enter 0 to 16 hours.'; });
      if (Object.keys(errors).length) return { errors };
      const debt = nights.reduce((sum, h) => sum + Math.max(0, v.target - h), 0);
      const net = nights.reduce((sum, h) => sum + (v.target - h), 0);
      const avg = nights.reduce((a, b) => a + b, 0) / 7;
      const short = nights.filter(h => h < v.target).length;
      return {
        hero: { icon: 'moon', value: `${num(debt, 1)} h`, label: 'sleep debt this week' },
        rows: [
          ['Sleep debt', `${num(debt, 1)} hours`],
          ['Average sleep', `${fmtDur(avg * 60).replace(/:00$/, '')} a night (${num(avg, 1)} h)`, 'bed'],
          ['Nights under target', `${short} of 7`, 'calendar-week'],
          ['Net after longer nights', net > 0 ? `${num(net, 1)} hours short` : `${num(-net, 1)} hours over target`, 'battery-2'],
        ],
        bars: { title: `Each night against your ${num(v.target, 1)}-hour target`, highlight: 'none', max: Math.max(v.target, ...nights), target: v.target, items: DAYS.map((d, i) => [d, nights[i], `${num(nights[i], 1)} h`]) },
        insight: debt ? `You slept ${num(debt, 1)} hours less than your target this week. Regular sleep timing matters as well as total hours, so aim to close the gap gradually rather than with one long lie-in.` : 'You met your target every night this week.',
      };
    },

  };

  const ICONS = [
    [/^distance|miles|kilomet/i, 'route'], [/pace|speed/i, 'gauge'], [/calorie|kcal/i, 'flame'],
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
    const vals = bars.items.map(([, n]) => n);
    const max = bars.max || Math.max(...vals, 0) || 1;
    const low = Math.min(...vals);
    const mark = bars.highlight === 'first' ? 0 : bars.highlight === 'none' || bars.unit === 'count' ? -1 : vals.indexOf(low);
    const target = bars.target ? `<span class="calc-bar-target" style="--t:${bars.target / max * 100}%" aria-hidden="true"></span>` : '';
    return `<figure class="calc-bars"><figcaption>${icon('chart-bar')} ${bars.title}</figcaption>${bars.items.map(([label, n, shown], i) => {
      const top = i === mark;
      const under = bars.target && n < bars.target;
      return `<div class="calc-bar${top ? ' is-best' : ''}${under ? ' is-under' : ''}"><span class="calc-bar-label">${label}${top && bars.highlight !== 'first' ? ` ${icon('trophy')}` : ''}</span><span class="calc-bar-track">${target}<span class="calc-bar-fill" style="--w:${Math.max(n / max * 100, n ? 3 : 0)}%"></span></span><span class="calc-bar-val">${shown ?? fmtBar(bars.unit, n)}</span></div>`;
    }).join('')}</figure>`;
  };

  // Marker on a horizontal scale, with optional labelled bands.
  const renderRange = r => {
    if (!r) return '';
    const pos = n => Math.min(100, Math.max(0, (n - r.min) / (r.max - r.min) * 100));
    return `<figure class="calc-range-viz"><figcaption>${icon('gauge')} ${r.title}</figcaption><div class="calc-scale">${(r.bands || []).map(([label, a, b], i) => `<span class="calc-band b${i}" style="left:${pos(a)}%;width:${pos(b) - pos(a)}%"><span>${label}</span></span>`).join('')}<span class="calc-marker" style="--p:${pos(r.value)}%"><span>${r.fmt(r.value)}</span></span></div><div class="calc-scale-ends"><span>${r.fmt(r.min)}</span><span>${r.fmt(r.max)}</span></div></figure>`;
  };

  // Route line from start to finish with a tick at each whole mile.
  const renderRoute = r => {
    if (!r) return '';
    const total = Math.max(1, Math.ceil(r.distance));
    const ticks = Array.from({ length: Math.min(total, 20) - 1 }, (_, i) => `<span class="calc-tick" style="left:${(i + 1) / total * 100}%"></span>`).join('');
    return `<figure class="calc-route"><figcaption>${icon('route')} Your distance</figcaption><div class="calc-route-line">${icon('walk', 'ti calc-route-start')}<span class="calc-route-track">${ticks}<span class="calc-route-fill" style="--w:${r.distance / total * 100}%"></span></span>${icon('flag', 'ti calc-route-end')}</div><div class="calc-scale-ends"><span>0 ${r.unit}</span><span>${num(r.distance, 2)} ${r.unit}</span></div></figure>`;
  };

  const renderTimeline = t => {
    if (!t) return '';
    return `<figure class="calc-timeline"><figcaption>${icon('clock')} ${t.title}</figcaption><ol>${t.items.map(([time, label, ic, on]) => `<li${on ? ' class="is-on"' : ''}>${icon(ic || 'clock')}<strong>${time}</strong><span>${label}</span></li>`).join('')}</ol></figure>`;
  };

  const renderZones = z => {
    if (!z) return '';
    return `<figure class="calc-zones"><figcaption>${icon('heartbeat')} ${z.title}</figcaption>${z.items.map(([name, range, desc, top], i) => `<div class="calc-zone z${i + 1}"><span class="calc-zone-bar" style="--w:${top * 100}%"><strong>${name}</strong><span>${range}</span></span><small>${desc}</small></div>`).join('')}</figure>`;
  };

  // Stacked fill, e.g. water from drinks and food.
  const renderFill = f => {
    if (!f) return '';
    return `<figure class="calc-fill"><figcaption>${icon('droplet')} ${f.title}</figcaption><div class="calc-fill-track">${f.parts.map(([label, n], i) => `<span class="calc-fill-part p${i}" style="--w:${n / f.max * 100}%" title="${label}: ${f.fmt(n)}"></span>`).join('')}</div><div class="calc-fill-key">${f.parts.map(([label, n], i) => `<span><i class="p${i}"></i>${label} ${f.fmt(n)}</span>`).join('')}</div></figure>`;
  };

  // Count-up animation for numeric headline figures; skipped for reduced motion.
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const countUp = el => {
    const text = el.textContent;
    const m = text.match(/^(\$?)([\d,]+(?:\.\d+)?)(.*)$/);
    if (!m || reduce) return;
    const target = Number(m[2].replace(/,/g, ''));
    const digits = (m[2].split('.')[1] || '').length;
    const start = performance.now();
    const step = t => {
      const k = Math.min((t - start) / 600, 1);
      el.textContent = `${m[1]}${(target * (1 - (1 - k) ** 3)).toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })}${m[3]}`;
      if (k < 1) requestAnimationFrame(step); else el.textContent = text;
    };
    requestAnimationFrame(step);
  };

  // Numbers become numbers (blank is null); radios, selects and text stay strings.
  const read = form => {
    const v = {};
    [...form.elements].forEach(el => {
      if (!el.name || el.type === 'range') return;
      if (el.type === 'radio') { if (el.checked) v[el.name] = el.value; return; }
      v[el.name] = el.type === 'number' ? (el.value.trim() === '' ? null : Number(el.value)) : el.value;
    });
    return v;
  };

  // Fields shown only for one choice, e.g. data-show-if="method=measured".
  const toggleFields = (root, v) => root.querySelectorAll('[data-show-if]').forEach(el => {
    const [name, value] = el.dataset.showIf.split('=');
    el.hidden = !value.split('|').includes(String(v[name]));
  });

  const run = root => {
    const form = root.querySelector('form');
    const out = root.querySelector('.calc-results');
    root.querySelectorAll('.calc-error').forEach(e => { e.textContent = ''; });
    root.querySelectorAll('[aria-invalid]').forEach(e => e.removeAttribute('aria-invalid'));
    const values = read(form);
    toggleFields(root, values);
    const result = calcs[root.dataset.calc](values, form);
    if (result.errors) {
      Object.entries(result.errors).forEach(([name, message]) => {
        const err = root.querySelector(`#${root.dataset.calc}-${name}-err`);
        if (err) err.innerHTML = `${icon('alert-circle')} ${message}`;
        const field = form.elements[name];
        if (field && field.setAttribute) field.setAttribute('aria-invalid', 'true');
      });
      out.innerHTML = `<div class="calc-empty is-error">${icon('alert-circle', 'ti calc-empty-icon')}<p>Check the highlighted fields to see your estimate.</p></div>`;
      root.dataset.copy = '';
      return;
    }
    const heroRow = result.rows.find(r => r[2] === true) || result.rows[0];
    const hero = result.hero || { icon: iconFor(heroRow[0]), value: heroRow[1], label: heroRow[0] };
    const rest = result.rows.filter(r => r !== (result.hero ? result.rows[0] : heroRow));
    const copy = result.rows.map(([k, val]) => `${k}: ${val}`).join('\n');
    const changed = root.dataset.copy !== copy;
    out.innerHTML = `<div class="calc-hero">${icon(hero.icon, 'ti calc-hero-icon')}<div><span class="calc-hero-val">${hero.value}</span><span class="calc-hero-label">${hero.label}</span></div></div>
      ${result.insight ? `<p class="calc-insight">${icon('bulb')}<span>${result.insight}</span></p>` : ''}
      ${renderBars(result.bars)}${renderRange(result.range)}${renderRoute(result.route)}${renderTimeline(result.timeline)}${renderZones(result.zones)}${renderFill(result.fill)}
      <dl class="calc-tiles">${rest.filter(r => r[3] !== 'copy-only').map(([k, val, ic]) => `<div class="calc-tile">${icon(typeof ic === 'string' ? ic : iconFor(k))}<dt>${k}</dt><dd>${val}</dd></div>`).join('')}</dl>${result.note ? `<p class="calc-note">${icon('info-circle')} ${result.note}</p>` : ''}`;
    const grow = () => out.querySelectorAll('.calc-bar-fill, .calc-route-fill, .calc-zone-bar, .calc-fill-part').forEach(b => b.classList.add('is-in'));
    if (changed) { countUp(out.querySelector('.calc-hero-val')); requestAnimationFrame(grow); } else grow();
    root.dataset.copy = copy;
  };

  document.querySelectorAll('[data-calc]').forEach(root => {
    const form = root.querySelector('form');
    const btn = root.querySelector('.calc-btn');
    form.addEventListener('submit', e => {
      e.preventDefault();
      run(root);
      btn.classList.add('is-done');
      setTimeout(() => btn.classList.remove('is-done'), 900);
    });
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
    // Steppers nudge the number box by its step, within its min and max.
    root.querySelectorAll('.calc-step').forEach(b => b.addEventListener('click', () => {
      const input = b.parentElement.querySelector('input[type=number]');
      const step = Number(input.step) || 1;
      let next = (Number(input.value) || 0) + step * Number(b.dataset.step);
      if (input.min !== '') next = Math.max(Number(input.min), next);
      if (input.max !== '') next = Math.min(Number(input.max), next);
      input.value = Number(next.toFixed(4));
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }));
    form.addEventListener('reset', () => setTimeout(() => {
      form.querySelectorAll('.calc-range').forEach(r => { r.value = form.elements[r.dataset.for].value || r.min; });
      run(root);
    }, 0));
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

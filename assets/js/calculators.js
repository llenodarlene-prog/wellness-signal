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


  // Even-pace race splits for the marathon and half marathon calculators.
  const raceCalc = (v, race) => {
    const C = window.WSCore;
    const mins = parseDur(v.time);
    if (!(mins > 0)) return { errors: { time: 'Enter your goal time as h:mm:ss, for example 4:00:00.' } };
    const D = C.RACE[race];
    const fin = mins * 60;
    const lo = race === 'marathon' ? 120 : 57, hi = race === 'marathon' ? 600 : 300;
    if (mins < lo || mins > hi) return { errors: { time: `Enter a time between ${fmtDur(lo)} and ${fmtDur(hi)}.` } };
    const at = race === 'marathon' ? [5000, 10000, 15000, 20000, C.RACE.half, 25000, 30000, 35000, 40000] : [5000, 10000, 15000, 20000];
    const lab = m => (m === C.RACE.half ? 'Halfway (13.1 mi)' : `${m / 1000}K`);
    const perMi = C.paceSec(fin, D, C.MI) / 60, perKm = C.paceSec(fin, D, 1000) / 60;
    return {
      hero: { icon: 'stopwatch', value: fmtDur(perMi), label: 'per mile goal pace' },
      rows: [
        ['Pace per mile', fmtDur(perMi)],
        ['Pace per kilometer', fmtDur(perKm), 'flag'],
        ['Speed', `${num(D / C.MI / (mins / 60), 2)} mph`, 'gauge'],
        ...at.map(m => [`Split at ${lab(m)}`, fmtDur(C.split(fin, D, m) / 60), 'route']),
        ['Finish', fmtDur(mins), 'flag'],
      ],
      insight: `To finish in ${fmtDur(mins)}, run about ${fmtDur(perMi)} per mile (${fmtDur(perKm)} per km) the whole way. The splits assume an even pace.`,
    };
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

    'hiking-calories': v => {
      const errors = {};
      if (!(v.weight > 0)) errors.weight = 'Enter your body weight.';
      if (!(v.pack >= 0)) errors.pack = 'Enter a pack weight of 0 or more.';
      else if (v.weight > 0 && v.pack > v.weight * 0.7) errors.pack = 'Enter a pack under 70% of your body weight.';
      if (!(v.miles > 0)) errors.miles = 'Enter a distance greater than zero.';
      if (!(v.gain >= 0)) errors.gain = 'Enter an elevation gain of 0 or more.';
      if (Object.keys(errors).length) return { errors };
      const kg = toKg(v.weight, v.wunit);
      const load = toKg(v.pack || 0, v.wunit) / kg;
      const mph = Number(v.pace);
      const s = mph * 0.44704;
      const meters = v.miles * 1609.344;
      const grade = v.gain ? (v.gain * 0.3048) / (meters / 2) : 0;
      if (grade > 0.4) return { errors: { gain: 'That gain is steeper than a 40% average grade for this distance. Check the distance and gain.' } };
      const REST = 3.5 * 20.1 / 60;
      const gradeCost = g => 34 * s * g * (1 - Math.pow(1.05, 1 - Math.pow(1.1, 100 * g + 32)));
      const loadMult = 1 + 1.96 * Math.pow(load, 1.36);
      const cost = g => Math.max(REST, REST + (0.19 + 1.78 * Math.pow(s, 0.58) + 0.27 * Math.pow(s, 4) + gradeCost(g)) * loadMult);
      const secs = v.miles / mph * 3600;
      const up = cost(grade), down = cost(-grade);
      const avg = (up + down) / 2;
      const total = avg * kg * secs / 4184;
      const baseTotal = (REST + 0.19 + 1.78 * Math.pow(s, 0.58) + 0.27 * Math.pow(s, 4)) * kg * secs / 4184;
      const mets = avg / REST;
      const perMile = total / v.miles;
      return {
        hero: { icon: 'flame', value: num(total, 0), label: 'estimated calories burned' },
        rows: [
          ['Estimated calories', `${num(total, 0)} kcal`],
          ['Moving time', fmtDur(secs / 60), 'clock'],
          ['Average grade', `${num(grade * 100, 1)}% up and down`, 'mountain'],
          ['Calories per mile', `${num(perMile, 0)} kcal`, 'route'],
          ['Calories per hour', `${num(total / (secs / 3600), 0)} kcal`, 'clock'],
          ['Same distance, flat, no pack', `${num(baseTotal, 0)} kcal`, 'walk'],
          ['Intensity', `${num(mets, 1)} METs · ${intensity(mets)}`, 'activity'],
        ],
        range: { title: 'Average intensity on the MET scale', min: 1, max: 12, value: mets, fmt: n => `${num(n, 1)} MET${n === 1 ? '' : 's'}`, bands: [['Below moderate', 1, 3], ['Moderate', 3, 6], ['Vigorous', 6, 12]] },
        insight: `A ${num(v.miles, 1)}-mile hike with ${num(v.gain, 0)} ft of climbing${v.pack ? ` and a ${num(v.pack, 0)} ${v.wunit} pack` : ''} at ${num(mph, 1)} mph works out to about ${num(total, 0)} calories over ${fmtDur(secs / 60)} of moving time. Climbing costs far more than descending, so most of the extra energy comes on the way up. This is a gross estimate that includes the energy you burn at rest.`,
        note: mph < 2.5 ? 'The equation was built from walking at about 2.5 to 4.0 mph, so treat slower paces as rougher estimates.' : '',
      };
    },

    'bmi': v => {
      const errors = {};
      if (!(v.weight > 0)) errors.weight = 'Enter your weight.';
      if (!(v.height > 0)) errors.height = 'Enter your height.';
      if (Object.keys(errors).length) return { errors };
      const kg = toKg(v.weight, v.wunit);
      const m = (v.hunit === 'cm' ? v.height : v.height * 2.54) / 100;
      const bmi = kg / (m * m);
      if (bmi < 8 || bmi > 120) return { errors: { height: 'Check your height and weight units.' } };
      const cat = bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Healthy weight' : bmi < 30 ? 'Overweight' : bmi < 35 ? 'Obesity, class 1' : bmi < 40 ? 'Obesity, class 2' : 'Obesity, class 3';
      const lo = 18.5 * m * m, hi = 24.9 * m * m;
      const show = kgv => (v.wunit === 'kg' ? `${num(kgv, 1)} kg` : `${num(kgv / 0.45359237, 0)} lb`);
      return {
        hero: { icon: 'scale', value: num(bmi, 1), label: `BMI · ${cat.toLowerCase()}` },
        rows: [
          ['BMI', num(bmi, 1)],
          ['CDC adult category', cat, 'activity'],
          ['Healthy weight range for your height', `${show(lo)} to ${show(hi)}`, 'scale'],
        ],
        range: { title: 'Where your BMI falls', min: 15, max: 45, value: Math.min(45, Math.max(15, bmi)), fmt: n => num(n, 1), bands: [['Under', 15, 18.5], ['Healthy', 18.5, 25], ['Over', 25, 30], ['Obesity', 30, 45]] },
        insight: `A BMI of ${num(bmi, 1)} falls in the CDC's ${cat.toLowerCase()} category for adults. BMI is a screening tool; it doesn't measure body fat or health directly.`,
        note: 'For adults 20 and older. Children and teens use BMI-for-age percentiles.',
      };
    },

    'waist-height': v => {
      const errors = {};
      if (!(v.waist > 0)) errors.waist = 'Enter your waist measurement.';
      if (!(v.height > 0)) errors.height = 'Enter your height.';
      if (Object.keys(errors).length) return { errors };
      const r = v.waist / v.height;
      if (r < 0.2 || r > 1.2) return { errors: { waist: 'Check that waist and height use the same unit.' } };
      const band = r < 0.4 ? 'Below the NICE healthy band' : r < 0.5 ? 'Healthy' : r < 0.6 ? 'Increased health risk' : 'High health risk';
      const u = v.unit === 'cm' ? 'cm' : 'in';
      return {
        hero: { icon: 'ruler', value: num(r, 2), label: `waist-to-height ratio · ${band.toLowerCase()}` },
        rows: [
          ['Waist-to-height ratio', num(r, 2)],
          ['NICE band', band, 'activity'],
          ['Waist that keeps you under 0.5', `under ${num(v.height / 2, 1)} ${u}`, 'ruler-2'],
        ],
        range: { title: 'NICE waist-to-height bands', min: 0.3, max: 0.8, value: Math.min(0.8, Math.max(0.3, r)), fmt: n => num(n, 2), bands: [['Low', 0.3, 0.4], ['Healthy', 0.4, 0.5], ['Increased', 0.5, 0.6], ['High', 0.6, 0.8]] },
        insight: `Your waist is ${num(r * 100, 0)}% of your height. NICE suggests keeping your waist to less than half your height, a ratio under 0.5.`,
        note: r < 0.4 ? 'NICE does not set a risk band below 0.4. A very low ratio is not a target; discuss concerns with a clinician.' : '',
      };
    },

    'sunscreen': v => {
      const errors = {};
      if (!(v.weight > 0)) errors.weight = 'Enter your weight.';
      if (!(v.height > 0)) errors.height = 'Enter your height.';
      if (!(v.hours > 0)) errors.hours = 'Enter the hours you will be outdoors.';
      if (Object.keys(errors).length) return { errors };
      const kg = toKg(v.weight, v.wunit);
      const cm = v.hunit === 'cm' ? v.height : v.height * 2.54;
      const bsa = Math.sqrt(cm * kg / 3600);
      if (bsa < 0.3 || bsa > 3.5) return { errors: { height: 'Check your height and weight units.' } };
      const frac = Number(v.exposed);
      const grams = bsa * 10000 * frac * 2 / 1000;
      const apps = 1 + Math.floor(Math.max(0, v.hours - 0.01) / 2);
      const oz = grams / 29.5735;
      return {
        hero: { icon: 'sun', value: num(grams, 0), label: 'mL of sunscreen per application' },
        rows: [
          ['Per application', `${num(grams, 0)} mL (${num(oz, 2)} fl oz, about ${num(grams / 5, 1)} teaspoons)`],
          ['Body surface area', `${num(bsa, 2)} m²`, 'user'],
          ['Skin exposed', `${num(frac * 100, 0)}%`, 'percentage'],
          ['Applications for your time outside', `${apps}`, 'clock'],
          ['Total for the day', `${num(grams * apps, 0)} mL (${num(oz * apps, 1)} fl oz)`, 'bottle'],
        ],
        insight: `Covering ${num(frac * 100, 0)}% of your skin at the 2 mg/cm² used in SPF testing takes about ${num(grams, 0)} mL. The AAD says most adults need about 1 ounce, a shot glass full, to cover skin not covered by clothing.`,
        note: 'Apply about 15 minutes before going outside, and reapply every 2 hours and right after swimming or sweating (AAD).',
      };
    },

    'jet-lag': v => {
      const errors = {};
      if (!(v.zones >= 1)) errors.zones = 'Enter at least one time zone.';
      if (Object.keys(errors).length) return { errors };
      const zones = Math.round(v.zones);
      const pre = Math.min(3, Math.max(0, Math.round(v.preshift || 0)), zones);
      const rate = v.direction === 'west' ? 1.5 : 1;
      const left = zones - pre;
      const days = Math.ceil(left / rate);
      const noPre = Math.ceil(zones / rate);
      const east = v.direction !== 'west';
      return {
        hero: { icon: 'plane', value: num(days, 0), label: `estimated ${days === 1 ? 'day' : 'days'} to adjust after arrival` },
        rows: [
          ['Hours your body clock must shift', `${zones} h ${east ? 'earlier' : 'later'}`],
          ['Shifted before you fly', `${pre} h`, 'moon-stars'],
          ['Average adjustment rate', `${num(rate, 1)} h per day ${east ? '(eastward)' : '(westward)'}`, 'clock'],
          ['Estimated days to adjust', `${days}${pre ? ` (vs ${noPre} with no pre-trip shift)` : ''}`, 'calendar'],
        ],
        insight: east
          ? `Flying east means your body clock has to move earlier, which is harder. In the 2 to 3 days before you fly, going to bed and waking up 1 hour earlier each day can cut your adjustment time.`
          : `Flying west means your body clock has to move later, which most people find easier. In the 2 to 3 days before you fly, going to bed and waking up 1 hour later each day can cut your adjustment time.`,
        note: 'Averages from the CDC Yellow Book. Sleep on the flight, light exposure and age all change how quickly you adjust.',
      };
    },

    'desk-height': v => {
      const errors = {};
      if (!(v.elbow > 0)) errors.elbow = 'Enter your elbow height.';
      if (Object.keys(errors).length) return { errors };
      const cm = v.unit === 'cm';
      const u = cm ? 'cm' : 'in';
      const toIn = x => (cm ? x / 2.54 : x);
      const fmt = x => `${num(x, 1)} ${u}`;
      const kb = v.kb >= 0 ? v.kb : 0;
      const surface = v.elbow - kb;
      const sit = v.mode !== 'stand';
      const [lo, hi] = sit ? [22, 30] : [36, 46.5];
      const kbIn = toIn(v.elbow);
      const rows = [
        ['Keyboard home row', `${fmt(v.elbow)} (your elbow height)`],
        ['Desk or keyboard-tray surface', fmt(surface), 'desk'],
      ];
      if (v.eye > 0) rows.push(['Top line of the screen', `at or slightly below ${fmt(v.eye)}`, 'eye']);
      rows.push(['Screen distance', cm ? '50 to 100 cm from your eyes' : '20 to 40 in from your eyes', 'ruler']);
      let note = '';
      if (kbIn < lo || kbIn > hi) note = `Your keyboard height is outside OSHA's ${sit ? 'seated' : 'standing'} adjustment range of ${lo} to ${hi} inches. Check your measurement, or plan on a keyboard tray${sit ? ', a chair adjustment or a footrest' : ''}.`;
      else if (sit) note = 'If your desk is fixed and too high, raise your chair to reach the right elbow height and use a footrest so your feet stay supported (OSHA).';
      return {
        hero: { icon: 'desk', value: num(surface, 1), label: `${u} desk surface height` },
        rows,
        insight: `With your elbows at ${fmt(v.elbow)} and a ${fmt(kb)} keyboard, a work surface at about ${fmt(surface)} puts the keys at elbow height, as OSHA recommends.`,
        note,
      };
    },

    'bmr': v => {
      const C = window.WSCore;
      const errors = {};
      if (!(v.age >= 18 && v.age <= 100)) errors.age = 'Enter an age from 18 to 100.';
      if (!(v.weight > 0)) errors.weight = 'Enter your weight.';
      if (!(v.height > 0)) errors.height = 'Enter your height.';
      if (Object.keys(errors).length) return { errors };
      const kg = C.toKg(v.weight, v.wunit), cm = C.toCm(v.height, v.hunit);
      if (kg < 25 || kg > 350 || cm < 100 || cm > 250) return { errors: { height: 'Check your height and weight units.' } };
      const bmr = C.mifflin({ sex: v.sex, kg, cm, age: v.age });
      return {
        hero: { icon: 'flame', value: num(bmr, 0), label: 'calories a day at rest (BMR)' },
        rows: [
          ['Basal metabolic rate', `${num(bmr, 0)} kcal/day`],
          ['Per hour', `${num(bmr / 24, 0)} kcal`, 'clock'],
          ['Equation', `Mifflin-St Jeor, ${v.sex === 'male' ? 'male' : 'female'} version`, 'activity'],
        ],
        insight: `Your body uses an estimated ${num(bmr, 0)} calories a day just to keep you alive at rest. Your total daily needs are higher once you add movement, which the TDEE Calculator estimates.`,
        note: v.age < 19 || v.age > 78 ? 'The equation was developed from adults aged 19 to 78, so treat results outside that range as rougher estimates.' : '',
      };
    },

    'tdee': v => {
      const C = window.WSCore;
      const errors = {};
      if (!(v.age >= 18 && v.age <= 100)) errors.age = 'Enter an age from 18 to 100.';
      if (!(v.weight > 0)) errors.weight = 'Enter your weight.';
      if (!(v.height > 0)) errors.height = 'Enter your height.';
      if (Object.keys(errors).length) return { errors };
      const kg = C.toKg(v.weight, v.wunit), cm = C.toCm(v.height, v.hunit);
      if (kg < 25 || kg > 350 || cm < 100 || cm > 250) return { errors: { height: 'Check your height and weight units.' } };
      const bmr = C.mifflin({ sex: v.sex, kg, cm, age: v.age });
      const t = C.tdee(bmr, v.level);
      return {
        hero: { icon: 'activity', value: num(t.typical, 0), label: 'estimated calories a day (TDEE)' },
        rows: [
          ['Estimated TDEE', `${num(t.typical, 0)} kcal/day`],
          ['Range for this activity level', `${num(t.lo, 0)} to ${num(t.hi, 0)} kcal/day`, 'activity'],
          ['BMR (at rest)', `${num(bmr, 0)} kcal/day`, 'flame'],
          ['Activity multiplier', `${num(t.pal.typical, 2)} (band ${num(t.pal.lo, 2)} to ${num(t.pal.hi, 2)})`, 'walk'],
        ],
        insight: `At a ${t.pal.label.toLowerCase()} lifestyle, you burn an estimated ${num(t.typical, 0)} calories a day. The FAO band for this level runs from ${num(t.lo, 0)} to ${num(t.hi, 0)}, which shows how much activity estimates can vary.`,
        note: v.age < 19 || v.age > 78 ? 'The BMR equation was developed from adults aged 19 to 78, so treat results outside that range as rougher estimates.' : '',
      };
    },

    'calorie-deficit': v => {
      const C = window.WSCore;
      const errors = {};
      if (!(v.maint >= 800 && v.maint <= 10000)) errors.maint = 'Enter maintenance calories between 800 and 10,000.';
      const d = v.deficit === 'custom' ? v.custom : Number(v.deficit);
      if (v.deficit === 'custom' && !(v.custom >= 0)) errors.custom = 'Enter a deficit of 0 or more.';
      if (Object.keys(errors).length) return { errors };
      if (d >= v.maint) return { errors: { custom: 'The deficit must be smaller than your maintenance calories.' } };
      const target = C.deficitTarget(v.maint, d);
      const note = target <= 800
        ? 'A target of about 800 calories a day or less counts as a very low-calorie diet, which NIDDK describes as supervised by a health care professional. Talk to a clinician before eating this little.'
        : 'This is arithmetic, not a prediction. Real weight change depends on many factors, and the CDC notes that gradual loss of about 1 to 2 pounds a week is more likely to last.';
      return {
        hero: { icon: 'scale', value: num(target, 0), label: 'calories a day target' },
        rows: [
          ['Target intake', `${num(target, 0)} kcal/day`],
          ['Daily deficit', `${num(d, 0)} kcal`, 'trending-down'],
          ['Weekly deficit', `${num(d * 7, 0)} kcal`, 'calendar'],
          ['Maintenance', `${num(v.maint, 0)} kcal/day`, 'flame'],
        ],
        insight: `Eating about ${num(target, 0)} calories a day would put you ${num(d, 0)} calories below your estimated maintenance of ${num(v.maint, 0)}.`,
        note,
      };
    },

    'macro': v => {
      const C = window.WSCore;
      const errors = {};
      if (!(v.kcal >= 500 && v.kcal <= 10000)) errors.kcal = 'Enter daily calories between 500 and 10,000.';
      let pct;
      if (v.preset === 'custom') {
        ['p', 'c', 'f'].forEach(k => { if (!(v[k] >= 0 && v[k] <= 100)) errors[k] = 'Enter a percentage from 0 to 100.'; });
        pct = { protein: v.p, carbs: v.c, fat: v.f };
        if (!Object.keys(errors).length && Math.abs(v.p + v.c + v.f - 100) > 0.01) errors.f = `Your percentages add up to ${num(v.p + v.c + v.f, 1)}%. Adjust them to total 100%.`;
      } else {
        const [p, c, f] = String(v.preset).split('-').map(Number);
        pct = { protein: p, carbs: c, fat: f };
      }
      if (Object.keys(errors).length) return { errors };
      const g = C.macros(v.kcal, pct);
      const out = (k, lo, hi) => pct[k] < lo || pct[k] > hi;
      const flags = [out('protein', 10, 35) && 'protein', out('carbs', 45, 65) && 'carbohydrate', out('fat', 20, 35) && 'fat'].filter(Boolean);
      return {
        hero: { icon: 'activity', value: `${num(g.protein, 0)} / ${num(g.carbs, 0)} / ${num(g.fat, 0)}`, label: 'grams of protein / carbs / fat a day' },
        rows: [
          ['Protein', `${num(g.protein, 0)} g (${num(pct.protein, 0)}%, ${num(g.protein * 4, 0)} kcal)`, 'barbell'],
          ['Carbohydrate', `${num(g.carbs, 0)} g (${num(pct.carbs, 0)}%, ${num(g.carbs * 4, 0)} kcal)`, 'activity'],
          ['Fat', `${num(g.fat, 0)} g (${num(pct.fat, 0)}%, ${num(g.fat * 9, 0)} kcal)`, 'droplet'],
        ],
        insight: `${num(v.kcal, 0)} calories split ${num(pct.protein, 0)}/${num(pct.carbs, 0)}/${num(pct.fat, 0)} works out to ${num(g.protein, 0)} g protein, ${num(g.carbs, 0)} g carbohydrate and ${num(g.fat, 0)} g fat a day.`,
        note: flags.length ? `Your ${flags.join(' and ')} share is outside the adult Acceptable Macronutrient Distribution Range (protein 10 to 35%, carbohydrate 45 to 65%, fat 20 to 35%).` : '',
      };
    },

    'protein': v => {
      const C = window.WSCore;
      const errors = {};
      if (!(v.weight > 0)) errors.weight = 'Enter your body weight.';
      if (Object.keys(errors).length) return { errors };
      const kg = C.toKg(v.weight, v.wunit);
      if (kg < 25 || kg > 350) return { errors: { weight: 'Check your weight and unit.' } };
      const r = C.protein(kg, v.scenario);
      const range = r.lo === r.hi ? `${num(r.lo, 0)} g` : `${num(r.lo, 0)} to ${num(r.hi, 0)} g`;
      const rda = C.protein(kg, 'rda').lo;
      return {
        hero: { icon: 'barbell', value: range.replace(' g', ''), label: 'grams of protein a day' },
        rows: [
          ['Daily protein', range],
          ['Scenario', `${r.s.label} (${r.s.lo === r.s.hi ? num(r.s.lo, 1) : `${num(r.s.lo, 1)} to ${num(r.s.hi, 1)}`} g/kg)`, 'activity'],
          ['Your weight', `${num(kg, 1)} kg`, 'scale'],
          ['Adult RDA for comparison', `${num(rda, 0)} g`, 'user'],
        ],
        insight: v.scenario === 'rda'
          ? `The RDA works out to about ${num(rda, 0)} g of protein a day at your weight. That's the amount that meets the needs of nearly all healthy adults.`
          : `For most people who exercise, the ISSN suggests ${range} of protein a day at your weight, compared with ${num(rda, 0)} g for the general RDA.`,
        note: 'People with kidney disease or other medical conditions should ask a clinician before raising their protein intake.',
      };
    },

    'vo2-max': v => {
      const C = window.WSCore;
      if (!(v.distance > 0)) return { errors: { distance: 'Enter the distance you covered.' } };
      const m = v.dunit === 'mi' ? v.distance * C.MI : v.dunit === 'km' ? v.distance * 1000 : v.distance;
      if (m < 800 || m > 5500) return { errors: { distance: 'Enter a 12-minute distance between about 0.5 and 3.4 miles (800 to 5,500 m). Check the unit.' } };
      const vo2 = C.cooper(m);
      return {
        hero: { icon: 'heartbeat', value: num(vo2, 1), label: 'estimated VO2 max (mL/kg/min)' },
        rows: [
          ['Estimated VO2 max', `${num(vo2, 1)} mL/kg/min`],
          ['Distance in 12 minutes', `${num(m, 0)} m (${num(m / C.MI, 2)} mi)`, 'route'],
          ['Average pace', `${fmtDur(12 / (m / C.MI))} per mile`, 'stopwatch'],
        ],
        insight: `Covering ${num(m / C.MI, 2)} miles in 12 minutes gives an estimated VO2 max of ${num(vo2, 1)} mL/kg/min with the Cooper formula. Lab treadmill tests measure it directly.`,
        note: 'For context, the FRIEND registry reports measured treadmill averages of 38.8 mL/kg/min for men and 27.9 for women aged 40 to 49. A field estimate and a lab test are not directly comparable.',
      };
    },

    'weight-loss-percentage': v => {
      const C = window.WSCore;
      const errors = {};
      if (!(v.start > 0)) errors.start = 'Enter a starting weight above zero.';
      if (!(v.current > 0)) errors.current = 'Enter a current weight above zero.';
      if (Object.keys(errors).length) return { errors };
      if (v.current > v.start * 3 || v.current < v.start / 3) return { errors: { current: 'Check both weights use the same unit.' } };
      const pc = C.pctChange(v.start, v.current);
      const diff = v.start - v.current;
      const u = v.wunit;
      const word = diff > 0 ? 'lost' : diff < 0 ? 'gained' : 'no change';
      return {
        hero: { icon: 'scale', value: `${num(Math.abs(pc), 1)}%`, label: diff > 0 ? 'of starting weight lost' : diff < 0 ? 'gained from starting weight' : 'change from starting weight' },
        rows: [
          ['Percent change', `${pc > 0 ? '+' : ''}${num(pc, 2)}%`],
          [diff >= 0 ? 'Weight lost' : 'Weight gained', `${num(Math.abs(diff), 1)} ${u}`, 'scale'],
          ['Starting weight', `${num(v.start, 1)} ${u}`, 'flag'],
          ['Current weight', `${num(v.current, 1)} ${u}`, 'activity'],
        ],
        insight: diff === 0 ? 'Your current weight matches your starting weight.' : `Going from ${num(v.start, 1)} to ${num(v.current, 1)} ${u} is a ${num(Math.abs(pc), 1)}% ${diff > 0 ? 'decrease' : 'increase'}, or ${num(Math.abs(diff), 1)} ${u} ${word}.`,
      };
    },

    'marathon-pace': v => raceCalc(v, 'marathon'),
    'half-marathon-pace': v => raceCalc(v, 'half'),

    'treadmill-calories': v => {
      const C = window.WSCore;
      const errors = {};
      if (!(v.weight > 0)) errors.weight = 'Enter your body weight.';
      if (!(v.mph > 0 && v.mph <= 15)) errors.mph = 'Enter a speed from 0.5 to 15 mph.';
      if (!(v.grade >= 0 && v.grade <= 15)) errors.grade = 'Enter an incline from 0% to 15%.';
      if (!(v.minutes > 0)) errors.minutes = 'Enter a duration greater than zero.';
      if (Object.keys(errors).length) return { errors };
      const kg = C.toKg(v.weight, v.wunit);
      const spd = C.mphToMpm(v.mph), g = v.grade / 100;
      const run = v.mode === 'run';
      const vo2 = run ? C.acsmRun(spd, g) : C.acsmWalk(spd, g);
      const gross = C.kcalPerMin(vo2, kg) * v.minutes;
      const net = C.kcalPerMin(vo2 - 3.5, kg) * v.minutes;
      const mets = vo2 / 3.5;
      let note = '';
      if (!run && (v.mph < 1.9 || v.mph > 3.7)) note = 'The ACSM walking equation is most accurate at about 1.9 to 3.7 mph, so treat this result as rougher.';
      if (run && v.mph < 4) note = 'At this speed most people walk. Switch to Walking unless you are truly jogging.';
      return {
        hero: { icon: 'flame', value: num(gross, 0), label: 'estimated calories burned' },
        rows: [
          ['Gross calories', `${num(gross, 0)} kcal`],
          ['Net calories (above resting)', `${num(net, 0)} kcal`, 'activity'],
          ['Calories per hour', `${num(gross / v.minutes * 60, 0)} kcal`, 'clock'],
          ['Intensity', `${num(mets, 1)} METs · ${intensity(mets)}`, 'gauge'],
          ['Pace', `${fmtDur(60 / v.mph)} per mile`, 'stopwatch'],
        ],
        range: { title: 'Intensity on the MET scale', min: 1, max: 14, value: Math.min(14, mets), fmt: n => `${num(n, 1)} METs`, bands: [['Below moderate', 1, 3], ['Moderate', 3, 6], ['Vigorous', 6, 14]] },
        insight: `${run ? 'Running' : 'Walking'} at ${num(v.mph, 1)} mph${v.grade ? ` on a ${num(v.grade, 1)}% incline` : ''} for ${num(v.minutes, 0)} minutes burns about ${num(gross, 0)} calories in total, or ${num(net, 0)} above what you'd burn at rest.`,
        note,
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

// Wellness Signal calculator core: pure, unit-tested formulas shared by the
// calculators. No DOM access, no network, no storage. Inputs are canonical
// units (kg, cm, years, kcal) unless a function says otherwise. Results are
// returned unrounded; rounding happens only at display time.
//
// Sources (verified November 2026):
// - Mifflin MD et al., Am J Clin Nutr 1990;51:241-7 (PMID 2305711)
// - FAO/WHO/UNU, Human Energy Requirements, 2001 (PAL bands and examples)
// - 21 CFR 101.9(c)(1)(i)(B): general factors 4, 4 and 9 kcal per gram
// - RDA 0.8 g/kg protein (Wolfe & Cifelli, Adv Nutr 2017, PMC5347101)
// - Jager R et al., ISSN position stand: protein and exercise, 2017 (PMID 28642676)
// - WHO, Waist Circumference and Waist-Hip Ratio, Expert Consultation 2008 (cut-offs 0.90 M, 0.85 W)
// - Hodgdon JA, Beckett MB 1984 Navy circumference equations, as given in PMC10282178 and PMC9008774
// - Munro MG et al., FIGO 2018 normal uterine bleeding (PMID 30198563): cycles 24 to 38 days
// - Fiber AI 14 g/1,000 kcal; 25/38 g (19-50), 21/30 g (51+), as given in PMC9043041
// - Caffeine half-life about 3 to 7 h (PMC13414015) or 4 to 6 h in many adults (PMC13278887)
// - Pandolf KB et al. 1977 load carriage equation, as given in PMC4511810
// - FDA, Spilling the Beans: How Much Caffeine Is Too Much? (12 fl oz typical amounts)
(function (root) {
  const LB = 0.45359237;
  const IN = 2.54;

  const toKg = (w, unit) => (unit === 'kg' ? w : w * LB);
  const toCm = (h, unit) => (unit === 'cm' ? h : h * IN);

  // Mifflin-St Jeor resting energy expenditure, kcal/day (simplified sex-specific form).
  const mifflin = ({ sex, kg, cm, age }) => 10 * kg + 6.25 * cm - 5 * age + (sex === 'female' ? -161 : 5);

  // FAO/WHO/UNU 2001 physical activity level bands (TEE = BMR x PAL) and the
  // example mean PAL for each lifestyle from the report's factorial table.
  const PAL = {
    sedentary: { lo: 1.4, hi: 1.69, typical: 1.53, label: 'Sedentary or light activity' },
    active: { lo: 1.7, hi: 1.99, typical: 1.76, label: 'Active or moderately active' },
    vigorous: { lo: 2.0, hi: 2.4, typical: 2.25, label: 'Vigorous or vigorously active' },
  };
  const tdee = (bmr, level) => {
    const p = PAL[level];
    if (!p) throw new Error(`unknown activity level ${level}`);
    return { typical: bmr * p.typical, lo: bmr * p.lo, hi: bmr * p.hi, pal: p };
  };

  // Calorie target: plain arithmetic, not a weight-change prediction.
  const deficitTarget = (maintenance, deficit) => maintenance - deficit;

  // Atwater general factors (21 CFR 101.9).
  const KCAL_PER_G = { protein: 4, carbs: 4, fat: 9 };
  const macros = (kcal, pct) => {
    const sum = pct.protein + pct.carbs + pct.fat;
    if (Math.abs(sum - 100) > 0.01) throw new Error('percentages must total 100');
    const g = k => (kcal * pct[k] / 100) / KCAL_PER_G[k];
    return { protein: g('protein'), carbs: g('carbs'), fat: g('fat') };
  };

  // Protein scenarios in g per kg body weight per day.
  const PROTEIN = {
    rda: { lo: 0.8, hi: 0.8, label: 'General adult RDA' },
    exercise: { lo: 1.4, hi: 2.0, label: 'Most exercising adults (ISSN)' },
  };
  const protein = (kg, scenario) => {
    const s = PROTEIN[scenario];
    if (!s) throw new Error(`unknown scenario ${scenario}`);
    return { lo: kg * s.lo, hi: kg * s.hi, s };
  };


  // Cooper 12-minute run (Cooper KH, JAMA 1968): VO2max = (metres - 504.9) / 44.73, mL/kg/min.
  const MI = 1609.344;
  const cooper = meters => (meters - 504.9) / 44.73;

  // Percent change from a starting value. Positive = increase.
  const pctChange = (start, current) => ((current - start) / start) * 100;

  // Official road race distances in metres (World Athletics).
  const RACE = { marathon: 42195, half: 21097.5 };
  // Even-pace split time (seconds) at a distance (metres) for a finish time (seconds).
  const split = (finishSec, raceM, atM) => finishSec * (atM / raceM);
  const paceSec = (finishSec, raceM, unitM) => finishSec / (raceM / unitM);

  // ACSM metabolic equations, VO2 in mL/kg/min. Speed in m/min, grade as a decimal.
  const acsmWalk = (sMpm, grade) => 0.1 * sMpm + 1.8 * sMpm * grade + 3.5;
  const acsmRun = (sMpm, grade) => 0.2 * sMpm + 0.9 * sMpm * grade + 3.5;
  // About 5 kcal per litre of oxygen.
  const kcalPerMin = (vo2, kg) => vo2 * kg / 1000 * 5;
  const mphToMpm = mph => mph * MI / 60;


  // Lean body mass from a known body fat percentage. Lean mass is everything that
  // is not fat (muscle, bone, organs, water), not muscle alone.
  const leanMass = (kg, bfPct) => {
    if (!(bfPct >= 0 && bfPct < 100)) throw new Error('body fat must be 0 to under 100');
    return { lean: kg * (1 - bfPct / 100), fat: kg * bfPct / 100 };
  };

  // Waist-to-hip ratio and WHO 2008 cut-offs for substantially increased risk.
  const whr = (waist, hip) => waist / hip;
  const WHR_CUT = { male: 0.90, female: 0.85 };

  // US Navy circumference equations (Hodgdon & Beckett 1984), all lengths in inches.
  // Men: abdomen at the navel. Women: waist at its narrowest plus hips at the widest.
  const navyBF = ({ sex, height, neck, waist, hip }) => {
    const L = Math.log10;
    if (sex === 'female') {
      const x = waist + hip - neck;
      if (!(x > 0)) throw new Error('waist + hip must exceed neck');
      return 163.205 * L(x) - 97.684 * L(height) - 78.387;
    }
    const x = waist - neck;
    if (!(x > 0)) throw new Error('waist must exceed neck');
    return 86.010 * L(x) - 70.041 * L(height) + 36.76;
  };

  // FDA typical caffeine per 12 fl oz (mg), low and high (FDA consumer update).
  const CAFFEINE_12OZ = {
    coffee: [113, 247], blackTea: [71, 71], greenTea: [37, 37], soda: [23, 83], energy: [41, 246],
  };
  // servings: { key: number of 12 fl oz servings }, extraMg: exact mg from labels.
  const caffeine = (servings, extraMg = 0) => {
    let lo = extraMg, hi = extraMg;
    for (const [k, n] of Object.entries(servings)) {
      const r = CAFFEINE_12OZ[k];
      if (!r) throw new Error(`unknown drink ${k}`);
      if (!(n >= 0)) throw new Error('servings must be 0 or more');
      lo += r[0] * n; hi += r[1] * n;
    }
    return { lo, hi };
  };

  // Walking time in minutes: distance ÷ speed (same distance unit per hour) plus breaks.
  const walkMinutes = (distance, speedPerHour, breakMin = 0) => {
    if (!(speedPerHour > 0)) throw new Error('speed must be above zero');
    return distance / speedPerHour * 60 + breakMin;
  };


  // Calendar arithmetic on ISO dates (YYYY-MM-DD) in UTC, so daylight saving never shifts a day.
  const addDays = (iso, n) => {
    const [y, m, d] = iso.split('-').map(Number);
    const t = new Date(Date.UTC(y, m - 1, d + n));
    return t.toISOString().slice(0, 10);
  };
  const daysBetween = (a, b) => {
    const p = s => { const [y, m, d] = s.split('-').map(Number); return Date.UTC(y, m - 1, d); };
    return Math.round((p(b) - p(a)) / 86400000);
  };
  // Predicted period starts: last start + k × cycle length, each with ± variation days.
  const periodDates = (lastStart, cycle, variation = 0, count = 3) => {
    if (!(cycle >= 15 && cycle <= 90)) throw new Error('cycle length out of range');
    return Array.from({ length: count }, (_, i) => {
      const k = i + 1;
      return { date: addDays(lastStart, cycle * k), earliest: addDays(lastStart, cycle * k - variation), latest: addDays(lastStart, cycle * k + variation) };
    });
  };
  // FIGO 2018: regular cycles are 24 to 38 days long.
  const FIGO_CYCLE = { lo: 24, hi: 38 };

  // Dietary fiber Adequate Intakes for adults (g/day) and the 14 g per 1,000 kcal basis.
  const FIBER_AI = { female: { '19-50': 25, '51+': 21 }, male: { '19-50': 38, '51+': 30 } };
  const fiberByKcal = kcal => 14 * kcal / 1000;

  // First-order elimination: amount left = dose × 0.5^(hours ÷ half-life).
  const remaining = (dose, hours, halfLife) => {
    if (!(halfLife > 0)) throw new Error('half-life must be above zero');
    return dose * Math.pow(0.5, hours / halfLife);
  };

  // Swim pace. 1 yard = 0.9144 m exactly (NIST).
  const YD = 0.9144;
  const toMeters = (d, unit) => (unit === 'yd' ? d * YD : d);
  // Seconds per 100 of the chosen unit.
  const per100 = (seconds, distance, unit, outUnit) => {
    const m = toMeters(distance, unit);
    const out = outUnit === 'yd' ? m / YD : m;
    return seconds / out * 100;
  };

  // Pandolf et al. 1977 load-carriage equation, metabolic rate in watts.
  // W body mass kg, L load kg, V speed m/s, G grade %, eta terrain factor (1.0 blacktop or treadmill).
  const pandolf = ({ W, L, V, G = 0, eta = 1 }) =>
    1.5 * W + 2.0 * (W + L) * Math.pow(L / W, 2) + eta * (W + L) * (1.5 * V * V + 0.35 * V * G);
  const wattsToKcalPerHour = w => w * 3600 / 4184;

  const core = { LB, IN, toKg, toCm, mifflin, PAL, tdee, deficitTarget, KCAL_PER_G, macros, PROTEIN, protein, MI, cooper, pctChange, RACE, split, paceSec, acsmWalk, acsmRun, kcalPerMin, mphToMpm, leanMass, whr, WHR_CUT, navyBF, CAFFEINE_12OZ, caffeine, walkMinutes, addDays, daysBetween, periodDates, FIGO_CYCLE, FIBER_AI, fiberByKcal, remaining, YD, toMeters, per100, pandolf, wattsToKcalPerHour };
  root.WSCore = core;
  if (typeof module !== 'undefined' && module.exports) module.exports = core;
})(typeof globalThis !== 'undefined' ? globalThis : this);

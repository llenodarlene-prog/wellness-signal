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

  const core = { LB, IN, toKg, toCm, mifflin, PAL, tdee, deficitTarget, KCAL_PER_G, macros, PROTEIN, protein, MI, cooper, pctChange, RACE, split, paceSec, acsmWalk, acsmRun, kcalPerMin, mphToMpm };
  root.WSCore = core;
  if (typeof module !== 'undefined' && module.exports) module.exports = core;
})(typeof globalThis !== 'undefined' ? globalThis : this);

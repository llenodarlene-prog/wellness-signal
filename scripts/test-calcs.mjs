// Unit tests for assets/js/calc-core.js. Expected values are worked out by
// hand from the published formulas, not copied from the code under test.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const ctx = { globalThis: {} };
ctx.globalThis = ctx;
vm.runInNewContext(await readFile('assets/js/calc-core.js', 'utf8'), ctx);
const C = ctx.WSCore;
let n = 0;
const near = (a, b, tol = 1e-6, msg = '') => { n++; assert.ok(Math.abs(a - b) <= tol, `${msg} expected ${b}, got ${a}`); };
const throws = (fn, msg) => { n++; assert.throws(fn, undefined, msg); };

// Unit conversion
near(C.toKg(160, 'lb'), 72.5747792, 1e-6, '160 lb');
near(C.toKg(70, 'kg'), 70, 0, 'kg passthrough');
near(C.toCm(66, 'in'), 167.64, 1e-9, '66 in');
near(C.toCm(170, 'cm'), 170, 0, 'cm passthrough');

// Mifflin-St Jeor: 10w + 6.25h - 5a + 5 (male) / -161 (female)
near(C.mifflin({ sex: 'male', kg: 80, cm: 180, age: 30 }), 800 + 1125 - 150 + 5, 1e-9, 'male 80/180/30'); // 1780
near(C.mifflin({ sex: 'female', kg: 60, cm: 165, age: 40 }), 600 + 1031.25 - 200 - 161, 1e-9, 'female 60/165/40'); // 1270.25
near(C.mifflin({ sex: 'female', kg: 72.5747792, cm: 167.64, age: 35 }), 725.747792 + 1047.75 - 175 - 161, 1e-6, 'female imperial'); // 1437.497792
near(C.mifflin({ sex: 'male', kg: 50, cm: 150, age: 78 }), 500 + 937.5 - 390 + 5, 1e-9, 'boundary age 78'); // 1052.5

// TDEE = BMR x PAL (FAO 2001)
near(C.tdee(1780, 'sedentary').typical, 1780 * 1.53, 1e-9, 'sedentary typical'); // 2723.4
near(C.tdee(1780, 'active').lo, 1780 * 1.7, 1e-9, 'active low');
near(C.tdee(1270.25, 'vigorous').hi, 1270.25 * 2.4, 1e-9, 'vigorous high'); // 3048.6
throws(() => C.tdee(1500, 'extreme'), 'unknown PAL');

// Deficit arithmetic
near(C.deficitTarget(2500, 500), 2000, 0, 'deficit 500');
near(C.deficitTarget(1800, 0), 1800, 0, 'deficit 0');

// Macros: 2,000 kcal at 20/50/30 -> 100 g protein, 250 g carbs, 66.67 g fat
let m = C.macros(2000, { protein: 20, carbs: 50, fat: 30 });
near(m.protein, 100, 1e-9, 'protein g'); near(m.carbs, 250, 1e-9, 'carb g'); near(m.fat, 600 / 9, 1e-9, 'fat g');
m = C.macros(1800, { protein: 30, carbs: 40, fat: 30 });
near(m.protein, 135, 1e-9); near(m.carbs, 180, 1e-9); near(m.fat, 60, 1e-9);
near(m.protein * 4 + m.carbs * 4 + m.fat * 9, 1800, 1e-9, 'macros sum back to calories');
throws(() => C.macros(2000, { protein: 30, carbs: 30, fat: 30 }), 'must total 100');

// Protein: 70 kg -> RDA 56 g; exercise 98 to 140 g
let p = C.protein(70, 'rda');
near(p.lo, 56, 1e-9, 'rda 70kg');
p = C.protein(70, 'exercise');
near(p.lo, 98, 1e-9); near(p.hi, 140, 1e-9);
p = C.protein(C.toKg(160, 'lb'), 'rda');
near(p.lo, 58.05982336, 1e-6, 'rda 160 lb');
throws(() => C.protein(70, 'bodybuilder'), 'unknown scenario');


// Cooper: 2,400 m -> (2400 - 504.9) / 44.73 = 42.367
near(C.cooper(2400), 1895.1 / 44.73, 1e-9, 'cooper 2400 m');
near(C.cooper(1.5 * 1609.344), (2414.016 - 504.9) / 44.73, 1e-9, 'cooper 1.5 mi'); // 42.68
near(C.cooper(504.9), 0, 1e-12, 'cooper zero point');

// Percent change
near(C.pctChange(200, 180), -10, 1e-12, 'loss 10%');
near(C.pctChange(80, 84), 5, 1e-12, 'gain 5%');
near(C.pctChange(150, 150), 0, 0, 'no change');

// Race pace: 4:00:00 marathon -> 14,400 s / 26.2188 mi = 549.2 s/mi (9:09)
near(C.paceSec(14400, 42195, 1609.344), 14400 / (42195 / 1609.344), 1e-9, 'marathon pace/mi');
near(C.paceSec(14400, 42195, 1000), 14400 / 42.195, 1e-9, 'marathon pace/km'); // 341.27
near(C.split(14400, 42195, 21097.5), 7200, 1e-9, 'halfway split');
near(C.split(7200, 21097.5, 10000), 7200 * 10000 / 21097.5, 1e-9, 'half 10K split'); // 3412.73
near(C.RACE.half * 2, C.RACE.marathon, 0, 'half is half');

// ACSM: walking 3 mph (80.4672 m/min) flat -> 0.1*80.4672 + 3.5 = 11.54672
near(C.mphToMpm(3), 80.4672, 1e-9, 'mph to m/min');
near(C.acsmWalk(80.4672, 0), 11.54672, 1e-9, 'walk flat');
near(C.acsmWalk(80.4672, 0.05), 8.04672 + 1.8 * 80.4672 * 0.05 + 3.5, 1e-9, 'walk 5%');
// Running 6 mph (160.9344 m/min) at 1% -> 32.18688 + 1.44841 + 3.5 = 37.13529
near(C.acsmRun(160.9344, 0.01), 0.2 * 160.9344 + 0.9 * 160.9344 * 0.01 + 3.5, 1e-9, 'run 1%');
near(C.kcalPerMin(10, 70), 3.5, 1e-12, 'kcal/min');


// Lean body mass: 180 lb at 25% fat -> 135 lb lean, 45 lb fat
let lb = C.leanMass(180, 25); near(lb.lean, 135, 1e-9, 'lean'); near(lb.fat, 45, 1e-9, 'fat');
near(C.leanMass(70, 0).lean, 70, 0, 'bf 0');
throws(() => C.leanMass(70, 100), 'bf 100'); throws(() => C.leanMass(70, -1), 'bf negative');

// Waist-to-hip ratio: 32 / 40 = 0.8
near(C.whr(32, 40), 0.8, 1e-12, 'whr'); near(C.WHR_CUT.male, 0.9, 0); near(C.WHR_CUT.female, 0.85, 0);

// Navy, man: height 70, neck 15, abdomen 34 -> 86.010*log10(19) - 70.041*log10(70) + 36.76
near(C.navyBF({ sex: 'male', height: 70, neck: 15, waist: 34 }), 86.010 * Math.log10(19) - 70.041 * Math.log10(70) + 36.76, 1e-9, 'navy male');
near(C.navyBF({ sex: 'male', height: 70, neck: 15, waist: 34 }), 17.513, 1e-3, 'navy male value'); // by hand: 86.010*1.27875 - 70.041*1.84510 + 36.76 = 109.986 - 129.233 + 36.76
// Navy, woman: height 64, neck 13, waist 28, hip 38 -> 163.205*log10(53) - 97.684*log10(64) - 78.387
near(C.navyBF({ sex: 'female', height: 64, neck: 13, waist: 28, hip: 38 }), 163.205 * Math.log10(53) - 97.684 * Math.log10(64) - 78.387, 1e-9, 'navy female');
near(C.navyBF({ sex: 'female', height: 64, neck: 13, waist: 28, hip: 38 }), 26.589, 1e-3, 'navy female value'); // 163.205*1.72428 - 97.684*1.80618 - 78.387
throws(() => C.navyBF({ sex: 'male', height: 70, neck: 16, waist: 15 }), 'neck > waist');

// Caffeine: 2 coffees + 1 black tea -> 2*113+71 = 297 to 2*247+71 = 565; plus 80 mg label
let cf = C.caffeine({ coffee: 2, blackTea: 1 }, 80); near(cf.lo, 377, 0, 'caf lo'); near(cf.hi, 645, 0, 'caf hi');
near(C.caffeine({}).hi, 0, 0, 'caf none'); throws(() => C.caffeine({ latte: 1 }), 'unknown drink');

// Walking: 3 miles at 3 mph = 60 min; 5 km at 4 km/h + 10 min break = 85 min
near(C.walkMinutes(3, 3), 60, 1e-12, 'walk'); near(C.walkMinutes(5, 4, 10), 85, 1e-12, 'walk break');
throws(() => C.walkMinutes(3, 0), 'zero speed');

console.log(`Calculator core tests passed (${n} assertions).`);

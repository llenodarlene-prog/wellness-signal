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

console.log(`Calculator core tests passed (${n} assertions).`);

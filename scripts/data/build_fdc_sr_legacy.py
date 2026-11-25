"""Build assets/data/fdc-sr-legacy.json from USDA FoodData Central SR Legacy (April 2018) CSVs.

Usage: python3 -I scripts/data/build_fdc_sr_legacy.py <path to FoodData_Central_sr_legacy_food_csv_2018-04>
Source: https://fdc.nal.usda.gov/download-datasets (public domain, CC0 1.0).
Nutrients are per 100 g of the food as listed. Missing values stay null, never zero.
"""
import csv, json, sys, os

src = sys.argv[1]
NUT = [('1008', 'kcal'), ('1003', 'protein'), ('1004', 'fat'), ('1005', 'carbs'),
       ('1079', 'fiber'), ('2000', 'sugars'), ('1258', 'satfat'), ('1093', 'sodium')]
idx = {k: i for i, (k, _) in enumerate(NUT)}
rd = lambda name: csv.DictReader(open(os.path.join(src, name), encoding='utf-8'))

cats = {r['id']: r['description'] for r in rd('food_category.csv')}
units = {r['id']: r['name'] for r in rd('measure_unit.csv')}
foods = {}
for r in rd('food.csv'):
    foods[r['fdc_id']] = [int(r['fdc_id']), r['description'], cats.get(r['food_category_id'], ''), [None] * len(NUT), []]
for r in rd('food_nutrient.csv'):
    f = foods.get(r['fdc_id'])
    if f and r['nutrient_id'] in idx and r['amount'] != '':
        f[3][idx[r['nutrient_id']]] = round(float(r['amount']), 3)
for r in rd('food_portion.csv'):
    f = foods.get(r['fdc_id'])
    if not f or not r['gram_weight']:
        continue
    unit = units.get(r['measure_unit_id'], '')
    unit = '' if unit in ('undetermined', '') else unit
    amt = r['amount'].rstrip('0').rstrip('.') if '.' in r['amount'] else r['amount']
    label = ' '.join(x for x in [amt, unit, r['portion_description'], r['modifier']] if x).strip()
    f[4].append([label, round(float(r['gram_weight']), 2)])
out = {'source': 'USDA FoodData Central, SR Legacy (April 2018), public domain',
       'url': 'https://fdc.nal.usda.gov/', 'per': '100 g',
       'nutrients': [n for _, n in NUT], 'foods': sorted(foods.values(), key=lambda f: f[1].lower())}
json.dump(out, open('assets/data/fdc-sr-legacy.json', 'w'), separators=(',', ':'))
print(len(out['foods']), 'foods')

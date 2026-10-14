// Charts embedded in posts with a {{chart:id}} line. Every value must match
// the cited source in the post; hypothetical figures must say so in `note`.
export const charts = {
  'generation-share': {
    title: 'Share of US adults vs share of US wellness spending',
    unit: '%',
    max: 50,
    series: [
      { key: 'population', label: 'Share of adult population' },
      { key: 'spending', label: 'Share of wellness spending' },
    ],
    rows: [
      { label: 'Gen Z and millennials', population: 36, spending: 41, prefix: { spending: '>' } },
      { label: 'Adults aged 58 and older', population: 35, spending: 28 },
    ],
    source: 'McKinsey & Company, Future of Wellness, May 2025.',
    note: 'Gen Z and millennial spending share is "more than 41%".',
  },
  'wellness-economy-forecast': {
    title: 'Global wellness economy, US$ trillions',
    unit: 'T',
    currency: '$',
    max: 10,
    series: [{ key: 'value', label: 'Wellness economy' }],
    rows: [
      { label: '2024 (estimate)', value: 6.8 },
      { label: '2029 (projection)', value: 9.8, projected: true },
    ],
    source: 'Global Wellness Institute, 2025 Global Wellness Economy Monitor.',
    note: 'The 2029 figure is a forecast, not recorded spending.',
  },
  'classpass-place-revenue': {
    title: 'Revenue from one class place, by booking scenario',
    unit: '',
    currency: '$',
    max: 30,
    series: [{ key: 'value', label: 'Revenue' }],
    rows: [
      { label: 'The place remains empty', value: 0 },
      { label: 'ClassPass booking', value: 16 },
      { label: 'Direct customer booking', value: 30 },
    ],
    source: 'Illustrative example from this article.',
    note: 'Hypothetical figures; not an actual ClassPass contract or published average payout.',
  },
};

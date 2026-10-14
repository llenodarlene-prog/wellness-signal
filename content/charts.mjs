// Charts embedded in posts with a {{chart:id}} line. Every value must match
// the cited source in the post; hypothetical figures must say so in `note`.
const GWI_NOV_2025 = 'Global Wellness Institute, "Wellness Market Hits Record $6.8 Trillion", November 25, 2025.';

export const charts = {
  'wellness-economy-scale': {
    title: 'Wellness economy vs related global markets, US$ trillions',
    unit: 'T',
    currency: '$',
    max: 12,
    series: [{ key: 'value', label: 'Market size' }],
    rows: [
      { label: 'Pharmaceutical industry', value: 1.8 },
      { label: 'Global wellness economy (2024)', value: 6.8 },
      { label: 'Total global health expenditure', value: 11.2 },
    ],
    source: GWI_NOV_2025,
    note: 'Markets are defined differently and partly overlap; figures show relative scale only.',
  },
  'wellness-growth-rates': {
    title: 'Wellness economy growth rates',
    unit: '%',
    max: 10,
    series: [{ key: 'value', label: 'Growth rate' }],
    rows: [
      { label: 'Average annual growth, last five years', value: 6.2 },
      { label: 'Growth, 2023 to 2024', value: 7.9 },
      { label: 'Projected annual growth through 2029', value: 7.6, projected: true },
    ],
    source: GWI_NOV_2025,
    note: 'The 2029 rate is a projection.',
  },
  'wellness-fastest-sectors': {
    title: 'Average annual growth over the last five years',
    unit: '%',
    max: 20,
    series: [{ key: 'value', label: 'Annual growth' }],
    rows: [
      { label: 'Wellness real estate', value: 19.5 },
      { label: 'Mental wellness', value: 12.4 },
      { label: 'Wellness economy overall', value: 6.2 },
    ],
    source: GWI_NOV_2025,
  },
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
  'classpass-class-capacity': {
    title: 'A 12-place class with eight bookings',
    unit: ' places',
    max: 12,
    series: [{ key: 'value', label: 'Places' }],
    rows: [
      { label: 'Booked', value: 8 },
      { label: 'Unsold when the class starts', value: 4, projected: true },
    ],
    source: 'Illustrative example from this article.',
    note: 'Unsold places earn nothing once the class begins.',
  },
  'classpass-contribution': {
    title: 'Contribution from one marketplace booking',
    unit: '',
    currency: '$',
    max: 30,
    series: [{ key: 'value', label: 'Amount' }],
    rows: [
      { label: 'Revenue from the ClassPass booking', value: 16 },
      { label: 'Additional cost of serving the customer', value: 3 },
      { label: 'Contribution before displaced sales', value: 13 },
      { label: 'Direct booking it could replace', value: 30, projected: true },
    ],
    source: 'Illustrative example from this article.',
    note: 'Hypothetical figures; not an actual ClassPass contract or published average payout.',
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

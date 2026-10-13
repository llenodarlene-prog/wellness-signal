// Interactive and visual blocks layered onto the page copy in pages.mjs.
// Every figure here must carry a named source; projections are labelled as such.

export const categoryIcons = {
  'wellness': 'leaf',
  'fitness': 'pulse',
  'mind-sleep': 'moon',
  'longevity-recovery': 'hourglass',
  'beauty-aesthetics': 'sparkle',
  'work-wellness': 'briefcase',
  'travel-retreats': 'compass',
};

export const economy = {
  source: 'Global Wellness Institute, 2024 Global Wellness Economy Monitor',
  sourceUrl: 'https://globalwellnessinstitute.org/industry-research/2024-global-wellness-economy-monitor',
  bars: [
    { label: '2023', value: 6.3, kind: 'measured', note: 'Measured market size' },
    { label: '2028', value: 9.0, kind: 'projected', note: 'Projection ("nearly $9.0 trillion")' },
  ],
  facts: [
    { value: '$6.3T', label: 'Global wellness economy, 2023' },
    { value: '6%', label: 'Average annual growth since 2019' },
    { value: '11', label: 'Sectors in the GWI definition' },
  ],
};

export const readingSteps = [
  { icon: 'source', h: 'Source', p: 'Who produced the figure, and do they have a commercial interest in it?' },
  { icon: 'flask', h: 'Method', p: 'Survey, sales data, model, or trial, and how large and representative the sample is.' },
  { icon: 'ruler', h: 'Definition', p: 'Which products, services, or populations the number actually includes.' },
  { icon: 'calendar', h: 'Timeframe', p: 'Whether it is historical, a current estimate, or a projection.' },
];

export const separations = [
  ['Scientific findings', 'Commercial forecasts'],
  ['Early research', 'Established evidence'],
  ['Consumer interest', 'Demonstrated benefits'],
  ['Market growth', 'Proof of effectiveness'],
];

export const evidenceLadder = [
  { h: 'Marketing claims', p: 'Statements made to sell a product or service. Useful for tracking what the industry is promoting, not for judging whether it works.' },
  { h: 'Anecdotes and testimonials', p: 'Individual experiences. They can point to questions worth studying, but cannot separate an effect from coincidence or expectation.' },
  { h: 'Observational studies', p: 'Research that follows people without assigning an intervention. Good at spotting associations; weaker at proving cause and effect.' },
  { h: 'Randomised controlled trials', p: 'Participants are randomly assigned to an intervention or a comparison. The strongest single-study design for testing whether something works.' },
  { h: 'Systematic reviews and meta-analyses', p: 'Structured syntheses of all relevant studies on a question. The most reliable summary of what the evidence shows, when the underlying studies are sound.' },
];

export const partnerRules = {
  accept: [
    'Original, evidence-based analysis',
    'Claims supported by credible, cited sources',
    'Sponsored articles labelled as sponsored',
    'Disclosed commercial relationships',
  ],
  decline: [
    'Medical claims without supporting evidence',
    'Undisclosed paid links or placements',
    'Promotional copy presented as editorial',
    'Previously published or AI-spun content',
  ],
};

export const standardIcons = {
  'Source Quality': 'source',
  'Research Context': 'flask',
  'Accurate Data': 'chart',
  'Balanced Reporting': 'scale',
  'Clear Communication': 'message',
  'Editorial Enquiries': 'message',
  'Corrections and Updates': 'check',
  'Research and Contributions': 'source',
  'Guest Contributions': 'message',
  'Sponsored Content': 'sparkle',
  'Research Partnerships': 'chart',
};

// "What gets cited" versus "what we check", drawn from each category page's copy.
export const categoryLens = {
  'wellness': [
    ['Headline market size', 'Which products and services the estimate includes'],
    ['Popular diets and products', 'Whether research supports broad benefit claims'],
    ['Forecast growth', 'Measured market activity to date'],
  ],
  'fitness': [
    ['Gym membership numbers', 'How often people actually exercise'],
    ['Wearable measurements', 'The evidence behind each metric'],
    ['Trending training methods', 'Research into participation and outcomes'],
  ],
  'mind-sleep': [
    ['Self-reported sleep', 'Clinical or device-based measurement'],
    ['Meditation app outcomes', 'Study design and its limitations'],
    ['Stress-relief products', 'Whether they are a substitute for professional care'],
  ],
  'longevity-recovery': [
    ['Recovery product claims', 'How benefits were measured, and in whom'],
    ['Early-stage longevity research', 'Established findings in healthy aging'],
    ['Commercial demand', 'Demonstrated clinical benefit'],
  ],
  'beauty-aesthetics': [
    ['Ingredient and device claims', 'Published evidence of performance'],
    ['Projected market growth', 'Actual reported revenue'],
    ['Treatment popularity', 'Provider qualifications and oversight'],
  ],
  'work-wellness': [
    ['Programme availability', 'Employee participation'],
    ['Participation rates', 'Measurable outcomes'],
    ['Business-impact claims', 'Whether outcomes can be attributed to the programme'],
  ],
  'travel-retreats': [
    ['Wellness tourism totals', 'How each source defines wellness travel'],
    ['Market forecasts', 'Recorded spending and visitor patterns'],
    ['Luxury guest experience', 'Claims of medical or therapeutic effect'],
  ],
};

const s = 'fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"';
export const icons = {
  leaf: `<path d="M5 19c0-8 5-14 14-14 0 9-6 14-14 14Z"/><path d="M5 19 13 11"/>`,
  pulse: `<path d="M3 12h4l2-5 4 10 2-5h6"/>`,
  moon: `<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z"/>`,
  hourglass: `<path d="M7 3h10M7 21h10M8 3c0 5 8 6 8 9s-8 4-8 9M16 3c0 5-8 6-8 9s8 4 8 9"/>`,
  sparkle: `<path d="M12 3c.6 4.6 2.4 6.4 7 7-4.6.6-6.4 2.4-7 7-.6-4.6-2.4-6.4-7-7 4.6-.6 6.4-2.4 7-7Z"/><path d="M19 17v4M17 19h4"/>`,
  briefcase: `<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/>`,
  compass: `<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5 5-2Z"/>`,
  source: `<path d="M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2V5Z"/><path d="M4 19a2 2 0 0 1 2-2h12M8 7h6"/>`,
  flask: `<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3"/><path d="M7.5 15h9"/>`,
  ruler: `<path d="m3 17 14-14 4 4L7 21l-4-4Z"/><path d="m7 13 2 2M10 10l2 2M13 7l2 2"/>`,
  calendar: `<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>`,
  chart: `<path d="M4 20V10M10 20V4M16 20v-7M3 20h18"/>`,
  scale: `<path d="M12 3v18M5 21h14M6 7h12M6 7l-3 7a3 3 0 0 0 6 0L6 7ZM18 7l-3 7a3 3 0 0 0 6 0l-3-7Z"/>`,
  message: `<path d="M4 5h16v11H9l-5 4V5Z"/><path d="M8 9h8M8 12h5"/>`,
  check: `<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>`,
  mail: `<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>`,
  arrow: `<path d="M5 12h14M13 6l6 6-6 6"/>`,
};
export const icon = (name, size = 24) =>
  `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" ${s} aria-hidden="true">${icons[name] || ''}</svg>`;

// Decorative botanical line illustration, echoing the logo's leaf.
export const sprig = `<svg class="sprig" viewBox="0 0 220 320" fill="none" stroke="currentColor" stroke-width="1.1" aria-hidden="true">
  <path d="M110 315C108 230 112 150 140 20"/>
  <path d="M112 250c-30-6-52-26-60-58 30 4 52 24 60 58Z"/><path d="M112 250 70 205"/>
  <path d="M116 190c28-10 44-34 46-66-28 10-44 34-46 66Z"/><path d="M116 190l38-56"/>
  <path d="M120 135c-26-8-42-28-46-56 26 6 42 26 46 56Z"/><path d="M120 135 84 92"/>
  <path d="M128 85c22-10 34-30 34-54-22 10-34 30-34 54Z"/><path d="M128 85l28-44"/>
</svg>`;

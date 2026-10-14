// Site copy. Inline **bold** is supported. Values in `pending` are rendered as
// visible "to confirm" markers and block production builds until resolved.

export const categories = [
  { slug: 'wellness', name: 'Wellness', image: 'nutrition-table', summary: 'Consumer habits, wellness spending, nutrition trends, and the businesses influencing how people approach personal wellbeing.' },
  { slug: 'fitness', name: 'Fitness', image: 'pilates-stretch', summary: 'Exercise participation, gym industry trends, Pilates, yoga, fitness technology, and new approaches to physical activity.' },
  { slug: 'mind-sleep', name: 'Mind & Sleep', image: 'sleep-journal', summary: 'Sleep research, meditation, mindfulness, stress, and the products and practices associated with mental wellbeing.' },
  { slug: 'longevity-recovery', name: 'Longevity & Recovery', image: 'sauna-terrace', summary: 'Healthy aging, recovery methods, emerging technologies, and the evidence behind popular longevity practices.' },
  { slug: 'beauty-aesthetics', name: 'Beauty & Aesthetics', image: 'skincare-counter', summary: 'Skincare innovation, beauty technology, aesthetic treatments, and consumer trends across the beauty industry.' },
  { slug: 'work-wellness', name: 'Work & Wellness', image: 'workplace-lounge', summary: 'Employee wellbeing, corporate wellness programmes, workplace health trends, and research into programme effectiveness.' },
  { slug: 'travel-retreats', name: 'Travel & Retreats', image: 'retreat-pool-terrace', summary: 'Wellness tourism, spa destinations, retreats, hospitality trends, and the experiences influencing wellness travel.' },
];

const latest = (name, text, bg) => ({
  bg, bgStyle: 'light',
  h2: `Latest ${name} Articles`,
  p: [text],
  empty: true,
});

export const pages = [
  {
    slug: '',
    title: 'Wellness Signal | Wellness Research, Trends & Industry Insights',
    description: 'Research-backed insights into wellness trends, fitness, sleep, longevity, beauty, workplace wellbeing, and wellness travel.',
    hero: {
      h1: 'Wellness Research Beyond the Headlines',
      eyebrow: 'Health Insights for Healthier Tomorrow.',
      image: 'desk-sea-view',
      deck: 'Research, data, and industry developments across seven areas of wellness, read at the source.',
      secondary: { label: 'How We Work', href: '/about/#editorial-standards' },
      p: [
        'Wellness is more than a personal routine. It is shaping consumer habits, new technologies, business decisions, and the way people approach everyday health.',
        'At Wellness Signal, we examine the research, statistics, and industry developments behind these changes. From fitness and sleep to longevity and wellness travel, our coverage connects scientific findings with real consumer trends.',
        'We look beyond popular claims to bring you reliable information, relevant data, and fresh perspectives on the wellness industry.',
      ],
      cta: { label: 'Explore Our Articles', href: '#coverage' },
    },
    sections: [
      { type: 'facts' },
      {
        id: 'coverage', h2: 'Explore Our Coverage',
        p: ['Wellness spans many areas of everyday life. Our editorial coverage brings together research, consumer behaviour, and industry developments across seven key topics.'],
        categoryCards: true,
      },
      {
        h2: 'Research That Goes Beyond the Numbers', bg: 'data-laptop', bgStyle: 'dark',
        p: [
          'Statistics tell part of the story. The source, methodology, and context reveal what those figures actually represent.',
          'Our research-focused articles examine industry estimates, consumer surveys, participation data, and scientific findings. We look at how figures are collected, where comparisons can be misleading, and what the available evidence supports.',
          "Whether you're researching a wellness market, following consumer behaviour, or reviewing a new industry trend, we bring the relevant information together in one place.",
        ],
        cta: { label: 'Browse Our Research', href: '#coverage' },
        steps: true,
      },
      { type: 'chart' },
      {
        h2: 'Evidence Before Assumptions', tone: 'forest',
        p: [
          'A wellness product can attract widespread attention without having strong evidence behind its claims. A growing industry can generate impressive revenue without proving that every service delivers the results it promises.',
          'We examine these differences.',
          'Our editorial approach considers what consumers are doing, how industries are responding, and what research has established so far.',
          'We distinguish scientific findings from commercial forecasts, early research from established evidence, and consumer interest from demonstrated benefits.',
          'Our aim is to keep wellness reporting accurate, accessible, and useful.',
        ],
        cta: { label: 'About Wellness Signal', href: '/about/' },
        separations: true,
      },
      {
        h2: 'Latest from Wellness Signal',
        p: [
          'Stay informed about the latest research, market developments, and consumer trends across the wellness industry.',
          'Browse our newest articles covering fitness, sleep, recovery, beauty, workplace wellbeing, and travel.',
        ],
        empty: true, bg: 'retreat-pool-terrace', bgStyle: 'light',
        cta: { label: 'View All Articles', href: '#coverage' },
      },
    ],
  },
  {
    slug: 'about', nav: 'About',
    title: 'About Wellness Signal | Research, Trends & Editorial Standards',
    description: "Discover Wellness Signal's mission, editorial approach, and commitment to reliable research across health and wellness industries.",
    hero: {
      h1: 'About Wellness Signal', image: 'sage-leaf',
      deck: 'An independent editorial publication covering wellness research, consumer behaviour, and industry developments.',
      p: [
        'Wellness continues to influence how people live, work, exercise, travel, and spend. New products enter the market, consumer priorities shift, and scientific research introduces fresh perspectives on familiar practices.',
        'Keeping up with these developments can be challenging, particularly when commercial claims and scientific evidence are presented as though they carry the same weight.',
        'Wellness Signal is an independent editorial publication covering wellness research, consumer behaviour, and industry developments.',
        'We bring together statistics, scientific studies, market reports, and emerging trends to provide informed perspectives on the wellness industry and the choices influencing it.',
      ],
    },
    sections: [
      {
        h2: 'Our Mission', bg: 'research-reports', bgStyle: 'light',
        p: [
          'Our mission is to make wellness research and industry information accessible, accurate, and relevant.',
          'We examine the trends influencing consumer choices, the businesses responding to those trends, and the evidence supporting popular wellness practices.',
          'Rather than promoting a particular lifestyle or offering one-size-fits-all recommendations, we provide information that allows readers to evaluate claims, compare findings, and form their own perspectives.',
        ],
      },
      {
        h2: 'What We Cover', tone: 'white',
        p: ['Our editorial coverage spans seven areas:'],
        coverageIcons: true,
        list: [
          '**Wellness:** Consumer habits, nutrition trends, wellness spending, and industry research.',
          '**Fitness:** Exercise participation, fitness businesses, training trends, and wearable technology.',
          '**Mind & Sleep:** Sleep research, mindfulness, meditation, stress, and related consumer trends.',
          '**Longevity & Recovery:** Healthy aging, recovery services, emerging practices, and scientific evidence.',
          '**Beauty & Aesthetics:** Skincare, aesthetic services, beauty technology, and market developments.',
          '**Work & Wellness:** Workplace wellbeing, employee programmes, and corporate wellness research.',
          '**Travel & Retreats:** Wellness tourism, retreats, spas, and hospitality developments.',
        ],
      },
      {
        id: 'editorial-standards', h2: 'Our Editorial Standards', tone: 'cream',
        p: [
          'Reliable wellness reporting requires more than repeating statistics or summarising a study.',
          'We assess information based on its source, methodology, relevance, and limitations.',
        ],
        cards: [
          { h3: 'Source Quality', p: ['We prioritise credible sources, including peer-reviewed research, government publications, academic institutions, recognised industry reports, and original datasets.'] },
          { h3: 'Research Context', p: ["A study's findings depend on its design, participants, methods, and measured outcomes.", 'We aim to present those details where they are important to interpreting the results.'] },
          { h3: 'Accurate Data', p: ['We distinguish historical figures from current estimates and future projections. We also identify differences in market definitions, survey populations, and reporting periods when comparing statistics.'] },
          { h3: 'Balanced Reporting', p: ['Consumer popularity is not proof of scientific effectiveness.', 'We separate market developments from health-related evidence and avoid presenting emerging findings as established facts.'] },
          { h3: 'Clear Communication', p: ['We explain technical information in straightforward language without removing essential context or overstating conclusions.'] },
        ],
      },
      { type: 'ladder' },
      {
        h2: 'Who We Write For', bg: 'retreat-pool-terrace', bgStyle: 'dark',
        p: [
          'Wellness Signal serves readers interested in the research and trends influencing modern wellness.',
          'Our content is relevant to consumers, industry professionals, researchers, marketers, business owners, and anyone following developments across the wellness sector.',
          "Whether you're examining fitness participation, reviewing wellness statistics, or researching a growing market, our publication provides information drawn from documented sources.",
        ],
      },
      {
        h2: 'Corrections and Editorial Feedback', tone: 'white',
        p: [
          'Research evolves, and published figures may be revised as new information becomes available.',
          'We welcome factual corrections, updated sources, and questions about our coverage.',
          'When a material error is identified, we review the available evidence and correct the affected content where appropriate.',
        ],
      },
      {
        h2: 'Editorial Independence', bg: 'desk-laptop-brighter', bgStyle: 'dark',
        p: [
          'Our editorial focus is on accuracy, relevance, and useful information.',
          'We do not treat advertising claims, popularity, or commercial success as evidence of effectiveness.',
          'Any material commercial relationships associated with published content should be clearly disclosed.',
        ],
      },
      {
        h2: 'Contact Wellness Signal', bg: 'bedroom-sunset', bgStyle: 'light',
        p: ['Have a research source to share, a correction to suggest, or a question about our coverage?', 'We welcome relevant editorial enquiries.'],
        cta: { label: 'Contact Us', href: '/contact/' },
      },
    ],
  },
  {
    slug: 'wellness', category: true,
    title: 'Wellness Trends, Consumer Behaviour & Industry Research',
    description: 'Explore wellness statistics, consumer spending, nutrition trends, market developments, and research shaping the global wellness industry.',
    hero: {
      h1: 'Wellness Trends, Research, and Consumer Behaviour', image: 'nutrition-table',
      p: [
        'Wellness has become a significant part of consumer spending and everyday lifestyle choices. From nutrition and self-care to digital health products and personalised services, the industry continues to introduce new ways for people to approach wellbeing.',
        'Consumer interest, however, does not always reflect scientific evidence. Market growth also depends on how organisations define and measure different wellness categories.',
        'At Wellness Signal, we examine the statistics, research, and business developments behind wellness trends, placing consumer behaviour alongside the evidence that supports or challenges popular claims.',
      ],
    },
    sections: [
      {
        tone: 'white',
        cards: [
          { h3: 'Consumer Wellness Trends', p: ['Wellness habits vary by age, income, location, and personal priorities.', 'We examine how consumers approach wellness products, nutrition, self-care services, and daily routines. Our coverage considers survey findings, purchasing patterns, and the factors influencing demand.'] },
          { h3: 'Wellness Industry Statistics', p: ['Industry estimates can differ considerably depending on which products and services are included.', 'We review market data, spending reports, and forecasts while examining the definitions and research methods behind reported figures.', 'Our coverage distinguishes measured market activity from projections about future growth.'] },
          { h3: 'Nutrition and Everyday Wellness', p: ['Nutrition products, dietary trends, and wellness routines remain active areas of consumer interest.', 'We examine research and market developments related to nutrition habits, product categories, and changing preferences, without treating popular diets or emerging products as universally beneficial.'] },
          { h3: 'Emerging Wellness Markets', p: ['New technologies, retail categories, and personalised services continue to influence the industry.', 'We cover business developments, consumer adoption, and emerging wellness concepts, including the questions researchers and industry professionals are still investigating.'] },
        ],
        headingLevel: 2,
      },
      { type: 'lens' },
      latest('Wellness', 'Read research and insights covering wellness statistics, consumer behaviour, nutrition trends, and industry developments.', 'breakfast-bowl'),
    ],
  },
  {
    slug: 'fitness', category: true,
    title: 'Fitness Industry Trends, Statistics & Exercise Research',
    description: 'Explore fitness industry statistics, gym trends, exercise participation, Pilates, yoga, fitness technology, and consumer behaviour.',
    hero: {
      h1: 'Fitness Research, Exercise Trends, and Industry Insights', image: 'pilates-stretch',
      p: [
        'Fitness is no longer limited to traditional gyms. Boutique studios, digital platforms, wearable devices, and specialised training programmes have expanded the ways people exercise.',
        'These developments are influencing participation, spending, and the services offered by fitness businesses.',
        'Wellness Signal examines fitness industry statistics, exercise habits, and emerging technologies alongside research into physical activity and training.',
      ],
    },
    sections: [
      {
        tone: 'white', headingLevel: 2,
        cards: [
          { h3: 'Exercise Participation and Fitness Habits', p: ['Exercise participation varies across age groups, locations, and activities.', 'We examine physical activity surveys, participation statistics, and changes in consumer habits, distinguishing gym memberships from actual exercise frequency.'] },
          { h3: 'Gyms and Boutique Fitness Studios', p: ['The fitness industry includes large gym operators, independent facilities, Pilates studios, yoga businesses, and specialised training spaces.', 'Our coverage examines membership trends, business models, pricing, and the factors influencing how consumers choose fitness services.'] },
          { h3: 'Fitness Technology and Wearables', p: ['Smartwatches, fitness trackers, connected equipment, and digital applications provide new ways to monitor activity.', 'We explore consumer adoption, device capabilities, and the evidence behind commonly used fitness measurements.'] },
          { h3: 'Training Trends and Exercise Research', p: ['From strength training and running to Pilates and yoga, exercise preferences continue to evolve.', 'We examine research into different activities, participation patterns, and how new training approaches gain attention.'] },
        ],
      },
      { type: 'lens' },
      latest('Fitness', 'Browse fitness statistics, exercise research, gym industry developments, and technology trends.', 'pilates-studio'),
    ],
  },
  {
    slug: 'mind-sleep', category: true,
    title: 'Sleep Research, Mindfulness & Stress Trends',
    description: 'Explore sleep statistics, mindfulness research, meditation, stress trends, and evidence behind emerging sleep and wellbeing products.',
    hero: {
      h1: 'Sleep, Mindfulness, and Mental Wellbeing Research', image: 'sleep-journal',
      p: [
        'Sleep and mental wellbeing are closely connected to everyday routines, working habits, and overall health.',
        'Consumer interest in these areas has also created demand for sleep technology, meditation applications, mindfulness programmes, and other wellbeing services.',
        'Wellness Signal examines sleep statistics, mindfulness research, stress-related trends, and the businesses developing products and services in these categories.',
      ],
    },
    sections: [
      {
        tone: 'white', headingLevel: 2,
        cards: [
          { h3: 'Sleep Habits and Research', p: ['Sleep duration, quality, and consistency are measured in different ways across studies and population surveys.', 'We examine sleep statistics, research findings, and changes in consumer habits while distinguishing self-reported experiences from clinical or device-based measurements.'] },
          { h3: 'Meditation and Mindfulness', p: ['Meditation and mindfulness practices are used in personal routines, workplaces, and structured wellbeing programmes.', 'Our coverage examines participation trends, scientific research, and the reported outcomes of different approaches, with attention to the limitations of available studies.'] },
          { h3: 'Stress and Everyday Wellbeing', p: ['Stress is influenced by personal circumstances, work, lifestyle, and environmental factors.', 'We examine population surveys, workplace research, and consumer trends related to stress management, without treating general wellness practices as replacements for professional care.'] },
          { h3: 'Sleep Technology and Wellness Products', p: ['Sleep trackers, smart devices, digital programmes, and consumer products have become prominent within the wellness market.', 'We explore how these technologies are used, what they measure, and whether published research supports their claims.'] },
        ],
      },
      { type: 'lens' },
      latest('Mind & Sleep', 'Read coverage of sleep research, meditation, mindfulness, stress statistics, and related industry developments.', 'bedroom-sunset'),
    ],
  },
  {
    slug: 'longevity-recovery', category: true,
    title: 'Longevity Trends, Healthy Aging & Recovery Research',
    description: 'Explore longevity research, healthy aging, recovery technology, sauna trends, cold plunges, and evidence behind emerging recovery practices.',
    hero: {
      h1: 'Longevity, Healthy Aging, and Recovery Research', image: 'sauna-terrace',
      p: [
        'Longevity and recovery have attracted growing attention across fitness, wellness, technology, and hospitality.',
        'Consumers are exploring services such as saunas, cold-water immersion, recovery devices, and specialised programmes, while researchers continue to investigate healthy aging and the processes associated with long-term health.',
        'Wellness Signal examines scientific research, consumer adoption, and industry developments across longevity and recovery.',
      ],
    },
    sections: [
      {
        tone: 'white', headingLevel: 2,
        cards: [
          { h3: 'Healthy Aging and Longevity', p: ['Longevity research includes questions about lifespan, age-related health, physical function, and quality of life.', 'We examine studies, demographic data, and emerging approaches, distinguishing established findings from experimental interventions and early-stage research.'] },
          { h3: 'Recovery Practices', p: ['Saunas, cold plunges, massage, and other recovery services are promoted for a variety of purposes.', 'Our coverage looks at the available evidence, including how benefits are measured, which populations have been studied, and where findings remain limited.'] },
          { h3: 'Recovery Technology', p: ['Wearable devices, compression systems, and other recovery products have created new consumer markets.', 'We examine product categories, adoption trends, and research into their intended functions and claimed outcomes.'] },
          { h3: 'Longevity and Recovery Markets', p: ['Fitness studios, wellness resorts, specialised clinics, and technology businesses are responding to demand for recovery and healthy-aging services.', 'We explore market trends, business models, and consumer behaviour while keeping commercial growth separate from demonstrated clinical benefits.'] },
        ],
      },
      { type: 'lens' },
      latest('Longevity & Recovery', 'Browse research on healthy aging, recovery methods, wellness technologies, and industry statistics.', 'recovery-bench'),
    ],
  },
  {
    slug: 'beauty-aesthetics', category: true,
    title: 'Beauty & Aesthetics Trends, Statistics & Research',
    description: 'Explore beauty industry trends, skincare innovation, med spa statistics, aesthetic treatments, and consumer market research.',
    hero: {
      h1: 'Beauty Trends, Aesthetic Services, and Industry Research', image: 'skincare-counter',
      p: [
        'Beauty and aesthetics continue to evolve through product innovation, new technologies, and changing consumer preferences.',
        'Skincare brands, beauty device manufacturers, and aesthetic service providers are responding to demand for personalised products and professional treatments.',
        'Wellness Signal covers beauty industry statistics, skincare trends, consumer behaviour, and research related to emerging products and services.',
      ],
    },
    sections: [
      {
        tone: 'white', headingLevel: 2,
        cards: [
          { h3: 'Skincare and Consumer Trends', p: ['Skincare purchasing decisions are influenced by ingredients, product claims, price, personal preferences, and social media.', 'We examine consumer surveys, category growth, and research behind popular skincare approaches.'] },
          { h3: 'Beauty Technology', p: ['At-home devices, digital skin analysis, and technology-assisted treatments are introducing new products and services.', 'Our coverage explores product capabilities, market adoption, and available evidence concerning their performance.'] },
          { h3: 'Aesthetic Treatments and Med Spas', p: ['The aesthetic services market includes a wide range of procedures, providers, and business models.', 'We examine industry developments, consumer demand, service trends, and the role of qualifications and appropriate professional oversight.'] },
          { h3: 'Beauty Industry Statistics', p: ['Market reports provide information about spending, product categories, and changes in consumer demand.', 'We review these findings with attention to geographic scope, market definitions, and the difference between actual revenue and projected growth.'] },
        ],
      },
      { type: 'lens' },
      latest('Beauty & Aesthetics', 'Read articles covering skincare research, aesthetic services, beauty technology, and market developments.', 'skincare-vanity'),
    ],
  },
  {
    slug: 'work-wellness', category: true,
    title: 'Workplace Wellness Research & Corporate Wellness Trends',
    description: 'Explore corporate wellness statistics, employee wellbeing, workplace programmes, industry trends, and research into programme outcomes.',
    hero: {
      h1: 'Workplace Wellness, Employee Wellbeing, and Research', image: 'workplace-lounge',
      p: [
        'Employee wellbeing has become an important consideration for organisations evaluating workplace policies, benefits, and working conditions.',
        'Corporate wellness programmes now include physical activity initiatives, digital platforms, educational resources, and other employee services.',
        'But programme availability, employee participation, and measurable results are different indicators.',
        'Wellness Signal examines workplace wellness research, corporate spending, employee surveys, and the evidence behind common business claims.',
      ],
    },
    sections: [
      {
        tone: 'white', headingLevel: 2,
        cards: [
          { h3: 'Corporate Wellness Programmes', p: ['Wellness initiatives vary in design, objectives, and delivery.', 'We examine programme models, employer participation, and research into how different approaches are implemented and evaluated.'] },
          { h3: 'Employee Wellbeing', p: ['Working conditions, job demands, schedules, and organisational practices can influence employee wellbeing.', 'Our coverage reviews workplace surveys, employee experiences, and research into factors associated with wellbeing at work.'] },
          { h3: 'Workplace Wellness Statistics', p: ['Employers may measure programme performance through participation, satisfaction, retention, absenteeism, or other indicators.', 'We examine the research methods behind these figures and the challenges involved in attributing business outcomes to wellness initiatives.'] },
          { h3: 'Corporate Wellness Industry Trends', p: ['Digital platforms, employee benefits providers, and specialised wellness businesses operate within a diverse corporate market.', 'We explore purchasing trends, market research, and developments influencing employer decisions.'] },
        ],
      },
      { type: 'lens' },
      latest('Work & Wellness', 'Browse research on employee wellbeing, corporate wellness programmes, workplace trends, and industry statistics.', 'desk-sea-view'),
    ],
  },
  {
    slug: 'travel-retreats', category: true,
    title: 'Wellness Tourism, Retreats & Spa Industry Research',
    description: 'Explore wellness tourism statistics, spa industry trends, retreats, luxury wellness travel, and hospitality market developments.',
    hero: {
      h1: 'Wellness Tourism, Retreats, and Hospitality Trends', image: 'retreat-pool-terrace',
      p: [
        'Wellness has become an increasingly visible part of travel and hospitality, influencing hotel amenities, destination experiences, and specialised retreat programmes.',
        'Travellers can choose from spa-focused holidays, fitness retreats, relaxation experiences, and properties offering a broader range of wellness services.',
        'Wellness Signal examines consumer travel preferences, tourism research, spa industry developments, and the business models behind wellness-focused experiences.',
      ],
    },
    sections: [
      {
        tone: 'white', headingLevel: 2,
        cards: [
          { h3: 'Wellness Tourism Statistics', p: ['Wellness tourism research covers travel associated with personal wellbeing, although definitions differ across industry reports.', 'We examine spending estimates, visitor patterns, and market forecasts while identifying how different sources classify wellness-related travel.'] },
          { h3: 'Retreats and Wellness Experiences', p: ['Retreats vary in purpose, activities, accommodation, and professional services.', 'Our coverage examines consumer preferences, retreat formats, and the factors influencing demand for specialised wellness experiences.'] },
          { h3: 'Spa and Hospitality Industry', p: ['Spas, hotels, resorts, and independent wellness providers offer different services to leisure and destination travellers.', 'We explore operating models, consumer trends, industry statistics, and developments in hospitality wellness offerings.'] },
          { h3: 'Luxury Wellness Travel', p: ['Luxury wellness travel brings together premium accommodation, specialised facilities, and personalised experiences.', 'We examine market trends and changing guest expectations while distinguishing service quality and experience from claims of medical or therapeutic effectiveness.'] },
        ],
      },
      { type: 'lens' },
      latest('Travel & Retreats', 'Read research on wellness tourism, retreat trends, spa industry statistics, and hospitality developments.', 'bedroom-sunset'),
    ],
  },
  {
    slug: 'contact', nav: 'Contact',
    title: 'Contact Wellness Signal | Editorial & Research Enquiries',
    description: 'Contact Wellness Signal for editorial questions, research suggestions, factual corrections, and relevant business enquiries.',
    hero: {
      h1: 'Contact Wellness Signal', image: 'bedroom-sunset',
      p: [
        "Have a question about our research or something we've published?",
        'We welcome enquiries, factual corrections, relevant research sources, and suggestions for future editorial coverage.',
      ],
    },
    sections: [
      {
        tone: 'white', headingLevel: 2,
        cards: [
          { h3: 'Editorial Enquiries', p: ['For questions about published articles, research references, or topics covered on Wellness Signal, please contact our editorial team.'] },
          { h3: 'Corrections and Updates', p: ["If you've identified information that may be inaccurate or outdated, send us the article link, the relevant passage, and any supporting sources.", 'We review reported errors and make corrections where warranted.'] },
          { h3: 'Research and Contributions', p: ['We welcome relevant research publications, public datasets, industry reports, and editorial proposals aligned with our coverage.', 'Submitting a suggestion or proposal does not guarantee publication.'] },
        ],
      },
      {
        h2: 'Get in Touch', bg: 'desk-sea-view', bgStyle: 'light',
        p: ['{{editorial_email_line}}', 'Please include a clear subject line and relevant details so we can review your enquiry.'],
      },
    ],
  },
  {
    slug: 'partner-with-us', footerOnly: 'Partner With Us',
    title: 'Partner With Wellness Signal | Guest Posts & Sponsored Content',
    description: 'Guest contributions, sponsored content, and research partnerships with Wellness Signal, published under clear editorial and disclosure standards.',
    hero: {
      h1: 'Partner With Wellness Signal', image: 'desk-laptop-brighter',
      deck: 'Guest contributions, sponsored content, and research partnerships for organisations working across the wellness industry.',
      cta: { label: 'Send a Proposal', href: 'mailto:wellnesssignal@gmail.com?subject=Partnership%20enquiry' },
      p: [
        'Wellness Signal reaches readers who follow wellness research, consumer behaviour, and industry developments.',
        'We work with contributors, brands, and organisations whose expertise or data adds something useful to that coverage. Every partnership follows the same editorial standards as the rest of the publication.',
      ],
    },
    sections: [
      {
        h2: 'Ways to Work With Us', tone: 'white', headingLevel: 3,
        cards: [
          { h3: 'Guest Contributions', p: ['Original articles from researchers, practitioners, and industry professionals.', 'Pieces should offer evidence-based analysis within one of our seven coverage areas and cite their sources.'] },
          { h3: 'Sponsored Content', p: ['Paid articles produced with or for a brand or organisation.', 'Sponsored pieces are clearly labelled, reviewed by our editors, and held to the same accuracy standards as editorial content.'] },
          { h3: 'Research Partnerships', p: ['Datasets, surveys, and industry reports that can inform our coverage.', 'We assess methodology and scope before referencing any partner research.'] },
        ],
      },
      { type: 'partnerTable' },
      {
        h2: 'How It Works', tone: 'white', headingLevel: 3,
        cards: [
          { h3: 'Send a Proposal', p: ['Share a short outline, the topic area, your credentials, and the sources you plan to use.'] },
          { h3: 'Editorial Review', p: ['We assess relevance, originality, and evidence. Submitting a proposal does not guarantee publication.'] },
          { h3: 'Editing and Fact-Checking', p: ['Accepted pieces are edited for accuracy, clarity, and house style. Claims are checked against their sources.'] },
          { h3: 'Publication With Disclosure', p: ['Published pieces carry a clear byline, and any commercial relationship is disclosed on the page.'] },
        ],
      },
      {
        h2: 'Start a Conversation', bg: 'research-reports', bgStyle: 'light',
        p: ['Tell us about your organisation, the partnership you have in mind, and the readers you want to reach.', '{{editorial_email_line}}'],
      },
    ],
  },
  {
    slug: 'privacy-policy', legal: true, footerOnly: 'Privacy Policy',
    title: 'Privacy Policy | Wellness Signal',
    description: 'How Wellness Signal collects, uses, and protects personal information on wellsignal.org.',
    updated: 'October 13, 2026',
    hero: { h1: 'Privacy Policy', p: ['Wellness Signal respects the privacy of visitors to wellsignal.org.', 'This Privacy Policy describes the personal information that may be collected when you use our website, how it may be processed, and the choices available to you.'] },
    sections: [
      { h2: 'Information We Collect', p: ['When you contact us by email, we may collect your name, email address, and the information included in your message.', 'Technical information may also be collected during website visits, including IP addresses, browser and device details, referring pages, and website activity.', "The precise information collected depends on the website's hosting, security, and analytics configuration."] },
      { h2: 'How Information Is Used', p: ['Information may be used to respond to enquiries, review editorial corrections, maintain website operations, investigate technical issues, and meet applicable legal obligations.', 'Where analytics are enabled, usage information may also be processed to assess website performance and readership patterns.'] },
      { h2: 'Cookies and Analytics', p: ['Our website may use cookies or similar technologies for essential functionality, security, and analytics.', 'Where required by applicable law, appropriate choices will be offered for non-essential technologies.'] },
      { h2: 'Third-Party Services', p: ['Website hosting, email, security, and analytics providers may process information necessary to provide their services.', 'External websites linked from our articles operate under their own privacy policies.'] },
      { h2: 'Data Retention and Security', p: ['We aim to retain personal information only for as long as necessary for the purpose for which it was collected or as required by applicable law.', 'Reasonable safeguards should be maintained to protect information against unauthorised access, disclosure, alteration, or loss.'] },
      { h2: 'Your Privacy Rights', p: ['Depending on applicable law, you may be entitled to request access to, correction of, or deletion of certain personal information.', 'Requests can be submitted through our contact email. Identity verification may be required.'] },
      { h2: "Children's Privacy", p: ['Wellness Signal is a general informational publication and is not specifically directed at children.', 'If you believe personal information about a child has been collected inappropriately, please contact us.'] },
      { h2: 'Policy Updates', p: ['This Privacy Policy may be updated when website operations, service providers, or legal requirements change.', 'The latest version will be published on this page with its revision date.'] },
      { h2: 'Contact', p: ['**Wellness Signal**', 'Website: {{site_link}}', '{{privacy_email_line}}'] },
    ],
  },
  {
    slug: 'terms', legal: true, footerOnly: 'Terms and Conditions',
    title: 'Terms and Conditions | Wellness Signal',
    description: 'Terms governing access to and use of the Wellness Signal website.',
    updated: 'October 13, 2026',
    hero: { h1: 'Terms and Conditions', p: ['These Terms and Conditions govern access to and use of the Wellness Signal website at wellsignal.org.', 'By using this website, you agree to these terms to the extent permitted by applicable law.'] },
    sections: [
      { h2: 'About Our Content', p: ['Wellness Signal publishes editorial information covering wellness research, market trends, consumer behaviour, and industry developments.', 'Content is provided for general educational and informational purposes.', 'We aim to maintain accurate and relevant information but cannot guarantee that every article will remain complete or current as research and market conditions change.'] },
      { h2: 'Medical Disclaimer', p: ['Wellness Signal does not provide personalised medical advice, diagnosis, or treatment.', 'Content discussing fitness, nutrition, sleep, longevity, recovery, beauty, or other wellness practices should not replace consultation with qualified healthcare professionals.', 'Readers should seek appropriate professional advice before making decisions affecting their personal health.'] },
      { h2: 'Intellectual Property', p: ['Unless otherwise stated, original articles, graphics, website branding, and other original materials published on Wellness Signal are protected by applicable intellectual property laws.', 'Visitors may read and share links to our content. Substantial republication, commercial redistribution, or unauthorised reproduction may require written permission.', 'Third-party materials remain the property of their respective owners.'] },
      { h2: 'Research and External Sources', p: ['Our articles may refer to academic studies, public datasets, industry reports, businesses, and external websites.', 'External links are provided for reference and do not automatically constitute endorsement.', 'Wellness Signal does not control third-party content or guarantee its ongoing accuracy or availability.'] },
      { h2: 'Product and Service Coverage', p: ['Articles may discuss wellness products, technologies, businesses, and professional services.', "Editorial coverage does not guarantee a product's safety, effectiveness, quality, or suitability for a particular individual."] },
      { h2: 'Acceptable Website Use', p: ['Visitors must not use the website for unlawful activities, interfere with website operations, introduce malicious software, or attempt unauthorised access to systems.', 'Automated access must comply with applicable legal and technical restrictions.'] },
      { h2: 'Limitation of Liability', p: ['To the extent permitted by applicable law, Wellness Signal and its responsible operators disclaim liability for losses arising from reliance on general informational content or from website interruptions and inaccuracies.', 'Nothing in these terms limits rights or liabilities that cannot legally be excluded.'] },
      { h2: 'Changes to These Terms', p: ['These terms may be updated to reflect changes in the website, editorial operations, or applicable requirements.', 'Revised terms will be published on this page with an updated date.'] },
      { h2: 'Contact', p: ['**Wellness Signal**', 'Website: {{site_link}}', '{{editorial_email_line}}'] },
    ],
  },
];

(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const header = document.querySelector('.site-header');
  const progress = document.querySelector('.progress');
  const toTop = document.querySelector('.to-top');

  // Menu
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('site-nav');
  toggle?.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('menu-open', open);
  });

  // Header state, reading progress, back-to-top
  const onScroll = () => {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    header?.classList.toggle('scrolled', y > 24);
    if (progress) progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    toTop?.classList.toggle('show', y > 900);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  toTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }));

  // Reveal on scroll
  const reveals = document.querySelectorAll('.reveal, [data-chart]');
  if (reduce || !('IntersectionObserver' in window)) {
    reveals.forEach(el => el.classList.add('in'));
  } else {
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    reveals.forEach(el => io.observe(el));
  }

  // Chart view toggle
  document.querySelectorAll('[data-chart-view]').forEach(button => {
    button.addEventListener('click', () => {
      const chart = document.querySelector('[data-chart]');
      const showAll = button.dataset.chartView === 'all';
      chart?.classList.toggle('measured-only', !showAll);
      document.querySelectorAll('[data-chart-view]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    });
  });

  // Evidence ladder tabs
  document.querySelectorAll('[data-ladder]').forEach(ladder => {
    const tabs = [...ladder.querySelectorAll('[role="tab"]')];
    const select = tab => {
      tabs.forEach(t => {
        const on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
      });
    };
    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => select(tab));
      tab.addEventListener('keydown', event => {
        const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[event.key];
        if (!step) return;
        event.preventDefault();
        const next = tabs[(i + step + tabs.length) % tabs.length];
        select(next);
        next.focus();
      });
    });
  });

  // Soft pointer glow on cards
  if (!reduce) {
    document.querySelectorAll('.cat, .card, .step').forEach(card => {
      card.addEventListener('pointermove', event => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${event.clientX - rect.left}px`);
        card.style.setProperty('--my', `${event.clientY - rect.top}px`);
      });
    });
  }
})();

// Article table of contents: highlight the section in view
(() => {
  const links = [...document.querySelectorAll('.toc a')];
  if (!links.length || !('IntersectionObserver' in window)) return;
  const byId = new Map(links.map(link => [link.getAttribute('href').slice(1), link]));
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      links.forEach(link => link.classList.remove('active'));
      byId.get(entry.target.id)?.classList.add('active');
    });
  }, { rootMargin: '-20% 0px -70% 0px' });
  byId.forEach((_, id) => { const el = document.getElementById(id); if (el) io.observe(el); });
})();

// Articles index: filter by category
(() => {
  const grid = document.querySelector('[data-filterable]');
  const buttons = document.querySelectorAll('[data-filter]');
  if (!grid || !buttons.length) return;
  buttons.forEach(button => button.addEventListener('click', () => {
    const value = button.dataset.filter;
    buttons.forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    grid.querySelectorAll('.post-card').forEach(card => { card.hidden = value !== 'all' && card.dataset.category !== value; });
  }));
})();

export function initFloatingButtons() {
  const navbar = document.getElementById('navbar');
  const floatTopBtn = document.getElementById('float-top');
  const floatButtons = document.querySelector('.float-buttons');
  const mobileCtaBar = document.getElementById('mobile-cta-bar');

  if (!navbar) return;

  function updateFloatingButtons() {
    const heroHeight = document.getElementById('hero')?.offsetHeight || 0;
    const inHero = window.scrollY < heroHeight;
    const isMobile = window.matchMedia('(max-width: 768px)').matches;

    navbar.classList.toggle('scrolled', window.scrollY > 60);
    floatTopBtn?.classList.toggle('is-hidden', inHero);
    floatButtons?.classList.toggle('is-mobile-hero', isMobile && inHero);
    mobileCtaBar?.classList.toggle('is-hidden', !isMobile || inHero);
  }

  window.addEventListener('scroll', updateFloatingButtons, { passive: true });
  window.addEventListener('resize', updateFloatingButtons);
  updateFloatingButtons();
}

export function initMobileMenu() {
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.querySelector('.nav-links');

  if (!hamburger || !navLinks) return;

  hamburger.setAttribute('aria-expanded', 'false');
  hamburger.setAttribute('aria-controls', navLinks.id || 'navLinks');

  hamburger.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    hamburger.classList.toggle('active', isOpen);
    document.body.classList.toggle('menu-open', isOpen);
    hamburger.setAttribute('aria-expanded', String(isOpen));
  });

  navLinks.querySelectorAll('a').forEach((anchor) => {
    anchor.addEventListener('click', () => {
      navLinks.classList.remove('open');
      hamburger.classList.remove('active');
      document.body.classList.remove('menu-open');
      hamburger.setAttribute('aria-expanded', 'false');
    });
  });
}

export function initScrollReveal() {
  const revealEls = document.querySelectorAll(
    '.trust-item, .product-card, .step, .review-card, .faq-item, .shop-info-faq-item, .home-blog-card, .about-grid, .contact-card'
  );

  if (!revealEls.length || !('IntersectionObserver' in window)) {
    revealEls.forEach(el => el.classList.add('visible'));
    return;
  }

  revealEls.forEach(el => el.classList.add('reveal'));

  const observer = new IntersectionObserver(entries => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('visible'), i * 80);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  revealEls.forEach(el => observer.observe(el));
}

export function initFaqAccordion() {
  document.querySelectorAll('.faq-item').forEach((item) => {
    item.querySelector('.faq-q')?.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
      if (!isOpen) item.classList.add('open');
    });
  });
}

export function initKeyboardCards() {
  document.querySelectorAll('.product-card[role="button"]').forEach((card) => {
    card.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      card.click();
    });
  });
}

export function initHeroVideoFallback() {
  const video = document.getElementById('heroVideo');
  if (!video) return;

  video.addEventListener('error', () => {
    const wrap = document.querySelector('.hero-video-wrap');
    if (wrap) {
      wrap.style.background = 'linear-gradient(135deg, #2d1f28 0%, #c96a8a 100%)';
    }
  });
}

export function initActiveNavHighlight() {
  const sections = document.querySelectorAll('section[id]');
  const navAnchors = document.querySelectorAll('.nav-links a[href^="#"]');

  if (!sections.length || !navAnchors.length) return;

  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach((section) => {
      if (window.scrollY >= section.offsetTop - 120) current = section.id;
    });
    navAnchors.forEach((anchor) => {
      anchor.classList.toggle('active-nav', anchor.getAttribute('href') === `#${current}`);
    });
  }, { passive: true });
}

export function initPressFeedback() {
  const interactiveSelector = [
    '.btn',
    '.nav-links a',
    '.product-card[role="button"]',
    '.contact-card',
    '.home-blog-card',
    '.shop-info-faq-item summary',
    '.review-card',
    '.step',
    '.float-btn',
    '.mobile-cta-bar',
    '.blog-button',
    '.blog-card',
    '.blog-related-card'
  ].join(',');

  document.addEventListener('pointerdown', (event) => {
    const target = event.target.closest(interactiveSelector);
    if (!target || target.matches('[disabled], [aria-disabled="true"]')) return;

    target.classList.add('is-pressing');

    const clearPress = () => {
      window.setTimeout(() => target.classList.remove('is-pressing'), 90);
    };

    target.addEventListener('pointerup', clearPress, { once: true });
    target.addEventListener('pointercancel', clearPress, { once: true });
    target.addEventListener('pointerleave', clearPress, { once: true });
  }, { passive: true });
}

export function initPageUi() {
  initFloatingButtons();
  initMobileMenu();
  initScrollReveal();
  initFaqAccordion();
  initKeyboardCards();
  initHeroVideoFallback();
  initActiveNavHighlight();
  initPressFeedback();
}

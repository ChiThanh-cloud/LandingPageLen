(function () {
  const page = document.querySelector('.blog-page');
  if (!page) return;

  document.querySelectorAll('.blog-media img').forEach((image) => {
    image.addEventListener('error', () => {
      image.closest('.blog-media')?.classList.add('blog-image-error');
      image.setAttribute('aria-hidden', 'true');
    }, { once: true });
  });

  const postLayout = document.querySelector('.blog-post-layout');
  if (postLayout) {
    const progress = document.createElement('div');
    progress.className = 'blog-reading-progress';
    progress.setAttribute('aria-hidden', 'true');
    progress.innerHTML = '<span></span>';
    document.body.prepend(progress);

    const bar = progress.querySelector('span');
    const updateProgress = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const percent = maxScroll > 0 ? Math.min(100, Math.max(0, (window.scrollY / maxScroll) * 100)) : 0;
      bar.style.width = percent + '%';
    };

    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress);
    updateProgress();
  }

  const searchInput = document.querySelector('[data-blog-search]');
  const filterButtons = Array.from(document.querySelectorAll('[data-blog-filter]'));
  const cards = Array.from(document.querySelectorAll('[data-blog-card]'));
  const empty = document.querySelector('[data-blog-empty]');

  if (!cards.length) return;

  let activeTag = 'all';

  function normalize(value) {
    return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  function applyFilters() {
    const query = normalize(searchInput?.value.trim() || '');
    let visibleCount = 0;

    cards.forEach((card) => {
      const haystack = normalize(card.dataset.blogSearch || card.textContent || '');
      const tags = (card.dataset.blogTags || '').split(',').map(tag => tag.trim());
      const matchesQuery = !query || haystack.includes(query);
      const matchesTag = activeTag === 'all' || tags.includes(activeTag);
      const isVisible = matchesQuery && matchesTag;

      card.hidden = !isVisible;
      if (isVisible) visibleCount += 1;
    });

    empty?.classList.toggle('blog-show', visibleCount === 0);
  }

  searchInput?.addEventListener('input', applyFilters);

  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      activeTag = button.dataset.blogFilter || 'all';
      filterButtons.forEach((item) => {
        const isActive = item === button;
        item.classList.toggle('blog-active', isActive);
        item.setAttribute('aria-pressed', String(isActive));
      });
      applyFilters();
    });
  });
})();

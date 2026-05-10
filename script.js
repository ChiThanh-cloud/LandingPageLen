/* =============================================
   TIỆM LEN NHÀ TINY – SCRIPT
   ============================================= */

// ---- Navbar scroll effect ----
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 60);
});

// ---- Mobile menu ----
const hamburger = document.getElementById('hamburger');
const navLinks  = document.querySelector('.nav-links');
hamburger.addEventListener('click', () => {
  navLinks.classList.toggle('open');
  hamburger.classList.toggle('active');
});
navLinks.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    navLinks.classList.remove('open');
    hamburger.classList.remove('active');
  });
});

// ---- Scroll reveal ----
const revealEls = document.querySelectorAll(
  '.trust-item, .product-card, .step, .review-card, .faq-item, .about-grid, .contact-card'
);
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

// ---- FAQ accordion ----
document.querySelectorAll('.faq-item').forEach(item => {
  item.querySelector('.faq-q').addEventListener('click', () => {
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
    if (!isOpen) item.classList.add('open');
  });
});

// ---- Hero video fallback ----
const video = document.getElementById('heroVideo');
if (video) {
  video.addEventListener('error', () => {
    document.querySelector('.hero-video-wrap').style.background =
      'linear-gradient(135deg, #2d1f28 0%, #c96a8a 100%)';
  });
}

// ---- Smooth active nav highlight ----
const sections = document.querySelectorAll('section[id]');
const navAnchors = document.querySelectorAll('.nav-links a[href^="#"]');
window.addEventListener('scroll', () => {
  let current = '';
  sections.forEach(s => {
    if (window.scrollY >= s.offsetTop - 120) current = s.id;
  });
  navAnchors.forEach(a => {
    a.classList.toggle('active-nav', a.getAttribute('href') === '#' + current);
  });
}, { passive: true });

// ---- Sample Modal Logic ----
const sampleData = {
  yarn: {
    title: "Mẫu Cuộn Len",
    items: [
      { img: "images/yarn_collection.jpg", name: "Len Milk Cotton 125g" },
      { img: "images/yarn_hero.jpg", name: "Len Sợi Dệt 2mm" }
    ]
  },
  handmade: {
    title: "Mẫu Móc Theo Yêu Cầu",
    items: [
      { img: "images/crochet_products.jpg", name: "Thú Bông Handmade" },
      { img: "images/yarn_hero.jpg", name: "Túi Tote Móc Tay" }
    ]
  },
  gift: {
    title: "Mẫu Bộ Quà Tặng",
    items: [
      { img: "images/yarn_hero.jpg", name: "Set Quà Tặng Người Yêu" },
      { img: "images/yarn_collection.jpg", name: "Set Quà Sinh Nhật" }
    ]
  }
};

const sampleModal = document.getElementById('sampleModal');
const sampleModalTitle = document.getElementById('sampleModalTitle');
const sampleGallery = document.getElementById('sampleGallery');

function openSampleModal(type) {
  const data = sampleData[type];
  if (!data) return;

  sampleModalTitle.textContent = data.title;
  sampleGallery.innerHTML = '';
  
  data.items.forEach(item => {
    const div = document.createElement('div');
    div.className = 'sample-item';
    div.innerHTML = `<img src="${item.img}" alt="${item.name}"><h4>${item.name}</h4>`;
    sampleGallery.appendChild(div);
  });

  sampleModal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeSampleModal() {
  sampleModal.classList.remove('active');
  document.body.style.overflow = '';
}

if (sampleModal) {
  sampleModal.addEventListener('click', (e) => {
    if (e.target === sampleModal) closeSampleModal();
  });
}

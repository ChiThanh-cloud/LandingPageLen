/* =============================================
   TIỆM LEN NHÀ TINY – SCRIPT
   ============================================= */

// ---- Khởi tạo Supabase ----
const SUPABASE_URL = 'https://pkcmpqerwjxscbhwchgx.supabase.co';
const SUPABASE_KEY = 'sb_publishable_C4UKMMkAjjqSnYVD4tA7bA_NXEakUyg';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Kiểm tra kết nối (bạn có thể xem kết quả trong F12 -> Console)
async function checkSupabaseConnection() {
  try {
    const { data, error } = await supabaseClient.from('products').select('*').limit(1);
    if (error) {
      console.log('Chưa tìm thấy bảng "products" trên Supabase. Bạn hãy tạo bảng nhé!');
    } else {
      console.log('🎉 Kết nối Supabase thành công! Dữ liệu mẫu:', data);
    }
  } catch (err) {
    console.error('Lỗi kết nối Supabase:', err.message);
  }
}
// Chạy hàm kiểm tra
checkSupabaseConnection();

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

const sampleModal = document.getElementById('sampleModal');
const sampleModalTitle = document.getElementById('sampleModalTitle');
const sampleGallery = document.getElementById('sampleGallery');

const categoryTitles = {
  yarn: "Mẫu Cuộn Len",
  handmade: "Mẫu Móc Theo Yêu Cầu",
  gift: "Mẫu Bộ Quà Tặng"
};

async function openSampleModal(type) {
  sampleModalTitle.textContent = categoryTitles[type] || "Sản phẩm mẫu";
  sampleGallery.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-light);">Đang tải mẫu sản phẩm...</div>';
  
  sampleModal.classList.add('active');
  document.body.style.overflow = 'hidden';

  try {
    // Lấy dữ liệu từ bảng "products" trên Supabase lọc theo category
    const { data, error } = await supabaseClient
      .from('products')
      .select('*')
      .eq('category', type);

    if (error) throw error;

    sampleGallery.innerHTML = '';
    
    if (data.length === 0) {
      sampleGallery.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px;">Chưa có mẫu nào trong mục này.</div>';
      return;
    }

    data.forEach(item => {
      const div = document.createElement('div');
      div.className = 'sample-item';
      
      let weightHtml = '';
      if (item.weight) {
        weightHtml = `<div class="sample-weight">${item.weight}</div>`;
      }
      
      div.innerHTML = `
        <img src="${item.image_url}" alt="${item.name}">
        <h4>${item.name}</h4>
        ${weightHtml}
      `;
      sampleGallery.appendChild(div);
    });
  } catch (err) {
    console.error('Lỗi khi lấy dữ liệu:', err.message);
    sampleGallery.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: red;">Không thể tải dữ liệu. Vui lòng kiểm tra lại bảng "products" trên Supabase.</div>';
  }
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

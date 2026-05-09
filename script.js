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

// ---- Chart Modal Logic ----
const chartData = {
  capybara: {
    title: "Thú bông Capybara",
    img: "images/crochet_products.jpg",
    yarn: "Len Milk Cotton 125g (Màu Nâu Tây, Đen, Hồng pastel)",
    formula: `<strong>ĐẦU & THÂN (Màu nâu tây)</strong><br>
Vòng 1: Tạo vòng tròn ma thuật (MR), 6X (6)<br>
Vòng 2: 6V (12)<br>
Vòng 3: (X, V)*6 (18)<br>
Vòng 4: (2X, V)*6 (24)<br>
Vòng 5: (3X, V)*6 (30)<br>
Vòng 6-12: 30X (30)<br>
Vòng 13: (3X, A)*6 (24) - Bắt đầu nhồi bông<br>
Vòng 14: (2X, A)*6 (18)<br>
Vòng 15: (X, A)*6 (12)<br>
Vòng 16: 6A (6) - Chốt sợi, giấu len.<br><br>
<strong>TAI (Làm 2 cái)</strong><br>
Vòng 1: MR 5X, không kết vòng, chốt sợi để khâu.<br><br>
<em>Lưu ý: Mắt gắn ở giữa vòng 6 và 7, cách nhau 4 mũi.</em>`
  },
  sunflower: {
    title: "Hoa Hướng Dương",
    img: "images/yarn_collection.jpg",
    yarn: "Len Susan 4 (Màu Vàng Tươi, Nâu Đậm, Xanh Lá)",
    formula: `<strong>NHỤY HOA (Màu nâu đậm)</strong><br>
Vòng 1: MR 6X (6)<br>
Vòng 2: 6V (12)<br>
Vòng 3: (X, V)*6 (18)<br>
Vòng 4: (2X, V)*6 (24) - Chốt sợi.<br><br>
<strong>CÁNH HOA (Màu vàng tươi)</strong><br>
Nối len vàng vào cạnh ngoài của vòng nhụy cuối cùng.<br>
Mỗi cánh: Lên 3 bính, đan 1 mũi kép đôi vào cùng chân, 1 mũi píc (picot) 3 bính, 1 kép đôi vào chân tiếp theo, 3 bính, trượt vào cùng chân.<br>
Lặp lại quanh nhụy (khoảng 12 cánh).<br><br>
<strong>LÁ & ĐÀI HOA (Xanh lá)</strong><br>
Làm tương tự nhụy nhưng không thêm cánh, khâu úp vào mặt sau của nhụy hoa, kẹp kẽm cành ở giữa.`
  },
  bag: {
    title: "Túi Tote Xinh Xắn",
    img: "images/yarn_hero.jpg",
    yarn: "Sợi Dệt loại 2mm (Màu Be, Đỏ Đô)",
    formula: `<strong>ĐÁY TÚI (Màu be)</strong><br>
Lên 30 bính.<br>
Hàng 1: Bỏ qua 2 bính đầu, đan 27 mũi kép đơn (F), 5F vào bính cuối. Xoay đan cạnh đối diện: 26F, 4F vào bính đầu tiên. Trượt kết vòng.<br>
Hàng 2: Lên 2 bính, 27F, 5V (mũi kép đơn tăng), 26F, 4V. Trượt kết vòng.<br>
Hàng 3-4: Tăng mũi tương tự ở hai đầu bo cong đáy túi.<br><br>
<strong>THÂN TÚI</strong><br>
Vòng 5: Đan mũi F chìm cạnh sau (Back loop only) không tăng mũi để gập thành thân túi.<br>
Vòng 6-25: Đan mũi F họa tiết sọc xen kẽ hoặc đan trơn tùy ý. Không tăng mũi.<br><br>
<strong>QUAI TÚI</strong><br>
Đánh dấu 2 điểm chia đều trên miệng túi. Đan móc xích dài 60 mũi bính nối 2 điểm. Đan đè 2-3 hàng mũi đơn (X) lên dây quai để làm quai bản to.`
  }
};

const modalOverlay = document.getElementById('chartModal');
const modalTitle = document.getElementById('modalTitle');
const modalImg = document.getElementById('modalImg');
const modalYarn = document.getElementById('modalYarn');
const modalFormula = document.getElementById('modalFormula');

function openChartModal(id) {
  const data = chartData[id];
  if (!data) return;
  
  modalTitle.textContent = data.title;
  modalImg.src = data.img;
  modalYarn.textContent = data.yarn;
  modalFormula.innerHTML = data.formula;
  
  modalOverlay.classList.add('active');
  document.body.style.overflow = 'hidden'; // Ngăn cuộn trang nền
}

function closeChartModal() {
  modalOverlay.classList.remove('active');
  document.body.style.overflow = '';
}

// Đóng khi click ra ngoài vùng trắng
modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) closeChartModal();
});

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
  document.body.classList.toggle('menu-open');
});
navLinks.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    navLinks.classList.remove('open');
    hamburger.classList.remove('active');
    document.body.classList.remove('menu-open');
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

// ---- TRẠNG THÁI MODAL SẢN PHẨM ----
let currentCategory = '';
let currentSubCategory = 'all';
let searchKeyword = '';

const categoryTitles = {
  yarn: "Mẫu Cuộn Len",
  handmade: "Mẫu Móc Theo Yêu Cầu",
  gift: "Mẫu Bộ Quà Tặng",
  set: "Set Tự Móc"
};

const subCategories = {
  handmade: [
    { id: 'all', label: 'Tất cả' },
    { id: 'gau', label: 'Gấu len' },
    { id: 'hoa', label: 'Hoa len' },
    { id: 'tui', label: 'Túi xách' }
  ],
  yarn: [
    { id: 'all', label: 'Tất cả' },
    { id: 'milk', label: 'Len Milk' },
    { id: 'cotton', label: 'Len Cotton' }
  ]
};

const modalSearchInput = document.getElementById('modalSearchInput');
const modalFilterTabs = document.getElementById('modalFilterTabs');

async function openSampleModal(type) {
  currentCategory = type;
  currentSubCategory = 'all';
  searchKeyword = '';
  
  if (modalSearchInput) modalSearchInput.value = '';
  sampleModalTitle.textContent = categoryTitles[type] || "Sản phẩm mẫu";
  
  sampleModal.classList.add('active');
  document.body.style.overflow = 'hidden';

  renderFilterTabs(type);
  fetchAndRenderProducts();
}

function renderFilterTabs(type) {
  if (!modalFilterTabs) return;
  const tabs = subCategories[type];
  
  if (!tabs) {
    modalFilterTabs.innerHTML = '';
    return;
  }

  modalFilterTabs.innerHTML = tabs.map(tab => `
    <div class="filter-tab ${tab.id === currentSubCategory ? 'active' : ''}" 
         onclick="filterBySubCategory('${tab.id}')">
      ${tab.label}
    </div>
  `).join('');
}

async function filterBySubCategory(subId) {
  currentSubCategory = subId;
  renderFilterTabs(currentCategory);
  fetchAndRenderProducts();
}

// Debounce tìm kiếm để tránh gọi Supabase quá nhiều lần
let searchTimeout;
if (modalSearchInput) {
  modalSearchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchKeyword = e.target.value.trim();
    searchTimeout = setTimeout(() => {
      fetchAndRenderProducts();
    }, 400);
  });
}

async function fetchAndRenderProducts() {
  // 1. Hiện Skeleton
  sampleGallery.innerHTML = Array(4).fill(0).map(() => `
    <div class="sample-item">
      <div class="skeleton skeleton-img"></div>
      <div class="skeleton skeleton-text"></div>
      <div class="skeleton skeleton-btn"></div>
    </div>
  `).join('');

  try {
    // 2. Xây dựng câu truy vấn Supabase
    let query = supabaseClient
      .from('products')
      .select('*')
      .eq('category', currentCategory);

    if (currentSubCategory !== 'all') {
      query = query.eq('sub_category', currentSubCategory);
    }

    if (searchKeyword) {
      query = query.ilike('name', `%${searchKeyword}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    // 3. Render dữ liệu
    sampleGallery.innerHTML = '';
    
    if (data.length === 0) {
      sampleGallery.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px;">Không tìm thấy sản phẩm nào phù hợp.</div>';
      return;
    }

    const actionScripts = {
      yarn: {
        label: '🎨 Xem bảng màu & Đặt',
        msg: (name) => `Chào Tiny, mình đang quan tâm đến loại "${name}", Tiny gửi mình bảng màu và tư vấn số lượng nhé!`
      },
      handmade: {
        label: '📏 Tư vấn Size & Dáng',
        msg: (name) => `Chào Tiny, mình muốn đặt móc mẫu "${name}" theo yêu cầu riêng, Tiny tư vấn giúp mình nhé!`
      },
      set: {
        label: '📦 Xem chi tiết Set',
        msg: (name) => `Chào Tiny, Set "${name}" này gồm những gì và có hướng dẫn kèm theo không ạ?`
      },
      gift: {
        label: '🎁 Tư vấn Hộp quà',
        msg: (name) => `Chào Tiny, mình muốn mua set quà "${name}", Tiny có gói hộp và ghi thiệp giúp mình không?`
      }
    };

    const script = actionScripts[currentCategory] || {
      label: '💬 Nhắn Mess hỏi mua',
      msg: (name) => `Chào Tiny, mình muốn hỏi mua: "${name}"`
    };

    data.forEach(item => {
      const div = document.createElement('div');
      div.className = 'sample-item';
      const outOfStock = item.status === 'out';
      const stockBadge = outOfStock ? `<div class="sample-stock-badge">Hết hàng</div>` : '';
      const weightHtml = item.weight ? `<span class="sample-weight">${item.weight}</span>` : '';
      
      const cleanPrice = item.price ? item.price.toString().replace(/[,.]/g, '') : '';
      const priceHtml = (cleanPrice && !isNaN(cleanPrice)) 
        ? `<div class="sample-price">${Number(cleanPrice).toLocaleString('vi-VN')}đ</div>`
        : '';

      const messengerUrl = `https://m.me/61559447375156?text=${encodeURIComponent(script.msg(item.name))}`;
      const messengerBtn = outOfStock
        ? `<div class="sample-outstock-note">Liên hệ Tiny để đặt trước!</div>`
        : `<a href="${messengerUrl}" target="_blank" rel="noopener" class="btn-messenger">${script.label}</a>`;

      div.innerHTML = `
        <div class="sample-img-wrap">
          <img src="${item.image_url}" alt="${item.name}" loading="lazy" ${outOfStock ? 'style="filter:grayscale(60%);opacity:.7"' : ''}>
          ${stockBadge}
        </div>
        <div class="sample-item-info">
          <div class="sample-title-row">
            <h4>${item.name}</h4>
            ${weightHtml}
          </div>
          ${priceHtml}
        </div>
        <div class="sample-item-footer">${messengerBtn}</div>
      `;
      sampleGallery.appendChild(div);
    });

    // 4. Thêm ghi chú
    const categoryNotes = {
      yarn: '💡 Mách nhỏ: Chọn loại len bạn thích, Tiny sẽ gửi bảng màu nhé!',
      handmade: '💡 Mách nhỏ: Bạn có thể đặt theo mẫu hoặc chia sẻ ảnh ý tưởng riêng!',
      set: '💡 Mách nhỏ: Mỗi Set đã gom đủ nguyên liệu và có hướng dẫn!',
      gift: '💡 Mách nhỏ: Tiny có thể ghi thiệp tay và gói hộp thêm nhé!'
    };

    if (categoryNotes[currentCategory] && data.length > 0) {
      const note = document.createElement('div');
      note.className = 'category-note'; 
      note.style.cssText = 'grid-column: 1/-1; text-align: center; margin-top: 15px; font-size: 0.85rem; color: var(--text-mid); font-style: italic;';
      note.innerHTML = categoryNotes[currentCategory];
      sampleGallery.appendChild(note);
    }

  } catch (err) {
    console.error('Lỗi khi lấy dữ liệu:', err.message);
    sampleGallery.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: red;">Không thể tải dữ liệu.</div>';
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

// ---- POLICY MODAL LOGIC (FB ADS) ----
const policyModal = document.getElementById('policyModal');
const policyContent = document.getElementById('policyContent');

const policies = {
  privacy: `
    <h2>Chính sách bảo mật</h2>
    <p>Chào mừng bạn đến với <strong>Tiệm Len Nhà Tiny</strong>. Chúng mình cam kết bảo mật tuyệt đối thông tin cá nhân của bạn.</p>
    <h3>1. Thu thập thông tin</h3>
    <p>Chúng mình thu thập thông tin (tên, số điện thoại, địa chỉ) chỉ khi bạn chủ động nhắn tin đặt hàng qua Zalo hoặc Messenger.</p>
    <h3>2. Sử dụng thông tin</h3>
    <p>Thông tin của bạn chỉ được dùng để: Tư vấn sản phẩm, giao hàng và hỗ trợ sau bán hàng.</p>
    <h3>3. Facebook Pixel & Cookies</h3>
    <p>Trang web sử dụng Facebook Pixel để tối ưu hóa quảng cáo. Dữ liệu này là ẩn danh và giúp chúng mình hiển thị sản phẩm phù hợp hơn với bạn.</p>
    <h3>4. Cam kết</h3>
    <p>Tiny không bao giờ bán hoặc chia sẻ thông tin của bạn cho bên thứ ba.</p>
  `,
  terms: `
    <h2>Điều khoản dịch vụ</h2>
    <p>Bằng việc mua sắm tại Tiny, bạn đồng ý với các điều khoản sau:</p>
    <h3>1. Quy trình Handmade</h3>
    <p>Sản phẩm móc tay cần thời gian hoàn thiện từ 3-7 ngày tùy độ phức tạp. Tiny sẽ thông báo lịch giao dự kiến khi chốt đơn.</p>
    <h3>2. Thanh toán & Đặt cọc</h3>
    <p>Với các đơn hàng thiết kế riêng theo yêu cầu, vui lòng chuyển khoản đặt cọc trước 50% giá trị đơn hàng.</p>
    <h3>3. Chính sách đổi trả</h3>
    <p>Vì là hàng handmade, Tiny chỉ nhận đổi trả nếu sản phẩm bị lỗi kỹ thuật hoặc sai mẫu so với thỏa thuận ban đầu. Vui lòng quay video khi mở hàng.</p>
    <h3>4. Vận chuyển</h3>
    <p>Chúng mình sử dụng các đơn vị vận chuyển uy tín. Thời gian nhận hàng từ 2-4 ngày tùy khu vực.</p>
  `
};

function openPolicyModal(type) {
  if (!policies[type]) return;
  policyContent.innerHTML = policies[type];
  policyModal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closePolicyModal() {
  policyModal.classList.remove('active');
  document.body.style.overflow = '';
}

if (policyModal) {
  policyModal.addEventListener('click', (e) => {
    if (e.target === policyModal) closePolicyModal();
  });
}

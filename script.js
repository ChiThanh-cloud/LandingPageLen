/* =============================================
   TIỆM LEN NHÀ TINY – SCRIPT
   ============================================= */

// ---- Khởi tạo Supabase ----
const SUPABASE_URL = 'https://pkcmpqerwjxscbhwchgx.supabase.co';
const SUPABASE_KEY = 'sb_publishable_C4UKMMkAjjqSnYVD4tA7bA_NXEakUyg';
const supabaseClient = window.supabase
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

// Kiểm tra kết nối (bạn có thể xem kết quả trong F12 -> Console)
async function checkSupabaseConnection() {
  if (!supabaseClient) return;
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

if (location.hostname === 'localhost' || location.hostname.startsWith('192.168.')) {
  checkSupabaseConnection();
}

// ---- Ads tracking placeholder (Meta / GA4 / TikTok safe mode) ----
const adEventNames = {
  nav_order_click: 'NavOrderClick',
  hero_messenger_click: 'HeroMessengerClick',
  hero_view_products_click: 'HeroViewProductsClick',
  product_card_click: 'ViewContent',
  product_messenger_click: 'Contact',
  modal_order_similar_click: 'Lead',
  contact_facebook_click: 'ContactFacebookClick',
  contact_zalo_click: 'ContactZaloClick',
  float_top_click: 'FloatTopClick',
  float_zalo_click: 'FloatZaloClick',
  float_facebook_click: 'FloatFacebookClick',
  policy_privacy_click: 'PolicyView',
  policy_terms_click: 'PolicyView',
  policy_shipping_click: 'PolicyView',
  policy_refund_click: 'PolicyView'
};

function trackAdEvent(trackKey, params = {}) {
  const eventName = adEventNames[trackKey] || trackKey;
  const payload = {
    source: 'landing_page',
    track_key: trackKey,
    ...params
  };

  if (typeof window.fbq === 'function') {
    window.fbq('trackCustom', eventName, payload);
  }

  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, payload);
  }

  if (window.ttq && typeof window.ttq.track === 'function') {
    window.ttq.track(eventName, payload);
  }
}

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-track]');
  if (el) {
    trackAdEvent(el.dataset.track, {
      label: el.textContent.trim().replace(/\s+/g, ' '),
      href: el.getAttribute('href') || '',
      category: el.dataset.category || '',
      product: el.dataset.product || ''
    });
  }
});

// ---- Navbar scroll effect ----
const navbar = document.getElementById('navbar');
const floatTopBtn = document.getElementById('float-top');
const floatButtons = document.querySelector('.float-buttons');

function updateFloatingButtons() {
  const heroHeight = document.getElementById('hero')?.offsetHeight || 0;
  const inHero = window.scrollY < heroHeight;
  const isMobile = window.matchMedia('(max-width: 768px)').matches;

  navbar.classList.toggle('scrolled', window.scrollY > 60);
  if (floatTopBtn) {
    floatTopBtn.classList.toggle('is-hidden', inHero);
  }
  if (floatButtons) {
    floatButtons.classList.toggle('is-mobile-hero', isMobile && inHero);
  }
}

window.addEventListener('scroll', updateFloatingButtons, { passive: true });
window.addEventListener('resize', updateFloatingButtons);
updateFloatingButtons();

// ---- Mobile menu ----
const hamburger = document.getElementById('hamburger');
const navLinks = document.querySelector('.nav-links');
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
  yarn: "Cuộn Len",
  handmade: "Đồ Móc Theo Yêu Cầu",
  gift: "Bộ Quà Tặng",
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
const productModal = document.getElementById('productModal');
const productModalTitle = document.getElementById('productModalTitle');
const productGallery = document.getElementById('productGallery');

let productImageLightbox = null;

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char]));
}

function getProductImageUrl(item) {
  return item.full_image_url || item.image_url || '';
}

function showProductUnavailableMessage(message = 'Tiny đang nhập hàng, bạn liên hệ Tiny khi có hàng nhé.') {
  productGallery.innerHTML = `
    <div style="grid-column: 1/-1; text-align: center; padding: 40px 16px; color: var(--text-mid);">
      ${message}
    </div>
  `;
}

function normalizeProductText(value) {
  return String(value || '').toLowerCase().trim();
}

function productMatchesSubCategory(product, subCategory) {
  if (subCategory === 'all') return true;

  const rawSubCategory = normalizeProductText(product.sub_category || product.subCategory || product.type);
  if (rawSubCategory === subCategory) return true;

  const productName = normalizeProductText(product.name);
  const aliases = {
    gau: ['gau', 'gấu', 'bear'],
    hoa: ['hoa', 'flower'],
    tui: ['tui', 'túi', 'bag'],
    milk: ['milk'],
    cotton: ['cotton']
  };

  return (aliases[subCategory] || [subCategory]).some(alias => productName.includes(alias));
}

function ensureImageLightbox() {
  if (productImageLightbox) return productImageLightbox;

  productImageLightbox = document.createElement('div');
  productImageLightbox.className = 'product-image-lightbox';
  productImageLightbox.setAttribute('role', 'dialog');
  productImageLightbox.setAttribute('aria-modal', 'true');
  productImageLightbox.setAttribute('aria-label', 'Xem ảnh sản phẩm');
  productImageLightbox.innerHTML = `
    <button class="product-image-lightbox-close" type="button" aria-label="Đóng ảnh lớn">×</button>
    <figure class="product-image-lightbox-frame">
      <img src="" alt="">
      <figcaption></figcaption>
    </figure>
  `;

  productImageLightbox.addEventListener('click', (e) => {
    if (
      e.target === productImageLightbox ||
      e.target.closest('.product-image-lightbox-close')
    ) {
      closeImageLightbox();
    }
  });

  document.body.appendChild(productImageLightbox);
  return productImageLightbox;
}

function openImageLightbox(src, title) {
  if (!src) return;
  const lightbox = ensureImageLightbox();
  const image = lightbox.querySelector('img');
  const caption = lightbox.querySelector('figcaption');

  image.src = src;
  image.alt = title || 'Ảnh sản phẩm';
  caption.textContent = title || '';
  lightbox.classList.add('active');
}

function closeImageLightbox() {
  if (!productImageLightbox) return;
  productImageLightbox.classList.remove('active');
  const image = productImageLightbox.querySelector('img');
  image.removeAttribute('src');
}

async function openProductModal(type) {
  currentCategory = type;
  currentSubCategory = 'all';
  searchKeyword = '';

  if (modalSearchInput) modalSearchInput.value = '';
  productModalTitle.textContent = categoryTitles[type] || "Sản phẩm";

  productModal.classList.add('active');
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
  productGallery.innerHTML = Array(4).fill(0).map(() => `
    <div class="product-item">
      <div class="skeleton skeleton-img"></div>
      <div class="skeleton skeleton-text"></div>
      <div class="skeleton skeleton-btn"></div>
    </div>
  `).join('');

  const renderProducts = (products) => {
    productGallery.innerHTML = '';

    if (products.length === 0) {
      showProductUnavailableMessage(searchKeyword
        ? 'Không tìm thấy sản phẩm phù hợp. Bạn nhắn Tiny để được tư vấn mẫu gần giống nhé.'
        : undefined);
      return;
    }

    const actionScripts = {
      yarn: {
        label: '🎨 Xem bảng màu & Đặt',
        msg: (name) => `Chào Tiny, mình đang quan tâm đến màu/dòng len "${name}", Tiny tư vấn số lượng và tình trạng màu này giúp mình nhé!`
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

    products.forEach(item => {
      const div = document.createElement('div');
      div.className = 'product-item';
      const outOfStock = item.status === 'out';
      const stockBadge = outOfStock ? `<div class="product-stock-badge">Hết hàng</div>` : '';
      const weightHtml = item.weight ? `<span class="product-weight">${escapeHtml(item.weight)}</span>` : '';
      const itemNameRaw = item.name || 'Sản phẩm';
      const itemName = escapeHtml(itemNameRaw);
      const imageUrl = getProductImageUrl(item);
      const thumbImageUrl = item.image_url || imageUrl;

      const cleanPrice = item.price ? item.price.toString().replace(/[,.]/g, '') : '';
      const priceHtml = (cleanPrice && !isNaN(cleanPrice))
        ? `<div class="product-price-inline">${Number(cleanPrice).toLocaleString('vi-VN')}đ</div>`
        : '';

      const messengerUrl = `https://m.me/61559447375156?text=${encodeURIComponent(script.msg(itemNameRaw))}`;
      const messengerBtn = outOfStock
        ? `<div class="product-outstock-note">Liên hệ Tiny để đặt trước!</div>`
        : `<a href="${messengerUrl}" target="_blank" rel="noopener" class="btn-messenger" data-track="product_messenger_click" data-category="${currentCategory}" data-product="${itemName}">${script.label}</a>`;

      div.innerHTML = `
        <button class="product-img-wrap product-img-button" type="button" aria-label="Xem ảnh lớn: ${itemName}">
          <img src="${escapeHtml(thumbImageUrl)}" alt="${itemName}" loading="lazy" ${outOfStock ? 'style="filter:grayscale(60%);opacity:.7"' : ''}>
          ${stockBadge}
        </button>
        <div class="product-item-info">
          <div class="product-title-row">
            <h4>${itemName}</h4>
            ${weightHtml}
          </div>
          ${priceHtml}
        </div>
        <div class="product-item-footer">${messengerBtn}</div>
      `;

      div.querySelector('.product-img-button').addEventListener('click', () => {
        openImageLightbox(imageUrl, itemNameRaw);
      });

      productGallery.appendChild(div);
    });

    const categoryNotes = {
      yarn: '💡 Mách nhỏ: Chọn loại len bạn thích, Tiny sẽ gửi bảng màu nhé!',
      handmade: '💡 Mách nhỏ: Bạn có thể đặt theo mẫu hoặc chia sẻ ảnh ý tưởng riêng!',
      set: '💡 Mách nhỏ: Mỗi Set đã gom đủ nguyên liệu và có hướng dẫn!',
      gift: '💡 Mách nhỏ: Tiny có thể ghi thiệp tay và gói hộp thêm nhé!'
    };

    if (categoryNotes[currentCategory]) {
      const note = document.createElement('div');
      note.className = 'category-note';
      note.style.cssText = 'grid-column: 1/-1; text-align: center; margin-top: 15px; font-size: 0.85rem; color: var(--text-mid); font-style: italic;';
      note.innerHTML = categoryNotes[currentCategory];
      productGallery.appendChild(note);
    }
  };

  if (!supabaseClient) {
    showProductUnavailableMessage();
    return;
  }

  try {
    // 2. Xây dựng câu truy vấn Supabase
    let query = supabaseClient
      .from('products')
      .select('*')
      .eq('category', currentCategory);

    if (searchKeyword) {
      query = query.ilike('name', `%${searchKeyword}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    // 3. Lọc tab ở phía trình duyệt để không phụ thuộc cứng vào cột sub_category.
    const filteredData = data.filter(item => productMatchesSubCategory(item, currentSubCategory));

    if (!searchKeyword && filteredData.length === 0) {
      showProductUnavailableMessage();
      return;
    }

    renderProducts(filteredData);

  } catch (err) {
    console.error('Lỗi khi lấy dữ liệu:', err.message);
    showProductUnavailableMessage();
  }
}

function closeProductModal() {
  closeImageLightbox();
  productModal.classList.remove('active');
  document.body.style.overflow = '';
}

if (productModal) {
  productModal.addEventListener('click', (e) => {
    if (e.target === productModal) closeProductModal();
  });
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (productImageLightbox?.classList.contains('active')) {
      closeImageLightbox();
      return;
    }

    if (productModal?.classList.contains('active')) {
      closeProductModal();
    }
  }
});

// ---- POLICY MODAL LOGIC (FB ADS) ----
const policyModal = document.getElementById('policyModal');
const policyContent = document.getElementById('policyContent');

const policies = {
  privacy: `
    <h2>Chính sách bảo mật</h2>
    <p><strong>Chủ thể bán hàng: Tiệm Len Nhà Tiny.</strong> Tiny chỉ thu thập thông tin cần thiết để tư vấn, xác nhận đơn, giao hàng và hỗ trợ sau bán hàng.</p>
    <h3>1. Thông tin có thể được thu thập</h3>
    <p>Tên người nhận, số điện thoại, địa chỉ giao hàng, nội dung bạn nhắn qua Zalo/Messenger/Facebook, ảnh mẫu bạn gửi để đặt làm sản phẩm và lịch sử sản phẩm đã tư vấn.</p>
    <h3>2. Mục đích sử dụng</h3>
    <p>Thông tin được dùng để báo giá, tư vấn màu/size/chất liệu, xác nhận đơn, giao hàng, xử lý đổi trả/hoàn tiền và chăm sóc khách hàng.</p>
    <h3>3. Cookie, pixel và công cụ đo lường</h3>
    <p>Khi được bật, website có thể dùng Meta Pixel, TikTok Pixel và Google Analytics để đo lượt xem trang, lượt nhấn nút liên hệ và hiệu quả quảng cáo. Các công cụ này không dùng để bán thông tin cá nhân của bạn.</p>
    <h3>4. Bên thứ ba liên quan</h3>
    <p>Thông tin có thể được chia sẻ ở mức cần thiết với nền tảng chat, đơn vị vận chuyển, Supabase để hiển thị dữ liệu sản phẩm, và các nền tảng đo lường quảng cáo khi pixel được bật.</p>
    <h3>5. Quyền của khách hàng</h3>
    <p>Bạn có thể yêu cầu Tiny kiểm tra, chỉnh sửa hoặc xóa thông tin đặt hàng bằng cách liên hệ qua Zalo 036.890.3519 hoặc Facebook Fanpage.</p>
    <h3>6. Cam kết</h3>
    <p>Tiny không bán thông tin khách hàng. Dữ liệu chỉ được lưu trong thời gian cần thiết cho việc xử lý đơn, bảo hành/đổi trả và đối soát vận chuyển.</p>
  `,
  terms: `
    <h2>Điều khoản dịch vụ</h2>
    <p>Chủ thể bán hàng: <strong>Tiệm Len Nhà Tiny</strong>. Địa chỉ liên hệ: 853 Ba Đình, Phường Chánh Hưng, TP. Hồ Chí Minh. Kênh hỗ trợ: Zalo 036.890.3519 và Facebook Fanpage.</p>
    <h3>1. Sản phẩm và báo giá</h3>
    <p>Tiny bán len sợi từ 18.000đ, hộp quà từ 100.000đ, set tự móc từ 100.000đ và nhận làm đồ móc handmade báo giá theo mẫu. Giá hiển thị hoặc báo qua tin nhắn được tính bằng VND và có thể thay đổi theo kích thước, chất liệu, độ khó, số lượng và yêu cầu gói quà.</p>
    <h3>2. Đơn đặt riêng</h3>
    <p>Với sản phẩm handmade theo ảnh mẫu, Tiny sẽ tư vấn trước về màu, size, thời gian hoàn thiện và chi phí. Sản phẩm handmade có thể chênh nhẹ về màu sắc/kích thước do ánh sáng, lô len và thao tác thủ công.</p>
    <h3>3. Thanh toán và đặt cọc</h3>
    <p>Đơn có sẵn có thể thanh toán theo thỏa thuận khi chốt đơn. Đơn thiết kế riêng có thể cần đặt cọc trước, thông thường từ 30-50% giá trị đơn, tùy độ phức tạp và số lượng.</p>
    <h3>4. Thời gian thực hiện</h3>
    <p>Đơn móc theo yêu cầu thường cần 3-7 ngày làm việc, đơn phức tạp hoặc số lượng lớn có thể lâu hơn. Tiny sẽ báo lịch dự kiến trước khi nhận cọc.</p>
    <h3>5. Hủy đơn</h3>
    <p>Đơn đặt riêng đã bắt đầu làm hoặc đã mua nguyên liệu riêng theo yêu cầu có thể không được hủy hoàn toàn. Tiny sẽ trao đổi phương án phù hợp theo tiến độ thực tế.</p>
  `,
  shipping: `
    <h2>Chính sách vận chuyển</h2>
    <h3>1. Phạm vi giao hàng</h3>
    <p>Tiny hỗ trợ giao hàng toàn quốc qua các đơn vị vận chuyển phù hợp như GHN, GHTK, J&amp;T hoặc đơn vị tương đương.</p>
    <h3>2. Thời gian giao hàng</h3>
    <p>Nội thành TP.HCM thường từ 1-3 ngày làm việc sau khi gửi hàng. Các tỉnh thành khác thường từ 2-5 ngày làm việc, tùy khu vực và tình trạng vận chuyển.</p>
    <h3>3. Phí vận chuyển</h3>
    <p>Phí ship được báo khi chốt đơn, phụ thuộc địa chỉ nhận hàng, kích thước và trọng lượng gói hàng. Một số chương trình ưu đãi ship nếu có sẽ được thông báo rõ trước khi thanh toán.</p>
    <h3>4. Đóng gói</h3>
    <p>Sản phẩm được đóng gói cẩn thận để hạn chế móp méo, ẩm bẩn hoặc hư hại trong quá trình vận chuyển. Với đơn quà tặng, Tiny có thể hỗ trợ gói hộp/thiệp theo thỏa thuận.</p>
    <h3>5. Kiểm tra khi nhận hàng</h3>
    <p>Khách hàng nên quay video khi mở hàng để Tiny và đơn vị vận chuyển có căn cứ hỗ trợ nếu phát sinh thiếu hàng, sai mẫu hoặc hư hỏng.</p>
  `,
  refund: `
    <h2>Chính sách đổi trả &amp; hoàn tiền</h2>
    <h3>1. Trường hợp hỗ trợ</h3>
    <p>Tiny hỗ trợ đổi, sửa hoặc hoàn tiền nếu sản phẩm bị lỗi kỹ thuật do Tiny, giao sai mẫu đã chốt, thiếu sản phẩm, hoặc hư hỏng nghiêm trọng trong quá trình vận chuyển có video mở hàng rõ ràng.</p>
    <h3>2. Thời hạn phản hồi</h3>
    <p>Vui lòng liên hệ trong vòng 48 giờ sau khi nhận hàng kèm ảnh/video tình trạng sản phẩm để Tiny kiểm tra và đề xuất hướng xử lý.</p>
    <h3>3. Sản phẩm đặt riêng</h3>
    <p>Với hàng handmade làm theo yêu cầu cá nhân, Tiny không nhận đổi trả vì đổi ý sau khi sản phẩm đã hoàn thiện đúng thông tin đã chốt. Nếu có lỗi do Tiny, Tiny sẽ ưu tiên sửa hoặc làm lại phần lỗi.</p>
    <h3>4. Hoàn tiền</h3>
    <p>Nếu đủ điều kiện hoàn tiền, Tiny sẽ hoàn qua phương thức đã thỏa thuận sau khi xác minh tình trạng đơn hàng. Thời gian xử lý thông thường từ 3-7 ngày làm việc.</p>
    <h3>5. Chi phí phát sinh</h3>
    <p>Nếu lỗi phát sinh từ Tiny hoặc vận chuyển có xác nhận, Tiny sẽ hỗ trợ chi phí hợp lý. Nếu khách đổi thông tin sau khi đơn đã gửi, chi phí phát sinh có thể do khách thanh toán.</p>
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

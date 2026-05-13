/* =============================================
   TIỆM LEN NHÀ TINY – SCRIPT
   ============================================= */

// ---- Khởi tạo Supabase ----
const SUPABASE_URL = 'https://pkcmpqerwjxscbhwchgx.supabase.co';
const SUPABASE_KEY = 'sb_publishable_C4UKMMkAjjqSnYVD4tA7bA_NXEakUyg';
const CONTACT_URL = 'https://m.me/61559447375156';
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
const productCategoryCache = new Map();
const yarnVariantCache = new Map();
const PRODUCT_SELECT_COLUMNS = 'id,created_at,name,slug,category,sub_category,description,cover_image,image_url,full_image_url,base_price,price,weight,yarn_size,knitting_needle,crochet_hook,origin,status,sort_order';
const VARIANT_SELECT_COLUMNS = 'id,product_id,sku,name,color_code,color_name,color_hex,image_url,full_image_url,price,status,sort_order';

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char]));
}

function getOptimizedCloudinaryUrl(url, variant = 'thumb') {
  if (!url || !url.includes('res.cloudinary.com') || !url.includes('/image/upload/')) {
    return url || '';
  }

  const uploadMarker = '/image/upload/';
  const [base, path] = url.split(uploadMarker);
  const firstPathPart = path.split('/')[0] || '';
  if (firstPathPart.includes('f_auto') || firstPathPart.includes('q_auto') || firstPathPart.startsWith('w_')) {
    return url;
  }

  const transform = variant === 'full'
    ? 'f_auto,q_auto,w_1400,c_limit'
    : 'f_auto,q_auto,w_520,c_limit';

  return `${base}${uploadMarker}${transform}/${path}`;
}

function getProductImageUrl(item) {
  return getOptimizedCloudinaryUrl(item.full_image_url || item.cover_image || item.image_url || '', 'full');
}

function getProductThumbImageUrl(item) {
  return getOptimizedCloudinaryUrl(item.cover_image || item.image_url || item.full_image_url || '', 'thumb');
}

function getProductPrice(item) {
  return item.base_price ?? item.price ?? '';
}

function formatProductPrice(value) {
  const cleanPrice = value ? value.toString().replace(/[,.]/g, '') : '';
  return (cleanPrice && !isNaN(cleanPrice))
    ? `${Number(cleanPrice).toLocaleString('vi-VN')}đ`
    : '';
}

function buildContactUrl(message) {
  const separator = CONTACT_URL.includes('?') ? '&' : '?';
  return `${CONTACT_URL}${separator}text=${encodeURIComponent(message)}`;
}

function getVariantCode(variant) {
  return variant.sku || variant.color_code || variant.name || '';
}

function getVariantName(variant) {
  return variant.color_name || variant.name || '';
}

function getVariantImage(product, variant, mode = 'full') {
  const url = variant?.full_image_url || variant?.image_url || product.full_image_url || product.cover_image || product.image_url || '';
  return getOptimizedCloudinaryUrl(url, mode);
}

function getVariantPrice(product, variant) {
  return variant?.price ?? product.base_price ?? product.price ?? '';
}

function getVariantStatusLabel(status) {
  const labels = {
    available: 'Còn hàng',
    out: 'Hết hàng',
    preorder: 'Đặt trước',
    hidden: 'Ẩn'
  };
  return labels[status || 'available'] || status || 'Còn hàng';
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

function setYarnListMode() {
  const searchWrap = document.querySelector('.modal-search-wrap');
  if (searchWrap) searchWrap.style.display = '';
  productModal?.querySelector('.product-modal-content')?.classList.remove('yarn-detail-modal');
  renderFilterTabs(currentCategory);
  productModalTitle.textContent = categoryTitles[currentCategory] || 'Sản phẩm';
}

function setYarnDetailMode(product) {
  const searchWrap = document.querySelector('.modal-search-wrap');
  if (searchWrap) searchWrap.style.display = 'none';
  productModal?.querySelector('.product-modal-content')?.classList.add('yarn-detail-modal');
  if (modalFilterTabs) modalFilterTabs.innerHTML = '';
  productModalTitle.textContent = product.name || 'Bảng màu';
}

async function fetchYarnVariants(productId) {
  if (!supabaseClient || !productId) return [];
  if (yarnVariantCache.has(productId)) return yarnVariantCache.get(productId);

  const baseQuery = supabaseClient
    .from('product_variants')
    .select(VARIANT_SELECT_COLUMNS)
    .eq('product_id', productId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  let { data, error } = await baseQuery;

  if (error) {
    console.warn('Schema variants chưa chuẩn, đang dùng fallback:', error.message);
    const fallback = await supabaseClient
      .from('product_variants')
      .select('*')
      .eq('product_id', productId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });
    data = fallback.data;
    error = fallback.error;
  }

  if (error) {
    console.warn('Chưa tải được variants:', error.message);
    yarnVariantCache.set(productId, []);
    return [];
  }

  const variants = (data || []).filter(variant => variant.status !== 'hidden');
  yarnVariantCache.set(productId, variants);
  return variants;
}

async function attachYarnVariantCounts(products) {
  if (currentCategory !== 'yarn' || products.length === 0) return products;

  const productsWithVariants = await Promise.all(products.map(async (product) => {
    const variants = await fetchYarnVariants(product.id);
    return {
      ...product,
      variant_count: variants.length
    };
  }));

  return productsWithVariants;
}

function renderYarnContactButton(product, variant) {
  const selectedVariant = variant || {};
  const code = getVariantCode(selectedVariant) || 'Chưa chọn';
  const colorName = getVariantName(selectedVariant) || 'Chưa có tên màu';
  const price = formatProductPrice(getVariantPrice(product, selectedVariant)) || 'Liên hệ';
  const status = getVariantStatusLabel(selectedVariant.status);
  const message = [
    'Em muốn hỏi màu len:',
    `- Dòng len: ${product.name || ''}`,
    `- Mã màu: ${code}`,
    `- Tên màu: ${colorName}`,
    `- Giá: ${price}`,
    `- Trạng thái: ${status}`
  ].join('\n');

  return buildContactUrl(message);
}

function renderYarnVariantDetail(product, variants, selectedVariantId) {
  const selectedVariant = variants.find(variant => String(variant.id) === String(selectedVariantId)) || variants[0] || null;
  const heroImage = getVariantImage(product, selectedVariant, 'full');
  const selectedCode = selectedVariant ? getVariantCode(selectedVariant) : '';
  const selectedName = selectedVariant ? getVariantName(selectedVariant) : '';
  const selectedPrice = formatProductPrice(getVariantPrice(product, selectedVariant)) || 'Liên hệ';
  const selectedStatus = selectedVariant ? getVariantStatusLabel(selectedVariant.status) : 'Chưa có bảng màu';
  const detailRows = [
    ['Trọng lượng', product.weight],
    ['Kích cỡ sợi', product.yarn_size],
    ['Kim đan', product.knitting_needle],
    ['Kim móc', product.crochet_hook],
    ['Xuất xứ', product.origin]
  ].filter(([, value]) => value);

  productGallery.innerHTML = `
    <article class="yarn-detail-view">
      <button type="button" class="yarn-back-btn" id="yarnBackBtn">← Quay lại danh sách len</button>
      <div class="yarn-detail-layout">
        <button type="button" class="yarn-detail-image product-img-button" id="yarnDetailImageBtn" aria-label="Xem ảnh lớn: ${escapeHtml(product.name || 'Cuộn len')}">
          <img src="${escapeHtml(heroImage)}" alt="${escapeHtml(product.name || 'Cuộn len')}">
        </button>
        <div class="yarn-detail-info">
          <h3>${escapeHtml(product.name || 'Cuộn len')}</h3>
          <div class="yarn-detail-price" id="yarnDetailPrice">${escapeHtml(selectedPrice)}</div>
          ${product.description ? `<p class="yarn-detail-description">${escapeHtml(product.description)}</p>` : ''}
          ${detailRows.length ? `
            <ul class="yarn-spec-list">
              ${detailRows.map(([label, value]) => `<li><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</li>`).join('')}
            </ul>
          ` : ''}
          <div class="yarn-selected-box">
            <span>Mã đang chọn: <strong id="yarnSelectedCode">${escapeHtml(selectedCode || 'Chưa có')}</strong></span>
            <span>Tên màu: <strong id="yarnSelectedName">${escapeHtml(selectedName || 'Chưa có')}</strong></span>
            <span>Trạng thái: <strong id="yarnSelectedStatus">${escapeHtml(selectedStatus)}</strong></span>
          </div>
          <a class="btn-messenger yarn-contact-btn ${selectedVariant ? '' : 'disabled'}" id="yarnContactBtn" href="${selectedVariant ? renderYarnContactButton(product, selectedVariant) : '#'}" target="_blank" rel="noopener">
            Liên hệ đặt màu này
          </a>
        </div>
      </div>
      <section class="yarn-color-section">
        <h4>Mã màu</h4>
        ${variants.length ? `
          <div class="yarn-color-grid">
            ${variants.map((variant) => {
              const thumb = getVariantImage(product, variant, 'thumb');
              const code = getVariantCode(variant);
              const active = selectedVariant && String(variant.id) === String(selectedVariant.id);
              return `
                <button type="button" class="yarn-color-option ${active ? 'active' : ''}" data-variant-id="${variant.id}" aria-label="Chọn màu ${escapeHtml(code)}">
                  <img src="${escapeHtml(thumb)}" alt="${escapeHtml(code)}" loading="lazy">
                  <span>${escapeHtml(code || 'Màu')}</span>
                </button>
              `;
            }).join('')}
          </div>
        ` : '<p class="yarn-empty-variants">Dòng len này chưa có bảng màu. Bạn liên hệ Tiny để được gửi bảng màu nhé.</p>'}
      </section>
    </article>
  `;

  const imageButton = document.getElementById('yarnDetailImageBtn');
  imageButton?.addEventListener('click', () => {
    openImageLightbox(heroImage, product.name || 'Cuộn len');
  });

  document.getElementById('yarnBackBtn')?.addEventListener('click', () => {
    setYarnListMode();
    fetchAndRenderProducts();
  });

  productGallery.querySelectorAll('.yarn-color-option').forEach((button) => {
    button.addEventListener('click', () => {
      renderYarnVariantDetail(product, variants, button.dataset.variantId);
    });
  });
}

async function openYarnProductDetail(product) {
  setYarnDetailMode(product);
  productGallery.innerHTML = `
    <div class="yarn-detail-loading">
      <div class="skeleton skeleton-img"></div>
      <div class="skeleton skeleton-text"></div>
      <div class="skeleton skeleton-btn"></div>
    </div>
  `;
  const variants = await fetchYarnVariants(product.id);
  renderYarnVariantDetail(product, variants, variants[0]?.id);
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

  setYarnListMode();
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
      if (currentCategory === 'yarn') div.classList.add('yarn-line-card');
      const outOfStock = item.status === 'out';
      const stockBadge = outOfStock ? `<div class="product-stock-badge">Hết hàng</div>` : '';
      const weightHtml = item.weight ? `<span class="product-weight">${escapeHtml(item.weight)}</span>` : '';
      const itemNameRaw = item.name || 'Sản phẩm';
      const itemName = escapeHtml(itemNameRaw);
      const imageUrl = getProductImageUrl(item);
      const thumbImageUrl = getProductThumbImageUrl(item);

      const displayPrice = formatProductPrice(getProductPrice(item));
      const priceHtml = displayPrice
        ? `<div class="product-price-inline">${currentCategory === 'yarn' ? 'Từ ' : ''}${displayPrice}</div>`
        : '';
      const variantCountHtml = currentCategory === 'yarn' && Number(item.variant_count) > 0
        ? `<div class="yarn-card-count">${Number(item.variant_count)} màu hiện có</div>`
        : '';

      const messengerUrl = `https://m.me/61559447375156?text=${encodeURIComponent(script.msg(itemNameRaw))}`;
      const messengerBtn = currentCategory === 'yarn'
        ? `<button type="button" class="btn-messenger yarn-view-colors-btn" data-track="product_card_click" data-category="${currentCategory}" data-product="${itemName}">${script.label}</button>`
        : outOfStock
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
          ${variantCountHtml}
        </div>
        <div class="product-item-footer">${messengerBtn}</div>
      `;

      if (currentCategory === 'yarn') {
        div.querySelector('.product-img-button').addEventListener('click', () => openYarnProductDetail(item));
        div.querySelector('.yarn-view-colors-btn')?.addEventListener('click', () => openYarnProductDetail(item));
      } else {
        div.querySelector('.product-img-button').addEventListener('click', () => {
          openImageLightbox(imageUrl, itemNameRaw);
        });
      }

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
    // 2. Query theo schema chuẩn. Có cache theo danh mục/tab/tìm kiếm.
    const normalizedSearch = normalizeProductText(searchKeyword);
    const cacheKey = [
      currentCategory,
      currentSubCategory,
      normalizedSearch
    ].join('|');
    let data = productCategoryCache.get(cacheKey);

    if (!data) {
      let query = supabaseClient
        .from('products')
        .select(PRODUCT_SELECT_COLUMNS)
        .eq('category', currentCategory)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false })
        .limit(100);

      if (currentSubCategory !== 'all') {
        query = query.eq('sub_category', currentSubCategory);
      }

      if (normalizedSearch) {
        query = query.ilike('name', `%${normalizedSearch}%`);
      }

      const { data: standardData, error: standardError } = await query;

      if (standardError) {
        console.warn('Schema products chưa chuẩn, đang dùng fallback:', standardError.message);
        const { data: legacyData, error: legacyError } = await supabaseClient
          .from('products')
          .select('*')
          .eq('category', currentCategory)
          .order('created_at', { ascending: false })
          .limit(100);

        if (legacyError) throw legacyError;

        data = (legacyData || []).filter(item => (
          productMatchesSubCategory(item, currentSubCategory)
          && (!normalizedSearch || normalizeProductText(item.name).includes(normalizedSearch))
        ));
      } else {
        data = standardData || [];
      }

      data = data.filter(item => (
        currentCategory === 'yarn'
          ? (!item.status || item.status === 'available')
          : item.status !== 'hidden'
      ));
      productCategoryCache.set(cacheKey, data);
    }

    data = await attachYarnVariantCounts(data);

    if (!searchKeyword && data.length === 0) {
      showProductUnavailableMessage();
      return;
    }

    renderProducts(data);

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
    <p>Tiny bán len sợi từ 8.000đ, hộp quà từ 100.000đ, set tự móc từ 100.000đ và nhận làm đồ móc handmade báo giá theo mẫu. Giá hiển thị hoặc báo qua tin nhắn được tính bằng VND và có thể thay đổi theo kích thước, chất liệu, độ khó, số lượng và yêu cầu gói quà.</p>
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

import { CONTACT_URL, PRODUCT_SELECT_COLUMNS, VARIANT_SELECT_COLUMNS } from './config.js';
import { ensureSupabaseClient } from './supabase-client.js';

let currentCategory = '';
let currentSubCategory = 'all';
let searchKeyword = '';
let searchTimeout;
let productImageLightbox = null;

const categoryTitles = {
  yarn: 'Cuộn Len',
  handmade: 'Đồ Móc Theo Yêu Cầu',
  gift: 'Bộ Quà Tặng',
  set: 'Set Tự Móc'
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

const productCategoryCache = new Map();
const yarnVariantCache = new Map();
const yarnVariantCountCache = new Map();

function getEls() {
  return {
    modalSearchInput: document.getElementById('modalSearchInput'),
    modalFilterTabs: document.getElementById('modalFilterTabs'),
    productModal: document.getElementById('productModal'),
    productModalTitle: document.getElementById('productModalTitle'),
    productGallery: document.getElementById('productGallery')
  };
}

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
  const pathParts = path.split('/');
  const firstPathPart = pathParts[0] || '';
  const hasTransform = /(^|,)(a_|ar_|b_|c_|dpr_|e_|f_|fl_|g_|h_|q_|r_|t_|w_|x_|y_|z_)/.test(firstPathPart);
  const publicPath = hasTransform ? pathParts.slice(1).join('/') : path;
  const transform = variant === 'full'
    ? 'f_auto,q_auto,w_1200,c_limit'
    : 'f_auto,q_auto,w_800,c_limit';

  return `${base}${uploadMarker}${transform}/${publicPath}`;
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
  const { productGallery } = getEls();
  if (!productGallery) return;

  productGallery.innerHTML = `
    <div style="grid-column: 1/-1; text-align: center; padding: 40px 16px; color: var(--text-mid);">
      ${message}
    </div>
  `;
}

function normalizeProductText(value) {
  return String(value || '').toLowerCase().trim();
}

function setYarnListMode() {
  const { modalFilterTabs, productModal, productModalTitle } = getEls();
  const searchWrap = document.querySelector('.modal-search-wrap');
  const modalContent = productModal?.querySelector('.product-modal-content');

  if (searchWrap) searchWrap.style.display = '';
  productModal?.classList.remove('yarn-detail-open');
  modalContent?.classList.remove('yarn-detail-modal');
  modalContent?.classList.toggle('yarn-list-modal', currentCategory === 'yarn');
  renderFilterTabs(currentCategory);
  if (productModalTitle) productModalTitle.textContent = categoryTitles[currentCategory] || 'Sản phẩm';
  if (!subCategories[currentCategory] && modalFilterTabs) modalFilterTabs.innerHTML = '';
}

function setYarnDetailMode(product) {
  const { modalFilterTabs, productModal, productModalTitle } = getEls();
  const searchWrap = document.querySelector('.modal-search-wrap');
  const modalContent = productModal?.querySelector('.product-modal-content');

  if (searchWrap) searchWrap.style.display = 'none';
  productModal?.classList.add('yarn-detail-open');
  modalContent?.classList.add('yarn-detail-modal');
  modalContent?.classList.remove('yarn-list-modal');
  if (modalFilterTabs) modalFilterTabs.innerHTML = '';
  if (productModalTitle) productModalTitle.textContent = product.name || 'Bảng màu';
}

async function fetchYarnVariants(productId) {
  const client = await ensureSupabaseClient();
  if (!client || !productId) return [];
  if (yarnVariantCache.has(productId)) return yarnVariantCache.get(productId);

  const { data, error } = await client
    .from('product_variants')
    .select(VARIANT_SELECT_COLUMNS)
    .eq('product_id', productId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

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

  const missingIds = products
    .map(product => product.id)
    .filter(id => id && !yarnVariantCountCache.has(id));

  if (missingIds.length) {
    const client = await ensureSupabaseClient();
    if (client) {
      const { data, error } = await client
        .from('product_variants')
        .select('product_id,status')
        .in('product_id', missingIds);

      if (!error) {
        missingIds.forEach(id => yarnVariantCountCache.set(id, 0));
        (data || []).forEach((variant) => {
          if (variant.status === 'hidden') return;
          const count = yarnVariantCountCache.get(variant.product_id) || 0;
          yarnVariantCountCache.set(variant.product_id, count + 1);
        });
      }
    }
  }

  return products.map(product => ({
    ...product,
    variant_count: yarnVariantCountCache.get(product.id) || 0
  }));
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
  const { productGallery } = getEls();
  if (!productGallery) return;

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
        <div class="yarn-detail-left">
          <button type="button" class="yarn-detail-image product-img-button" id="yarnDetailImageBtn" aria-label="Xem ảnh lớn: ${escapeHtml(product.name || 'Cuộn len')}">
            <img src="${escapeHtml(heroImage)}" alt="Ảnh sản phẩm ${escapeHtml(product.name || 'cuộn len')} tại Tiệm Len Nhà Tiny" decoding="async">
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
        <section class="yarn-color-section yarn-detail-colors">
          <h4>Mã màu</h4>
          ${variants.length ? `
            <div class="yarn-color-grid">
              ${variants.map((variant) => {
                const thumb = getVariantImage(product, variant, 'thumb');
                const code = getVariantCode(variant);
                const active = selectedVariant && String(variant.id) === String(selectedVariant.id);
                return `
                  <button type="button" class="yarn-color-option ${active ? 'active' : ''}" data-variant-id="${variant.id}" aria-label="Chọn màu ${escapeHtml(code)}">
                    <img src="${escapeHtml(thumb)}" alt="Màu ${escapeHtml(code || 'len')} của ${escapeHtml(product.name || 'dòng len')} tại Tiệm Len Nhà Tiny" loading="lazy" decoding="async">
                    <span>${escapeHtml(code || 'Màu')}</span>
                  </button>
                `;
              }).join('')}
            </div>
          ` : '<p class="yarn-empty-variants">Dòng len này chưa có bảng màu. Bạn liên hệ Tiny để được gửi bảng màu nhé.</p>'}
        </section>
      </div>
    </article>
  `;

  document.getElementById('yarnDetailImageBtn')?.addEventListener('click', () => {
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
  const { productGallery } = getEls();
  if (!productGallery) return;

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
      <img src="" alt="" decoding="async">
      <figcaption></figcaption>
    </figure>
  `;

  productImageLightbox.addEventListener('click', (e) => {
    if (e.target === productImageLightbox || e.target.closest('.product-image-lightbox-close')) {
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
  productImageLightbox.querySelector('img')?.removeAttribute('src');
}

export async function openProductModal(type) {
  const { modalSearchInput, productModal, productModalTitle } = getEls();
  if (!productModal || !productModalTitle) return;

  currentCategory = type;
  currentSubCategory = 'all';
  searchKeyword = '';

  if (modalSearchInput) modalSearchInput.value = '';
  productModalTitle.textContent = categoryTitles[type] || 'Sản phẩm';

  productModal.classList.add('active');
  document.body.style.overflow = 'hidden';

  setYarnListMode();
  renderFilterTabs(type);
  await ensureSupabaseClient();
  fetchAndRenderProducts();
}

function renderFilterTabs(type) {
  const { modalFilterTabs } = getEls();
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

export function filterBySubCategory(subId) {
  currentSubCategory = subId;
  renderFilterTabs(currentCategory);
  fetchAndRenderProducts();
}

async function fetchAndRenderProducts() {
  const { productGallery } = getEls();
  if (!productGallery) return;

  productGallery.innerHTML = Array(4).fill(0).map(() => `
    <div class="product-item">
      <div class="skeleton skeleton-img"></div>
      <div class="skeleton skeleton-text"></div>
      <div class="skeleton skeleton-btn"></div>
    </div>
  `).join('');

  const client = await ensureSupabaseClient();
  if (!client) {
    showProductUnavailableMessage();
    return;
  }

  try {
    const normalizedSearch = normalizeProductText(searchKeyword);
    const cacheKey = [currentCategory, currentSubCategory, normalizedSearch].join('|');
    let data = productCategoryCache.get(cacheKey);

    if (!data) {
      let query = client
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
      if (standardError) throw standardError;

      data = (standardData || []).filter(item => (
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

function renderProducts(products) {
  const { productGallery } = getEls();
  if (!productGallery) return;

  productGallery.innerHTML = '';

  if (products.length === 0) {
    showProductUnavailableMessage(searchKeyword
      ? 'Không tìm thấy sản phẩm phù hợp. Bạn nhắn Tiny để được tư vấn mẫu gần giống nhé.'
      : undefined);
    return;
  }

  const actionScripts = {
    yarn: {
      label: 'Xem bảng màu & Đặt',
      msg: (name) => `Chào Tiny, mình đang quan tâm đến màu/dòng len "${name}", Tiny tư vấn số lượng và tình trạng màu này giúp mình nhé!`
    },
    handmade: {
      label: 'Tư vấn size & dáng',
      msg: (name) => `Chào Tiny, mình muốn đặt móc mẫu "${name}" theo yêu cầu riêng, Tiny tư vấn giúp mình nhé!`
    },
    set: {
      label: 'Xem chi tiết set',
      msg: (name) => `Chào Tiny, Set "${name}" này gồm những gì và có hướng dẫn kèm theo không ạ?`
    },
    gift: {
      label: 'Tư vấn hộp quà',
      msg: (name) => `Chào Tiny, mình muốn mua set quà "${name}", Tiny có gói hộp và ghi thiệp giúp mình không?`
    }
  };

  const script = actionScripts[currentCategory] || {
    label: 'Nhắn Mess hỏi mua',
    msg: (name) => `Chào Tiny, mình muốn hỏi mua: "${name}"`
  };

  products.forEach((item) => {
    const div = document.createElement('div');
    div.className = 'product-item';
    if (currentCategory === 'yarn') div.classList.add('yarn-line-card');

    const outOfStock = item.status === 'out';
    const stockBadge = outOfStock ? '<div class="product-stock-badge">Hết hàng</div>' : '';
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
      ? '<div class="product-outstock-note">Liên hệ Tiny để đặt trước!</div>'
      : `<a href="${messengerUrl}" target="_blank" rel="noopener" class="btn-messenger" data-track="product_messenger_click" data-category="${currentCategory}" data-product="${itemName}">${script.label}</a>`;

    div.innerHTML = `
      <button class="product-img-wrap product-img-button" type="button" aria-label="Xem ảnh lớn: ${itemName}">
        <img src="${escapeHtml(thumbImageUrl)}" alt="Ảnh sản phẩm ${itemName} tại Tiệm Len Nhà Tiny" loading="lazy" decoding="async" ${outOfStock ? 'style="filter:grayscale(60%);opacity:.7"' : ''}>
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
}

export function closeProductModal() {
  const { productModal } = getEls();
  closeImageLightbox();
  productModal?.classList.remove('active');
  productModal?.classList.remove('yarn-detail-open');
  document.body.style.overflow = '';
}

export function initProductModal() {
  const { modalSearchInput, productModal } = getEls();

  if (modalSearchInput) {
    modalSearchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchKeyword = e.target.value.trim();
      searchTimeout = setTimeout(() => {
        fetchAndRenderProducts();
      }, 400);
    });
  }

  productModal?.addEventListener('click', (e) => {
    if (e.target === productModal) closeProductModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;

    if (productImageLightbox?.classList.contains('active')) {
      closeImageLightbox();
      return;
    }

    if (productModal?.classList.contains('active')) {
      closeProductModal();
    }
  });

  window.openProductModal = openProductModal;
  window.closeProductModal = closeProductModal;
  window.filterBySubCategory = filterBySubCategory;
}

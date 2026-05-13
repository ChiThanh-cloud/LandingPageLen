const SUPABASE_URL = 'https://pkcmpqerwjxscbhwchgx.supabase.co';
const SUPABASE_KEY = 'sb_publishable_C4UKMMkAjjqSnYVD4tA7bA_NXEakUyg';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const PRODUCT_COLUMNS = 'id,created_at,updated_at,name,category,sub_category,image_url,full_image_url,weight,price,status,sort_order';

const subCategoryOptions = {
  handmade: [
    ['gau', 'Gấu len'],
    ['hoa', 'Hoa len'],
    ['tui', 'Túi xách']
  ],
  yarn: [
    ['milk', 'Len Milk'],
    ['cotton', 'Len Cotton']
  ],
  set: [],
  gift: []
};

const labels = {
  handmade: 'Đồ móc',
  yarn: 'Cuộn len',
  set: 'Set tự móc',
  gift: 'Quà tặng',
  available: 'Còn hàng',
  out: 'Hết hàng',
  preorder: 'Đặt trước',
  hidden: 'Ẩn'
};

const state = {
  products: [],
  editingId: null
};

const $ = (id) => document.getElementById(id);

const els = {
  loginPanel: $('loginPanel'),
  adminApp: $('adminApp'),
  loginForm: $('loginForm'),
  loginEmail: $('loginEmail'),
  loginPassword: $('loginPassword'),
  loginMessage: $('loginMessage'),
  logoutBtn: $('logoutBtn'),
  refreshBtn: $('refreshBtn'),
  userEmail: $('userEmail'),
  searchInput: $('searchInput'),
  categoryFilter: $('categoryFilter'),
  newProductBtn: $('newProductBtn'),
  productForm: $('productForm'),
  formTitle: $('formTitle'),
  clearFormBtn: $('clearFormBtn'),
  productId: $('productId'),
  productName: $('productName'),
  productCategory: $('productCategory'),
  productSubCategory: $('productSubCategory'),
  productStatus: $('productStatus'),
  productSortOrder: $('productSortOrder'),
  productPrice: $('productPrice'),
  productWeight: $('productWeight'),
  productImageUrl: $('productImageUrl'),
  productFullImageUrl: $('productFullImageUrl'),
  productMessage: $('productMessage'),
  imagePreviewWrap: $('imagePreviewWrap'),
  imagePreview: $('imagePreview'),
  productTable: $('productTable'),
  productCount: $('productCount')
};

function setMessage(el, text = '', type = '') {
  el.textContent = text;
  el.className = `form-message ${type}`.trim();
}

function normalizeText(value) {
  return String(value || '').toLowerCase().trim();
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

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char]));
}

function formatPrice(value) {
  if (!value) return '';
  const number = Number(value);
  if (Number.isNaN(number)) return '';
  return `${number.toLocaleString('vi-VN')}đ`;
}

function updateSubCategoryOptions(selectedValue = '') {
  const options = subCategoryOptions[els.productCategory.value] || [];
  els.productSubCategory.innerHTML = '<option value="">Không có</option>'
    + options.map(([value, label]) => (
      `<option value="${value}">${label}</option>`
    )).join('');
  els.productSubCategory.value = selectedValue;
}

function resetForm() {
  state.editingId = null;
  els.formTitle.textContent = 'Sản phẩm mới';
  els.productForm.reset();
  els.productId.value = '';
  els.productStatus.value = 'available';
  els.productSortOrder.value = '0';
  updateSubCategoryOptions();
  updateImagePreview();
  setMessage(els.productMessage);
}

function fillForm(product) {
  state.editingId = product.id;
  els.formTitle.textContent = `Sửa: ${product.name || 'Sản phẩm'}`;
  els.productId.value = product.id;
  els.productName.value = product.name || '';
  els.productCategory.value = product.category || 'handmade';
  updateSubCategoryOptions(product.sub_category || '');
  els.productStatus.value = product.status || 'available';
  els.productSortOrder.value = product.sort_order ?? 0;
  els.productPrice.value = product.price || '';
  els.productWeight.value = product.weight || '';
  els.productImageUrl.value = product.image_url || '';
  els.productFullImageUrl.value = product.full_image_url || '';
  updateImagePreview();
  setMessage(els.productMessage);
  els.productName.focus();
}

function updateImagePreview() {
  const url = els.productImageUrl.value.trim();
  if (!url) {
    els.imagePreviewWrap.classList.add('hidden');
    els.imagePreview.removeAttribute('src');
    return;
  }

  els.imagePreview.src = getOptimizedCloudinaryUrl(url, 'thumb');
  els.imagePreviewWrap.classList.remove('hidden');
}

function getFilteredProducts() {
  const keyword = normalizeText(els.searchInput.value);
  const category = els.categoryFilter.value;
  return state.products.filter((product) => {
    const matchesKeyword = !keyword || normalizeText(product.name).includes(keyword);
    const matchesCategory = category === 'all' || product.category === category;
    return matchesKeyword && matchesCategory;
  });
}

function renderProducts() {
  const products = getFilteredProducts();
  els.productCount.textContent = `${products.length} sản phẩm`;

  if (products.length === 0) {
    els.productTable.innerHTML = '<p class="form-message">Chưa có sản phẩm phù hợp.</p>';
    return;
  }

  els.productTable.innerHTML = products.map((product) => {
    const thumb = getOptimizedCloudinaryUrl(product.image_url || product.full_image_url || '', 'thumb');
    const categoryLabel = labels[product.category] || product.category || 'Chưa phân loại';
    const subLabel = product.sub_category ? ` / ${product.sub_category}` : '';
    const status = product.status || 'available';
    const hiddenClass = status === 'hidden' ? ' is-hidden' : '';
    const toggleText = status === 'hidden' ? 'Hiện' : 'Ẩn';
    const toggleClass = status === 'hidden' ? '' : 'danger-btn';

    return `
      <article class="product-row${hiddenClass}">
        <img class="product-thumb" src="${escapeHtml(thumb)}" alt="${escapeHtml(product.name || 'Sản phẩm')}">
        <div class="product-main">
          <strong>${escapeHtml(product.name || 'Chưa đặt tên')}</strong>
          <span>${escapeHtml(categoryLabel + subLabel)}</span>
        </div>
        <div class="product-meta">${escapeHtml(formatPrice(product.price) || product.weight || '')}</div>
        <span class="status-pill">${escapeHtml(labels[status] || status)}</span>
        <div class="row-actions">
          <button type="button" data-action="edit" data-id="${product.id}">Sửa</button>
          <button type="button" class="${toggleClass}" data-action="toggle" data-id="${product.id}">${toggleText}</button>
        </div>
      </article>
    `;
  }).join('');
}

async function loadProducts() {
  setMessage(els.productMessage, 'Đang tải sản phẩm...');
  const { data, error } = await supabaseClient
    .from('products')
    .select(PRODUCT_COLUMNS)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    setMessage(els.productMessage, error.message, 'error');
    return;
  }

  state.products = data || [];
  renderProducts();
  setMessage(els.productMessage);
}

function getFormPayload() {
  const price = els.productPrice.value.trim();
  const fullImage = els.productFullImageUrl.value.trim();
  return {
    name: els.productName.value.trim(),
    category: els.productCategory.value,
    sub_category: els.productSubCategory.value || null,
    status: els.productStatus.value,
    sort_order: Number(els.productSortOrder.value || 0),
    price: price ? Number(price) : null,
    weight: els.productWeight.value.trim() || null,
    image_url: els.productImageUrl.value.trim(),
    full_image_url: fullImage || null
  };
}

async function saveProduct(event) {
  event.preventDefault();
  const payload = getFormPayload();
  if (!payload.name || !payload.image_url) {
    setMessage(els.productMessage, 'Tên sản phẩm và link ảnh là bắt buộc.', 'error');
    return;
  }

  setMessage(els.productMessage, 'Đang lưu...');
  const request = state.editingId
    ? supabaseClient.from('products').update(payload).eq('id', state.editingId)
    : supabaseClient.from('products').insert(payload);

  const { error } = await request;
  if (error) {
    setMessage(els.productMessage, error.message, 'error');
    return;
  }

  setMessage(els.productMessage, 'Đã lưu sản phẩm.', 'success');
  await loadProducts();
  resetForm();
}

async function toggleProductVisibility(id) {
  const product = state.products.find((item) => String(item.id) === String(id));
  if (!product) return;

  const nextStatus = product.status === 'hidden' ? 'available' : 'hidden';
  const { error } = await supabaseClient
    .from('products')
    .update({ status: nextStatus })
    .eq('id', product.id);

  if (error) {
    setMessage(els.productMessage, error.message, 'error');
    return;
  }

  await loadProducts();
}

function bindEvents() {
  els.loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    setMessage(els.loginMessage, 'Đang đăng nhập...');
    const { error } = await supabaseClient.auth.signInWithPassword({
      email: els.loginEmail.value.trim(),
      password: els.loginPassword.value
    });

    if (error) {
      setMessage(els.loginMessage, error.message, 'error');
    }
  });

  els.logoutBtn.addEventListener('click', () => supabaseClient.auth.signOut());
  els.refreshBtn.addEventListener('click', loadProducts);
  els.newProductBtn.addEventListener('click', resetForm);
  els.clearFormBtn.addEventListener('click', resetForm);
  els.productForm.addEventListener('submit', saveProduct);
  els.productCategory.addEventListener('change', () => updateSubCategoryOptions());
  els.productImageUrl.addEventListener('input', updateImagePreview);
  els.searchInput.addEventListener('input', renderProducts);
  els.categoryFilter.addEventListener('change', renderProducts);

  els.productTable.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;

    const product = state.products.find((item) => String(item.id) === String(button.dataset.id));
    if (!product) return;

    if (button.dataset.action === 'edit') {
      fillForm(product);
    }

    if (button.dataset.action === 'toggle') {
      toggleProductVisibility(product.id);
    }
  });
}

async function showAuthedApp(session) {
  els.loginPanel.classList.add('hidden');
  els.adminApp.classList.remove('hidden');
  els.userEmail.textContent = session.user.email || '';
  await loadProducts();
}

function showLogin() {
  els.adminApp.classList.add('hidden');
  els.loginPanel.classList.remove('hidden');
  els.userEmail.textContent = '';
  state.products = [];
  renderProducts();
}

async function init() {
  bindEvents();
  updateSubCategoryOptions();
  const { data } = await supabaseClient.auth.getSession();

  if (data.session) {
    await showAuthedApp(data.session);
  } else {
    showLogin();
  }

  supabaseClient.auth.onAuthStateChange((_event, session) => {
    if (session) {
      showAuthedApp(session);
    } else {
      showLogin();
    }
  });
}

init();

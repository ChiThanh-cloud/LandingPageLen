const SUPABASE_URL = 'https://pkcmpqerwjxscbhwchgx.supabase.co';
const SUPABASE_KEY = 'sb_publishable_C4UKMMkAjjqSnYVD4tA7bA_NXEakUyg';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const PRODUCT_COLUMNS = 'id,created_at,updated_at,name,category,sub_category,image_url,full_image_url,weight,price,status,sort_order';
const VARIANT_COLUMNS = 'id,product_id,created_at,updated_at,name,image_url,status,sort_order';
const CLOUDINARY_CONFIG_KEY = 'tiny_admin_cloudinary_config';
const DEFAULT_CLOUDINARY_CONFIG = {
  cloudName: 'djn2kd2hh',
  uploadPreset: '',
  folder: 'tiny-products'
};

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
  variants: [],
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
  cloudinaryCloudName: $('cloudinaryCloudName'),
  cloudinaryUploadPreset: $('cloudinaryUploadPreset'),
  cloudinaryFolder: $('cloudinaryFolder'),
  saveCloudinaryConfigBtn: $('saveCloudinaryConfigBtn'),
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
  productImageFile: $('productImageFile'),
  uploadImageBtn: $('uploadImageBtn'),
  productFullImageUrl: $('productFullImageUrl'),
  productMessage: $('productMessage'),
  imagePreviewWrap: $('imagePreviewWrap'),
  imagePreview: $('imagePreview'),
  productTable: $('productTable'),
  productCount: $('productCount'),
  variantPanel: $('variantPanel'),
  variantProductName: $('variantProductName'),
  variantCount: $('variantCount'),
  variantForm: $('variantForm'),
  variantId: $('variantId'),
  variantName: $('variantName'),
  variantSortOrder: $('variantSortOrder'),
  variantStatus: $('variantStatus'),
  variantImageUrl: $('variantImageUrl'),
  variantImageFile: $('variantImageFile'),
  uploadVariantImageBtn: $('uploadVariantImageBtn'),
  clearVariantBtn: $('clearVariantBtn'),
  variantMessage: $('variantMessage'),
  variantList: $('variantList'),
  bulkVariantFiles: $('bulkVariantFiles'),
  bulkUploadVariantsBtn: $('bulkUploadVariantsBtn'),
  variantImportText: $('variantImportText'),
  importVariantsBtn: $('importVariantsBtn')
};

function setMessage(el, text = '', type = '') {
  el.textContent = text;
  el.className = `form-message ${type}`.trim();
}

function normalizeText(value) {
  return String(value || '').toLowerCase().trim();
}

function getCloudinaryConfig() {
  try {
    return {
      ...DEFAULT_CLOUDINARY_CONFIG,
      ...(JSON.parse(localStorage.getItem(CLOUDINARY_CONFIG_KEY)) || {})
    };
  } catch (_err) {
    return { ...DEFAULT_CLOUDINARY_CONFIG };
  }
}

function setCloudinaryConfig(config) {
  localStorage.setItem(CLOUDINARY_CONFIG_KEY, JSON.stringify(config));
}

function renderCloudinaryConfig() {
  const config = getCloudinaryConfig();
  els.cloudinaryCloudName.value = config.cloudName;
  els.cloudinaryUploadPreset.value = config.uploadPreset;
  els.cloudinaryFolder.value = config.folder;
}

function saveCloudinaryConfig() {
  const config = {
    cloudName: els.cloudinaryCloudName.value.trim() || DEFAULT_CLOUDINARY_CONFIG.cloudName,
    uploadPreset: els.cloudinaryUploadPreset.value.trim(),
    folder: els.cloudinaryFolder.value.trim()
  };

  setCloudinaryConfig(config);
  setMessage(els.productMessage, 'Đã lưu cấu hình Cloudinary.', 'success');
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
  state.variants = [];
  els.formTitle.textContent = 'Sản phẩm mới';
  els.productForm.reset();
  els.productId.value = '';
  els.productStatus.value = 'available';
  els.productSortOrder.value = '0';
  updateSubCategoryOptions();
  updateImagePreview();
  updateVariantPanel();
  resetVariantForm();
  setMessage(els.productMessage);
}

async function fillForm(product) {
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
  await updateVariantPanel();
  setMessage(els.productMessage);
  els.productName.focus();
}

function isEditingYarnProduct() {
  return Boolean(state.editingId) && els.productCategory.value === 'yarn';
}

function resetVariantForm() {
  els.variantForm.reset();
  els.variantId.value = '';
  els.variantStatus.value = 'available';
  els.variantSortOrder.value = '0';
  setMessage(els.variantMessage);
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

async function uploadSelectedImage() {
  const file = els.productImageFile.files?.[0];
  await uploadImageFile({
    file,
    targetInput: els.productImageUrl,
    button: els.uploadImageBtn,
    successMessage: 'Upload ảnh thành công. Link đã được điền vào image_url.',
    onSuccess: updateImagePreview
  });
}

async function uploadSelectedVariantImage() {
  const file = els.variantImageFile.files?.[0];
  await uploadImageFile({
    file,
    targetInput: els.variantImageUrl,
    button: els.uploadVariantImageBtn,
    successMessage: 'Upload ảnh biến thể thành công.',
    onSuccess: () => setMessage(els.variantMessage, 'Upload ảnh biến thể thành công.', 'success'),
    messageEl: els.variantMessage
  });
}

async function uploadImageFile({
  file,
  targetInput,
  button,
  successMessage,
  onSuccess,
  messageEl = els.productMessage
}) {
  const config = getCloudinaryConfig();

  if (!file) {
    setMessage(messageEl, 'Chọn một file ảnh trước khi upload.', 'error');
    return;
  }

  if (!config.cloudName || !config.uploadPreset) {
    setMessage(messageEl, 'Nhập Cloud name và unsigned upload preset trước.', 'error');
    return;
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', config.uploadPreset);
  if (config.folder) {
    formData.append('folder', config.folder);
  }

  button.disabled = true;
  button.textContent = 'Đang upload...';
  setMessage(messageEl, 'Đang upload ảnh lên Cloudinary...');

  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(config.cloudName)}/image/upload`, {
      method: 'POST',
      body: formData
    });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error?.message || 'Upload Cloudinary thất bại.');
    }

    targetInput.value = result.secure_url;
    if (targetInput === els.productImageUrl && !els.productFullImageUrl.value.trim()) {
      els.productFullImageUrl.value = '';
    }
    onSuccess?.();
    setMessage(messageEl, successMessage, 'success');
  } catch (err) {
    setMessage(messageEl, err.message, 'error');
  } finally {
    button.disabled = false;
    button.textContent = 'Upload';
  }
}

function renderVariants() {
  els.variantCount.textContent = `${state.variants.length} ảnh`;

  if (!state.variants.length) {
    els.variantList.innerHTML = '<p class="form-message">Chưa có ảnh riêng cho cuộn len này.</p>';
    return;
  }

  const productImage = els.productImageUrl.value.trim();
  els.variantList.innerHTML = state.variants.map((variant) => {
    const thumb = getOptimizedCloudinaryUrl(variant.image_url || productImage, 'thumb');
    const status = variant.status || 'available';
    const hiddenClass = status === 'hidden' ? ' is-hidden' : '';
    const toggleText = status === 'hidden' ? 'Hiện' : 'Ẩn';
    const toggleClass = status === 'hidden' ? '' : 'danger-btn';
    const meta = labels[status] || status;

    return `
      <article class="variant-row${hiddenClass}">
        <img class="variant-thumb" src="${escapeHtml(thumb)}" alt="${escapeHtml(variant.name || 'Ảnh cuộn len')}">
        <div class="variant-info">
          <strong>${escapeHtml(variant.name || 'Chưa đặt tên')}</strong>
          <span>${escapeHtml(meta)}</span>
        </div>
        <div class="row-actions">
          <button type="button" data-variant-action="edit" data-id="${variant.id}">Sửa</button>
          <button type="button" class="${toggleClass}" data-variant-action="toggle" data-id="${variant.id}">${toggleText}</button>
        </div>
      </article>
    `;
  }).join('');
}

async function loadVariants(productId) {
  const { data, error } = await supabaseClient
    .from('product_variants')
    .select(VARIANT_COLUMNS)
    .eq('product_id', productId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    state.variants = [];
    setMessage(els.variantMessage, error.message, 'error');
    renderVariants();
    return;
  }

  state.variants = data || [];
  renderVariants();
}

async function updateVariantPanel() {
  if (!isEditingYarnProduct()) {
    els.variantPanel.classList.add('hidden');
    state.variants = [];
    return;
  }

  els.variantPanel.classList.remove('hidden');
  els.variantProductName.textContent = els.productName.value.trim() || 'Cuộn len đang chọn';
  await loadVariants(state.editingId);
}

function getVariantPayload() {
  return {
    product_id: state.editingId,
    name: els.variantName.value.trim(),
    image_url: els.variantImageUrl.value.trim() || null,
    status: els.variantStatus.value,
    sort_order: Number(els.variantSortOrder.value || 0)
  };
}

function fillVariantForm(variant) {
  els.variantId.value = variant.id;
  els.variantName.value = variant.name || '';
  els.variantSortOrder.value = variant.sort_order ?? 0;
  els.variantStatus.value = variant.status || 'available';
  els.variantImageUrl.value = variant.image_url || '';
  setMessage(els.variantMessage);
  els.variantName.focus();
}

async function saveVariant(event) {
  event.preventDefault();
  if (!isEditingYarnProduct()) {
    setMessage(els.variantMessage, 'Lưu sản phẩm cuộn len trước khi thêm biến thể.', 'error');
    return;
  }

  const payload = getVariantPayload();
  if (!payload.name) {
    setMessage(els.variantMessage, 'Tên biến thể là bắt buộc.', 'error');
    return;
  }

  setMessage(els.variantMessage, 'Đang lưu biến thể...');
  const variantId = els.variantId.value;
  const request = variantId
    ? supabaseClient.from('product_variants').update(payload).eq('id', variantId)
    : supabaseClient.from('product_variants').insert(payload);

  const { error } = await request;
  if (error) {
    setMessage(els.variantMessage, error.message, 'error');
    return;
  }

  setMessage(els.variantMessage, 'Đã lưu biến thể.', 'success');
  resetVariantForm();
  await loadVariants(state.editingId);
}

function getNameFromFile(file) {
  return file.name
    .replace(/\.[^.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function bulkUploadVariantImages() {
  if (!isEditingYarnProduct()) {
    setMessage(els.variantMessage, 'Chọn và lưu một sản phẩm cuộn len trước.', 'error');
    return;
  }

  const files = Array.from(els.bulkVariantFiles.files || []);
  if (!files.length) {
    setMessage(els.variantMessage, 'Chọn nhiều ảnh trước khi upload.', 'error');
    return;
  }

  const config = getCloudinaryConfig();
  if (!config.cloudName || !config.uploadPreset) {
    setMessage(els.variantMessage, 'Nhập Cloud name và unsigned upload preset trước.', 'error');
    return;
  }

  els.bulkUploadVariantsBtn.disabled = true;
  els.bulkUploadVariantsBtn.textContent = 'Đang upload...';

  try {
    const uploadedVariants = [];
    for (const [index, file] of files.entries()) {
      setMessage(els.variantMessage, `Đang upload ${index + 1}/${files.length}: ${file.name}`);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', config.uploadPreset);
      if (config.folder) {
        formData.append('folder', `${config.folder}/variants`);
      }

      const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(config.cloudName)}/image/upload`, {
        method: 'POST',
        body: formData
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error?.message || `Upload thất bại: ${file.name}`);
      }

      uploadedVariants.push({
        product_id: state.editingId,
        name: getNameFromFile(file),
        image_url: result.secure_url,
        status: 'available',
        sort_order: state.variants.length + index + 1
      });
    }

    const { error } = await supabaseClient
      .from('product_variants')
      .insert(uploadedVariants);

    if (error) throw error;

    els.bulkVariantFiles.value = '';
    setMessage(els.variantMessage, `Đã upload và tạo ${uploadedVariants.length} ảnh.`, 'success');
    await loadVariants(state.editingId);
  } catch (err) {
    setMessage(els.variantMessage, err.message, 'error');
  } finally {
    els.bulkUploadVariantsBtn.disabled = false;
    els.bulkUploadVariantsBtn.textContent = 'Upload và tạo ảnh';
  }
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = '';
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      value += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === ',' && !inQuotes) {
      row.push(value);
      value = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') index += 1;
      row.push(value);
      if (row.some((cell) => cell.trim() !== '')) rows.push(row);
      row = [];
      value = '';
      continue;
    }

    value += char;
  }

  row.push(value);
  if (row.some((cell) => cell.trim() !== '')) rows.push(row);
  if (rows.length < 2) return [];

  const headers = rows[0].map((cell) => cell.trim());
  return rows.slice(1).map((cells) => headers.reduce((item, header, index) => {
    item[header] = (cells[index] || '').trim();
    return item;
  }, {}));
}

function parseVariantImportText(text) {
  const trimmed = text.trim().replace(/^\uFEFF/, '');
  if (!trimmed) return [];

  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed.data)) return parsed.data;
    if (Array.isArray(parsed.rows)) return parsed.rows;
    return [parsed];
  }

  return parseCsv(trimmed);
}

function getVariantImportPayloads(rows) {
  return rows.map((row, index) => {
    const colorCode = String(row.color_code || row.colorCode || row.code || row.name || '').trim();
    const imageUrl = String(row.image_url || row.imageUrl || row.full_image_url || row.fullImageUrl || '').trim();
    const fullImageUrl = String(row.full_image_url || row.fullImageUrl || imageUrl).trim();
    const sourceImageUrl = String(row.source_full_image_url || row.sourceFullImageUrl || row.source_image_url || row.sourceImageUrl || '').trim();
    const sortOrder = row.sort_order ?? row.sortOrder ?? index + 1;

    return {
      product_id: state.editingId,
      name: colorCode || `Màu ${index + 1}`,
      color_code: colorCode || null,
      image_url: imageUrl || null,
      full_image_url: fullImageUrl || imageUrl || null,
      source_image_url: sourceImageUrl || null,
      status: String(row.status || 'available').trim() || 'available',
      sort_order: Number(sortOrder || index + 1)
    };
  }).filter((item) => item.name && item.image_url);
}

function isHttpUrl(value) {
  return /^https?:\/\//i.test(String(value || ''));
}

async function uploadRemoteImageUrl(sourceUrl, name) {
  const config = getCloudinaryConfig();
  if (!config.cloudName || !config.uploadPreset) {
    throw new Error('Nhập Cloud name và unsigned upload preset trước khi import ảnh từ tool.');
  }

  const formData = new FormData();
  formData.append('file', sourceUrl);
  formData.append('upload_preset', config.uploadPreset);
  if (config.folder) {
    formData.append('folder', `${config.folder}/variants`);
  }
  formData.append('public_id', getNameFromFile({ name }));

  const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(config.cloudName)}/image/upload`, {
    method: 'POST',
    body: formData
  });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error?.message || `Upload Cloudinary thất bại: ${name}`);
  }

  return result.secure_url;
}

async function prepareImportedVariantPayloads(payloads) {
  const prepared = [];

  for (const [index, payload] of payloads.entries()) {
    const imageUrl = payload.image_url || '';
    const sourceUrl = payload.source_image_url || '';
    const shouldUploadSource = sourceUrl && !isHttpUrl(imageUrl);

    if (!isHttpUrl(imageUrl) && !sourceUrl) {
      throw new Error('JSON đang dùng đường dẫn local nên admin không mở được ảnh. Hãy dùng nút Copy JSON Admin trong tool rồi import lại.');
    }

    if (shouldUploadSource) {
      setMessage(els.variantMessage, `Đang upload ${index + 1}/${payloads.length}: ${payload.name}`);
      const uploadedUrl = await uploadRemoteImageUrl(sourceUrl, `${payload.name}-${payload.sort_order}`);
      prepared.push({
        ...payload,
        image_url: uploadedUrl,
        full_image_url: uploadedUrl
      });
      continue;
    }

    prepared.push(payload);
  }

  return prepared.map(({ source_image_url: _sourceImageUrl, ...payload }) => payload);
}

async function insertVariantPayloads(payloads) {
  const inserts = [];

  for (const payload of payloads) {
    const existing = state.variants.find((variant) => normalizeText(variant.name) === normalizeText(payload.name));
    if (!existing) {
      inserts.push(payload);
      continue;
    }

    const { product_id: _productId, ...updatePayload } = payload;
    const { error } = await supabaseClient
      .from('product_variants')
      .update(updatePayload)
      .eq('id', existing.id);

    if (!error) continue;

    const fallbackPayload = {
      name: payload.name,
      image_url: payload.image_url,
      status: payload.status,
      sort_order: payload.sort_order
    };
    const fallback = await supabaseClient
      .from('product_variants')
      .update(fallbackPayload)
      .eq('id', existing.id);

    if (fallback.error) throw error;
  }

  if (!inserts.length) return;

  const { error } = await supabaseClient
    .from('product_variants')
    .insert(inserts);

  if (!error) return;

  const fallbackPayloads = inserts.map((item) => ({
    product_id: item.product_id,
    name: item.name,
    image_url: item.image_url,
    status: item.status,
    sort_order: item.sort_order
  }));
  const fallback = await supabaseClient
    .from('product_variants')
    .insert(fallbackPayloads);

  if (fallback.error) throw error;
}

async function importVariantRows() {
  if (!isEditingYarnProduct()) {
    setMessage(els.variantMessage, 'Chọn và lưu một sản phẩm cuộn len trước khi import.', 'error');
    return;
  }

  const text = els.variantImportText.value.trim();
  if (!text) {
    setMessage(els.variantMessage, 'Dán JSON hoặc CSV từ tool lấy ảnh trước.', 'error');
    return;
  }

  els.importVariantsBtn.disabled = true;
  els.importVariantsBtn.textContent = 'Đang import...';

  try {
    const rows = parseVariantImportText(text);
    const payloads = await prepareImportedVariantPayloads(getVariantImportPayloads(rows));
    if (!payloads.length) {
      throw new Error('Không tìm thấy dòng nào có mã màu và image_url.');
    }

    setMessage(els.variantMessage, `Đang import ${payloads.length} ảnh màu...`);
    await insertVariantPayloads(payloads);
    els.variantImportText.value = '';
    setMessage(els.variantMessage, `Đã import ${payloads.length} ảnh màu.`, 'success');
    await loadVariants(state.editingId);
  } catch (err) {
    setMessage(els.variantMessage, err.message || 'Import thất bại.', 'error');
  } finally {
    els.importVariantsBtn.disabled = false;
    els.importVariantsBtn.textContent = 'Import ảnh màu';
  }
}

async function toggleVariantVisibility(id) {
  const variant = state.variants.find((item) => String(item.id) === String(id));
  if (!variant) return;

  const nextStatus = variant.status === 'hidden' ? 'available' : 'hidden';
  const { error } = await supabaseClient
    .from('product_variants')
    .update({ status: nextStatus })
    .eq('id', variant.id);

  if (error) {
    setMessage(els.variantMessage, error.message, 'error');
    return;
  }

  await loadVariants(state.editingId);
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
  const wasEditing = Boolean(state.editingId);
  const payload = getFormPayload();
  if (!payload.name || !payload.image_url) {
    setMessage(els.productMessage, 'Tên sản phẩm và link ảnh là bắt buộc.', 'error');
    return;
  }

  setMessage(els.productMessage, 'Đang lưu...');
  const request = wasEditing
    ? supabaseClient.from('products').update(payload).eq('id', state.editingId)
    : supabaseClient.from('products').insert(payload).select(PRODUCT_COLUMNS).single();

  const { data, error } = await request;
  if (error) {
    setMessage(els.productMessage, error.message, 'error');
    return;
  }

  setMessage(els.productMessage, 'Đã lưu sản phẩm.', 'success');
  await loadProducts();
  if (!wasEditing && data?.id) {
    const createdProduct = state.products.find((item) => String(item.id) === String(data.id)) || data;
    await fillForm(createdProduct);
  } else {
    resetForm();
  }
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
  els.saveCloudinaryConfigBtn.addEventListener('click', saveCloudinaryConfig);
  els.newProductBtn.addEventListener('click', resetForm);
  els.clearFormBtn.addEventListener('click', resetForm);
  els.productForm.addEventListener('submit', saveProduct);
  els.productCategory.addEventListener('change', () => {
    updateSubCategoryOptions();
    updateVariantPanel();
  });
  els.productImageUrl.addEventListener('input', updateImagePreview);
  els.productName.addEventListener('input', () => {
    if (isEditingYarnProduct()) {
      els.variantProductName.textContent = els.productName.value.trim() || 'Cuộn len đang chọn';
    }
  });
  els.uploadImageBtn.addEventListener('click', uploadSelectedImage);
  els.productImageFile.addEventListener('change', uploadSelectedImage);
  els.uploadVariantImageBtn.addEventListener('click', uploadSelectedVariantImage);
  els.variantImageFile.addEventListener('change', uploadSelectedVariantImage);
  els.variantForm.addEventListener('submit', saveVariant);
  els.clearVariantBtn.addEventListener('click', resetVariantForm);
  els.bulkUploadVariantsBtn.addEventListener('click', bulkUploadVariantImages);
  els.importVariantsBtn.addEventListener('click', importVariantRows);
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

  els.variantList.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-variant-action]');
    if (!button) return;

    const variant = state.variants.find((item) => String(item.id) === String(button.dataset.id));
    if (!variant) return;

    if (button.dataset.variantAction === 'edit') {
      fillVariantForm(variant);
    }

    if (button.dataset.variantAction === 'toggle') {
      toggleVariantVisibility(variant.id);
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
  state.variants = [];
  renderProducts();
  updateVariantPanel();
}

async function init() {
  bindEvents();
  renderCloudinaryConfig();
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

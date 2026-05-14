import { SUPABASE_KEY, SUPABASE_SCRIPT_URL, SUPABASE_URL } from './config.js';

let supabaseClient = null;
let supabaseLoadingPromise = null;

function loadExternalScript(src) {
  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector(`script[src="${src}"]`);
    if (existingScript) {
      existingScript.addEventListener('load', resolve, { once: true });
      existingScript.addEventListener('error', reject, { once: true });
      if (window.supabase) resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export async function ensureSupabaseClient() {
  if (supabaseClient) return supabaseClient;
  if (!supabaseLoadingPromise) {
    supabaseLoadingPromise = loadExternalScript(SUPABASE_SCRIPT_URL)
      .then(() => {
        supabaseClient = window.supabase
          ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)
          : null;
        return supabaseClient;
      })
      .catch((err) => {
        console.warn('Chưa tải được Supabase SDK:', err.message);
        return null;
      });
  }
  return supabaseLoadingPromise;
}

export async function checkSupabaseConnection() {
  const client = await ensureSupabaseClient();
  if (!client) return;

  try {
    const { data, error } = await client.from('products').select('id,name,category').limit(1);
    if (error) {
      console.log('Chưa tìm thấy bảng "products" trên Supabase. Bạn hãy tạo bảng nhé!');
    } else {
      console.log('🎉 Kết nối Supabase thành công! Dữ liệu mẫu:', data);
    }
  } catch (err) {
    console.error('Lỗi kết nối Supabase:', err.message);
  }
}

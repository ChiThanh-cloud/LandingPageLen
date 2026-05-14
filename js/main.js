import { initAdTracking } from './analytics.js';
import { initPolicyModal } from './policy-modal.js';
import { initProductModal } from './products.js';
import { checkSupabaseConnection } from './supabase-client.js';
import { initPageUi } from './ui.js';

initAdTracking();
initPageUi();
initProductModal();
initPolicyModal();

if (location.hostname === 'localhost' || location.hostname.startsWith('192.168.')) {
  checkSupabaseConnection();
}

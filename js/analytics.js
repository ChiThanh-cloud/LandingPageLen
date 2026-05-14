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

export function trackAdEvent(trackKey, params = {}) {
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

export function initAdTracking() {
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-track]');
    if (!el) return;

    trackAdEvent(el.dataset.track, {
      label: el.textContent.trim().replace(/\s+/g, ' '),
      href: el.getAttribute('href') || '',
      category: el.dataset.category || '',
      product: el.dataset.product || ''
    });
  });
}

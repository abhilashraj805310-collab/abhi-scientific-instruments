/* ASI privacy-conscious visitor and inquiry tracking. Uses the site's public Supabase publishable key with RLS. */
(function () {
  if (window.__asiTrackingStarted) return;
  window.__asiTrackingStarted = true;
  const SUPABASE_URL = 'https://lkeemgjfnmgymuvklyhs.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_85UNumHMaiXEu0gRHYHcwA_s33DF1hB';
  const params = new URLSearchParams(location.search);
  const refHost = (() => { try { return document.referrer ? new URL(document.referrer).hostname : null; } catch (_) { return null; } })();
  const source = String(params.get('utm_source') || params.get('source') || refHost || 'Direct').slice(0, 120);
  let sessionId = sessionStorage.getItem('asi_visitor_session');
  if (!sessionId) { sessionId = (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(36).slice(2)); sessionStorage.setItem('asi_visitor_session', sessionId); }
  const safeParams = new URLSearchParams();
  ['product', 'utm_source', 'utm_medium', 'utm_campaign'].forEach(key => {
    const value = params.get(key);
    if (value) safeParams.set(key, value.slice(0, 120));
  });
  const path = location.pathname + (safeParams.toString() ? '?' + safeParams.toString() : '');
  const product = params.get('product') || (location.pathname.includes('product') ? document.querySelector('h1')?.textContent?.trim() : null);
  import('https://esm.sh/@supabase/supabase-js@2').then(({ createClient }) => {
    const db = createClient(SUPABASE_URL, SUPABASE_KEY);
    const track = async (eventName, extra = {}) => {
      try {
        await db.from('visitor_events').insert({
          event_name: eventName, page_path: path, page_title: document.title,
          product_name: extra.product_name || product || null,
          source: String(source).slice(0, 240), session_id: sessionId,
          referrer_host: refHost, metadata: extra.metadata || {}
        });
      } catch (_) {}
    };
    track('page_view');
    if (product) track('product_view', { product_name: product });
    document.addEventListener('click', event => {
      const a = event.target.closest('a');
      if (!a) return;
      const href = a.href || '';
      if (/wa\.me|api\.whatsapp\.com|whatsapp\.com/i.test(href)) {
        track('whatsapp_click', { product_name: product, metadata: { destination: 'whatsapp' } });
      } else if (href.startsWith('tel:')) track('phone_click');
      else if (href.startsWith('mailto:')) track('email_click');
    });
    const form = document.querySelector('#asi-inquiry-form');
    if (form) form.addEventListener('submit', async event => {
      event.preventDefault();
      const button = form.querySelector('button[type="submit"],button:not([type])');
      if (button) { button.disabled = true; button.dataset.originalText = button.textContent; button.textContent = 'Submitting…'; }
      const fd = new FormData(form);
      const name = String(fd.get('name') || '').trim();
      const email = String(fd.get('email') || '').trim();
      const requirement = String(fd.get('requirement') || '').trim();
      const phone = String(fd.get('phone') || '').trim();
      const company = String(fd.get('company') || '').trim();
      const productName = params.get('product') || '';
      const { error } = await db.from('leads').insert({
        name, email: email || null, phone: phone || null, company: company || null,
        product: productName || null, requirement, source: 'website_form', status: 'New'
      });
      if (error) {
        alert('Inquiry save nahi ho payi. Please WhatsApp ya email se contact karein. (' + error.message + ')');
        if (button) { button.disabled = false; button.textContent = button.dataset.originalText || 'Send Requirement'; }
        return;
      }
      track('inquiry_form_submit', { product_name: productName || null });
      form.reset();
      alert('Thank you! Your inquiry has been submitted successfully. Our team will contact you.');
      if (button) { button.disabled = false; button.textContent = button.dataset.originalText || 'Send Requirement'; }
    });
  }).catch(() => {});
})();
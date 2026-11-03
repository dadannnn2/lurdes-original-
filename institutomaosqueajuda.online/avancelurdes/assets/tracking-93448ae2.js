(function () {
  'use strict';
  const keys = ['src','sck','utm_source','utm_medium','utm_campaign','utm_content','utm_term','utm_id','keyword','device','network','fbclid','gclid'];
  function sourceWithLead(source) {
    const storageKey = source === 'FB' ? 'lead' : source === 'google' ? 'lead-google' : null;
    if (!storageKey) return source;
    try {
      const id = JSON.parse(window.localStorage.getItem(storageKey) || 'null')?._id;
      if ((typeof id === 'string' || typeof id === 'number') && String(id).trim()) return source + 'jLj' + String(id);
    } catch (_) {}
    return source;
  }
  window.getUtmParameters = function () {
    const key = 'olhar_tracking:' + window.location.pathname.replace(/\/(?:index\.html?)?$/, '');
    let stored = {};
    for (const name of ['localStorage', 'sessionStorage']) {
      try { Object.assign(stored, JSON.parse(window[name].getItem(key) || '{}')); } catch (_) {}
    }
    const query = new URLSearchParams(window.location.search);
    const tracking = {};
    for (const name of keys) {
      const value = query.get(name) || stored[name];
      if (typeof value === 'string' && value.trim()) tracking[name] = value;
    }
    const originalSource = tracking.utm_source;
    tracking.utm_source = sourceWithLead(originalSource);
    if (!tracking.utm_source) delete tracking.utm_source;
    for (const name of ['localStorage', 'sessionStorage']) {
      try {
        if (originalSource === 'FB' || originalSource === 'google') window[name].setItem(key + ':utm_source_original', originalSource);
        window[name].setItem(key, JSON.stringify(tracking));
      } catch (_) {}
    }
    return tracking;
  };
  window.getUtmParameters();
  function applyUtmIfNeeded() {
    const current = new URLSearchParams(window.location.search).get('utm_source');
    const desired = sourceWithLead(current);
    if (desired === current) return false;
    const url = new URL(window.location.href);
    url.searchParams.set('utm_source', desired);
    window.getUtmParameters();
    window.location.replace(url.toString());
    return true;
  }
  const current = new URLSearchParams(window.location.search).get('utm_source');
  if ((current === 'FB' || current === 'google') && !applyUtmIfNeeded()) {
    const interval = setInterval(() => { if (applyUtmIfNeeded()) clearInterval(interval); }, 500);
  }
})();

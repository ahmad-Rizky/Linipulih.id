(function (app) {
'use strict';
const { siteConfig } = app;
// Disabled by default. No cookies, storage, network requests, or free-text data.
// Integrators can listen to linipulih:track after enabling and reviewing consent.
function track(name, details = {}) {
  if (!siteConfig.tracking.enabled) return;
  window.dispatchEvent(new CustomEvent('linipulih:track', {
    detail: { event: name, page: location.pathname, ...details }
  }));
}
function initTracking() {
  document.querySelectorAll('[data-track]').forEach(el => el.addEventListener('click', () => track(el.dataset.track)));
}

Object.assign(app, { track, initTracking });
})(window.Linipulih);

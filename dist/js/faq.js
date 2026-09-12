(function (app) {
'use strict';
const { track } = app;
// Native details/summary preserve keyboard support and work without JavaScript.
function initFaq() {
  document.querySelectorAll('[data-faq]').forEach((item, index) => {
    item.addEventListener('toggle', () => {
      if (item.open) track('faq_open', { item: index + 1 });
    });
  });
}

Object.assign(app, { initFaq });
})(window.Linipulih);

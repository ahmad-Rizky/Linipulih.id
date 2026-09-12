(function (app) {
'use strict';
const {initConfig,initNavigation,initFaq,initActions,initAudio,initMotion,initTracking} = app;
initConfig();
initNavigation();
initFaq();
initActions();
initAudio();
initMotion();
initTracking();

// Keep clean folder URLs on HTTP hosts; file previews need explicit index.html.
if (location.protocol !== 'file:') {
  document.querySelectorAll('a[href]').forEach(link => {
    const url = new URL(link.href);
    if (url.origin === location.origin && url.pathname.endsWith('/index.html')) {
      url.pathname = url.pathname.slice(0, -10);
      link.href = url.href;
    }
  });
}
})(window.Linipulih);

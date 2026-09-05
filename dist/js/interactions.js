import { siteConfig } from './config.js';
import { track } from './tracking.js';
const money = value => 'Rp' + Number(value).toLocaleString('id-ID');
const getValue = key => key.split('.').reduce((value, part) => value?.[part], siteConfig);
export function publicUrl(value, allowLocal = false) {
  if (!value) return null;
  try {
    const url = new URL(value, location.origin);
    return url.protocol === 'https:' || (allowLocal && url.origin === location.origin && url.protocol === 'http:') ? url.href : null;
  } catch { return null; }
}
export function initConfig() {
  document.querySelectorAll('[data-config]').forEach(el => {
    const value = getValue(el.dataset.config);
    if (value != null) el.textContent = value;
  });
  const price = siteConfig.lepas.promoActive ? siteConfig.lepas.promoPrice : siteConfig.lepas.price;
  document.querySelectorAll('[data-price]').forEach(el => { el.textContent = money(price); });
  document.querySelectorAll('[data-price-original]').forEach(el => {
    el.hidden = !siteConfig.lepas.promoActive; el.textContent = money(siteConfig.lepas.price);
  });
  document.querySelectorAll('[data-base-price]').forEach(el => { el.textContent = money(siteConfig.lepas.price); });
  document.querySelectorAll('[data-checkout-status]').forEach(el => {
    el.textContent = publicUrl(siteConfig.lepas.checkoutUrl) ? 'Pembayaran dilakukan melalui checkout resmi.' : 'Pembayaran belum dibuka. Checkout resmi sedang disiapkan.';
  });
  document.querySelectorAll('[data-social]').forEach(el => {
    const href = publicUrl(siteConfig.brand[el.dataset.social]);
    if (href) el.href = href; else el.hidden = true;
  });
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(siteConfig.brand.supportEmail)) {
    document.querySelectorAll('[data-support-email]').forEach(el => {
      el.href = 'mailto:' + siteConfig.brand.supportEmail; el.textContent = siteConfig.brand.supportEmail; el.hidden = false;
    });
    document.querySelectorAll('[data-support-pending]').forEach(el => { el.hidden = true; });
  }
}
export function initActions() {
  const dialog = document.querySelector('#action-dialog');
  let trigger;
  function explain(el, title, message) {
    trigger = el;
    dialog.querySelector('#dialog-title').textContent = title;
    dialog.querySelector('#dialog-message').textContent = message;
    dialog.showModal();
  }
  dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', e => { if (e.target === dialog) { const r=dialog.getBoundingClientRect(); if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom) dialog.close(); } });
  dialog.addEventListener('close', () => trigger?.focus());
  document.querySelectorAll('[data-checkout]').forEach(el => {
    const url = publicUrl(siteConfig.lepas.checkoutUrl);
    if (url) el.href = url;
    else el.addEventListener('click', e => {
      e.preventDefault(); explain(el, 'Pembayaran belum dibuka', 'Checkout resmi sedang disiapkan. Belum ada pembayaran yang diproses dari halaman ini. Kamu bisa mengenali isi LEPAS terlebih dahulu atau menghubungi kanal dukungan.');
    });
  });
  document.querySelectorAll('[data-member-area]').forEach(el => {
    const url = publicUrl(siteConfig.lepas.memberAreaUrl);
    if (url) el.href = url;
    else el.addEventListener('click', e => {
      e.preventDefault(); explain(el, 'Akses melalui pembelian resmi', 'Ikuti tautan akses yang diberikan setelah pembayaran dikonfirmasi. Halaman ini tidak memverifikasi transaksi atau membagikan undangan privat. Jika tautan belum diterima, hubungi dukungan.');
    });
  });
}
export function initAudio() {
  const button = document.querySelector('[data-audio-toggle]');
  const audio = document.querySelector('#sample-audio');
  if (!button || !audio) return;
  const status = document.querySelector('#sample-status');
  const url = publicUrl(siteConfig.lepas.sampleUrl, true);
  const reset = () => { button.textContent = '▶'; button.setAttribute('aria-label','Putar cuplikan LEPAS'); button.setAttribute('aria-pressed','false'); };
  if (url) {
    audio.src = url; audio.hidden = false;
    status.textContent = 'Dengarkan cuplikan untuk mengenali cara LEPAS menemani.';
    const transcript = document.querySelector('[data-sample-transcript]');
    transcript.textContent = siteConfig.lepas.sampleTranscript || 'Transkrip cuplikan belum tersedia.';
  }
  button.addEventListener('click', async () => {
    if (!url) { status.textContent = 'Cuplikan audio sedang disiapkan. Kamu bisa membaca daftar 14 episode di bawah.'; track('sample_unavailable'); return; }
    try { if (audio.paused) await audio.play(); else audio.pause(); }
    catch { status.textContent = 'Audio belum bisa diputar. Coba lagi atau hubungi dukungan.'; reset(); }
  });
  audio.addEventListener('play', () => { button.textContent='Ⅱ';button.setAttribute('aria-label','Jeda cuplikan LEPAS');button.setAttribute('aria-pressed','true');track('sample_play'); });
  audio.addEventListener('pause', reset); audio.addEventListener('ended', reset);
  audio.addEventListener('error', () => { status.textContent='Cuplikan gagal dimuat. Coba lagi nanti.'; reset(); });
}
export function initMotion() {
  if (!('IntersectionObserver' in window)) return;
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.remove('is-pending'); observer.unobserve(entry.target); }
    }), { threshold: .08 });
    document.querySelectorAll('.three-steps article,.article-card,.phase').forEach(el => { el.classList.add('reveal','is-pending'); observer.observe(el); });
  }
  const sticky = document.querySelector('.sticky-cta');
  if (!sticky) return;
  const hero = document.querySelector('.product-hero');
  const offer = document.querySelector('#penawaran');
  const footer = document.querySelector('.site-footer');
  const visible = new Map([[hero,true],[offer,false],[footer,false]]);
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => visible.set(entry.target,entry.isIntersecting));
    sticky.hidden = visible.get(hero) || visible.get(offer) || visible.get(footer);
  });
  [hero,offer,footer].forEach(el => observer.observe(el));
}

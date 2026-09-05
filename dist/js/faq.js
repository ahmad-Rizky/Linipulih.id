// Native details/summary preserve keyboard support and work without JavaScript.
import { track } from './tracking.js';
export function initFaq() {
  document.querySelectorAll('[data-faq]').forEach((item, index) => {
    item.addEventListener('toggle', () => {
      if (item.open) track('faq_open', { item: index + 1 });
    });
  });
}

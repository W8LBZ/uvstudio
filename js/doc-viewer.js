// Opens the project documents (README, LICENSE, NOTICE) in a modal instead of a raw
// file tab. Markdown goes through the vendored marked; anything else shows as plain text.
// Relative links inside a rendered document open in the same viewer.
// On file:// fetch is blocked, so links keep their normal new-tab behavior there.
(function () {
  'use strict';
  const modal = document.getElementById('docModal');
  if (!modal || location.protocol === 'file:') return;
  const title = document.getElementById('docModalTitle');
  const body = document.getElementById('docModalBody');
  const close = document.getElementById('docModalClose');

  function hide() {
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
  }

  async function show(href, label) {
    title.textContent = label;
    body.textContent = '';
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(() => close.focus());
    try {
      const res = await fetch(href);
      if (!res.ok) throw new Error(res.status);
      const text = await res.text();
      if (/\.md$/i.test(href)) {
        // First-party files from this origin only, so marked's unsanitized HTML is acceptable.
        body.innerHTML = window.marked.parse(text);
      } else {
        const pre = document.createElement('pre');
        pre.textContent = text;
        body.append(pre);
      }
      body.scrollTop = 0;
    } catch {
      hide();
      window.open(href, '_blank', 'noopener');
    }
  }

  document.addEventListener('click', (e) => {
    const a = e.target.closest('.about-links a, #docModalBody a');
    if (!a) return;
    const href = a.getAttribute('href');
    if (/^[a-z]+:|^\/\/|^#/i.test(href)) {
      if (!href.startsWith('#')) a.target = '_blank';
      return;
    }
    e.preventDefault();
    show(href, a.textContent.trim() || href);
  });
  close.addEventListener('click', hide);
  modal.addEventListener('click', (e) => { if (e.target === modal) hide(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('show')) hide();
  });
})();

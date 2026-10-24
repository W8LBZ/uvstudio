// In-page viewer for the project documents (README, LICENSE, NOTICE) and the field help
// pages in docs/help/<lang>/<topic>.md. Markdown goes through the vendored marked;
// anything else shows as plain text. Relative links inside a document open in the viewer.
// Help triggers are the labels themselves (data-help="<topic>"), not extra icons.
// On file:// fetch is blocked, so document links keep their new-tab behavior and help is off.
(function () {
  'use strict';
  const modal = document.getElementById('docModal');
  if (!modal || location.protocol === 'file:') return;
  const title = document.getElementById('docModalTitle');
  const body = document.getElementById('docModalBody');
  const close = document.getElementById('docModalClose');
  let current = location.href;

  for (const el of document.querySelectorAll('[data-help]')) {
    el.classList.add('has-help');
    el.tabIndex = 0;
    el.setAttribute('role', 'button');
  }

  function hide() {
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
  }

  async function load(urls) {
    for (const url of urls) {
      const res = await fetch(url);
      if (res.ok) return { url: res.url || url, text: await res.text() };
    }
    throw new Error('not found');
  }

  async function show(urls, label) {
    title.textContent = label;
    body.textContent = '';
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(() => close.focus());
    try {
      const { url, text } = await load(urls);
      current = url;
      if (/\.md$/i.test(new URL(url).pathname)) {
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
      window.open(urls[0], '_blank', 'noopener');
    }
  }

  function showHelp(el) {
    const topic = el.dataset.help;
    const lang = document.documentElement.lang || 'en';
    const urls = [...new Set([lang, 'en'])].map(l => new URL(`docs/help/${l}/${topic}.md`, location.href).href);
    show(urls, el.textContent.trim());
  }

  document.addEventListener('click', (e) => {
    const help = e.target.closest('[data-help]');
    if (help) { showHelp(help); return; }
    const a = e.target.closest('.about-links a, #docModalBody a');
    if (!a) return;
    const href = a.getAttribute('href');
    if (/^[a-z]+:|^\/\/|^#/i.test(href)) {
      if (!href.startsWith('#')) a.target = '_blank';
      return;
    }
    e.preventDefault();
    const base = a.closest('#docModalBody') ? current : location.href;
    show([new URL(href, base).href], a.textContent.trim() || href);
  });
  document.addEventListener('keydown', (e) => {
    const help = e.target.closest && e.target.closest('[data-help]');
    if (help && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); showHelp(help); }
    if (e.key === 'Escape' && modal.classList.contains('show')) hide();
  });
  close.addEventListener('click', hide);
  modal.addEventListener('click', (e) => { if (e.target === modal) hide(); });
})();

// W8LBZ fork: one-time acknowledgement before the first write to a radio. flash.js asks
// window.uvStudioLicenseAck() at the start of every critical (writing) operation; until
// the user agrees, the modal opens and the operation doesn't start. Agreeing is remembered
// and re-presses the button that triggered the write. Reading and browsing are never gated.
(function () {
  'use strict';
  const KEY = 'licenseAck';
  const prefs = window.UVStudioPreferences;
  const modal = document.getElementById('licenseAckModal');
  let pending = null;
  let lastButton = null;
  // Capture phase runs before the button's own handler, so this is the button that started the write.
  document.addEventListener('click', (e) => { lastButton = e.target.closest && e.target.closest('button'); }, true);

  function hide() {
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
  }

  window.uvStudioLicenseAck = () => {
    if (!modal || prefs.get(KEY, '') === '1') return true;
    pending = lastButton;
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(() => document.getElementById('licenseAckLater').focus());
    return false;
  };

  if (!modal) return;
  document.getElementById('licenseAckAgree').addEventListener('click', () => {
    prefs.set(KEY, '1');
    hide();
    const button = pending;
    pending = null;
    if (button && button.isConnected && !button.disabled) button.click();
  });
  for (const id of ['licenseAckLater', 'licenseAckClose']) document.getElementById(id).addEventListener('click', hide);
  modal.addEventListener('click', (e) => { if (e.target === modal) hide(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('show')) hide();
  });
})();

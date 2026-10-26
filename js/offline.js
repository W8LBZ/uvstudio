// Registers the offline copy (sw.js). When a newer version is online after an offline start, or
// after a load that fell back to the copy (checked at load, on 'online' and on returning to the
// app), offers to reload into it instead of switching under the user (a radio write may be
// running; unsaved edits keep their own beforeunload guard).
(function () {
  if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
  navigator.serviceWorker.register('sw.js').catch(() => {});

  let asked = false;
  async function checkForUpdate() {
    if (asked || !navigator.onLine) return;
    try {
      const text = await (await fetch('js/studio-version.js', { cache: 'no-store' })).text();
      const latest = /UVSTUDIO_VERSION = "([^"]+)"/.exec(text)?.[1];
      if (!latest || latest === window.UVSTUDIO_VERSION) return;
      asked = true;
      if (window.confirm(window.uvStudioI18n.t('plus_update_ready', latest))) location.reload();
    } catch { /* still offline */ }
  }
  window.addEventListener('online', checkForUpdate);
  // 'online' only fires when the connection itself drops and returns; a Wi-Fi whose internet
  // comes back stays "online" throughout, so also check when the app returns to the foreground.
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') checkForUpdate(); });
  window.addEventListener('load', checkForUpdate);
})();

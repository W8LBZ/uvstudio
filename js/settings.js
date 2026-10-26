// Radio settings for F4HWN UV-K1 / UV-K5 V3 builds: the 0xA000-0xA177 area of the
// EEPROM compatibility map. Field layout, ranges and labels follow the firmware
// (App/settings.c load/save, App/ui/menu.c labels, App/app/menu_settings.def limits).
// Labels are the radio's own menu names and option strings.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.UVSTUDIO_SETTINGS = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const BASE = 0xA000;
  const SIZE = 0x178;
  const CHANNEL_NONE = 1024;   // MR_CHANNELS_MAX: "None" for priority channels

  const ON_OFF = ['OFF', 'ON'];
  const ACTIONS = ['NONE', 'FLASHLIGHT', 'POWER', 'MONITOR', 'SCAN', 'VOX', 'FM RADIO', '1750Hz',
    'LOCK KEYPAD', 'VFO A/B', 'VFO/MEM', 'MODE', 'RX MODE', 'MAIN ONLY', 'PTT', 'WIDE/NARROW',
    'MUTE', 'RxA', 'RF LOG', 'BEAM', 'POWER HIGH', 'REMOVE OFFSET', 'FOX HUNT', 'BEACON', 'TONE CALL'];
  const MIC_DB2 = [3, 8, 16, 24, 32, 40, 48, 56, 63];   // gMicGain_dB2

  const two = n => String(n).padStart(2, '0');
  const mmss = seconds => `${two(Math.floor(seconds / 60))}m:${two(seconds % 60)}s`;
  const list = labels => labels.map((label, value) => [value, label]);
  const range = (min, max, format = String) => {
    const pairs = [];
    for (let v = min; v <= max; v++) pairs.push([v, format(v)]);
    return pairs;
  };
  const offOr = format => v => (v === 0 ? 'OFF' : format(v));

  // Bitfield at addr: value = (byte >> shift) & mask. Composite fields supply get/set.
  const field = (id, group, addr, values, shift = 0, bits = 8) => ({ id, group, addr, shift, bits, values });

  function rxModeGet(img) {
    const dual = img[0x00C];
    const cross = img[0x00A];
    if (dual === 3) return cross === 0 ? 4 : 5;
    return (dual !== 0 ? 1 : 0) + (cross !== 0 ? 2 : 0);
  }

  function rxModeSet(img, mode) {   // ACTION_SetRxMode
    const selected = (img[0x0C3] < 2 ? img[0x0C3] : 0) + 1;   // TX_VFO + 1
    img[0x00C] = mode >= 4 ? 3 : selected * (mode & 1);
    img[0x00A] = (mode >= 4 ? mode === 5 : (mode & 2) !== 0) ? selected : 0;
  }

  // SCAN_LIST_MIX_MASK at 0xA170: 24-bit list mask (bit n-1 = list n), valid only with the
  // "MIX",1 marker in bytes 3..6; otherwise (or mask 0) the firmware mixes all lists.
  const MIX_ALL = 0xFFFFFF;
  function mixGet(img) {
    const valid = img[0x173] === 0x4D && img[0x174] === 0x49 && img[0x175] === 0x58 && img[0x176] === 1;
    const mask = img[0x170] | (img[0x171] << 8) | (img[0x172] << 16);
    return valid && mask ? mask : MIX_ALL;
  }
  function mixSet(img, mask) {
    img.set([mask & 0xFF, (mask >> 8) & 0xFF, mask >> 16, 0x4D, 0x49, 0x58, 1], 0x170);
  }

  // VFO A/B indices at 0xA010: u16 per side (shown channel, last memory, last band VFO).
  // 0-1023 memory channels, 1024-1030 band VFOs. Setting the shown channel also sets the
  // matching "last" entry, as CHIRP does; an empty memory makes the radio step to the next one.
  const BAND_MHZ = [18, 108, 137, 174, 350, 400, 470, 1300];
  const SCREEN_VALUES = [
    ...BAND_MHZ.slice(0, 7).map((lo, b) => [CHANNEL_NONE + b, `VFO ${lo}-${BAND_MHZ[b + 1]} MHz`]),
    ...range(0, CHANNEL_NONE - 1, v => `CH ${v + 1}`)
  ];
  const u16 = (img, at) => img[at] | (img[at + 1] << 8);
  const putU16 = (img, at, v) => { img[at] = v & 0xFF; img[at + 1] = v >> 8; };
  const vfoChannel = (id, at) => ({
    id, group: 'radio', values: SCREEN_VALUES,
    get: img => u16(img, at),
    set: (img, v) => { putU16(img, at, v); putU16(img, at + (v < CHANNEL_NONE ? 2 : 4), v); }
  });

  // TX_VFO at 0xA0C3. Like COMMON_SwitchVFOs, dual watch and cross band follow the new side.
  function mainVfoSet(img, v) {
    img[0x0C3] = v;
    if (img[0x00A]) img[0x00A] = v + 1;
    if (img[0x00C] && img[0x00C] !== 3) img[0x00C] = v + 1;
  }

  // FM broadcast (BK1080): band at 0xA023 bits 1-2, 48 presets at 0xA028 as u16 in 100 kHz
  // units (0xFFFF empty). The firmware skips presets outside lo <= f < hi of the current band.
  const FM_BANDS = [[875, 1080], [760, 1080], [760, 900], [640, 760]];
  const FM_PRESETS = 48;
  const fmBand = img => FM_BANDS[(img[0x023] >> 1) & 3];
  const fmPreset = n => ({ id: `FM ${n + 1}`, group: 'fm', addr: 0xA028 + n * 2, shift: 0, bits: 16, values: 'fm' });

  const FIELDS = [
    // Radio
    field('Sql', 'radio', 0xA001, range(0, 9)),
    field('TxTOut', 'radio', 0xA002, range(5, 179, v => mmss(v * 5 + 5))),
    field('Mic', 'radio', 0xA007, range(0, 8, v => `+${MIC_DB2[v] >> 1}.${(MIC_DB2[v] & 1) * 5}dB`)),
    {
      id: 'VOX', group: 'radio', values: range(0, 10, offOr(String)),
      get: img => (img[0x005] === 1 ? img[0x006] + 1 : 0),
      set: (img, v) => { img[0x005] = v ? 1 : 0; if (v) img[0x006] = v - 1; }
    },
    {
      id: 'RxMode', group: 'radio', get: rxModeGet, set: rxModeSet,
      values: list(['MAIN ONLY', 'DUAL RX RESPOND', 'CROSS BAND', 'MAIN TX DUAL RX', 'FULL RX RESPOND', 'MAIN TX FULL RX'])
    },
    field('BatSav', 'radio', 0xA00B, range(0, 5, offOr(v => `1:${v}`))),
    field('BatTyp', 'radio', 0xA0C4, list(['1600mAh K5', '2200mAh K5', '3500mAh K5', '1400mAh K1', '2500mAh K1'])),
    field('1 Call', 'radio', 0xA135, 'channel', 0, 16),
    field('Roger', 'radio', 0xA0C1, list(['OFF', 'ROGER', 'MDC'])),
    field('STE', 'radio', 0xA00E, list(ON_OFF), 0, 1),
    field('RP STE', 'radio', 0xA0C2, range(0, 10, offOr(v => `${v}*100ms`))),
    field('SetNFM', 'radio', 0xA00E, list(['NARROW', 'NARROWER']), 1, 1),
    field('SetRxA FM', 'radio', 0xA000, list(['FLAT', 'CLEAN', 'MID', 'BOOST', 'MAX']), 0, 4),
    field('SetRxA AM', 'radio', 0xA000, list(['SHARP', 'STOCK', 'OPEN']), 4, 4),
    { id: 'Main VFO', group: 'radio', values: list(['A', 'B']), get: img => img[0x0C3], set: mainVfoSet },
    vfoChannel('VFO A', 0x010),
    vfoChannel('VFO B', 0x016),

    // Display
    field('ChDisp', 'display', 0xA009, list(['FREQ', 'CHANNEL NUMBER', 'NAME', 'NAME + FREQ'])),
    field('POnMsg', 'display', 0xA0AF, list(['ALL', 'SOUND', 'MESSAGE', 'VOLTAGE', 'LOGO', 'NONE'])),
    field('Message 1', 'display', 0xA0C8, 'text'),
    field('Message 2', 'display', 0xA0D8, 'text'),
    field('BLTime', 'display', 0xA00D, range(0, 61, v => (v === 0 ? 'OFF' : v === 61 ? 'ON' : mmss(v * 5)))),
    field('BLMin', 'display', 0xA008, range(0, 9), 4, 4),
    field('BLMax', 'display', 0xA008, range(1, 10), 0, 4),
    field('BLTxRx', 'display', 0xA157, list(['OFF', 'TX', 'RX', 'TX/RX']), 6, 2),
    field('BatTxt', 'display', 0xA157, list(['NONE', 'VOLTAGE', 'PERCENT']), 2, 2),
    field('MicBar', 'display', 0xA157, list(ON_OFF), 4, 1),
    field('SetCtr', 'display', 0xA15D, range(1, 15), 0, 4),
    field('SetInv', 'display', 0xA15D, list(ON_OFF), 4, 1),
    field('SetMet', 'display', 0xA15D, list(['TINY', 'CLASSIC']), 6, 1),
    field('SetGUI', 'display', 0xA15D, list(['TINY', 'CLASSIC']), 7, 1),
    field('SetSav', 'display', 0xA15F, list(['OFF', 'LOGO', 'LOGO+', 'MATRIX']), 2, 2),

    // Keys
    field('Beep', 'keys', 0xA0A8, list(ON_OFF), 0, 1),
    field('F1Shrt', 'keys', 0xA0A9, list(ACTIONS)),
    field('F1Long', 'keys', 0xA0AA, list(ACTIONS)),
    field('F2Shrt', 'keys', 0xA0AB, list(ACTIONS)),
    field('F2Long', 'keys', 0xA0AC, list(ACTIONS)),
    field('M Long', 'keys', 0xA0A8, list(ACTIONS), 1, 7),
    field('KeyLck', 'keys', 0xA0AE, range(0, 40, offOr(v => mmss(v * 15)))),
    field('SetLck', 'keys', 0xA15A, list(['KEYS', 'KEYS + ACTIONS', 'KEYS + PTT', 'KEYS + ACTIONS + PTT'])),
    field('SetPTT', 'keys', 0xA15F, list(['CLASSIC', 'ONEPUSH']), 0, 1),
    field('SetNav', 'keys', 0xA004, list(['LEFT/RIGHT (UV-K1)', 'UP/DOWN (UV-K5)']), 6, 1),
    field('SetKey', 'keys', 0xA004, list(['KEY_MENU', 'KEY_UP', 'KEY_DOWN', 'KEY_EXIT', 'KEY_STAR']), 2, 4),

    // Scan
    field('ScList', 'scan', 0xA130, range(1, 26, v => (v === 25 ? 'ALL' : v === 26 ? 'MIX' : two(v))), 0, 7),
    field('ScPri', 'scan', 0xA130, list(ON_OFF), 7, 1),
    field('PriCh1', 'scan', 0xA131, 'channel', 0, 16),
    field('PriCh2', 'scan', 0xA133, 'channel', 0, 16),
    field('ScnRev', 'scan', 0xA0AD, range(0, 104, v => (v === 0 ? 'STOP'
      : v < 81 ? `CARRIER ${two(Math.floor(v / 4))}s:${String((v % 4) * 250).padStart(3, '0')}ms`
        : `TIMEOUT ${mmss((v - 80) * 5)}`))),
    field('SetScn', 'scan', 0xA15F, [[1, 'NORMAL'], [0, 'FAST']], 1, 1),   // stored inverted
    { id: 'ScMix', group: 'scan', values: 'mask', get: mixGet, set: mixSet },

    // Transmit
    field('SetPwr', 'tx', 0xA15F, list(['< 20mW', '125mW', '250mW', '500mW', '1W', '2W', '5W']), 4, 4),
    field('SetTOT', 'tx', 0xA15E, list(['OFF', 'SOUND', 'VISUAL', 'ALL']), 4, 4),
    field('SetEOT', 'tx', 0xA15E, list(['OFF', 'SOUND', 'VISUAL', 'ALL']), 0, 4),
    field('SetTmr', 'tx', 0xA15C, list(ON_OFF), 0, 1),
    field('SetOff', 'tx', 0xA15C, range(0, 120, offOr(v => `${Math.floor(v / 60)}h:${two(v % 60)}m`)), 1, 7),

    // DTMF
    field('D ST', 'dtmf', 0xA0E8, list(ON_OFF)),
    field('D Prel', 'dtmf', 0xA0ED, range(3, 99, v => `${v}*10ms`)),
    // Not in the radio menu; CHIRP's 30-1000 ms. The firmware uses 100 ms for bytes over 100.
    field('D 1st', 'dtmf', 0xA0EE, range(3, 100, v => `${v}*10ms`)),
    field('D *#', 'dtmf', 0xA0EF, range(3, 100, v => `${v}*10ms`)),
    field('D Code', 'dtmf', 0xA0F0, range(3, 100, v => `${v}*10ms`)),
    field('D Gap', 'dtmf', 0xA0F1, range(3, 100, v => `${v}*10ms`)),
    field('D Live', 'dtmf', 0xA157, list(ON_OFF), 1, 1),
    field('UPCode', 'dtmf', 0xA110, 'dtmf'),
    field('DWCode', 'dtmf', 0xA120, 'dtmf'),

    // Service (hidden until the version number is clicked 5 times, like the radio's
    // PTT + side key 1 power-on menu). F Lock order = TxLockModes_t with the CA, PMR and
    // GMRS flags on, as in every release edition. Labels give what TX_freq_check allows.
    field('F Lock', 'service', 0xA150, list(['DEFAULT+ (137-350, 400-600)', 'FCC HAM (144-148, 420-450)',
      'CA HAM (144-148, 430-450)', 'CE HAM (144-146, 430-440)', 'GB HAM (144-148, 430-440)',
      '137-174, 400-430', '137-174, 400-438', 'PMR 446', 'GMRS FRS MURS', 'DISABLE ALL', 'UNLOCK ALL'])),
    field('350 En', 'service', 0xA155, list(ON_OFF)),

    // FM radio
    field('FM band', 'fm', 0xA023, list(FM_BANDS.map(([lo, hi]) => `${lo / 10}-${hi / 10} MHz`)), 1, 2),
    ...Array.from({ length: FM_PRESETS }, (_, n) => fmPreset(n))
  ];

  const GROUPS = ['radio', 'display', 'keys', 'scan', 'tx', 'dtmf', 'fm', 'service'];
  const TEXT_LENGTH = 16;
  const PROTECTED = [[0x138, 0x148], [0x160, 0x170]];   // AES key, firmware version (offsets in the area)

  function byId(id) {
    const f = FIELDS.find(candidate => candidate.id === id);
    if (!f) throw new Error(`unknown setting ${id}`);
    return f;
  }

  // img is the SIZE-byte area starting at BASE.
  function getValue(img, id) {
    const f = byId(id);
    if (f.get) return f.get(img);
    const at = f.addr - BASE;
    if (f.values === 'text' || f.values === 'dtmf') {
      let text = '';
      for (let i = 0; i < TEXT_LENGTH; i++) {
        const c = img[at + i];
        if (c === 0x00 || c === 0xFF) break;
        text += String.fromCharCode(c);
      }
      return text;
    }
    const raw = f.bits === 16 ? img[at] | (img[at + 1] << 8) : img[at];
    return (raw >> f.shift) & ((1 << f.bits) - 1);
  }

  function setValue(img, id, value) {
    const f = byId(id);
    const at = f.addr - BASE;
    if (f.values === 'text' || f.values === 'dtmf') {
      const text = String(value ?? '');
      const allowed = f.values === 'dtmf' ? /^[0-9A-D*#]*$/ : /^[\x20-\x7E]*$/;
      if (text.length > TEXT_LENGTH || !allowed.test(text)) throw new Error(`invalid ${id} "${text}"`);
      img.fill(0, at, at + TEXT_LENGTH);
      for (let i = 0; i < text.length; i++) img[at + i] = text.charCodeAt(i);
      return;
    }
    if (f.values === 'fm') {   // MHz text, '' = empty
      const text = String(value ?? '').trim();
      const units = text === '' ? 0xFFFF : Math.round(Number(text) * 10);
      const [lo, hi] = fmBand(img);
      if (units !== 0xFFFF && !(units >= lo && units < hi)) {
        throw new Error(`${text} MHz outside the FM band (${lo / 10} to ${(hi - 1) / 10} MHz)`);
      }
      img[at] = units & 0xFF;
      img[at + 1] = units >> 8;
      return;
    }
    const v = Number(value);
    const valid = f.values === 'channel' ? Number.isInteger(v) && v >= 0 && v <= CHANNEL_NONE
      : f.values === 'mask' ? Number.isInteger(v) && v > 0 && v <= MIX_ALL
        : f.values.some(([candidate]) => candidate === v);
    if (!valid) throw new Error(`invalid ${id} value ${value}`);
    if (f.set) {
      f.set(img, v);
    } else if (f.bits === 16) {
      img[at] = v & 0xFF;
      img[at + 1] = v >> 8;
    } else {
      const mask = ((1 << f.bits) - 1) << f.shift;
      img[at] = (img[at] & ~mask) | (v << f.shift);
    }
  }

  // Help page for a field: docs/help/<lang>/settings-<group>.md, at the heading named after the field.
  // FM presets share one heading and no per-row link, so 48 rows don't each grow an underline.
  const helpSlug = text => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const helpTopic = f => (f.values === 'fm' ? null : `settings-${f.group}#${helpSlug(f.id)}`);

  return { BASE, SIZE, CHANNEL_NONE, MIX_ALL, FIELDS, GROUPS, TEXT_LENGTH, PROTECTED, getValue, setValue, helpSlug, helpTopic };
});

// ---------- Settings panel (browser only; serial sessions run through flash.js) ----------
(function () {
  if (typeof document === 'undefined') return;
  const S = window.UVSTUDIO_SETTINGS;
  const M = window.UVSTUDIO_MEMORIES;
  const flash = window.UVStudioFlash;
  const $ = id => document.getElementById(id);
  const form = $('setForm');
  if (!form || !flash || !M) return;
  const t = (key, ...args) => window.uvStudioI18n.t(key, ...args);
  const log = flash.log;

  const readBtn = $('setReadBtn');
  const writeBtn = $('setWriteBtn');
  const openBtn = $('setOpenBackupBtn');
  const saveBtn = $('setSaveBackupBtn');
  const binInput = $('setBinFile');
  const summary = $('setSummary');

  let radioImage = null;
  let image = null;
  let busy = false;
  let serviceShown = false;   // this page load only

  // Five quick clicks on the sidebar version number show the Service group.
  let versionClicks = 0;
  let versionClickAt = 0;
  $('studioVersion')?.addEventListener('click', () => {
    const now = Date.now();
    versionClicks = now - versionClickAt < 1500 ? versionClicks + 1 : 1;
    versionClickAt = now;
    if (versionClicks < 5 || serviceShown) return;
    serviceShown = true;
    log(t('plus_service_shown'), 'info');
    render();
  });

  const escapeHtml = s => String(s).replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);
  const groupKey = g => `setGroup_${g}`;
  // Folded groups survive re-renders and reloads; FM radio (48 presets) starts folded.
  const prefs = window.UVStudioPreferences;
  const folded = new Set((() => { try { return JSON.parse(prefs.get('settingsFolded', '["fm"]')); } catch { return ['fm']; } })());
  const dirtyIds = () => (radioImage ? S.FIELDS.filter(f =>
    String(S.getValue(radioImage, f.id)) !== String(S.getValue(image, f.id))).map(f => f.id) : []);

  function control(f) {
    const value = S.getValue(image, f.id);
    const attrs = `data-id="${escapeHtml(f.id)}" id="set-${escapeHtml(f.id).replace(/\W/g, '_')}"`;
    if (f.values === 'text' || f.values === 'dtmf') {
      return `<input ${attrs} maxlength="${S.TEXT_LENGTH}" value="${escapeHtml(value)}">`;
    }
    if (f.values === 'mask') {
      return `<div class="set-mask" role="group" aria-label="${escapeHtml(f.id)}" ${attrs}>` +
        Array.from({ length: 24 }, (_, bit) => `<label><input type="checkbox" data-bit="${bit}"` +
          `${value & (1 << bit) ? ' checked' : ''}>${bit + 1}</label>`).join('') + '</div>';
    }
    if (f.values === 'fm') {
      return `<input ${attrs} inputmode="decimal" placeholder="—" value="${value === 0xFFFF ? '' : (value / 10).toFixed(1)}">`;
    }
    if (f.values === 'channel') {
      const shown = value >= S.CHANNEL_NONE ? '' : value + 1;
      return `<input ${attrs} type="number" min="1" max="${S.CHANNEL_NONE}" placeholder="—" value="${shown}">`;
    }
    const pairs = f.values.some(([v]) => v === value) ? f.values : f.values.concat([[value, `?${value}`]]);
    return `<select ${attrs}>${pairs.map(([v, label]) =>
      `<option value="${v}"${v === value ? ' selected' : ''}>${escapeHtml(label)}</option>`).join('')}</select>`;
  }

  function render() {
    if (!image) {
      form.innerHTML = '';
    } else {
      const dirty = new Set(dirtyIds());
      const help = topic => (topic ? ` data-help="${topic}" tabindex="0" role="button"` : '');
      form.innerHTML = S.GROUPS.filter(group => group !== 'service' || serviceShown).map(group => `<details class="set-group" data-group="${group}"${folded.has(group) ? '' : ' open'}><summary>${escapeHtml(t(groupKey(group)))}</summary>` +
        S.FIELDS.filter(f => f.group === group).map(f =>
          `<div class="set-row${f.values === 'mask' ? ' set-row-mask' : ''}${dirty.has(f.id) ? ' set-dirty' : ''}">` +
          `<label for="set-${escapeHtml(f.id).replace(/\W/g, '_')}"><span${help(S.helpTopic(f))}>${escapeHtml(f.id)}</span></label>${control(f)}</div>`
        ).join('') + '</details>').join('');
    }
    updateState();
  }

  function updateState() {
    const dirty = image ? dirtyIds().length : 0;
    summary.textContent = image ? t('setSummary', dirty) : '';
    const serial = 'serial' in navigator;
    readBtn.disabled = busy || !serial;
    writeBtn.disabled = busy || !serial || !radioImage || dirty === 0;
    openBtn.disabled = busy || !image;
    saveBtn.disabled = !image;
  }

  form.addEventListener('change', event => {
    const input = event.target.closest('[data-id]');
    const id = input?.dataset.id;
    if (!id) return;
    const f = S.FIELDS.find(candidate => candidate.id === id);
    try {
      const value = f.values === 'channel'
        ? (input.value.trim() === '' ? S.CHANNEL_NONE : Number(input.value) - 1)
        : f.values === 'mask'
          ? Array.from(input.querySelectorAll('[data-bit]')).reduce((m, box) => (box.checked ? m | (1 << box.dataset.bit) : m), 0)
          : input.value;
      S.setValue(image, id, value);
      input.removeAttribute('aria-invalid');
      if (f.values === 'fm') input.value = input.value.trim() && (S.getValue(image, id) / 10).toFixed(1);
    } catch (error) {
      log(t('memInvalidValue', `${id}: ${error.message}`), 'error');
      input.setAttribute('aria-invalid', 'true');
      return;
    }
    // RxMode and VOX touch shared bytes: refresh every row's dirty state.
    const dirty = new Set(dirtyIds());
    form.querySelectorAll('.set-row').forEach(row => {
      row.classList.toggle('set-dirty', dirty.has(row.querySelector('[data-id]').dataset.id));
    });
    updateState();
  });

  readBtn.addEventListener('click', () => {
    if (radioImage && dirtyIds().length && !window.confirm(t('memDiscardConfirm'))) return;
    void flash.runEepromOperation('read-settings', false, async radio => {
      const data = await radio.read(S.BASE, S.SIZE, done => radio.progress(Math.round((done / S.SIZE) * 100)));
      radioImage = data;
      image = data.slice();
      render();
      log(t('setReadComplete'), 'success');
    });
  });

  writeBtn.addEventListener('click', () => {
    const target = image.slice();
    const runs = M.dirtyRuns(radioImage, target);
    if (!runs.length) {
      log(t('memNoChanges'), 'info');
      return;
    }
    void flash.runEepromOperation('write-settings', true, async radio => {
      const total = runs.reduce((sum, run) => sum + run.length, 0);
      let done = 0;
      log(t('memWriting', total), 'info');
      for (const run of runs) {
        await radio.writeVerified(S.BASE + run.offset, target.subarray(run.offset, run.offset + run.length));
        done += run.length;
        radio.progress(Math.round((done / total) * 100));
      }
      radioImage = target;
      render();
      log(t('memWriteComplete', total), 'success');
      await radio.reboot();
    });
  });

  saveBtn.addEventListener('click', () => {
    const url = URL.createObjectURL(new Blob([image], { type: 'application/octet-stream' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'settings.bin';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  openBtn.addEventListener('click', () => binInput.click());
  binInput.addEventListener('change', async () => {
    const file = binInput.files[0];
    binInput.value = '';
    if (!file) return;
    const data = new Uint8Array(await file.arrayBuffer());
    if (data.length !== S.SIZE) {
      log(t('setBackupSize', S.SIZE), 'error');
      return;
    }
    // Never restore the AES key or firmware version stamp from a file: a key would
    // lock serial access (F4HWN has no unlock), the stamp belongs to the running firmware.
    for (const [start, end] of S.PROTECTED) data.set(radioImage.subarray(start, end), start);
    image = data;
    render();
    log(t('memBackupLoaded', file.name), 'success');
  });

  // toggle doesn't bubble, so listen in the capture phase.
  form.addEventListener('toggle', e => {
    const group = e.target.dataset?.group;
    if (!group) return;
    if (e.target.open) folded.delete(group); else folded.add(group);
    prefs.set('settingsFolded', JSON.stringify([...folded]));
  }, true);

  window.addEventListener('uvstudio:serialstatechange', event => {
    busy = Boolean(event.detail?.operation);
    updateState();
  });
  window.addEventListener('uvstudio:languagechange', render);
  window.addEventListener('beforeunload', event => {
    if (image && dirtyIds().length) event.preventDefault();
  });
  updateState();
})();

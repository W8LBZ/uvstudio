// Memory channels for F4HWN UV-K1 / UV-K5 V3 builds, read and written through
// the EEPROM compatibility map (firmware App/driver/eeprom_compat.c):
//   0x0000 1024 x 16-byte channel records
//   0x4000 1024 x 16-byte names (10 chars used)
//   0x8000 1024 x 2-byte attributes (band, compander, exclude, scan list), then 7 VFO attributes
//   0x880E 24 x 4-byte scan list names (the radio shows 3 characters)
// Codec and CHIRP CSV helpers are shared by the panel below and the tests.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.UVSTUDIO_MEMORIES = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const CHANNEL_COUNT = 1024;
  const NAME_BASE = 0x4000;
  const ATTR_BASE = 0x8000;
  const IMAGE_SIZE = 0x8870;       // through the scan list names, 8-byte aligned
  const LEGACY_IMAGE_SIZE = 0x8800; // backups made before scan list names were included
  const LIST_NAME_BASE = 0x880E;
  const LIST_NAME_LENGTH = 3;
  const NAME_LENGTH = 10;
  const EMPTY_BAND = 7;
  const SCANLIST_ALL = 25;      // SCAN_LIST_MODE_ALL: member of every list
  const SCANLIST_COUNT = 24;    // MR_CHANNELS_LIST
  const DEFAULT_STEP = 4;       // 12.5 kHz
  const FREQ_MIN_HZ = 18e6;     // BK4819 range with ENABLE_WIDE_RX
  const FREQ_MAX_HZ = 1300e6;

  const MODES = ['FM', 'NFM', 'AM', 'NAM', 'USB'];   // index = modulation * 2 + narrow
  const DUPLEXES = ['', '+', '-'];
  const POWERS = ['USER', 'LOW1', 'LOW2', 'LOW3', 'LOW4', 'LOW5', 'MID', 'HIGH'];
  const COMPANDERS = ['OFF', 'TX', 'RX', 'TX/RX'];
  const PTT_IDS = ['OFF', 'UP', 'DOWN', 'UP+DOWN', 'APOLLO'];
  const CHIRP_POWERS = [
    'USER = < 20mW to 5W', 'LOW 1 = < 20mW', 'LOW 2 = 125mW', 'LOW 3 = 250mW',
    'LOW 4 = 500mW', 'LOW 5 = 1W', 'MID = 2W', 'HIGH = 5W'
  ];
  const POWER_WATTS = [null, 0.02, 0.125, 0.25, 0.5, 1, 2, 5];
  // gStepFrequencyTable order (kHz); stored as an index.
  const STEPS = [2.5, 5, 6.25, 10, 12.5, 25, 8.33, 0.01, 0.05, 0.1, 0.25, 0.5, 1,
    1.25, 9, 15, 20, 30, 50, 100, 125, 200, 250, 500];
  const CTCSS = [
    670, 693, 719, 744, 770, 797, 825, 854, 885, 915,
    948, 974, 1000, 1035, 1072, 1109, 1148, 1188, 1230, 1273,
    1318, 1365, 1413, 1462, 1514, 1567, 1598, 1622, 1655, 1679,
    1713, 1738, 1773, 1799, 1835, 1862, 1899, 1928, 1966, 1995,
    2035, 2065, 2107, 2181, 2257, 2291, 2336, 2418, 2503, 2541
  ];
  const DCS = [
    0x13, 0x15, 0x16, 0x19, 0x1A, 0x1E, 0x23, 0x27, 0x29, 0x2B, 0x2C, 0x35, 0x39, 0x3A, 0x3B, 0x3C,
    0x4C, 0x4D, 0x4E, 0x52, 0x55, 0x59, 0x5A, 0x5C, 0x63, 0x65, 0x6A, 0x6D, 0x6E, 0x72, 0x75, 0x7A,
    0x7C, 0x85, 0x8A, 0x93, 0x95, 0x96, 0xA3, 0xA4, 0xA5, 0xA6, 0xA9, 0xAA, 0xAD, 0xB1, 0xB3, 0xB5,
    0xB6, 0xB9, 0xBC, 0xC6, 0xC9, 0xCD, 0xD5, 0xD9, 0xDA, 0xE3, 0xE6, 0xE9, 0xEE, 0xF4, 0xF5, 0xF9,
    0x09, 0x0A, 0x0B, 0x13, 0x19, 0x1A, 0x25, 0x26, 0x2A, 0x2C, 0x2D, 0x32, 0x34, 0x35, 0x36, 0x43,
    0x46, 0x4E, 0x53, 0x56, 0x5A, 0x66, 0x75, 0x86, 0x8A, 0x94, 0x97, 0x99, 0x9A, 0xAC, 0xB2, 0xB4,
    0xC3, 0xCA, 0xD3, 0xD9, 0xDA, 0xDC, 0xE3, 0xEC
  ].map((low, i) => low | (i >= 64 ? 0x100 : 0));
  const BAND_LOWER_HZ = [18e6, 108e6, 137e6, 174e6, 350e6, 400e6, 470e6];

  const CHIRP_HEADER = ['Location', 'Name', 'Frequency', 'Duplex', 'Offset', 'Tone',
    'rToneFreq', 'cToneFreq', 'DtcsCode', 'DtcsPolarity', 'RxDtcsCode', 'CrossMode',
    'Mode', 'TStep', 'Skip', 'Power', 'Comment', 'URCALL', 'RPT1CALL', 'RPT2CALL', 'DVCODE'];

  // ---------- Values ----------
  function formatMHz(hz) {
    return (hz / 1e6).toFixed(5).replace(/(\.\d{3}\d*?)0+$/, '$1');
  }

  function parseMHz(text) {
    const value = Number(String(text ?? '').trim());
    if (String(text ?? '').trim() === '' || !Number.isFinite(value) || value < 0) {
      throw new Error(`invalid frequency "${text}"`);
    }
    return Math.round(value * 1e5) * 10;   // radio stores 10 Hz units
  }

  function dcsText(code) {
    return DCS[code].toString(8).padStart(3, '0');
  }

  function toneText(type, code) {
    if (type === 1 && code < CTCSS.length) return (CTCSS[code] / 10).toFixed(1);
    if ((type === 2 || type === 3) && code < DCS.length) return `D${dcsText(code)}${type === 3 ? 'I' : 'N'}`;
    return '';
  }

  // '' | '88.5' (CTCSS) | 'D023N' / 'D023I' (DCS normal / inverted) -> code type + index
  function parseTone(text) {
    const s = String(text ?? '').trim().toUpperCase();
    if (s === '' || s === 'OFF') return { type: 0, code: 0 };
    const dcs = /^D([0-7]{3})([NIR]?)$/.exec(s);
    if (dcs) {
      const code = DCS.indexOf(parseInt(dcs[1], 8));
      if (code >= 0) return { type: dcs[2] === 'I' || dcs[2] === 'R' ? 3 : 2, code };
    } else if (/^\d+(\.\d+)?$/.test(s)) {
      const code = CTCSS.indexOf(Math.round(Number(s) * 10));
      if (code >= 0) return { type: 1, code };
    }
    throw new Error(`invalid tone "${text}"`);
  }

  function bandOf(hz) {
    for (let band = BAND_LOWER_HZ.length - 1; band > 0; band--) {
      if (hz >= BAND_LOWER_HZ[band]) return band;
    }
    return 0;
  }

  // ---------- Channel codec ----------
  function attrAt(image, index) {
    return image[ATTR_BASE + index * 2] | (image[ATTR_BASE + index * 2 + 1] << 8);
  }

  function isEmpty(image, index) {
    return (attrAt(image, index) & 7) === EMPTY_BAND;
  }

  function decodeChannel(image, index) {
    if (isEmpty(image, index)) return null;
    const r = index * 16;
    const view = new DataView(image.buffer, image.byteOffset, image.byteLength);
    const modulation = image[r + 11] >> 4;
    const narrow = (image[r + 12] >> 1) & 1;
    let name = '';
    for (let i = 0; i < NAME_LENGTH; i++) {
      const c = image[NAME_BASE + r + i];
      if (c === 0x00 || c === 0xFF) break;
      name += String.fromCharCode(c);
    }
    return {
      name: name.trimEnd(),
      freq: view.getUint32(r, true) * 10,
      offset: view.getUint32(r + 4, true) * 10,
      duplex: DUPLEXES[image[r + 11] & 0x0F] || '',
      mode: modulation <= 2 ? MODES[Math.min(modulation * 2 + narrow, 4)] : `MOD${modulation}`,
      txTone: toneText(image[r + 10] >> 4, image[r + 9]),
      rxTone: toneText(image[r + 10] & 0x0F, image[r + 8]),
      power: (image[r + 12] >> 2) & 7,
      step: image[r + 14],
      scanlist: image[ATTR_BASE + index * 2 + 1],
      skip: Boolean(attrAt(image, index) & 0x80),
      // TX_LOCK: apply the F Lock band plan to this channel (firmware default on).
      // Clear = this channel may transmit outside the band plan.
      txLock: Boolean(image[r + 12] & 0x40),
      busy: Boolean(image[r + 12] & 0x20),
      reverse: Boolean(image[r + 12] & 0x01),
      compander: (attrAt(image, index) >> 3) & 3,
      // Erased (0xFF) or out-of-range PTT ID reads as OFF, like the firmware.
      pttId: image[r + 13] === 0xFF || ((image[r + 13] >> 1) & 7) >= PTT_IDS.length ? 0 : (image[r + 13] >> 1) & 7
    };
  }

  function defaultChannel() {
    return {
      name: '', freq: 0, offset: 0, duplex: '', mode: 'FM', txTone: '', rxTone: '',
      power: 7, step: DEFAULT_STEP, scanlist: SCANLIST_ALL, skip: false, txLock: true,
      busy: false, reverse: false, compander: 0, pttId: 0
    };
  }

  // Writes ch into image (validating first, so a bad value leaves it untouched).
  // Bits the panel does not edit (busy lockout, reverse, DTMF, compander...) are kept.
  // ch === null deletes the channel the way the firmware does.
  function encodeChannel(image, index, ch) {
    const r = index * 16;
    const a = ATTR_BASE + index * 2;
    if (!Number.isInteger(index) || index < 0 || index >= CHANNEL_COUNT) {
      throw new Error(`invalid channel ${index}`);
    }
    if (ch === null) {
      image.fill(0xFF, r, r + 16);
      image.fill(0xFF, NAME_BASE + r, NAME_BASE + r + 16);
      image[a] = EMPTY_BAND;
      image[a + 1] = 0;
      return;
    }

    if (!(ch.freq >= FREQ_MIN_HZ && ch.freq <= FREQ_MAX_HZ)) {
      throw new Error(`frequency ${formatMHz(ch.freq || 0)} MHz out of range`);
    }
    if (!(ch.offset >= 0 && ch.offset / 10 <= 0xFFFFFFFF)) throw new Error('invalid offset');
    if (!DUPLEXES.includes(ch.duplex)) throw new Error(`invalid duplex "${ch.duplex}"`);
    const tx = parseTone(ch.txTone);
    const rx = parseTone(ch.rxTone);
    if (!(ch.power >= 0 && ch.power < POWERS.length)) throw new Error('invalid power');
    if (!(ch.step >= 0 && ch.step < STEPS.length)) throw new Error('invalid step');
    if (!(ch.scanlist >= 0 && ch.scanlist <= SCANLIST_ALL)) throw new Error('invalid scan list');
    if (!(ch.compander >= 0 && ch.compander < COMPANDERS.length)) throw new Error('invalid compander');
    if (!(ch.pttId >= 0 && ch.pttId < PTT_IDS.length)) throw new Error('invalid PTT ID');
    const modeIndex = MODES.indexOf(ch.mode);
    const name = String(ch.name ?? '').replace(/[^\x20-\x7E]/g, '').trim().slice(0, NAME_LENGTH);

    if (isEmpty(image, index)) {
      image.fill(0, r, r + 16);
      image[a] = 0;
    }
    const view = new DataView(image.buffer, image.byteOffset, image.byteLength);
    view.setUint32(r, Math.round(ch.freq / 10), true);
    view.setUint32(r + 4, Math.round(ch.offset / 10), true);
    image[r + 8] = rx.code;
    image[r + 9] = tx.code;
    image[r + 10] = (tx.type << 4) | rx.type;

    let modulation = image[r + 11] >> 4;
    let narrow = (image[r + 12] >> 1) & 1;
    if (modeIndex >= 0) {
      modulation = modeIndex >> 1;
      narrow = modeIndex & 1;
    }
    image[r + 11] = (modulation << 4) | DUPLEXES.indexOf(ch.duplex);
    image[r + 12] = (image[r + 12] & 0x80) | (ch.txLock === false ? 0 : 0x40) |
      (ch.busy ? 0x20 : 0) | (ch.power << 2) | (narrow << 1) | (ch.reverse ? 1 : 0);
    if (image[r + 13] === 0xFF) image[r + 13] = 0;
    image[r + 13] = (image[r + 13] & 0xF1) | (ch.pttId << 1);   // bit 0 (DTMF decode) kept
    image[r + 14] = ch.step;

    image[a] = (image[a] & 0x60) | (ch.compander << 3) | bandOf(ch.freq) | (ch.skip ? 0x80 : 0);
    image[a + 1] = ch.scanlist;

    image.fill(0, NAME_BASE + r, NAME_BASE + r + 16);
    for (let i = 0; i < name.length; i++) image[NAME_BASE + r + i] = name.charCodeAt(i);
  }

  function getListName(image, list) {   // list 1..24
    let name = '';
    for (let i = 0; i < LIST_NAME_LENGTH; i++) {
      const c = image[LIST_NAME_BASE + (list - 1) * 4 + i];
      if (c === 0x00 || c === 0xFF) break;
      name += String.fromCharCode(c);
    }
    return name.trimEnd();
  }

  function setListName(image, list, text) {
    const name = String(text ?? '').trim();
    if (!(list >= 1 && list <= SCANLIST_COUNT)) throw new Error(`invalid scan list ${list}`);
    if (name.length > LIST_NAME_LENGTH || !/^[\x20-\x7E]*$/.test(name)) throw new Error(`invalid list name "${text}"`);
    const at = LIST_NAME_BASE + (list - 1) * 4;
    image.fill(0, at, at + 4);
    for (let i = 0; i < name.length; i++) image[at + i] = name.charCodeAt(i);
  }

  function channelDirty(before, after, index) {
    const r = index * 16;
    const ranges = [[r, 16], [NAME_BASE + r, 16], [ATTR_BASE + index * 2, 2]];
    return ranges.some(([start, len]) => {
      for (let i = start; i < start + len; i++) if (before[i] !== after[i]) return true;
      return false;
    });
  }

  // ---------- Whole-channel operations (raw bytes, so nothing is lost) ----------
  const slotRanges = index => [[index * 16, 16], [NAME_BASE + index * 16, 16], [ATTR_BASE + index * 2, 2]];

  function copyChannel(image, index) {
    return isEmpty(image, index) ? null : slotRanges(index).map(([start, len]) => image.slice(start, start + len));
  }

  function pasteChannel(image, index, slot) {
    if (slot === null) encodeChannel(image, index, null);
    else slotRanges(index).forEach(([start], k) => image.set(slot[k], start));
  }

  function pasteChannels(image, at, slots) {
    if (at < 0 || at + slots.length > CHANNEL_COUNT) throw new Error('paste does not fit');
    slots.forEach((slot, k) => pasteChannel(image, at + k, slot));
  }

  // Shift channels at..1022 down one place and clear `at` (CHIRP "insert row above").
  function insertChannel(image, at) {
    if (!isEmpty(image, CHANNEL_COUNT - 1)) throw new Error('last channel is in use');
    for (let i = CHANNEL_COUNT - 1; i > at; i--) pasteChannel(image, i, copyChannel(image, i - 1));
    encodeChannel(image, at, null);
  }

  // Delete `at` and shift the channels after it up one place.
  function removeChannel(image, at) {
    for (let i = at; i < CHANNEL_COUNT - 1; i++) pasteChannel(image, i, copyChannel(image, i + 1));
    encodeChannel(image, CHANNEL_COUNT - 1, null);
  }

  // Move the selected channels one place up (delta -1) or down (+1); returns their new indices.
  function moveChannels(image, indices, delta) {
    const sorted = [...indices].sort((a, b) => (a - b) * -delta);
    if (sorted.some(i => i + delta < 0 || i + delta >= CHANNEL_COUNT)) throw new Error('cannot move past the ends');
    for (const i of sorted) {
      const here = copyChannel(image, i);
      pasteChannel(image, i, copyChannel(image, i + delta));
      pasteChannel(image, i + delta, here);
    }
    return indices.map(i => i + delta);
  }

  // Changed 8-byte blocks (the firmware's write granularity), merged into runs.
  function dirtyRuns(before, after, maxLength = 128) {
    const runs = [];
    for (let offset = 0; offset < after.length; offset += 8) {
      let changed = false;
      for (let i = offset; i < offset + 8 && !changed; i++) changed = before[i] !== after[i];
      if (!changed) continue;
      const last = runs[runs.length - 1];
      if (last && last.offset + last.length === offset && last.length < maxLength) last.length += 8;
      else runs.push({ offset, length: 8 });
    }
    return runs;
  }

  // ---------- CHIRP CSV ----------
  function parseCsv(text) {
    const rows = [];
    let row = [];
    let field = '';
    let quoted = false;
    text = String(text).replace(/^﻿/, '');
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (quoted) {
        if (c !== '"') field += c;
        else if (text[i + 1] === '"') { field += '"'; i++; }
        else quoted = false;
      } else if (c === '"') {
        quoted = true;
      } else if (c === ',') {
        row.push(field);
        field = '';
      } else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') i++;
        row.push(field);
        rows.push(row);
        row = [];
        field = '';
      } else {
        field += c;
      }
    }
    if (field !== '' || row.length) {
      row.push(field);
      rows.push(row);
    }
    return rows;
  }

  function csvField(value) {
    const s = String(value);
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }

  function toChirpRow(index, ch) {
    const tx = parseTone(ch.txTone);
    const rx = parseTone(ch.rxTone);
    const kind = tone => (tone.type === 1 ? 'Tone' : tone.type ? 'DTCS' : '');
    const value = tone => (tone.type === 1 ? (CTCSS[tone.code] / 10).toFixed(1) : dcsText(tone.code));
    const txKind = kind(tx);
    const rxKind = kind(rx);
    let tmode = '';
    let rtone = '88.5';
    let ctone = '88.5';
    let dtcs = '023';
    let rxDtcs = '023';
    let cross = 'Tone->Tone';

    // Mirrors chirp_common.split_tone_decode.
    if (!txKind && !rxKind) {
      tmode = '';
    } else if (txKind === 'Tone' && !rxKind) {
      tmode = 'Tone';
      rtone = value(tx);
    } else if (txKind === 'Tone' && rxKind === 'Tone' && tx.code === rx.code) {
      tmode = 'TSQL';
      ctone = value(tx);
    } else if (txKind === 'DTCS' && rxKind === 'DTCS' && tx.code === rx.code) {
      tmode = 'DTCS';
      dtcs = rxDtcs = value(tx);
    } else {
      tmode = 'Cross';
      cross = `${txKind}->${rxKind}`;
      if (txKind === 'Tone') rtone = value(tx);
      else if (txKind === 'DTCS') dtcs = value(tx);
      if (rxKind === 'Tone') ctone = value(rx);
      else if (rxKind === 'DTCS') rxDtcs = value(rx);
    }

    return [
      index + 1, ch.name, (ch.freq / 1e6).toFixed(6), ch.duplex, (ch.offset / 1e6).toFixed(6),
      tmode, rtone, ctone, dtcs, `${tx.type === 3 ? 'R' : 'N'}${rx.type === 3 ? 'R' : 'N'}`,
      rxDtcs, cross, ch.mode, (STEPS[ch.step] ?? STEPS[DEFAULT_STEP]).toFixed(2),
      ch.skip ? 'S' : '', CHIRP_POWERS[ch.power], '', '', '', '', ''
    ];
  }

  function exportChirpCsv(image) {
    const lines = [CHIRP_HEADER.join(',')];
    for (let i = 0; i < CHANNEL_COUNT; i++) {
      const ch = decodeChannel(image, i);
      if (ch) lines.push(toChirpRow(i, ch).map(csvField).join(','));
    }
    return lines.join('\r\n') + '\r\n';
  }

  function parsePower(text) {
    const s = String(text ?? '').trim();
    if (!s) return null;
    let index = CHIRP_POWERS.indexOf(s);
    if (index < 0) index = POWERS.indexOf(s.toUpperCase());
    if (index >= 0) return index;
    const m = /([\d.]+)\s*(mW|W)\b/i.exec(s);
    if (!m) return null;
    const watts = Number(m[1]) / (m[2].toLowerCase() === 'mw' ? 1000 : 1);
    let best = null;
    POWER_WATTS.forEach((w, i) => {
      if (w !== null && (best === null || Math.abs(w - watts) < Math.abs(POWER_WATTS[best] - watts))) best = i;
    });
    return best;
  }

  // One CHIRP CSV record -> channel. `existing` supplies values CHIRP has no column for.
  function fromChirpRecord(rec, existing) {
    const freq = parseMHz(rec.Frequency);
    let offset = rec.Offset ? parseMHz(rec.Offset) : 0;
    let duplex = String(rec.Duplex ?? '').trim().toLowerCase();
    if (duplex === 'split') {
      duplex = offset >= freq ? '+' : '-';
      offset = Math.abs(offset - freq);
    }
    // CHIRP 'off' (TX inhibit) has no F4HWN equivalent: import as simplex with TX lock,
    // which blocks TX only outside the F Lock band plan.
    const warning = duplex === 'off' ? 'duplex "off" imported as simplex with TX lock (TX still possible inside the band plan)' : null;
    if (warning) duplex = '';
    if (!DUPLEXES.includes(duplex)) throw new Error(`unsupported duplex "${rec.Duplex}"`);

    // Mirrors chirp_common.split_tone_encode.
    const polarity = String(rec.DtcsPolarity || 'NN').toUpperCase();
    const dcs = (code, pol) => `D${String(code).trim().padStart(3, '0')}${pol === 'R' ? 'I' : 'N'}`;
    let txTone = '';
    let rxTone = '';
    const tmode = String(rec.Tone ?? '').trim();
    if (tmode === 'Tone') {
      txTone = rec.rToneFreq;
    } else if (tmode === 'TSQL') {
      txTone = rxTone = rec.cToneFreq;
    } else if (tmode === 'DTCS') {
      txTone = dcs(rec.DtcsCode, polarity[0]);
      rxTone = dcs(rec.DtcsCode, polarity[1]);
    } else if (tmode === 'Cross') {
      const [txKind, rxKind] = String(rec.CrossMode ?? '').split('->');
      if (txKind === 'Tone') txTone = rec.rToneFreq;
      else if (txKind === 'DTCS') txTone = dcs(rec.DtcsCode, polarity[0]);
      if (rxKind === 'Tone') rxTone = rec.cToneFreq;
      else if (rxKind === 'DTCS') rxTone = dcs(rec.RxDtcsCode, polarity[1]);
    } else if (tmode !== '') {
      throw new Error(`unsupported tone mode "${tmode}"`);
    }

    const mode = String(rec.Mode ?? 'FM').trim() || 'FM';
    if (!MODES.includes(mode)) throw new Error(`unsupported mode "${mode}"`);
    const stepIndex = STEPS.findIndex(step => Math.abs(step - Number(rec.TStep)) < 0.001);
    const base = existing || defaultChannel();

    return {
      name: rec.Name ?? '',
      freq,
      offset,
      duplex,
      mode,
      txTone,
      rxTone,
      power: parsePower(rec.Power) ?? base.power,
      step: stepIndex >= 0 ? stepIndex : base.step,
      scanlist: base.scanlist,
      skip: String(rec.Skip ?? '').trim().toUpperCase() === 'S',
      txLock: warning ? true : base.txLock,
      busy: base.busy,
      reverse: base.reverse,
      compander: base.compander,
      pttId: base.pttId,
      warning
    };
  }

  // Same RF setup (name ignored), used to skip duplicates on import.
  function channelKey(ch) {
    const tone = text => { const t = parseTone(text); return `${t.type}:${t.code}`; };
    return [ch.freq, ch.duplex, ch.duplex ? ch.offset : 0, ch.mode, tone(ch.txTone), tone(ch.rxTone)].join('|');
  }

  // Applies CSV rows to the image. mode:
  //   'location' each row at its Location (1-based), other channels stay
  //   'replace'  clear every channel first, then as 'location'
  //   'append'   rows in file order after the last used channel (Location ignored)
  //   'prepend'  rows in file order from channel 1, existing channels shift down
  // dedupe skips rows whose RF setup matches a channel already present or an earlier row.
  function importChirpCsv(image, text, { mode = 'location', dedupe = false } = {}) {
    const rows = parseCsv(text);
    const header = (rows[0] || []).map(h => h.trim());
    if (!header.includes('Frequency') || (!header.includes('Location') && (mode === 'location' || mode === 'replace'))) {
      throw new Error('not a CHIRP CSV file (missing Location or Frequency column)');
    }
    const byLocation = mode === 'location' || mode === 'replace';
    const errors = [];
    const warnings = [];
    const scratch = new Uint8Array(IMAGE_SIZE).fill(0xFF);
    const parsed = [];
    rows.slice(1).forEach((row, i) => {
      if (row.every(field => field.trim() === '')) return;
      const rec = Object.fromEntries(header.map((name, col) => [name, row[col] ?? '']));
      try {
        let index = null;
        if (byLocation) {
          const location = Number(rec.Location);
          if (!Number.isInteger(location) || location < 1 || location > CHANNEL_COUNT) {
            throw new Error(`location "${rec.Location}" outside 1-${CHANNEL_COUNT}`);
          }
          index = location - 1;
        }
        const ch = fromChirpRecord(rec, byLocation && mode !== 'replace' ? decodeChannel(image, index) : null);
        encodeChannel(scratch, 0, ch);   // validate before touching the image
        parsed.push({ line: i + 2, index, ch });
      } catch (error) {
        errors.push({ line: i + 2, message: error.message });
      }
    });

    if (mode === 'replace' && !parsed.length) throw new Error('no valid rows: channels left unchanged');
    if (mode === 'replace') for (let i = 0; i < CHANNEL_COUNT; i++) encodeChannel(image, i, null);

    let duplicates = 0;
    let accepted = parsed;
    if (dedupe) {
      const seen = new Set();
      for (let i = 0; i < CHANNEL_COUNT; i++) {
        const ch = decodeChannel(image, i);
        if (ch && MODES.includes(ch.mode)) seen.add(channelKey(ch));
      }
      accepted = parsed.filter(p => {
        const key = channelKey(p.ch);
        if (seen.has(key)) { duplicates++; return false; }
        seen.add(key);
        return true;
      });
    }

    let lastUsed = -1;
    for (let i = 0; i < CHANNEL_COUNT; i++) if (!isEmpty(image, i)) lastUsed = i;
    if (mode === 'prepend') {
      const n = accepted.length;
      if (lastUsed + n >= CHANNEL_COUNT) {
        throw new Error(`no room to prepend ${n} channels (last used channel is ${lastUsed + 1})`);
      }
      for (let i = lastUsed + n; i >= n; i--) pasteChannel(image, i, copyChannel(image, i - n));
      accepted.forEach((p, k) => { p.index = k; encodeChannel(image, k, null); });
    } else if (mode === 'append') {
      accepted.forEach((p, k) => { p.index = lastUsed + 1 + k; });
    }

    let imported = 0;
    accepted.forEach(p => {
      if (p.index >= CHANNEL_COUNT) {
        errors.push({ line: p.line, message: 'no free channel left' });
        return;
      }
      encodeChannel(image, p.index, p.ch);
      if (p.ch.warning) warnings.push({ line: p.line, message: p.ch.warning });
      imported++;
    });
    errors.sort((a, b) => a.line - b.line);
    return { imported, errors, warnings, duplicates };
  }

  return {
    CHANNEL_COUNT,
    IMAGE_SIZE,
    LEGACY_IMAGE_SIZE,
    LIST_NAME_LENGTH,
    COMPANDERS,
    PTT_IDS,
    SCANLIST_ALL,
    SCANLIST_COUNT,
    MODES,
    DUPLEXES,
    POWERS,
    STEPS,
    CTCSS,
    DCS,
    formatMHz,
    parseMHz,
    toneText,
    parseTone,
    isEmpty,
    getListName,
    setListName,
    decodeChannel,
    defaultChannel,
    encodeChannel,
    channelDirty,
    copyChannel,
    pasteChannels,
    insertChannel,
    removeChannel,
    moveChannels,
    dirtyRuns,
    parseCsv,
    exportChirpCsv,
    importChirpCsv
  };
});

// ---------- Memories panel (browser only; serial sessions run through flash.js) ----------
(function () {
  if (typeof document === 'undefined') return;
  const M = window.UVSTUDIO_MEMORIES;
  const flash = window.UVStudioFlash;
  const $ = id => document.getElementById(id);
  const body = $('memTableBody');
  if (!body || !flash) return;
  const t = (key, ...args) => window.uvStudioI18n.t(key, ...args);
  const log = flash.log;

  const readBtn = $('memReadBtn');
  const writeBtn = $('memWriteBtn');
  const importBtn = $('memImportBtn');
  const exportBtn = $('memExportBtn');
  const openBtn = $('memOpenBackupBtn');
  const saveBtn = $('memSaveBackupBtn');
  const csvInput = $('memCsvFile');
  const importMode = $('memImportMode');
  const skipDuplicates = $('memSkipDuplicates');
  const sourceUrl = $('memSourceUrl');
  const loadUrlBtn = $('memLoadUrlBtn');
  const binInput = $('memBinFile');
  const showEmpty = $('memShowEmpty');
  const summary = $('memSummary');
  const toneList = $('memToneList');
  const listNames = $('memListNames');
  const listNamesBox = $('memListNamesBox');

  const selectionBar = $('memSelectionBar');
  const selectionCount = $('memSelectionCount');
  const selectAll = $('memSelectAll');
  const bulkField = $('memBulkField');
  const bulkValue = $('memBulkValue');

  let radioImage = null;   // last state read from / written to the radio
  let image = null;        // working copy edited by the table
  let busy = false;
  const selected = new Set();
  let lastClicked = null;
  let clipboard = null;    // copied channel slots

  toneList.innerHTML = M.CTCSS.map((_, i) => `<option value="${M.toneText(1, i)}">`).join('') +
    M.DCS.map((_, i) => `<option value="${M.toneText(2, i)}"><option value="${M.toneText(3, i)}">`).join('');

  const escapeHtml = s => String(s).replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);
  const options = (pairs, selected) => pairs.map(([value, label]) =>
    `<option value="${value}"${String(value) === String(selected) ? ' selected' : ''}>${escapeHtml(label)}</option>`).join('');
  const stepPairs = M.STEPS.map((step, i) => [i, step]).sort((a, b) => a[1] - b[1]);

  function scanPairs() {
    const pairs = [[0, '—']];
    for (let i = 1; i <= M.SCANLIST_COUNT; i++) pairs.push([i, `${i} ${M.getListName(image, i)}`.trim()]);
    pairs.push([M.SCANLIST_ALL, t('memScanAll')]);
    return pairs;
  }

  const BULK_FIELDS = ['duplex', 'offset', 'mode', 'txTone', 'rxTone', 'power', 'step', 'scanlist',
    'skip', 'txLock', 'busy', 'reverse', 'compander', 'pttId'];
  const FIELD_LABELS = {
    name: 'memColName', freq: 'memColFreq', duplex: 'memColDuplex', offset: 'memColOffset', mode: 'memColMode',
    txTone: 'memColTxTone', rxTone: 'memColRxTone', power: 'memColPower', step: 'memColStep',
    scanlist: 'memColScanList', skip: 'memColSkip', txLock: 'memColTxLock', busy: 'memColBusy',
    reverse: 'memColReverse', compander: 'memColCompander', pttId: 'memColPttId'
  };
  const CELL_FIELDS = Object.keys(FIELD_LABELS);

  function cellHtml(field, ch, labelText) {
    const attrs = `data-field="${field}" aria-label="${escapeHtml(labelText)}"`;
    const select = pairs => `<select ${attrs}>${options(pairs, ch[field])}</select>`;
    const check = () => `<input type="checkbox" ${attrs}${ch[field] ? ' checked' : ''}>`;
    switch (field) {
      case 'name': return `<input ${attrs} maxlength="10" value="${escapeHtml(ch.name)}">`;
      case 'freq': case 'offset': return `<input ${attrs} inputmode="decimal" value="${M.formatMHz(ch[field])}">`;
      case 'txTone': case 'rxTone': return `<input ${attrs} list="memToneList" value="${ch[field]}">`;
      case 'duplex': return select(M.DUPLEXES.map(d => [d, d]));
      case 'mode': return select((M.MODES.includes(ch.mode) ? M.MODES : M.MODES.concat(ch.mode)).map(m => [m, m]));
      case 'power': return select(M.POWERS.map((p, n) => [n, p]));
      case 'step': return select(ch.step < M.STEPS.length ? stepPairs : stepPairs.concat([[ch.step, `#${ch.step}`]]));
      case 'scanlist': return select(scanPairs());
      case 'compander': return select(M.COMPANDERS.map((c, n) => [n, c]));
      case 'pttId': return select(M.PTT_IDS.map((p, n) => [n, p]));
      default: return check();   // skip, txLock, busy, reverse
    }
  }

  // Reads a cell control back into a channel value (throws on bad input).
  function fieldValue(input) {
    const field = input.dataset.field;
    if (field === 'freq' || field === 'offset') return M.parseMHz(input.value);
    if (input.type === 'checkbox') return input.checked;
    if (['power', 'step', 'scanlist', 'compander', 'pttId'].includes(field)) return Number(input.value);
    return input.value;
  }

  function rowHtml(i) {
    const ch = M.decodeChannel(image, i);
    const dirty = radioImage && M.channelDirty(radioImage, image, i);
    const classes = [dirty && 'mem-dirty', selected.has(i) && 'mem-selected'].filter(Boolean).join(' ');
    const head = `<tr data-index="${i}"${classes ? ` class="${classes}"` : ''}>` +
      `<td><input type="checkbox" data-select${selected.has(i) ? ' checked' : ''} aria-label="${escapeHtml(t('memSelectRow', i + 1))}"></td>` +
      `<td class="slot-idx">${i + 1}</td>`;
    const label = field => `${t(FIELD_LABELS[field])} ${i + 1}`;
    if (!ch) {
      return `${head}<td></td><td>${cellHtml('freq', { freq: 0 }, label('freq')).replace(/ value="[^"]*"/, '')}</td>` +
        `<td colspan="${CELL_FIELDS.length - 1}"></td></tr>`;
    }
    return head + CELL_FIELDS.map(field => `<td>${cellHtml(field, ch, label(field))}</td>`).join('') +
      `<td><button type="button" class="btn compact-toolbar-action" data-action="delete" title="${escapeHtml(t('memDelete'))}" aria-label="${escapeHtml(`${t('memDelete')} ${i + 1}`)}">✕</button></td></tr>`;
  }

  function counts() {
    let used = 0;
    let dirty = 0;
    for (let i = 0; i < M.CHANNEL_COUNT; i++) {
      if (!M.isEmpty(image, i)) used++;
      if (radioImage && M.channelDirty(radioImage, image, i)) dirty++;
    }
    return { used, dirty };
  }

  function updateState() {
    const { used, dirty } = image ? counts() : { used: 0, dirty: 0 };
    summary.textContent = image ? t('memSummary', used, dirty) : '';
    const serial = 'serial' in navigator;
    const changed = Boolean(radioImage && image && M.dirtyRuns(radioImage, image).length);
    readBtn.disabled = busy || !serial;
    writeBtn.disabled = busy || !serial || !changed;
    importBtn.disabled = loadUrlBtn.disabled = openBtn.disabled = busy || !image;
    exportBtn.disabled = saveBtn.disabled = !image;
  }

  function renderListNames() {
    listNames.innerHTML = image ? Array.from({ length: M.SCANLIST_COUNT }, (_, n) => {
      const list = n + 1;
      const dirty = radioImage && M.getListName(radioImage, list) !== M.getListName(image, list);
      return `<label class="mem-list-name${dirty ? ' mem-dirty' : ''}"><span>${list}</span>` +
        `<input data-list="${list}" maxlength="${M.LIST_NAME_LENGTH}" value="${escapeHtml(M.getListName(image, list))}" ` +
        `aria-label="${escapeHtml(t('memListName', list))}"></label>`;
    }).join('') : '';
    listNamesBox.hidden = !image;
  }

  function render() {
    renderListNames();
    const rows = [];
    if (image) {
      for (let i = 0; i < M.CHANNEL_COUNT; i++) {
        if (showEmpty.checked || !M.isEmpty(image, i)) rows.push(rowHtml(i));
      }
    }
    body.innerHTML = rows.join('');
    selectionBar.hidden = !image;
    if (image) {
      updateSelection();
      renderBulkValue();
    }
    updateState();
  }

  function replaceRow(tr, focusField) {
    const i = Number(tr.dataset.index);
    if (!showEmpty.checked && M.isEmpty(image, i)) {
      tr.remove();
    } else {
      tr.outerHTML = rowHtml(i);
      body.querySelector(`tr[data-index="${i}"] [data-field="${focusField}"]`)?.focus();
    }
    updateState();
  }

  function download(data, name, type) {
    const url = URL.createObjectURL(new Blob([data], { type }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  body.addEventListener('change', event => {
    const input = event.target;
    const field = input.dataset.field;
    const tr = input.closest('tr');
    if (!field || !tr) return;
    const i = Number(tr.dataset.index);
    const wasEmpty = M.isEmpty(image, i);
    if (wasEmpty && input.value.trim() === '') return;
    try {
      const ch = M.decodeChannel(image, i) || M.defaultChannel();
      ch[field] = fieldValue(input);
      M.encodeChannel(image, i, ch);
      input.removeAttribute('aria-invalid');
    } catch (error) {
      log(t('memInvalidValue', `${i + 1}: ${error.message}`), 'error');
      input.setAttribute('aria-invalid', 'true');
      return;
    }
    if (wasEmpty) {
      replaceRow(tr, 'name');
      return;
    }
    // Normalize the edited field in place so keyboard focus is not lost.
    const ch = M.decodeChannel(image, i);
    if (field === 'freq' || field === 'offset') input.value = M.formatMHz(ch[field]);
    else if (field === 'name' || field === 'txTone' || field === 'rxTone') input.value = ch[field];
    tr.classList.toggle('mem-dirty', Boolean(radioImage && M.channelDirty(radioImage, image, i)));
    updateState();
  });

  listNames.addEventListener('change', event => {
    const input = event.target;
    const list = Number(input.dataset.list);
    try {
      M.setListName(image, list, input.value);
      input.removeAttribute('aria-invalid');
    } catch (error) {
      log(t('memInvalidValue', `${t('memListName', list)}: ${error.message}`), 'error');
      input.setAttribute('aria-invalid', 'true');
      return;
    }
    input.value = M.getListName(image, list);
    input.closest('label').classList.toggle('mem-dirty', M.getListName(radioImage, list) !== M.getListName(image, list));
    // Refresh the scan list labels in the table without moving focus.
    body.querySelectorAll('select[data-field="scanlist"]').forEach(select => {
      select.options[list].textContent = `${list} ${M.getListName(image, list)}`.trim();
    });
    updateState();
  });

  // ---------- Selection and table editing ----------
  function visibleIndices() {
    return Array.from(body.querySelectorAll('tr[data-index]'), tr => Number(tr.dataset.index));
  }

  function updateSelection() {
    for (const i of selected) if (i >= M.CHANNEL_COUNT) selected.delete(i);
    body.querySelectorAll('tr[data-index]').forEach(tr => {
      const on = selected.has(Number(tr.dataset.index));
      tr.classList.toggle('mem-selected', on);
      tr.querySelector('[data-select]').checked = on;
    });
    const visible = visibleIndices();
    selectAll.checked = visible.length > 0 && visible.every(i => selected.has(i));
    selectionCount.textContent = t('memSelected', selected.size);
    const none = selected.size === 0;
    selectionBar.querySelectorAll('[data-edit]').forEach(button => {
      button.disabled = none || (button.dataset.edit === 'paste' && !clipboard);
    });
    $('memBulkApply').disabled = none;
  }

  function renderBulkValue() {
    const sample = [...selected].map(i => M.decodeChannel(image, i)).find(Boolean) || M.defaultChannel();
    bulkValue.innerHTML = cellHtml(bulkField.value, sample, t('memBulkValue'));
  }

  bulkField.innerHTML = BULK_FIELDS.map(field => `<option value="${field}" data-i18n="${FIELD_LABELS[field]}">${escapeHtml(t(FIELD_LABELS[field]))}</option>`).join('');
  bulkField.addEventListener('change', renderBulkValue);

  body.addEventListener('click', event => {
    const box = event.target.closest('[data-select]');
    if (!box) return;
    const i = Number(box.closest('tr').dataset.index);
    if (event.shiftKey && lastClicked !== null) {
      const visible = visibleIndices();
      const [a, b] = [visible.indexOf(lastClicked), visible.indexOf(i)].sort((x, y) => x - y);
      visible.slice(a, b + 1).forEach(n => (box.checked ? selected.add(n) : selected.delete(n)));
    } else if (box.checked) {
      selected.add(i);
    } else {
      selected.delete(i);
    }
    lastClicked = i;
    updateSelection();
  });

  selectAll.addEventListener('change', () => {
    visibleIndices().forEach(i => (selectAll.checked ? selected.add(i) : selected.delete(i)));
    updateSelection();
  });

  function sortedSelection() {
    return [...selected].sort((a, b) => a - b);
  }

  const edits = {
    up: () => moveSelection(-1),
    down: () => moveSelection(1),
    insert: () => {
      const at = sortedSelection()[0];
      if (!M.isEmpty(image, M.CHANNEL_COUNT - 1)) throw new Error(t('memLastInUse', M.CHANNEL_COUNT));
      M.insertChannel(image, at);
      selected.clear();
      selected.add(at);
    },
    removeShift: () => {
      sortedSelection().reverse().forEach(i => M.removeChannel(image, i));
      selected.clear();
    },
    copy: () => {
      clipboard = sortedSelection().map(i => M.copyChannel(image, i));
      log(t('memCopied', clipboard.length), 'info');
    },
    paste: () => {
      const at = sortedSelection()[0];
      if (at + clipboard.length > M.CHANNEL_COUNT) throw new Error(t('memPasteOverflow', at + 1, clipboard.length));
      M.pasteChannels(image, at, clipboard);
      selected.clear();
      clipboard.forEach((_, k) => selected.add(at + k));
    }
  };

  function moveSelection(delta) {
    const moved = M.moveChannels(image, sortedSelection(), delta);
    selected.clear();
    moved.forEach(i => selected.add(i));
  }

  selectionBar.addEventListener('click', event => {
    const button = event.target.closest('[data-edit]');
    if (!button || !image) return;
    try {
      edits[button.dataset.edit]();
    } catch (error) {
      log(t('error', error.message), 'error');
      return;
    }
    if (button.dataset.edit !== 'copy') render();
    updateSelection();
  });

  $('memBulkApply').addEventListener('click', () => {
    const input = bulkValue.querySelector('[data-field]');
    let value;
    try {
      value = fieldValue(input);
    } catch (error) {
      log(t('memInvalidValue', error.message), 'error');
      return;
    }
    let changed = 0;
    for (const i of sortedSelection()) {
      const ch = M.decodeChannel(image, i);
      if (!ch) continue;
      try {
        M.encodeChannel(image, i, Object.assign(ch, { [bulkField.value]: value }));
        changed++;
      } catch (error) {
        log(t('memInvalidValue', `${i + 1}: ${error.message}`), 'error');
      }
    }
    log(t('memBulkDone', changed), changed ? 'success' : 'info');
    render();
  });

  body.addEventListener('click', event => {
    const button = event.target.closest('button[data-action="delete"]');
    if (!button) return;
    const tr = button.closest('tr');
    M.encodeChannel(image, Number(tr.dataset.index), null);
    replaceRow(tr, 'freq');
  });

  showEmpty.addEventListener('change', render);

  readBtn.addEventListener('click', () => {
    if (radioImage && counts().dirty > 0 && !window.confirm(t('memDiscardConfirm'))) return;
    void flash.runEepromOperation('read-memories', false, async radio => {
      log(t('memReading'), 'info');
      const data = await radio.read(0, M.IMAGE_SIZE,
        done => radio.progress(Math.round((done / M.IMAGE_SIZE) * 100)));
      radioImage = data;
      image = data.slice();
      selected.clear();
      render();
      log(t('memReadComplete', counts().used), 'success');
    });
  });

  writeBtn.addEventListener('click', () => {
    const target = image.slice();   // edits made while writing wait for the next write
    const runs = M.dirtyRuns(radioImage, target);
    if (!runs.length) {
      log(t('memNoChanges'), 'info');
      return;
    }
    void flash.runEepromOperation('write-memories', true, async radio => {
      const total = runs.reduce((sum, run) => sum + run.length, 0);
      let done = 0;
      log(t('memWriting', total), 'info');
      for (const run of runs) {
        await radio.writeVerified(run.offset, target.subarray(run.offset, run.offset + run.length));
        done += run.length;
        radio.progress(Math.round((done / total) * 100));
      }
      radioImage = target;
      render();
      log(t('memWriteComplete', total), 'success');
      await radio.reboot();
    });
  });

  // Shared CHIRP CSV lists offered in the URL box. Hosts must allow CORS
  // (raw.githubusercontent.com and GitHub Pages do).
  const SOURCES = [
    // { name: 'W8LBZ club repeaters', url: 'https://raw.githubusercontent.com/W8LBZ/<repo>/main/<list>.csv' },
  ];
  const sourceList = $('memSourceList');
  SOURCES.forEach(s => {
    const option = document.createElement('option');
    option.value = s.url;
    option.label = s.name;
    sourceList.append(option);
  });

  function importCsvText(text) {
    try {
      const { imported, errors, warnings, duplicates } = M.importChirpCsv(image, text, {
        mode: importMode.value, dedupe: skipDuplicates.checked
      });
      errors.forEach(e => log(t('memImportRowError', e.line, e.message), 'error'));
      warnings.forEach(w => log(t('memImportRowWarning', w.line, w.message), 'info'));
      if (duplicates) log(t('memImportDuplicates', duplicates), 'info');
      log(t('memImportComplete', imported, errors.length), imported ? 'success' : 'error');
    } catch (e) {
      log(t('error', e?.message ?? String(e)), 'error');
    }
    render();
  }

  importBtn.addEventListener('click', () => csvInput.click());
  csvInput.addEventListener('change', async () => {
    const file = csvInput.files[0];
    csvInput.value = '';
    if (file) importCsvText(await file.text());
  });

  loadUrlBtn.addEventListener('click', async () => {
    const url = sourceUrl.value.trim();
    if (!url) return;
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      importCsvText(await response.text());
    } catch (e) {
      log(t('memUrlFailed', url, e?.message ?? String(e)), 'error');
    }
  });

  exportBtn.addEventListener('click', () => {
    download(M.exportChirpCsv(image), 'memories.csv', 'text/csv');
  });

  saveBtn.addEventListener('click', () => {
    download(image, 'memories.bin', 'application/octet-stream');
  });

  openBtn.addEventListener('click', () => binInput.click());
  binInput.addEventListener('change', async () => {
    const file = binInput.files[0];
    binInput.value = '';
    if (!file) return;
    const data = new Uint8Array(await file.arrayBuffer());
    if (data.length !== M.IMAGE_SIZE && data.length !== M.LEGACY_IMAGE_SIZE) {
      log(t('memBackupSize', M.IMAGE_SIZE), 'error');
      return;
    }
    // Older backups stop before the scan list names: keep the current ones.
    const next = image.slice();
    next.set(data);
    image = next;
    render();
    log(t('memBackupLoaded', file.name), 'success');
  });

  window.addEventListener('uvstudio:serialstatechange', event => {
    busy = Boolean(event.detail?.operation);
    updateState();
  });
  window.addEventListener('uvstudio:languagechange', render);
  updateState();
})();

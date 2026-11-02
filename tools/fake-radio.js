// Fake UV-K5 (F4HWN v6.2.0) on a fake Web Serial port, speaking the real framed, obfuscated
// protocol: handshake, EEPROM read/write, reboot. Covers Memories, Radio settings, their backups,
// and calibration read/restore; not the Live Viewer, flashing, or apps. Used by tools/smoke.js.
// By hand: open UV Studio in Chrome, paste this file into the DevTools console (or save it as a
// DevTools Snippet), then press Connect.
// window.fakeRadio is the EEPROM; set window.fakeAesKey = true to act as a locked radio.
(() => {
  const M = window.UVSTUDIO_MEMORIES;
  const S = window.UVSTUDIO_SETTINGS;
  const OB = [0x16,0x6C,0x14,0xE6,0x2E,0x91,0x0D,0x40,0x21,0x35,0xD5,0x40,0x13,0x03,0xE9,0x80];
  const radio = new Uint8Array(0x10000).fill(0xFF);
  radio.fill(0, 0xA000, 0xA178); radio[0xA001] = 3; radio[0xA002] = 11; radio[0xA0C3] = 0; radio[0xA15F] = 0x62;
  radio.set(new TextEncoder().encode('W8LBZ'), 0xA0C8);
  for (let i = 0; i < 512; i++) radio[0xB000 + i] = (i * 7 + 3) & 0xFF;   // calibration (v5+ offset)
  M.encodeChannel(radio, 0, Object.assign(M.defaultChannel(), { name: 'CALLING', freq: 145500000 }));
  M.encodeChannel(radio, 1, Object.assign(M.defaultChannel(), { name: 'RPT', freq: 145600000, offset: 600000, duplex: '-', txTone: '88.5', mode: 'NFM' }));
  M.encodeChannel(radio, 9, Object.assign(M.defaultChannel(), { name: 'PMR1', freq: 446006250, mode: 'NFM', power: 1 }));
  M.encodeChannel(radio, M.CHANNEL_COUNT + 4, Object.assign(M.defaultChannel(), { name: '', freq: 146520000 }));   // VFO A 137
  window.fakeRadio = radio;
  window.radioLog = [];
  window.fakeAesKey = false;
  let ctrl, ts = 0, rx = [];
  const reply = (type, data) => {
    const msg = new Uint8Array(4 + data.length + 2);
    new DataView(msg.buffer).setUint16(0, type, true);
    new DataView(msg.buffer).setUint16(2, data.length, true);
    msg.set(data, 4);
    msg[msg.length - 2] = 0xFF; msg[msg.length - 1] = 0xFF;
    for (let i = 0; i < msg.length; i++) msg[i] ^= OB[i % 16];
    const len = msg.length - 2;
    const pkt = new Uint8Array(4 + msg.length + 2);
    pkt.set([0xAB, 0xCD, len & 0xFF, len >> 8]); pkt.set(msg, 4); pkt.set([0xDC, 0xBA], 4 + msg.length);
    // split delivery to exercise partial-frame parsing
    const cut = Math.floor(pkt.length / 2);
    setTimeout(() => { ctrl.enqueue(pkt.slice(0, cut)); setTimeout(() => ctrl.enqueue(pkt.slice(cut)), 2); }, 3);
  };
  const handle = () => {
    for (;;) {
      const i = rx.findIndex((b, k) => b === 0xAB && rx[k + 1] === 0xCD);
      if (i < 0 || rx.length < i + 4) return;
      const len = rx[i + 2] | (rx[i + 3] << 8);
      if (rx.length < i + 4 + len + 4) return;
      const body = rx.slice(i + 4, i + 4 + len).map((b, k) => b ^ OB[k % 16]);
      rx = rx.slice(i + 4 + len + 4);
      const dv = new DataView(Uint8Array.from(body).buffer);
      const type = dv.getUint16(0, true);
      radioLog.push(type.toString(16));
      if (type === 0x0514) {
        ts = dv.getUint32(4, true);
        const d = new Uint8Array(36); d.set(new TextEncoder().encode('F4HWN v6.2.0')); d[16] = fakeAesKey ? 1 : 0;
        reply(0x0515, d);
      } else if (type === 0x051B) {
        const off = dv.getUint16(4, true), size = body[6];
        if (dv.getUint32(8, true) !== ts) continue;
        const d = new Uint8Array(4 + size); d[0] = off & 0xFF; d[1] = off >> 8; d[2] = size;
        if (!fakeAesKey) d.set(radio.subarray(off, off + size), 4);
        reply(0x051C, d);
      } else if (type === 0x051D) {
        const off = dv.getUint16(4, true), size = body[6];
        if (dv.getUint32(8, true) !== ts) continue;
        if (!fakeAesKey) for (let k = 0; k + 8 <= size; k += 8) radio.set(body.slice(12 + k, 20 + k), off + k);
        reply(0x051E, new Uint8Array([off & 0xFF, off >> 8]));
      }
    }
  };
  const fakePort = {
    readable: null, writable: null,
    async open() {
      this.readable = new ReadableStream({ start(c) { ctrl = c; } });
      this.writable = new WritableStream({ write(chunk) { rx.push(...chunk); handle(); } });
    },
    async close() {}, getInfo() { return { usbVendorId: 0x1a86, usbProductId: 0x7523 }; }, async forget() {}
  };
  Object.defineProperty(navigator, 'serial', { configurable: true,
    value: { requestPort: async () => (window.pickerCount = (window.pickerCount || 0) + 1, fakePort),
      getPorts: async () => (window.pickerCount ? [fakePort] : []), addEventListener() {} } });
  window.dispatchEvent(new CustomEvent('uvstudio:serialstatechange', { detail: {} }));
})();

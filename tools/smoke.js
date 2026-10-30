// Headless smoke test of the Memories and Settings panels against a fake radio that speaks the
// real framed/obfuscated serial protocol. Drives Chrome over CDP, no npm deps.
// Usage: node tools/smoke.js index.html <out-dir>   (screenshots -> <out-dir>/memories.png, settings.png)
// CHROME env var overrides the headless shell path. MOBILE=1 runs at phone size (412 x 915, Pixel 9)
// and adds vfos.png and live.png.
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const shell = process.env.CHROME || path.join(os.homedir(), '.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell');
const page = 'file://' + path.resolve(process.argv[2]) + '#memories';
const outDir = process.argv[3];
const port = 9333;

const proc = spawn(shell, [`--remote-debugging-port=${port}`, '--headless', '--no-sandbox', '--window-size=1400,1000',
  `--user-data-dir=${path.join(outDir, 'profile')}`, 'about:blank'], { stdio: 'ignore' });

const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  let targets;
  for (let i = 0; i < 50; i++) {
    try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); break; } catch { await sleep(200); }
  }
  const ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener('open', r));
  let id = 0;
  const pending = new Map();
  const errors = [];
  ws.addEventListener('message', ({ data }) => {
    const msg = JSON.parse(data);
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
    if (msg.method === 'Runtime.exceptionThrown') errors.push(msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text);
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') errors.push(msg.params.args.map(a => a.value ?? a.description).join(' '));
  });
  const send = (method, params = {}) => new Promise(r => { const n = ++id; pending.set(n, r); ws.send(JSON.stringify({ id: n, method, params })); });
  const evaluate = async expr => {
    const res = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
    if (res.result.exceptionDetails) throw new Error(res.result.exceptionDetails.exception?.description);
    return res.result.result.value;
  };

  await send('Runtime.enable');
  await send('Page.enable');
  const mobile = Boolean(process.env.MOBILE);
  await send('Emulation.setDeviceMetricsOverride', mobile
    ? { width: 412, height: 915, deviceScaleFactor: 2, mobile: true }
    : { width: 1400, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: page });
  await sleep(1500);

  // Fake radio on a fake Web Serial port speaking the real framed, obfuscated protocol.
  await evaluate(`(() => {
    const M = window.UVSTUDIO_MEMORIES;
    const S = window.UVSTUDIO_SETTINGS;
    const OB = [0x16,0x6C,0x14,0xE6,0x2E,0x91,0x0D,0x40,0x21,0x35,0xD5,0x40,0x13,0x03,0xE9,0x80];
    const radio = new Uint8Array(0x10000).fill(0xFF);
    radio.fill(0, 0xA000, 0xA178); radio[0xA001] = 3; radio[0xA002] = 11; radio[0xA0C3] = 0; radio[0xA15F] = 0x62;
    radio.set(new TextEncoder().encode('W8LBZ'), 0xA0C8);
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
  })()`);

  const waitIdle = async () => { await sleep(300); for (let i = 0; i < 300; i++) { if (await evaluate("document.getElementById('studioSerialStatus').dataset.operation !== 'true'")) return; await sleep(100); } throw new Error('operation never finished'); };
  const state = () => evaluate(`({
    rows: document.querySelectorAll('#memTableBody tr').length,
    summary: document.getElementById('memSummary').textContent,
    write: !document.getElementById('memWriteBtn').disabled,
    visible: document.getElementById('memories-content').offsetParent !== null,
    dirty: document.querySelectorAll('#memTableBody tr.mem-dirty').length
  })`);

  console.log('before read', await state(), await evaluate("document.getElementById('memReadBtn').disabled"), errors);
  await evaluate(`document.getElementById('memReadBtn').click()`);
  await waitIdle();
  if (mobile) {
    await evaluate(`document.getElementById('memories-content').scrollIntoView()`);
    const shotTop = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(outDir, 'memories-top.png'), Buffer.from(shotTop.result.data, 'base64'));
  }
  console.log('after read', await state(), await evaluate("document.getElementById('log').textContent.slice(-600)"), errors);

  // Staged import pulses Write; Discard stops the pulse and Undo brings it back. Discard again after.
  const pulse = () => evaluate(`document.getElementById('memWriteBtn').classList.contains('mem-write-reminder')`);
  const click = id => evaluate(`document.getElementById('${id}').click()`);
  await evaluate(`document.getElementById('memSourceUrl').value = 'data:text/csv,Location%2CName%2CFrequency%0A1%2CSMOKE%2C146.430000'`);
  await click('memLoadUrlBtn');
  await sleep(300);
  const ready = await evaluate(`document.getElementById('memImportStatus').textContent`);
  await evaluate(`document.getElementById('memImportMode').value = 'append'`);
  await click('memImportApplyBtn');
  const pulses = [await pulse()];
  await click('memDiscardBtn');
  pulses.push(await pulse());
  await click('memUndoBtn');
  pulses.push(await pulse());
  await click('memDiscardBtn');
  console.log('import pulse (import, discard, undo)', ready, pulses);
  if (ready !== 'Ready to import: data:text/csv' || pulses.join() !== 'true,false,true') throw new Error('staged import / pulse broken');

  // Edit RX tone + name on channel 2, add channel 5 with show-empty.
  await evaluate(`(() => {
    const set = (sel, v) => { const el = document.querySelector(sel); el.value = v; el.dispatchEvent(new Event('change', { bubbles: true })); };
    set('tr[data-index="1"] [data-field="rxTone"]', '88.5');
    set('tr[data-index="1"] [data-field="name"]', 'RPT TSQL');
    set('tr[data-index="1"] [data-field="txTone"]', '88.6');   // invalid -> logged, untouched
    set('tr[data-index="1"] [data-field="busy"]', '');
    document.querySelector('tr[data-index="1"] [data-field="busy"]').checked = true;
    document.querySelector('tr[data-index="1"] [data-field="busy"]').dispatchEvent(new Event('change', { bubbles: true }));
    set('tr[data-index="1"] [data-field="pttId"]', '1');
    set('[data-list="2"]', 'RPT');
  })()`);
  console.log('after edit', await state());
  await evaluate(`(() => { const c = document.getElementById('memShowEmpty'); c.checked = true; c.dispatchEvent(new Event('change')); })()`);
  await evaluate(`(() => { const el = document.querySelector('tr[data-index="4"] [data-field="freq"]'); el.value = '433.5'; el.dispatchEvent(new Event('change', { bubbles: true })); })()`);
  console.log('after add', await state(), await evaluate(`document.activeElement?.dataset.field`));
  await evaluate(`(() => { const c = document.getElementById('memShowEmpty'); c.checked = false; c.dispatchEvent(new Event('change')); })()`);

  // Widest values must fit their cells without scrolling (DCS tone, 10-char name, 4-digit MHz).
  console.log('clipped inputs', await evaluate(`(() => {
    const set = (sel, v) => { const el = document.querySelector(sel); el.value = v; };
    set('tr[data-index="0"] [data-field="txTone"]', 'D023N');
    set('tr[data-index="0"] [data-field="rxTone"]', '100.0');
    set('tr[data-index="0"] [data-field="name"]', 'WWWWWWWWWW');
    set('tr[data-index="0"] [data-field="freq"]', '1234.56789');
    const clipped = [...document.querySelectorAll('#memTableBody tr[data-index="0"] input:not([type])')]
      .filter(el => el.scrollWidth > el.clientWidth).map(el => el.dataset.field);
    document.getElementById('memShowEmpty').dispatchEvent(new Event('change'));   // re-render from the image
    return clipped;
  })()`));

  // CSV import: choosing a file only stages it; Import into table applies it and Write pulses.
  const imp = await evaluate(`(async () => {
    const input = document.getElementById('memCsvFile');
    const dt = new DataTransfer();
    dt.items.add(new File(['Location,Name,Frequency,Duplex,Offset,Tone,rToneFreq,cToneFreq,DtcsCode,DtcsPolarity,Mode,TStep,Skip,Comment\\n1,SMOKE,145.500000,,0.000000,,88.5,88.5,023,NN,FM,5.00,,\\n'], 'smoke.csv'));
    input.files = dt.files;
    input.dispatchEvent(new Event('change'));
    await new Promise(r => setTimeout(r, 100));
    const apply = document.getElementById('memImportApplyBtn');
    const staged = { status: document.getElementById('memImportStatus').textContent, applyEnabled: !apply.disabled,
      rows: document.querySelectorAll('#memTableBody tr').length };
    document.getElementById('memImportMode').value = 'append';
    apply.click();
    return { staged, rows: document.querySelectorAll('#memTableBody tr').length, applyEnabled: !apply.disabled,
      pulse: document.getElementById('memWriteBtn').classList.contains('mem-write-reminder') };
  })()`);
  console.log('csv import', JSON.stringify(imp));
  if (!imp.staged.applyEnabled || imp.rows !== imp.staged.rows + 1 || imp.applyEnabled || !imp.pulse) throw new Error('CSV import flow broken');
  const view = await evaluate(`(() => {
    const order = () => [...document.querySelectorAll('#memTableBody tr')].map(tr => tr.dataset.index).join(',');
    const sort = document.getElementById('memSort');
    const byChannel = order();
    sort.value = 'freq'; sort.dispatchEvent(new Event('change'));
    const byFreq = [...document.querySelectorAll('#memTableBody [data-field="freq"]')].map(el => parseFloat(el.value));
    sort.value = 'channel'; sort.dispatchEvent(new Event('change'));
    const dupBox = document.getElementById('memShowDups');
    dupBox.checked = false; dupBox.dispatchEvent(new Event('change'));
    const dupsOff = document.querySelectorAll('#memTableBody tr.mem-dup-freq, #memTableBody tr.mem-dup-name').length;
    dupBox.checked = true; dupBox.dispatchEvent(new Event('change'));
    return { byChannel, back: order(), byFreq, dupsOff, dups: [...document.querySelectorAll('#memTableBody tr.mem-dup-freq, #memTableBody tr.mem-dup-name')]
      .map(tr => tr.dataset.index + ':' + tr.className.match(/mem-dup-\\w+/g).join('+')) };
  })()`);
  console.log('sort/dups', JSON.stringify(view));
  if (view.dups.length < 2 || view.dupsOff || view.back !== view.byChannel || view.byFreq.some((f, k) => k && f < view.byFreq[k - 1])) throw new Error('sort broken');

  if (mobile) await evaluate(`document.querySelector('tr[data-index="1"] .mem-card-summary').click(); document.querySelector('tr[data-index="0"]').scrollIntoView()`);
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(outDir, 'memories.png'), Buffer.from(shot.result.data, 'base64'));
  if (mobile) {
    await evaluate(`(() => { const box = document.getElementById('memVfoBox'); box.open = true; box.scrollIntoView(); document.querySelector('#memVfoBody .mem-card-summary').click(); })()`);
    console.log('vfo card opens', await evaluate(`document.querySelector('#memVfoBody tr.mem-open') !== null`));
    await sleep(300);
    const shotVfo = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(outDir, 'vfos.png'), Buffer.from(shotVfo.result.data, 'base64'));
  }

  await evaluate(`document.getElementById('memWriteBtn').click()`);
  // First write: the one-time license acknowledgement opens; agreeing re-presses Write.
  await sleep(300);
  console.log('license gate', await evaluate(`document.getElementById('licenseAckModal').classList.contains('show')`));
  await evaluate(`document.getElementById('licenseAckAgree').click()`);
  await waitIdle();
  console.log('after write', await state(), await evaluate("JSON.stringify(radioLog.reduce((m, k) => (m[k] = (m[k] || 0) + 1, m), {}))"));
  if (await evaluate(`document.getElementById('memWriteBtn').classList.contains('mem-write-reminder')`)) throw new Error('Write still pulses after writing');
  console.log('radio ch2', await evaluate('JSON.stringify(UVSTUDIO_MEMORIES.decodeChannel(fakeRadio, 1))'));
  console.log('list 2 name', await evaluate("UVSTUDIO_MEMORIES.getListName(fakeRadio, 2)"),
    await evaluate("document.querySelector('tr[data-index=\"0\"] [data-field=\"scanlist\"]').options[2].textContent"));
  console.log('radio ch5', await evaluate('JSON.stringify(UVSTUDIO_MEMORIES.decodeChannel(fakeRadio, 4))'));
  console.log('csv', JSON.stringify(await evaluate('UVSTUDIO_MEMORIES.exportChirpCsv(fakeRadio)')));
  const undo = await evaluate(`(() => {
    const name = () => document.querySelector('tr[data-index="0"] [data-field="name"]').value;
    const before = name();
    const el = document.querySelector('tr[data-index="0"] [data-field="name"]');
    el.value = 'UNDOME'; el.dispatchEvent(new Event('change', { bubbles: true }));
    const edited = name();
    document.getElementById('memDiscardBtn').click();
    const discarded = name();
    document.getElementById('memUndoBtn').click();
    const undone = name();
    document.getElementById('memDiscardBtn').click();
    return { before, edited, discarded, undone, discardOff: document.getElementById('memDiscardBtn').disabled };
  })()`);
  console.log('undo/discard', JSON.stringify(undo));
  if (undo.discarded !== undo.before || undo.undone !== 'UNDOME' || !undo.discardOff) throw new Error('undo/discard broken');
  console.log('log tail', await evaluate(`Array.from(document.querySelectorAll('#log *')).slice(-6).map(e => e.textContent).join(' | ')`));
  await evaluate("radioLog.length = 0; fakeAesKey = true; document.getElementById('memReadBtn').click()");
  await waitIdle();
  console.log('locked', await evaluate("radioLog.join(',')"), await evaluate("Array.from(document.getElementById('log').children).slice(-6).map(e => e.textContent).join(' | ')"));
  // ---- Settings panel
  await evaluate("radioLog.length = 0; fakeAesKey = false; location.hash = 'settings'");
  await sleep(500);
  await evaluate("document.getElementById('setReadBtn').click()");
  await waitIdle();
  // Port reuse: only the first action may open the picker.
  const pickers = await evaluate('window.pickerCount');
  console.log('pickers', pickers);
  if (pickers !== 1) throw new Error(`expected 1 port picker, got ${pickers}`);
  console.log('settings read', await evaluate(`({ fields: document.querySelectorAll('#setForm [data-id]').length,
    sql: document.querySelector('[data-id="Sql"]').value, msg: document.querySelector('[data-id="Message 1"]').value,
    pwr: document.querySelector('[data-id="SetPwr"]').selectedOptions[0].textContent,
    summary: document.getElementById('setSummary').textContent })`));
  // ScMix's 24 checkboxes must stay inside their row at every width.
  const overflows = [];
  for (let width = 320; width <= 1400; width += 10) {
    await send('Emulation.setDeviceMetricsOverride', { width, height: 915, deviceScaleFactor: 1, mobile: width < 700 });
    await sleep(50);
    if (await evaluate(`(() => { const m = document.querySelector('[data-id="ScMix"]'), r = m.closest('details').getBoundingClientRect();
      return m.scrollWidth > m.clientWidth + 1 || m.getBoundingClientRect().right > r.right + 1; })()`)) overflows.push(width);
  }
  await send('Emulation.setDeviceMetricsOverride', mobile
    ? { width: 412, height: 915, deviceScaleFactor: 2, mobile: true }
    : { width: 1400, height: 1000, deviceScaleFactor: 1, mobile: false });
  console.log('ScMix overflow widths', overflows);
  if (overflows.length) throw new Error(`ScMix overflows at ${overflows.join(', ')} px`);
  const service = () => evaluate(`Boolean(document.querySelector('[data-id="F Lock"]'))`);
  const hiddenBefore = !(await service());
  await evaluate(`(() => { const v = document.getElementById('studioVersion'); for (let i = 0; i < 5; i++) v.click(); })()`);
  console.log('service group', { hiddenBefore, shownAfter: await service() });
  if (!hiddenBefore || !(await service())) throw new Error('Service group reveal broken');
  await evaluate(`(() => {
    const set = (id, v) => { const el = document.querySelector('[data-id="' + id + '"]'); el.value = v; el.dispatchEvent(new Event('change', { bubbles: true })); };
    set('Sql', '6'); set('RxMode', '1'); set('Message 2', 'HELLO'); set('UPCode', '12E');
    const mix = document.querySelector('[data-id="ScMix"] [data-bit="2"]'); mix.checked = false;
    mix.dispatchEvent(new Event('change', { bubbles: true }));
  })()`);
  console.log('settings edited', await evaluate(`({ summary: document.getElementById('setSummary').textContent,
    dirty: document.querySelectorAll('.set-dirty').length, invalid: document.querySelectorAll('[aria-invalid="true"]').length })`));
  const shot2 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(outDir, 'settings.png'), Buffer.from(shot2.result.data, 'base64'));
  await evaluate("document.getElementById('setWriteBtn').click()");
  await waitIdle();
  console.log('settings written', await evaluate(`JSON.stringify({ sql: fakeRadio[0xA001], dual: fakeRadio[0xA00C], cross: fakeRadio[0xA00A],
    msg2: new TextDecoder().decode(fakeRadio.subarray(0xA0D8, 0xA0DD)), up: fakeRadio[0xA110],
    mix: Array.from(fakeRadio.subarray(0xA170, 0xA177)),
    cmds: radioLog.reduce((m, k) => (m[k] = (m[k] || 0) + 1, m), {}) })`));
  // ---- Table editing: select channels 1-2, move down, bulk power, copy/paste
  await evaluate("location.hash = 'memories'");
  await sleep(500);
  await evaluate("document.getElementById('memReadBtn').click()");
  await waitIdle();
  await evaluate(`(() => {
    const click = (sel, opts = {}) => document.querySelector(sel).dispatchEvent(new MouseEvent('click', Object.assign({ bubbles: true }, opts)));
    click('tr[data-index="0"] [data-select]');
    click('tr[data-index="1"] [data-select]', { shiftKey: true });
    document.querySelector('[data-edit="down"]').click();
    const field = document.getElementById('memBulkField'); field.value = 'power'; field.dispatchEvent(new Event('change'));
    document.querySelector('#memBulkValue select').value = '1';
    document.getElementById('memBulkApply').click();
    document.querySelector('[data-edit="copy"]').click();
  })()`);
  if (mobile) {   // phone: the edit menu stands in for the buttons
    console.log('edit menu', await evaluate(`(() => {
      const menu = document.getElementById('memEditMenu');
      const shown = getComputedStyle(menu).display !== 'none' && getComputedStyle(document.querySelector('[data-edit="up"]')).display === 'none';
      const bar = document.getElementById('memSelectionBar');
      window.scrollBy(0, bar.getBoundingClientRect().top + 300);   // scroll the bar's spot off the top
      const barTop = bar.getBoundingClientRect().top;
      return { shown, pasteEnabled: !menu.querySelector('option[value="paste"]').disabled, barTop: Math.round(barTop) };
    })()`));
  }
  console.log('edited table', await evaluate(`({ selected: document.getElementById('memSelectionCount').textContent,
    rows: Array.from(document.querySelectorAll('#memTableBody tr')).map(tr => tr.dataset.index + ':' + (tr.querySelector('[data-field="name"]')?.value ?? '-')).join(' ') })`));
  const shot3 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(outDir, 'table-edit.png'), Buffer.from(shot3.result.data, 'base64'));
  await evaluate("document.getElementById('memWriteBtn').click()");
  await waitIdle();
  console.log('table written', await evaluate(`JSON.stringify([0, 1, 2].map(i => { const c = UVSTUDIO_MEMORIES.decodeChannel(fakeRadio, i); return c && (c.name + '/' + c.power); }))`));
  if (mobile) {
    await evaluate("location.hash = 'live'");
    await sleep(800);
    const shot4 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(outDir, 'live.png'), Buffer.from(shot4.result.data, 'base64'));
  }
  console.log('page errors', errors);
  if (errors.length) process.exitCode = 1;
  ws.close();
  proc.kill();
})().catch(e => { console.error(e); proc.kill(); process.exit(1); });

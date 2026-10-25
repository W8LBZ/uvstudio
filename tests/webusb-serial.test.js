const test = require('node:test');
const assert = require('node:assert');
const { ch34xDivisor } = require('../js/webusb-serial.js');

test('CH340 divisor matches the Linux ch341 driver', () => {
  assert.strictEqual(ch34xDivisor(38400), 0x6483);
  assert.strictEqual(ch34xDivisor(9600), 0xb282);
  assert.strictEqual(ch34xDivisor(115200), 0xcc83);
});

test('installs navigator.serial over a fake CH340 and moves bytes both ways', async () => {
  const { install } = require('../js/webusb-serial.js');
  const controls = [];
  const sent = [];
  let release;
  const incoming = [[0x01, 0x02], [], [0x03], new Promise(resolve => { release = resolve; })];
  const device = {
    vendorId: 0x1a86, productId: 0x7523, opened: false, configuration: null,
    async open() { this.opened = true; },
    async close() { this.opened = false; },
    async selectConfiguration() {
      this.configuration = { interfaces: [{ interfaceNumber: 0, alternate: { endpoints: [
        { type: 'interrupt', direction: 'in', endpointNumber: 1 },
        { type: 'bulk', direction: 'in', endpointNumber: 2, packetSize: 32 },
        { type: 'bulk', direction: 'out', endpointNumber: 2 }
      ] } }] };
    },
    async claimInterface() {},
    async controlTransferIn() { return { data: new DataView(new Uint8Array([0x31, 0]).buffer) }; },
    async controlTransferOut(setup) { controls.push([setup.request, setup.value, setup.index]); },
    async transferIn(ep, length) {
      assert.strictEqual(ep, 2);
      assert.strictEqual(length, 32);
      const bytes = await incoming.shift();
      if (!bytes) return new Promise(() => {});
      return { status: 'ok', data: new DataView(new Uint8Array(bytes).buffer) };
    },
    async transferOut(ep, data) { sent.push(ep, ...data); return { status: 'ok' }; }
  };
  const usb = new EventTarget();
  usb.requestDevice = async () => device;
  usb.getDevices = async () => [device, { vendorId: 0x1234, productId: 1 }];
  const saved = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  Object.defineProperty(globalThis, 'navigator', { value: { usb }, configurable: true });
  try {
    install();
    const port = await navigator.serial.requestPort();
    assert.deepStrictEqual(await navigator.serial.getPorts(), [port]);
    assert.deepStrictEqual(port.getInfo(), { usbVendorId: 0x1a86, usbProductId: 0x7523 });
    await port.open({ baudRate: 38400 });
    assert.deepStrictEqual(controls, [[0xa1, 0, 0], [0x9a, 0x1312, 0x6483], [0x9a, 0x2518, 0xc3], [0xa4, 0xff9f, 0]]);

    const reader = port.readable.getReader();
    assert.deepStrictEqual([...(await reader.read()).value], [1, 2]);
    assert.deepStrictEqual([...(await reader.read()).value], [3]);
    const writer = port.writable.getWriter();
    await writer.write(new Uint8Array([9, 8]));
    assert.deepStrictEqual(sent, [2, 9, 8]);

    // Bytes that arrive after a reader cancels go to the next reader.
    const pending = reader.read();
    await reader.cancel();
    assert.ok((await pending).done);
    reader.releaseLock();
    release([0x04]);
    await new Promise(resolve => setTimeout(resolve));   // lands before the next reader exists
    const next = port.readable.getReader();
    assert.deepStrictEqual([...(await next.read()).value], [4]);

    let unplugged = null;
    navigator.serial.addEventListener('disconnect', event => { unplugged = event.target; });
    const event = new Event('disconnect');
    event.device = device;
    usb.dispatchEvent(event);
    assert.strictEqual(unplugged, port);
    await next.cancel();
    await port.close();
    assert.strictEqual(port.readable, null);
  } finally {
    if (saved) Object.defineProperty(globalThis, 'navigator', saved);
    else delete globalThis.navigator;
  }
});

test('replaces native Web Serial on Android only', () => {
  const { install } = require('../js/webusb-serial.js');
  const saved = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  const native = new EventTarget();
  const run = userAgent => {
    const nav = { usb: new EventTarget(), serial: native, userAgent };
    Object.defineProperty(globalThis, 'navigator', { value: nav, configurable: true });
    install();
    return nav.serial;
  };
  try {
    assert.strictEqual(run('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/156.0.0.0'), native);
    assert.notStrictEqual(run('Mozilla/5.0 (Linux; Android 10; K) Chrome/156.0.0.0 Mobile'), native);
  } finally {
    if (saved) Object.defineProperty(globalThis, 'navigator', saved);
    else delete globalThis.navigator;
  }
});

/* Web Serial on top of WebUSB for the radio's CH340 USB-serial chip. Used where Web Serial is
   missing, and on Android, where Chrome 148+ has a native Web Serial that does not list the
   CH340 (vendor class, no Android driver): there it replaces navigator.serial. Desktop
   browsers keep their native Web Serial. Covers the subset UV Studio uses:
   requestPort, getPorts, connect/disconnect events, open({baudRate}), readable, writable,
   getInfo, close. Chip setup follows Linux drivers/usb/serial/ch341.c. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else api.install();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const FILTERS = [
    { vendorId: 0x1a86, productId: 0x7523 },  /* CH340 (verified on a UV-K5 V3 cable) */
    { vendorId: 0x1a86, productId: 0x5523 }   /* CH341 in serial mode, same protocol */
  ];
  const REQ_READ_VERSION = 0x5f;
  const REQ_WRITE_REG = 0x9a;
  const REQ_SERIAL_INIT = 0xa1;
  const REQ_MODEM_CTRL = 0xa4;
  const REG_PRESCALER_DIVISOR = 0x1312;
  const REG_LCR_LCR2 = 0x2518;
  const LCR_8N1 = 0xc3;            /* RX enable | TX enable | 8 data bits */
  const MCR_DTR_RTS = 0x60;
  const CLOCK = 48000000;

  /* ch341_get_divisor, plus bit 7: without it the chip holds RX data until 32 bytes arrive. */
  function ch34xDivisor(baud) {
    const clkDiv = (ps, fact) => 1 << (12 - 3 * ps - fact);
    let ps = 3;
    while (ps >= 0 && baud <= CLOCK / (clkDiv(ps, 1) * 512)) ps--;
    if (ps < 0) throw new RangeError(`Unsupported baud rate ${baud}`);
    let fact = 1;
    let clk = clkDiv(ps, 1);
    let div = Math.floor(CLOCK / (clk * baud));
    if (div < 9 || div > 255) { div = Math.floor(div / 2); clk *= 2; fact = 0; }
    if (div < 2) throw new RangeError(`Unsupported baud rate ${baud}`);
    if (Math.floor(16 * CLOCK / (clk * div)) - 16 * baud >=
        16 * baud - Math.floor(16 * CLOCK / (clk * (div + 1)))) div++;
    if (fact === 1 && div % 2 === 0) { div /= 2; fact = 0; }
    return ((0x100 - div) << 8 | fact << 2 | ps | 0x80) & 0xffff;
  }

  function matches(device) {
    return FILTERS.some(f => f.vendorId === device.vendorId && f.productId === device.productId);
  }

  function install() {
    if (typeof navigator === 'undefined' || !navigator.usb) return;
    if ('serial' in navigator && !/Android/.test(navigator.userAgent)) return;
    const serial = new EventTarget();
    const ports = new Map();   /* USBDevice -> port, so the same device is always the same port */

    function portFor(device) {
      if (!ports.has(device)) ports.set(device, new Ch34xPort(device));
      return ports.get(device);
    }

    /* Web Serial events bubble from the port, so listeners read the port from event.target. */
    function fire(type, port) {
      const event = new Event(type);
      Object.defineProperty(event, 'target', { value: port });
      serial.dispatchEvent(event);
    }

    class Ch34xPort {
      constructor(device) {
        this.device = device;
        this.rx = null;
        this.stream = null;
        this.sink = null;
      }

      getInfo() {
        return { usbVendorId: this.device.vendorId, usbProductId: this.device.productId };
      }

      async open(options) {
        const dev = this.device;
        if (dev.opened) throw new DOMException('The port is already open.', 'InvalidStateError');
        await dev.open();
        try {
          if (dev.configuration === null) await dev.selectConfiguration(1);
          const iface = dev.configuration.interfaces[0];
          await dev.claimInterface(iface.interfaceNumber);
          const bulk = dir => iface.alternate.endpoints.find(e => e.type === 'bulk' && e.direction === dir);
          this.epIn = bulk('in').endpointNumber;
          /* One packet per transfer: the CH340 sends no zero-length packet, so a longer transfer
             never ends when a reply is an exact multiple of the packet size (32 B). */
          this.packetIn = bulk('in').packetSize;
          this.epOut = bulk('out').endpointNumber;
          const control = (request, value, index) => dev.controlTransferOut(
            { requestType: 'vendor', recipient: 'device', request, value, index });
          const version = await dev.controlTransferIn(
            { requestType: 'vendor', recipient: 'device', request: REQ_READ_VERSION, value: 0, index: 0 }, 2);
          await control(REQ_SERIAL_INIT, 0, 0);
          await control(REQ_WRITE_REG, REG_PRESCALER_DIVISOR, ch34xDivisor(options.baudRate));
          if (version.data && version.data.getUint8(0) >= 0x30) await control(REQ_WRITE_REG, REG_LCR_LCR2, LCR_8N1);
          await control(REQ_MODEM_CTRL, ~MCR_DTR_RTS & 0xffff, 0);
        } catch (error) {
          try { await dev.close(); } catch (_) {}
          throw error;
        }
      }

      /* Recreated after a reader cancels, like Web Serial. One IN transfer is in flight at a
         time and survives a cancelled stream, so the next reader picks up its data.
         ponytail: one packet in flight; queue a few if fast streams drop bytes. */
      get readable() {
        if (!this.device.opened) return null;
        if (!this.stream) {
          const stream = new ReadableStream({
            /* Loops past empty transfers: a pull that enqueues nothing is not called again. */
            pull: async controller => {
              try {
                while (this.stream === stream) {
                  const result = await (this.rx ||= this.device.transferIn(this.epIn, this.packetIn));
                  this.rx = null;
                  if (this.stream !== stream) return;
                  if (result.status === 'stall') await this.device.clearHalt('in', this.epIn);
                  else if (result.data.byteLength) {
                    controller.enqueue(new Uint8Array(result.data.buffer, result.data.byteOffset, result.data.byteLength));
                    return;
                  }
                }
              } catch (error) {
                this.rx = null;
                if (this.stream === stream) { this.stream = null; controller.error(error); }
              }
            },
            cancel: () => { if (this.stream === stream) this.stream = null; }
          });
          this.stream = stream;
        }
        return this.stream;
      }

      get writable() {
        if (!this.device.opened) return null;
        if (!this.sink) {
          const sink = new WritableStream({
            write: async chunk => {
              const result = await this.device.transferOut(this.epOut, chunk);
              if (result.status === 'stall') throw new DOMException('USB write stalled.', 'NetworkError');
            },
            close: () => { if (this.sink === sink) this.sink = null; },
            abort: () => { if (this.sink === sink) this.sink = null; }
          });
          this.sink = sink;
        }
        return this.sink;
      }

      async close() {
        this.stream = null;
        this.sink = null;
        if (this.device.opened) await this.device.close();   /* rejects the pending transferIn */
      }
    }

    navigator.usb.addEventListener('connect', event => {
      if (matches(event.device)) fire('connect', portFor(event.device));
    });
    navigator.usb.addEventListener('disconnect', event => {
      const port = ports.get(event.device);
      if (!port) return;
      ports.delete(event.device);
      fire('disconnect', port);
    });

    serial.requestPort = async () => portFor(await navigator.usb.requestDevice({ filters: FILTERS }));
    serial.getPorts = async () => (await navigator.usb.getDevices()).filter(matches).map(portFor);
    Object.defineProperty(navigator, 'serial', { value: serial, configurable: true });
  }

  return { ch34xDivisor, install };
});

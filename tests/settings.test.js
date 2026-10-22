'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const set = require('../js/settings.js');

const bitfields = set.FIELDS.filter(f => !f.get && Array.isArray(f.values));
const at = f => f.addr - set.BASE;
const mask = f => ((1 << f.bits) - 1) << f.shift;

function noise() {
  const img = new Uint8Array(set.SIZE);
  for (let i = 0; i < img.length; i++) img[i] = (i * 37 + 11) & 0xFF;
  return img;
}

test('round-trips every option of every field without touching other bits', () => {
  for (const f of set.FIELDS) {
    const values = f.values === 'mask' ? [1, 0x800001, set.MIX_ALL]
      : f.values === 'channel' ? [0, 511, set.CHANNEL_NONE]
      : f.values === 'text' ? ['', 'F4HWN', 'W8LBZ 16 CHARS!!']
        : f.values === 'dtmf' ? ['', '12345', 'ABCD*#0123456789']
          : f.values.map(([v]) => v);
    for (const value of values) {
      const img = noise();
      const before = img.slice();
      set.setValue(img, f.id, value);
      assert.equal(set.getValue(img, f.id), value, `${f.id}=${value}`);
      if (f.get) continue;
      const width = f.bits === 16 ? 2 : (typeof f.values === 'string' ? set.TEXT_LENGTH : 1);
      for (let i = 0; i < img.length; i++) {
        if (i >= at(f) && i < at(f) + width) {
          if (width === 1) assert.equal(img[i] & ~mask(f) & 0xFF, before[i] & ~mask(f) & 0xFF, `${f.id} spilled`);
        } else {
          assert.equal(img[i], before[i], `${f.id} touched byte 0x${(set.BASE + i).toString(16)}`);
        }
      }
    }
  }
});

test('keeps fields inside the area, apart from each other and away from protected bytes', () => {
  const used = new Map();
  for (const f of set.FIELDS.filter(candidate => !candidate.get)) {
    const width = f.bits === 16 ? 2 : (typeof f.values === 'string' && f.values !== 'channel' ? set.TEXT_LENGTH : 1);
    for (let i = at(f); i < at(f) + width; i++) {
      assert.ok(i >= 0 && i < set.SIZE, `${f.id} outside area`);
      const bits = width === 1 ? mask(f) : 0xFF;
      const prev = used.get(i) || 0;
      assert.equal(prev & bits, 0, `${f.id} overlaps at 0x${(set.BASE + i).toString(16)}`);
      used.set(i, prev | bits);
      for (const [start, end] of set.PROTECTED) assert.ok(i < start || i >= end, `${f.id} in protected range`);
    }
  }
});

test('places F4HWN fields where the firmware saves them', () => {
  const img = new Uint8Array(set.SIZE);
  set.setValue(img, 'SetPwr', 6);       // 0xA15F high nibble
  set.setValue(img, 'SetSav', 3);       // 0xA15F bits 2-3
  set.setValue(img, 'SetScn', 0);       // FAST is stored as bit 1 clear
  set.setValue(img, 'SetPTT', 1);
  assert.equal(img[0x15F], (6 << 4) | (3 << 2) | 1);
  set.setValue(img, 'BLMin', 3);
  set.setValue(img, 'BLMax', 9);
  assert.equal(img[0x008], (3 << 4) | 9);
  set.setValue(img, 'PriCh1', 0x123);
  assert.deepEqual([img[0x131], img[0x132]], [0x23, 0x01]);
});

test('encodes RxMode like ACTION_SetRxMode, relative to the TX VFO', () => {
  const img = new Uint8Array(set.SIZE);
  img[0x0C3] = 1;                       // TX on VFO B
  set.setValue(img, 'RxMode', 1);
  assert.deepEqual([img[0x00C], img[0x00A]], [2, 0]);
  set.setValue(img, 'RxMode', 3);
  assert.deepEqual([img[0x00C], img[0x00A]], [2, 2]);
  set.setValue(img, 'RxMode', 5);
  assert.deepEqual([img[0x00C], img[0x00A]], [3, 2]);
  assert.equal(set.getValue(img, 'RxMode'), 5);
  set.setValue(img, 'RxMode', 0);
  assert.deepEqual([img[0x00C], img[0x00A]], [0, 0]);
});

test('keeps the VOX level when VOX is switched off', () => {
  const img = new Uint8Array(set.SIZE);
  set.setValue(img, 'VOX', 6);
  assert.deepEqual([img[0x005], img[0x006]], [1, 5]);
  set.setValue(img, 'VOX', 0);
  assert.deepEqual([img[0x005], img[0x006]], [0, 5]);
});

test('stores the MIX list mask with the firmware marker', () => {
  const img = new Uint8Array(set.SIZE).fill(0xFF);
  assert.equal(set.getValue(img, 'ScMix'), set.MIX_ALL);        // no marker: all lists
  set.setValue(img, 'ScMix', 0b101);                            // lists 1 and 3
  assert.deepEqual(Array.from(img.subarray(0x170, 0x178)), [5, 0, 0, 0x4D, 0x49, 0x58, 1, 0xFF]);
  assert.equal(set.getValue(img, 'ScMix'), 5);
  assert.throws(() => set.setValue(img, 'ScMix', 0), /ScMix/);
});

test('rejects invalid values', () => {
  const img = new Uint8Array(set.SIZE);
  assert.throws(() => set.setValue(img, 'Sql', 10), /Sql/);
  assert.throws(() => set.setValue(img, 'UPCode', '12E'), /UPCode/);
  assert.throws(() => set.setValue(img, 'Message 1', 'x'.repeat(17)), /Message 1/);
  assert.throws(() => set.setValue(img, 'PriCh1', 1025), /PriCh1/);
  assert.equal(bitfields.length > 40, true);
});

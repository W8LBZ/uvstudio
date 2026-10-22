'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const mem = require('../js/memories.js');

const blank = () => new Uint8Array(mem.IMAGE_SIZE).fill(0xFF);

function channel(overrides) {
  return Object.assign(mem.defaultChannel(), { freq: 145500000 }, overrides);
}

test('encodes the firmware channel record, name and attribute layout', () => {
  const image = blank();
  mem.encodeChannel(image, 3, channel({
    name: 'RELAIS', freq: 145600000, offset: 600000, duplex: '-', mode: 'NFM',
    txTone: '88.5', rxTone: 'D023I', power: 6, step: 4, scanlist: 2, skip: true
  }));
  const r = 3 * 16;
  const view = new DataView(image.buffer);
  assert.equal(view.getUint32(r, true), 14560000);           // 10 Hz units
  assert.equal(view.getUint32(r + 4, true), 60000);
  assert.equal(image[r + 8], 0);                              // rx code: DCS 023 index
  assert.equal(image[r + 9], 8);                              // tx code: 88.5 Hz index
  assert.equal(image[r + 10], (1 << 4) | 3);                  // tx CTCSS, rx reversed DCS
  assert.equal(image[r + 11], (0 << 4) | 2);                  // FM, offset SUB
  assert.equal(image[r + 12], (6 << 2) | (1 << 1));           // MID, narrow
  assert.equal(image[r + 14], 4);
  assert.equal(String.fromCharCode(...image.subarray(0x4000 + r, 0x4000 + r + 6)), 'RELAIS');
  assert.equal(image[0x4000 + r + 6], 0);
  assert.equal(image[0x8000 + 6], 0x80 | 2);                  // skip + BAND3_137MHz
});

test('round-trips channels and keeps bits the panel does not edit', () => {
  const image = blank();
  const ch = channel({ name: 'PMR 1', freq: 446006250, mode: 'NAM', txTone: 'D754N', rxTone: '67.0', power: 1, step: 2, scanlist: 25 });
  mem.encodeChannel(image, 0, ch);
  image[12] |= 0x20;            // busy channel lockout
  image[0x8000] |= 0x08;        // compander
  mem.encodeChannel(image, 0, Object.assign(mem.decodeChannel(image, 0), { power: 7 }));
  assert.deepEqual(mem.decodeChannel(image, 0), Object.assign({}, ch, { power: 7 }));
  assert.equal(image[12] & 0x20, 0x20);
  assert.equal(image[0x8000] & 0x18, 0x08);
  assert.equal(image[0x8000] & 7, 5);                         // BAND6_400MHz (enum 5)
});

test('rejects invalid values without touching the image', () => {
  const image = blank();
  mem.encodeChannel(image, 0, channel());
  const before = image.slice();
  assert.throws(() => mem.encodeChannel(image, 0, channel({ txTone: '88.6' })), /tone/);
  assert.throws(() => mem.encodeChannel(image, 0, channel({ freq: 5e6 })), /range/);
  assert.throws(() => mem.encodeChannel(image, 0, channel({ duplex: 'split' })), /duplex/);
  assert.deepEqual(image, before);
});

test('deletes channels as empty and maps TX lock to duplex off', () => {
  const image = blank();
  mem.encodeChannel(image, 5, channel({ duplex: 'off' }));
  assert.equal(mem.decodeChannel(image, 5).duplex, 'off');
  assert.equal(image[5 * 16 + 12] & 0x40, 0x40);
  mem.encodeChannel(image, 5, null);
  assert.equal(mem.decodeChannel(image, 5), null);
  assert.equal(mem.decodeChannel(blank(), 0), null);
});

test('round-trips every tone combination through CHIRP CSV', () => {
  const tones = [['', ''], ['88.5', ''], ['100.0', '100.0'], ['D023N', 'D023N'], ['D023I', 'D023N'],
    ['D754N', '67.0'], ['', 'D411I'], ['67.0', '254.1'], ['D065N', 'D025N']];
  const source = blank();
  tones.forEach(([txTone, rxTone], i) => {
    mem.encodeChannel(source, i * 7, channel({ name: `T${i},"x"`, txTone, rxTone, duplex: i % 2 ? '+' : '', offset: i * 100000, power: i % 8, step: i, skip: i % 3 === 0 }));
  });
  const csv = mem.exportChirpCsv(source);
  const target = blank();
  const result = mem.importChirpCsv(target, csv);
  assert.deepEqual(result, { imported: tones.length, errors: [] });
  tones.forEach((_, i) => assert.deepEqual(mem.decodeChannel(target, i * 7), mem.decodeChannel(source, i * 7), `channel ${i * 7}`));
});

test('imports CHIRP split duplex, watt powers and reports bad rows', () => {
  const image = blank();
  const csv = [
    'Location,Name,Frequency,Duplex,Offset,Tone,rToneFreq,cToneFreq,DtcsCode,DtcsPolarity,RxDtcsCode,CrossMode,Mode,TStep,Skip,Power',
    '1,SPLIT,145.500000,split,144.900000,,88.5,88.5,023,NN,023,Tone->Tone,FM,12.50,,5.0W',
    '2,LOW,433.500000,,0.000000,,88.5,88.5,023,NN,023,Tone->Tone,NFM,6.25,,0.5W',
    '3,BAD,145.500000,,0.000000,TSQL-R,88.5,88.5,023,NN,023,Tone->Tone,FM,12.50,,',
    '1025,FAR,145.500000,,0,,88.5,88.5,023,NN,023,Tone->Tone,FM,12.50,,',
    '4,WFM,98.000000,,0,,88.5,88.5,023,NN,023,Tone->Tone,WFM,12.50,,'
  ].join('\n');
  const result = mem.importChirpCsv(image, csv);
  assert.equal(result.imported, 2);
  assert.deepEqual(result.errors.map(e => e.line), [4, 5, 6]);
  const split = mem.decodeChannel(image, 0);
  assert.equal(split.duplex, '-');
  assert.equal(split.offset, 600000);
  assert.equal(split.power, 7);
  assert.equal(mem.decodeChannel(image, 1).power, 4);
  assert.equal(mem.decodeChannel(image, 1).step, 2);
  assert.throws(() => mem.importChirpCsv(image, 'a,b\n1,2'), /CHIRP/);
});

test('groups changed bytes into aligned write runs', () => {
  const before = new Uint8Array(512);
  const after = before.slice();
  after[3] = 1;          // block 0
  after[9] = 1;          // block 8, contiguous with block 0
  after[300] = 1;        // block 296
  for (let i = 400; i < 512; i++) after[i] = 1;
  assert.deepEqual(mem.dirtyRuns(before, after), [
    { offset: 0, length: 16 }, { offset: 296, length: 8 }, { offset: 400, length: 112 }
  ]);
  assert.deepEqual(mem.dirtyRuns(before, after, 64).slice(-2), [
    { offset: 400, length: 64 }, { offset: 464, length: 48 }
  ]);
});

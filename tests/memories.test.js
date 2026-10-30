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
  assert.equal(image[r + 12], 0x40 | (6 << 2) | (1 << 1));    // TX lock, MID, narrow
  assert.equal(image[r + 14], 4);
  assert.equal(String.fromCharCode(...image.subarray(0x4000 + r, 0x4000 + r + 6)), 'RELAIS');
  assert.equal(image[0x4000 + r + 6], 0);
  assert.equal(image[0x8000 + 6], 0x80 | 2);                  // skip + BAND3_137MHz
});

test('round-trips channels and keeps bits the panel does not edit', () => {
  const image = blank();
  const ch = channel({ name: 'PMR 1', freq: 446006250, mode: 'NAM', txTone: 'D754N', rxTone: '67.0', power: 1, step: 2, scanlist: 25 });
  mem.encodeChannel(image, 0, ch);
  image[12] |= 0x80;            // unused bit
  image[13] |= 0x01;            // DTMF decode (not exposed)
  image[0x8000] |= 0x60;        // unused attribute bits
  mem.encodeChannel(image, 0, Object.assign(mem.decodeChannel(image, 0), { power: 7 }));
  assert.deepEqual(mem.decodeChannel(image, 0), Object.assign({}, ch, { power: 7 }));
  assert.equal(image[12] & 0x80, 0x80);
  assert.equal(image[13] & 0x01, 0x01);
  assert.equal(image[0x8000] & 0x60, 0x60);
  assert.equal(image[0x8000] & 7, 5);                         // BAND6_400MHz (enum 5)
});

test('encodes busy lockout, reverse, compander and PTT ID where the firmware reads them', () => {
  const image = blank();
  mem.encodeChannel(image, 2, channel({ busy: true, reverse: true, compander: 3, pttId: 4, txLock: false }));
  const r = 2 * 16;
  assert.equal(image[r + 12] & 0x61, 0x21);                   // busy bit5, reverse bit0, TX lock off
  assert.equal(image[r + 13], 4 << 1);
  assert.equal((image[0x8000 + 4] >> 3) & 3, 3);
  const ch = mem.decodeChannel(image, 2);
  assert.deepEqual([ch.busy, ch.reverse, ch.compander, ch.pttId], [true, true, 3, 4]);
  image[r + 13] = 0xFF;                                       // erased byte reads as PTT ID off
  assert.equal(mem.decodeChannel(image, 2).pttId, 0);
  assert.throws(() => mem.encodeChannel(image, 2, channel({ pttId: 5 })), /PTT/);
});

test('stores 3-character scan list names in 4-byte slots', () => {
  const image = blank();
  assert.equal(mem.getListName(image, 1), '');
  mem.setListName(image, 3, 'RPT');
  assert.deepEqual(Array.from(image.subarray(0x880E + 8, 0x880E + 12)), [0x52, 0x50, 0x54, 0]);
  assert.equal(mem.getListName(image, 3), 'RPT');
  assert.equal(mem.getListName(image, 2), '');
  assert.throws(() => mem.setListName(image, 3, 'FOUR'), /list name/);
  assert.throws(() => mem.setListName(image, 25, 'X'), /scan list/);
  assert.equal(mem.IMAGE_SIZE % 8, 0);
  assert.ok(mem.IMAGE_SIZE >= 0x880E + 24 * 4);
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

test('deletes channels as empty', () => {
  const image = blank();
  mem.encodeChannel(image, 5, channel());
  mem.encodeChannel(image, 5, null);
  assert.equal(mem.decodeChannel(image, 5), null);
  assert.equal(mem.decodeChannel(blank(), 0), null);
});

test('keeps TX lock separate from duplex and on by default', () => {
  const image = blank();
  mem.encodeChannel(image, 0, channel({ duplex: '-', offset: 600000 }));
  assert.equal(image[12] & 0x40, 0x40);                         // firmware default: band plan applies
  assert.equal(mem.decodeChannel(image, 0).duplex, '-');
  mem.encodeChannel(image, 0, Object.assign(mem.decodeChannel(image, 0), { txLock: false }));
  assert.equal(image[12] & 0x40, 0);
  assert.equal(mem.decodeChannel(image, 0).duplex, '-');
  assert.equal(mem.decodeChannel(image, 0).txLock, false);
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
  assert.deepEqual(result, { imported: tones.length, errors: [], warnings: [], duplicates: 0 });
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
    '4,WFM,98.000000,,0,,88.5,88.5,023,NN,023,Tone->Tone,WFM,12.50,,',
    '5,RXONLY,162.550000,off,0,,88.5,88.5,023,NN,023,Tone->Tone,NFM,12.50,,'
  ].join('\n');
  const result = mem.importChirpCsv(image, csv);
  assert.equal(result.imported, 3);
  assert.deepEqual(result.errors.map(e => e.line), [4, 5, 6]);
  assert.deepEqual(result.warnings.map(w => w.line), [7]);
  assert.equal(mem.decodeChannel(image, 4).duplex, '');
  assert.equal(mem.decodeChannel(image, 4).txLock, true);
  const split = mem.decodeChannel(image, 0);
  assert.equal(split.duplex, '-');
  assert.equal(split.offset, 600000);
  assert.equal(split.power, 7);
  assert.equal(mem.decodeChannel(image, 1).power, 4);
  assert.equal(mem.decodeChannel(image, 1).step, 2);
  assert.throws(() => mem.importChirpCsv(image, 'a,b\n1,2'), /CHIRP/);
});

test('imports with append, prepend, replace and duplicate skipping', () => {
  const head = 'Location,Name,Frequency,Duplex,Offset,Tone,rToneFreq,cToneFreq,DtcsCode,DtcsPolarity,RxDtcsCode,CrossMode,Mode,TStep,Skip,Power';
  const csv = [head,
    '9,A,146.520000,,0,,88.5,88.5,023,NN,023,Tone->Tone,FM,12.50,,',
    '9,B,147.000000,+,0.600000,Tone,100.0,88.5,023,NN,023,Tone->Tone,FM,12.50,,',
    '9,B2,147.000000,+,0.600000,Tone,100.0,88.5,023,NN,023,Tone->Tone,FM,12.50,,'
  ].join('\n');
  const names = image => Array.from({ length: 6 }, (_, i) => mem.decodeChannel(image, i)?.name ?? null);
  const start = () => {
    const image = blank();
    mem.encodeChannel(image, 0, channel({ name: 'OLD', freq: 146520000 }));
    mem.encodeChannel(image, 2, channel({ name: 'GAP' }));
    return image;
  };

  let image = start();
  assert.equal(mem.importChirpCsv(image, csv, { mode: 'append' }).imported, 3);
  assert.deepEqual(names(image), ['OLD', null, 'GAP', 'A', 'B', 'B2']);

  image = start();
  const r = mem.importChirpCsv(image, csv, { mode: 'append', dedupe: true });
  assert.equal(r.imported, 1);
  assert.equal(r.duplicates, 2);   // A matches OLD (name ignored), B2 matches B
  assert.deepEqual(names(image), ['OLD', null, 'GAP', 'B', null, null]);

  image = start();
  mem.importChirpCsv(image, csv, { mode: 'prepend' });
  assert.deepEqual(names(image), ['A', 'B', 'B2', 'OLD', null, 'GAP']);

  image = start();
  mem.importChirpCsv(image, csv, { mode: 'replace' });
  assert.deepEqual(names(image), [null, null, null, null, null, null]);
  assert.equal(mem.decodeChannel(image, 8).name, 'B2');

  image = start();
  assert.throws(() => mem.importChirpCsv(image, head + '\n1,X,2000', { mode: 'replace' }), /unchanged/);
  assert.equal(mem.decodeChannel(image, 0).name, 'OLD');

  image = blank();
  mem.encodeChannel(image, mem.CHANNEL_COUNT - 2, channel());
  assert.throws(() => mem.importChirpCsv(image, csv, { mode: 'prepend' }), /no room/);
  const full = mem.importChirpCsv(image, csv, { mode: 'append' });
  assert.equal(full.imported, 1);
  assert.deepEqual(full.errors.map(e => e.message), ['no free channel left', 'no free channel left']);

  // Location column optional when it is ignored.
  assert.equal(mem.importChirpCsv(blank(), 'Name,Frequency\nX,145.5', { mode: 'append' }).imported, 1);
});

test('encodes VFO records at 0x9000 with the shared per-band attribute', () => {
  const image = blank();
  const vfo = band => mem.CHANNEL_COUNT + band * 2;   // VFO A of a band; +1 = VFO B
  assert.equal(mem.decodeChannel(image, vfo(2) + 1), null);              // erased
  mem.encodeChannel(image, vfo(2) + 1, channel({ freq: 146520000, step: 0, duplex: '+', offset: 600000, txTone: '100.0' }));
  const view = new DataView(image.buffer);
  assert.equal(view.getUint32(0x9050, true), 14652000);                  // band 2, VFO B
  assert.equal(image[0x9050 + 11], 1);                                    // FM, +
  assert.equal(image[0x8804], 0xFF);                                      // shared attribute untouched
  assert.equal(mem.decodeChannel(image, vfo(2) + 1).txTone, '100.0');
  assert.equal(mem.decodeChannel(image, vfo(2)), null);                   // VFO A record still erased
  assert.ok(mem.channelDirty(blank(), image, vfo(2) + 1));
  assert.throws(() => mem.encodeChannel(image, vfo(2), channel({ freq: 446000000 })), /band/);
  // The firmware snaps VFOs to half the step for steps >= 10 kHz: 12.5 kHz -> 6.25 kHz grid.
  mem.encodeChannel(image, vfo(2), channel({ freq: 146520000, step: 4 }));
  assert.equal(mem.decodeChannel(image, vfo(2)).freq, 146518750);
  mem.encodeChannel(image, vfo(2), channel({ freq: 146520000, step: 0 }));   // 2.5 kHz: on grid
  assert.equal(mem.decodeChannel(image, vfo(2)).freq, 146520000);
  assert.equal(mem.roundToStep(118012000, 6), 118008330);                    // 8.33 kHz channel 2
  mem.encodeChannel(image, vfo(2) + 1, null);                                // clear back to erased
  assert.equal(mem.decodeChannel(image, vfo(2) + 1), null);
  assert.equal(image.subarray(0x9050, 0x9060).every(b => b === 0xFF), true);
  assert.equal(image.subarray(0x8870, 0x9000).every(b => b === 0xFF), true);   // unmapped hole untouched
});

test('an erased record is empty even when its attribute claims a band', () => {
  const image = blank();
  image[0x8000 + 2 * 19] = 0; image[0x8000 + 2 * 19 + 1] = 0;   // slot 20: band 0, record 0xFF
  assert.equal(mem.isEmpty(image, 19), true);
  assert.equal(mem.decodeChannel(image, 19), null);
  assert.equal(mem.exportChirpCsv(image).trim().split('\r\n').length, 1);   // header only
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

function named(names) {
  const image = blank();
  names.forEach((name, i) => { if (name) mem.encodeChannel(image, i, channel({ name, freq: 145000000 + i * 12500 })); });
  return image;
}
const namesOf = (image, n) => Array.from({ length: n }, (_, i) => mem.decodeChannel(image, i)?.name ?? null);

test('moves selected channels as a block, keeping every byte', () => {
  const image = named(['A', 'B', 'C', 'D', 'E']);
  image[3 * 16 + 13] |= 1;                                     // hidden DTMF bit travels with D
  assert.deepEqual(mem.moveChannels(image, [2, 3], -1), [1, 2]);
  assert.deepEqual(namesOf(image, 5), ['A', 'C', 'D', 'B', 'E']);
  assert.equal(image[2 * 16 + 13] & 1, 1);
  assert.deepEqual(mem.moveChannels(image, [1, 2], 1), [2, 3]);
  assert.deepEqual(namesOf(image, 5), ['A', 'B', 'C', 'D', 'E']);
  assert.throws(() => mem.moveChannels(image, [0], -1), /ends/);
});

test('inserts and removes with shifting, like CHIRP', () => {
  const image = named(['A', 'B', 'C']);
  mem.insertChannel(image, 1);
  assert.deepEqual(namesOf(image, 4), ['A', null, 'B', 'C']);
  mem.removeChannel(image, 0);
  assert.deepEqual(namesOf(image, 4), [null, 'B', 'C', null]);
  mem.encodeChannel(image, mem.CHANNEL_COUNT - 1, channel({ name: 'LAST' }));
  assert.throws(() => mem.insertChannel(image, 0), /last channel/);
});

test('insert then delete leaves empty slots with leftover bytes untouched', () => {
  const image = named(['A', 'B']);
  image[5 * 16] = 0x42;                         // stale record byte in an empty slot
  image[0x8000 + 5 * 2] = 0x07;                 // attribute band 7: empty
  const before = image.slice();
  mem.insertChannel(image, 0);
  mem.removeChannel(image, 0);
  assert.deepEqual(mem.dirtyRuns(before, image), []);
});

test('copies and pastes channels, including empty ones', () => {
  const image = named(['A', null, 'C']);
  const clip = [0, 1, 2].map(i => mem.copyChannel(image, i));
  mem.pasteChannels(image, 10, clip);
  assert.deepEqual(namesOf(image, 13).slice(10), ['A', null, 'C']);
  assert.throws(() => mem.pasteChannels(image, mem.CHANNEL_COUNT - 1, clip), /fit/);
});

test('history undoes back through noted states and resets', () => {
  const h = mem.createHistory(2);
  const image = new Uint8Array(4);
  h.note(image);
  assert.equal(h.canUndo, false);
  image[0] = 1; h.note(image);
  h.note(image);   // unchanged: no new step
  image[1] = 2; h.note(image);
  image[2] = 3; h.note(image);   // limit 2 drops the oldest step
  assert.deepEqual([...h.undo()], [1, 2, 0, 0]);
  const back = h.undo();
  assert.deepEqual([...back], [1, 0, 0, 0]);
  assert.equal(h.undo(), null);
  h.note(back);   // re-rendering the undone state adds nothing
  assert.equal(h.canUndo, false);
  h.reset();
  assert.equal(h.canUndo, false);
});

test('csvNameFromUrl gives a short label for the loaded CSV', () => {
  assert.equal(mem.csvNameFromUrl('https://raw.githubusercontent.com/a/b/main/repeaters.csv'), 'repeaters.csv');
  assert.equal(mem.csvNameFromUrl('https://www.repeaterbook.com/api/export.php?state_id=39&county=Lorain'), 'export.php');
  assert.equal(mem.csvNameFromUrl('https://example.com/lists/'), 'lists');
  assert.equal(mem.csvNameFromUrl('https://example.com/'), 'example.com');
  assert.equal(mem.csvNameFromUrl('https://example.com/my%20list.csv'), 'my list.csv');
  assert.equal(mem.csvNameFromUrl('data:text/csv,Location%2CName%0A1%2CX'), 'data:text/csv');
  assert.equal(mem.csvNameFromUrl('data:text/csv;charset=utf-8,a'), 'data:text/csv');
});

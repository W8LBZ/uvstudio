'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');

const SCOPE = 'https://w8lbz.github.io/uvstudio/';

// Runs sw.js (with a file list and build, as the Pages workflow fills them) against a fake
// network and CacheStorage.
function worker(files, build, stores = new Map()) {
  const listeners = {};
  const net = { online: true, stalled: false, version: 'new' };
  const openCache = name => {
    if (!stores.has(name)) stores.set(name, new Map());
    const store = stores.get(name);
    const url = req => (typeof req === 'string' ? new URL(req, SCOPE).href : req.url);
    return {
      put: async (req, res) => { store.set(url(req), res); },
      match: async req => store.get(url(req)),
      addAll: async reqs => { for (const req of reqs) store.set(new URL(req.url, SCOPE).href, { ok: true, body: `${req.url} ${net.version}` }); }
    };
  };
  const source = fs.readFileSync(`${__dirname}/../sw.js`, 'utf8')
    .replace('const FILES = [];', `const FILES = ${JSON.stringify(files)};`)
    .replace("const BUILD = '';", `const BUILD = '${build}';`)
    .replace('const TIMEOUT_MS = 3000;', 'const TIMEOUT_MS = 20;');
  vm.runInNewContext(source, {
    URL,
    setTimeout,
    Request: class { constructor(url, init) { this.url = url; this.cache = init?.cache; } },
    self: { registration: { scope: SCOPE }, location: { origin: 'https://w8lbz.github.io' },
      skipWaiting() {}, clients: { claim: async () => {} }, addEventListener: (type, fn) => { listeners[type] = fn; } },
    caches: { open: async name => openCache(name), keys: async () => [...stores.keys()], delete: async name => stores.delete(name) },
    fetch: async req => { if (net.stalled) await new Promise(r => setTimeout(r, 200)); if (!net.online) throw new TypeError('offline'); return { ok: true, body: `${req.url} ${net.version}`, clone() { return this; } }; },
    Response: { error: () => ({ ok: false, error: true }) }
  });
  const run = async type => { const waits = []; listeners[type]({ waitUntil: p => waits.push(p) }); await Promise.all(waits); };
  const get = async (url, mode = 'no-cors') => {
    let reply = null;
    const waits = [];
    listeners.fetch({ request: { url: url.startsWith('https:') ? url : SCOPE + url, method: 'GET', mode }, respondWith: p => { reply = p; }, waitUntil: p => waits.push(p) });
    const t0 = Date.now();
    const res = reply && await reply;
    net.replyMs = Date.now() - t0;
    await Promise.all(waits);
    return res;
  };
  return { run, get, net, stores };
}

test('precaches every listed file, serves the copy offline and keeps one copy per file', async () => {
  const w = worker(['index.html', 'js/flash.js', 'docs/help/en/mic.md'], 'b1');
  await w.run('install');
  await w.run('activate');
  assert.match((await w.get('js/flash.js?v=106')).body, /new$/);   // online: network
  w.net.online = false;
  assert.ok((await w.get('docs/help/en/mic.md')).ok);              // never opened, still there
  assert.ok((await w.get('js/flash.js?v=107')).ok);                // ?v= ignored
  assert.ok((await w.get('?webusbprobe', 'navigate')).ok);         // any page URL falls back to index.html
  assert.equal((await w.get('js/never-listed.js')).error, true);
  assert.equal(await w.get('https://api.github.com/repos/x'), null);   // other origins: not intercepted
  w.net.online = true;
  w.net.stalled = true;                                              // connected, no internet
  assert.match((await w.get('js/flash.js')).body, /flash\.js\?v=106 new$/);   // the copy
  assert.ok(w.net.replyMs < 150, `copy served after the timeout, not the stall (${w.net.replyMs} ms)`);
  assert.equal([...w.stores.get(`uvstudio-plus ${SCOPE} b1`).keys()].filter(k => k.includes('flash.js')).length, 1);
});

test('a new build replaces the old copy and leaves the test site alone', async () => {
  const stores = new Map();
  const old = worker(['index.html'], 'b1', stores);
  await old.run('install');
  stores.set(`uvstudio-plus ${SCOPE}test/ t1`, new Map());
  const next = worker(['index.html'], 'b2', stores);
  await next.run('install');
  await next.run('activate');
  assert.deepEqual([...stores.keys()].sort(), [`uvstudio-plus ${SCOPE} b2`, `uvstudio-plus ${SCOPE}test/ t1`]);
});

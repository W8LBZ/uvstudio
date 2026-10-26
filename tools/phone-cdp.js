// Evaluate an expression in the phone's UV Studio tab over Chrome DevTools (see "Phone tests" in
// CLAUDE.md for the adb forward): node.exe tools/phone-cdp.js "<expr>". Promises are awaited and
// the value printed; with no UV Studio tab open it lists the open targets instead.
(async () => {
  const targets = await (await fetch('http://127.0.0.1:9333/json')).json();
  const page = targets.find(t => t.type === 'page' && t.url.includes('uvstudio'));
  if (!page) { console.log(JSON.stringify(targets.map(t => `${t.type} ${t.url}`))); return; }
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(r => { ws.onopen = r; });
  ws.onmessage = m => {
    const d = JSON.parse(m.data);
    if (d.id !== 1) return;
    const r = d.result?.result;
    console.log(r?.value !== undefined ? (typeof r.value === 'string' ? r.value : JSON.stringify(r.value))
      : JSON.stringify(d.result?.exceptionDetails?.exception?.description ?? r ?? d));
    ws.close();
  };
  ws.send(JSON.stringify({ id: 1, method: 'Runtime.evaluate', params: { expression: process.argv[2], awaitPromise: true, returnByValue: true, userGesture: true } }));
})();

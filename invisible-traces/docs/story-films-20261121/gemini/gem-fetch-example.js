const chats = {"I-3":"https://gemini.google.com/app/ca5a0a8252626875","F-2":"https://gemini.google.com/app/8c6097b98e143627"};
for (const [name, url] of Object.entries(chats)) {
  const pgF = await openTab(url); await sleep(4000);
  const info = await page.evaluate(() => [...document.querySelectorAll('video')].map(v => ({src: v.currentSrc || v.src, d: v.duration})));
  console.log(name, JSON.stringify(info).slice(0, 300));
  const src = info.map(x => x.src).find(s => s && s.startsWith('http'));
  if (!src) { const sF = await snapshot(page); console.log(sF.diff.slice ? '' : ''); continue; }
  const res = await fetch(src); const buf = Buffer.from(await res.arrayBuffer());
  console.log(name, 'fetch', res.status, res.headers.get('content-type'), buf.length);
  if (res.status === 200 && buf.length > 100000) { const post = await fetch(`http://127.0.0.1:4498/save?name=${name}`, {method: 'POST', body: buf}); console.log(name, 'saved', post.status, await post.text()); }
  await closeTab(pgF);
}

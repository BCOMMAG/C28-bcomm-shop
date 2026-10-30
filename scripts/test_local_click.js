const { spawn } = require('child_process');
const path = require('path');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function test() {
  const chromePort = 9355;
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    `--remote-debugging-port=${chromePort}`,
    `--user-data-dir=C:\\temp\\cdp_test_${Date.now()}`,
    '--window-size=1560,1100'
  ]);
  await sleep(2000);
  const targetRes = await fetch(`http://127.0.0.1:${chromePort}/json/new?http://localhost:3000/leidy-boutique`, { method: 'PUT' });
  const target = await targetRes.json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);

  let id = 1;
  const pending = new Map();
  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const msgId = id++;
      pending.set(msgId, { resolve, reject });
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  const logs = [];
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && pending.has(data.id)) {
      const { resolve } = pending.get(data.id);
      pending.delete(data.id);
      resolve(data.result);
    }
    if (data.method === 'Runtime.consoleAPICalled') {
      const args = data.params.args.map((a) => a.value || a.description || '').join(' ');
      logs.push('[CONSOLE ' + data.params.type + '] ' + args);
    }
    if (data.method === 'Runtime.exceptionThrown') {
      logs.push('[EXCEPTION] ' + JSON.stringify(data.params.exceptionDetails));
    }
  };

  await new Promise((r) => (ws.onopen = r));
  await send('Runtime.enable');
  await send('Page.enable');
  await sleep(4000);

  console.log('Clicking on product...');
  const res = await send('Runtime.evaluate', {
    expression: `(() => {
      const card = document.querySelector('.catalog-card-image');
      if (card) { card.click(); return 'clicked'; }
      return 'not found';
    })()`,
    returnByValue: true
  });
  console.log('Click eval:', res?.result?.value);
  await sleep(3000);

  logs.forEach((l) => console.log(l));
  chrome.kill();
}
test().catch(console.error);


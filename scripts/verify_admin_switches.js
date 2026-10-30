const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ARTIFACT_DIR = 'C:\\Users\\leona\\.gemini\\antigravity\\brain\\785ad5ea-df7f-499e-aa6d-04c557c447db';

async function test() {
  const chromePort = 9380;
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    `--remote-debugging-port=${chromePort}`,
    `--user-data-dir=C:\\temp\\cdp_test_${Date.now()}`,
    '--window-size=1560,1100'
  ]);
  await sleep(2500);

  const targetRes = await fetch(`http://127.0.0.1:${chromePort}/json/new?http://localhost:3000/admin/configuracoes/aparencia`, { method: 'PUT' });
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

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && pending.has(data.id)) {
      const { resolve } = pending.get(data.id);
      pending.delete(data.id);
      resolve(data.result);
    }
  };

  await new Promise((r) => (ws.onopen = r));
  await send('Runtime.enable');
  await send('Page.enable');

  // Autenticar admin no localStorage
  await send('Page.navigate', { url: 'http://localhost:3000/admin/login' });
  await sleep(1500);
  await send('Runtime.evaluate', {
    expression: `(() => {
      localStorage.setItem('leidy_admin_auth', 'true');
      localStorage.setItem('leidy_admin_user', JSON.stringify({ email: 'admin@leidyboutique.com.br', role: 'dono' }));
    })()`
  });

  console.log('Navegando para Configurações de Aparência...');
  await send('Page.navigate', { url: 'http://localhost:3000/admin/configuracoes/aparencia' });
  await sleep(4000);

  const evalRes = await send('Runtime.evaluate', {
    expression: `(() => {
      const text = document.body.innerText;
      return {
        url: window.location.href,
        title: document.title,
        hasExibicaoEstoque: text.includes('Exibição de Estoque para o Consumidor'),
        hasModoTransparente: text.includes('Modo Transparente Ativo') || text.includes('Modo Sigilo Comercial Ativo'),
        snippet: text.slice(0, 500)
      };
    })()`,
    returnByValue: true
  });
  console.log('Resultado Admin Aparência:', evalRes?.result?.value);

  // Scroll para o bloco de estoque e tirar screenshot
  await send('Runtime.evaluate', {
    expression: `(() => {
      const el = Array.from(document.querySelectorAll('h2')).find(h => h.textContent.includes('Exibição de Estoque'));
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
    })()`
  });
  await sleep(1000);

  const screenshot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'comprovante_admin_bloco_estoque_scroll.png'), Buffer.from(screenshot.data, 'base64'));
  console.log('📸 Screenshot salvo: comprovante_admin_bloco_estoque_scroll.png');

  // Testar também Checkout
  await send('Page.navigate', { url: 'http://localhost:3000/admin/configuracoes/checkout' });
  await sleep(3500);

  const evalCheckout = await send('Runtime.evaluate', {
    expression: `(() => {
      const text = document.body.innerText;
      return {
        url: window.location.href,
        hasCheckoutEstoque: text.includes('Exibir Quantidade de Estoque para o Consumidor'),
        hasTransparente: text.includes('Transparente:') || text.includes('Sigilo comercial:')
      };
    })()`,
    returnByValue: true
  });
  console.log('Resultado Admin Checkout:', evalCheckout?.result?.value);

  await send('Runtime.evaluate', {
    expression: `(() => {
      const el = Array.from(document.querySelectorAll('h3')).find(h => h.textContent.includes('Exibir Quantidade'));
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
    })()`
  });
  await sleep(1000);

  const screenshotChk = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'comprovante_admin_checkout_estoque_scroll.png'), Buffer.from(screenshotChk.data, 'base64'));
  console.log('📸 Screenshot salvo: comprovante_admin_checkout_estoque_scroll.png');

  chrome.kill();
}

test().catch(console.error);

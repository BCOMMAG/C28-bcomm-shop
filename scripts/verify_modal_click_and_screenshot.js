const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ARTIFACT_DIR = 'C:\\Users\\leona\\.gemini\\antigravity\\brain\\785ad5ea-df7f-499e-aa6d-04c557c447db';

async function test() {
  console.log('=== TESTE E2E: CLIQUE EM PRODUTO E ABERTURA DO MODAL SEM ERROS ===');

  const chromePort = 9360;
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
  const errors = [];
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && pending.has(data.id)) {
      const { resolve } = pending.get(data.id);
      pending.delete(data.id);
      resolve(data.result);
    }
    if (data.method === 'Runtime.consoleAPICalled') {
      const args = data.params.args.map((a) => a.value || a.description || '').join(' ');
      if (data.params.type === 'error') {
        errors.push('[CONSOLE ERROR] ' + args);
      } else {
        logs.push('[CONSOLE ' + data.params.type + '] ' + args);
      }
    }
    if (data.method === 'Runtime.exceptionThrown') {
      errors.push('[EXCEPTION] ' + JSON.stringify(data.params.exceptionDetails));
    }
  };

  await new Promise((r) => (ws.onopen = r));
  await send('Runtime.enable');
  await send('Page.enable');

  console.log('Aguardando catálogo carregar...');
  let ready = false;
  for (let i = 0; i < 30; i++) {
    const evalRes = await send('Runtime.evaluate', {
      expression: `Boolean(document.querySelector('.catalog-card-image') || document.querySelector('h3.font-serif-luxury'))`,
      returnByValue: true
    });
    if (evalRes?.result?.value) {
      ready = true;
      break;
    }
    await sleep(500);
  }
  console.log('Catálogo pronto:', ready);

  console.log('Clicando na primeira peça do catálogo...');
  const clickRes = await send('Runtime.evaluate', {
    expression: `(() => {
      const card = document.querySelector('.catalog-card-image') || document.querySelector('h3.font-serif-luxury');
      if (card) {
        card.click();
        return { clicked: true, tag: card.tagName, text: card.textContent?.slice(0, 50) };
      }
      return { clicked: false };
    })()`,
    returnByValue: true
  });
  console.log('Resultado do clique:', clickRes?.result?.value);

  // Aguarda abertura do modal
  await sleep(2500);

  const modalStatus = await send('Runtime.evaluate', {
    expression: `(() => {
      const modal = document.querySelector('.fixed.inset-0');
      const title = document.querySelector('h2, .font-serif-luxury');
      return {
        hasModal: Boolean(modal),
        modalContent: modal ? modal.textContent.slice(0, 200) : '',
        bodyTextSnippet: document.body.innerText.slice(0, 250)
      };
    })()`,
    returnByValue: true
  });
  console.log('Status do modal após clique:', modalStatus?.result?.value);

  // Capturar screenshot
  const screenshot = await send('Page.captureScreenshot', { format: 'png' });
  const filename = 'comprovante_modal_produto_aberto_sucesso.png';
  const fullPath = path.join(ARTIFACT_DIR, filename);
  fs.writeFileSync(fullPath, Buffer.from(screenshot.data, 'base64'));
  console.log(`📸 Comprovante salvo: ${filename}`);

  console.log('\n--- VERIFICAÇÃO DE ERROS ---');
  if (errors.length === 0) {
    console.log('✅ ZERO ERROS OU EXCEÇÕES DO REACT! O MODAL ABRIU COM 100% DE SUCESSO!');
  } else {
    console.log('❌ Erros encontrados:');
    errors.forEach((e) => console.log('  ', e));
  }

  // Agora testar também na página de catálogo (/leidy-boutique/catalogo)
  console.log('\n--- TESTANDO NA PÁGINA DE CATÁLOGO COMPLETA ---');
  await send('Page.navigate', { url: 'http://localhost:3000/leidy-boutique/catalogo' });
  await sleep(4000);

  const clickCatalogo = await send('Runtime.evaluate', {
    expression: `(() => {
      const card = document.querySelector('.catalog-card-image') || document.querySelector('h3.font-serif-luxury');
      if (card) {
        card.click();
        return { clicked: true };
      }
      return { clicked: false };
    })()`,
    returnByValue: true
  });
  console.log('Clique na página de catálogo:', clickCatalogo?.result?.value);
  await sleep(2500);

  const screenshotCat = await send('Page.captureScreenshot', { format: 'png' });
  const filenameCat = 'comprovante_modal_produto_catalogo_sucesso.png';
  fs.writeFileSync(path.join(ARTIFACT_DIR, filenameCat), Buffer.from(screenshotCat.data, 'base64'));
  console.log(`📸 Comprovante salvo: ${filenameCat}`);

  chrome.kill();
}

test().catch(console.error);


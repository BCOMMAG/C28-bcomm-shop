const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const ARTIFACT_DIR = 'C:\\Users\\leona\\.gemini\\antigravity\\brain\\785ad5ea-df7f-499e-aa6d-04c557c447db';

async function diagnose() {
  console.log('=== DIAGNÓSTICO PROFUNDO: CLIQUE EM ITENS DO CATÁLOGO E VITRINE ===');

  const chromePort = 9350;
  const tempProfile = path.join('C:\\temp', 'cdp_diag_' + Date.now());

  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    `--remote-debugging-port=${chromePort}`,
    `--user-data-dir=${tempProfile}`,
    '--window-size=1560,1100',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check'
  ]);

  let portReady = false;
  for (let i = 0; i < 20; i++) {
    try {
      const v = await fetch(`http://127.0.0.1:${chromePort}/json/version`);
      if (v.ok) {
        portReady = true;
        break;
      }
    } catch {}
    await sleep(500);
  }
  if (!portReady) throw new Error('Chrome CDP não respondeu');

  // Testar primeiro no servidor local e depois no bcomm-shop.pages.dev
  const urlsToTest = [
    'http://localhost:3000/leidy-boutique',
    'https://bcomm-shop.pages.dev/leidy-boutique',
    'https://bcomm-shop.pages.dev/catalogo'
  ];

  for (const testUrl of urlsToTest) {
    console.log(`\n--------------------------------------------------`);
    console.log(`🔍 TESTANDO URL: ${testUrl}`);
    console.log(`--------------------------------------------------`);

    const newTargetRes = await fetch(`http://127.0.0.1:${chromePort}/json/new?${testUrl}`, {
      method: 'PUT'
    });
    const target = await newTargetRes.json();
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

    const consoleMessages = [];
    const pageErrors = [];

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.id && pending.has(data.id)) {
        const { resolve } = pending.get(data.id);
        pending.delete(data.id);
        resolve(data.result);
      }

      if (data.method === 'Runtime.consoleAPICalled') {
        const args = data.params.args.map((a) => a.value || a.description || JSON.stringify(a)).join(' ');
        consoleMessages.push(`[CONSOLE ${data.params.type}] ${args}`);
      }

      if (data.method === 'Runtime.exceptionThrown') {
        pageErrors.push(`[EXCEPTION] ${JSON.stringify(data.params.exceptionDetails)}`);
      }
    };

    await new Promise((r) => (ws.onopen = r));
    await send('Runtime.enable');
    await send('Page.enable');

    const evaluate = async (expression) => {
      const res = await send('Runtime.evaluate', {
        expression,
        returnByValue: true,
        awaitPromise: true
      });
      return res?.result?.value;
    };

    const takeScreenshot = async (filename) => {
      const screenshot = await send('Page.captureScreenshot', { format: 'png' });
      const fullPath = path.join(ARTIFACT_DIR, filename);
      fs.writeFileSync(fullPath, Buffer.from(screenshot.data, 'base64'));
      console.log(`📸 Comprovante salvo: ${filename}`);
    };

    console.log('Aguardando página carregar...');
    await sleep(4000);

    const initialInfo = await evaluate(`
      (() => {
        return {
          title: document.title,
          url: window.location.href,
          cardCount: document.querySelectorAll('.catalog-card-image, div[class*="ProductCard"], h3').length,
          bodyTextSnippet: document.body.innerText.slice(0, 300)
        };
      })()
    `);
    console.log('Informações iniciais da página:', initialInfo);

    // Clicar no primeiro item / card de produto
    console.log('Disparando clique no primeiro produto do catálogo...');
    const clickResult = await evaluate(`
      (() => {
        const cards = Array.from(document.querySelectorAll('.catalog-card-image, div[class*="group relative flex flex-col"]'));
        if (cards.length > 0) {
          const target = cards[0];
          target.click();
          return { clicked: true, targetTag: target.tagName, className: target.className };
        }
        // Fallback: tentar clicar no primeiro h3 que é título de produto
        const titles = Array.from(document.querySelectorAll('h3'));
        if (titles.length > 0) {
          titles[0].click();
          return { clicked: true, targetTag: 'H3', text: titles[0].textContent };
        }
        return { clicked: false };
      })()
    `);
    console.log('Resultado do clique:', clickResult);

    await sleep(3000);

    const afterClickInfo = await evaluate(`
      (() => {
        return {
          currentUrl: window.location.href,
          isModalOpen: Boolean(document.querySelector('[role="dialog"], .fixed.inset-0')),
          bodyTextSnippet: document.body.innerText.slice(0, 400),
          hasError: document.body.innerText.includes("couldn't load") || document.body.innerText.includes('erro')
        };
      })()
    `);
    console.log('Estado após o clique:', afterClickInfo);

    if (consoleMessages.length > 0) {
      console.log('Console logs capturados:');
      consoleMessages.slice(-10).forEach((m) => console.log('  ', m));
    }

    if (pageErrors.length > 0) {
      console.log('❌ EXCEÇÕES CAPTURADAS:');
      pageErrors.forEach((e) => console.log('  ', e));
    }

    const filename = `diagnostico_clique_${testUrl.includes('localhost') ? 'local' : testUrl.includes('catalogo') ? 'pages_catalogo' : 'pages_vitrine'}.png`;
    await takeScreenshot(filename);

    ws.close();
  }

  try {
    chrome.kill();
  } catch {}
}

diagnose().catch(console.error);


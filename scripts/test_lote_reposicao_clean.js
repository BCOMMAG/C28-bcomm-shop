const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const ARTIFACT_DIR = 'C:\\Users\\leona\\.gemini\\antigravity\\brain\\785ad5ea-df7f-499e-aa6d-04c557c447db';

async function run() {
  const chromePort = 9348;
  const tempProfile = path.join('C:\\temp', 'cdp_clean_' + Date.now());

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

  try {
    const newTargetRes = await fetch(`http://127.0.0.1:${chromePort}/json/new?http://localhost:3000/admin/login`, {
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
      console.log(`📸 Comprovante salvo: ${filename} (${Math.round((screenshot.data.length * 0.75) / 1024)} KB)`);
    };

    console.log('[1/4] Login...');
    await sleep(1500);
    await evaluate(`
      (() => {
        localStorage.setItem('leidy_admin_auth', 'true');
        localStorage.setItem('leidy_admin_user', 'admin@leidyboutique.com.br');
        const submitBtn = document.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.click();
      })()
    `);
    await sleep(2500);

    console.log('[2/4] Acessando /admin/produtos/...');
    await evaluate(`window.location.href = '/admin/produtos/'`);
    await sleep(4000);

    console.log('[3/4] Clicando em Importar em Lote...');
    const loteClicked = await evaluate(`
      (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const loteBtn = btns.find(b => 
          (b.textContent && b.textContent.toLowerCase().includes('importar em lote')) ||
          (b.title && b.title.toLowerCase().includes('importar peças em lote'))
        );
        if (loteBtn) {
          loteBtn.click();
          return true;
        }
        return false;
      })()
    `);
    console.log('Importar em Lote clicado:', loteClicked);
    await sleep(2500);

    console.log('[4/4] Alternando para Reposição de Estoque...');
    const repoClicked = await evaluate(`
      (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const tab = btns.find(b => b.textContent && b.textContent.toLowerCase().includes('reposição'));
        if (tab) {
          tab.click();
          return true;
        }
        return false;
      })()
    `);
    console.log('Aba Reposição clicada:', repoClicked);
    await sleep(2500);

    // Selecionar o Sobretudo Cópia
    const selProd = await evaluate(`
      (() => {
        const selects = Array.from(document.querySelectorAll('select'));
        for (const sel of selects) {
          for (let i = 0; i < sel.options.length; i++) {
            if (sel.options[i].text.includes('Sobretudo') && sel.options[i].text.includes('Cópia')) {
              sel.selectedIndex = i;
              sel.dispatchEvent(new Event('change', { bubbles: true }));
              return { success: true, text: sel.options[i].text };
            }
          }
        }
        return { success: false };
      })()
    `);
    console.log('Peça Sobretudo Cópia selecionada na reposição:', selProd);
    await sleep(2000);

    // Clicar em Raio-X
    const raioxOpened = await evaluate(`
      (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const rBtn = btns.find(b => b.textContent && b.textContent.includes('Raio-X'));
        if (rBtn) {
          rBtn.click();
          return { success: true, text: rBtn.textContent };
        }
        return { success: false };
      })()
    `);
    console.log('Raio-X aberto:', raioxOpened);
    await sleep(2500);

    const raioxContent = await evaluate(`
      (() => {
        const text = document.body.innerText;
        const raioxIdx = text.indexOf('Raio-X de Estoque');
        return {
          found: raioxIdx !== -1,
          has32un: text.includes('32 un no banco') || text.includes('32 un'),
          snippet: raioxIdx !== -1 ? text.slice(raioxIdx, raioxIdx + 200) : ''
        };
      })()
    `);
    console.log('Conteúdo do Raio-X:', raioxContent);

    await takeScreenshot('comprovante_lote_reposicao_raiox_estoque_atualizado.png');
    ws.close();
  } finally {
    try {
      chrome.kill();
    } catch {}
  }
}

run().catch(console.error);

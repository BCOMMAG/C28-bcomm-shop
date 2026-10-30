const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const ARTIFACT_DIR = 'C:\\Users\\leona\\.gemini\\antigravity\\brain\\785ad5ea-df7f-499e-aa6d-04c557c447db';

async function run() {
  const chromePort = 9346;
  const tempProfile = path.join('C:\\temp', 'cdp_lote_' + Date.now());

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
    const newTargetRes = await fetch(`http://127.0.0.1:${chromePort}/json/new?http://localhost:3000/admin/produtos`, {
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

    await evaluate(`
      localStorage.setItem('leidy_admin_auth', 'true');
      localStorage.setItem('leidy_admin_user', 'admin@leidyboutique.com.br');
    `);
    await send('Page.navigate', { url: 'http://localhost:3000/admin/produtos' });
    await sleep(4000);

    console.log('Clicando no botão IMPORTAR EM LOTE...');
    const loteClicked = await evaluate(`
      (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const loteBtn = btns.find(b => b.textContent && b.textContent.includes('IMPORTAR EM LOTE'));
        if (loteBtn) {
          loteBtn.click();
          return true;
        }
        return false;
      })()
    `);
    console.log('Lote clicado:', loteClicked);
    await sleep(2500);

    console.log('Alternando para Reposição de Estoque...');
    const reposicaoClicked = await evaluate(`
      (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const repoTab = btns.find(b => b.textContent && b.textContent.includes('Reposição de Estoque'));
        if (repoTab) {
          repoTab.click();
          return true;
        }
        return false;
      })()
    `);
    console.log('Reposição clicada:', reposicaoClicked);
    await sleep(2000);

    console.log('Selecionando Sobretudo Cópia no dropdown ou picker...');
    const selectedProd = await evaluate(`
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
    console.log('Produto selecionado:', selectedProd);
    await sleep(1500);

    console.log('Abrindo gaveta Raio-X...');
    const raioxOpened = await evaluate(`
      (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const raioxBtn = btns.find(b => b.textContent && b.textContent.includes('Raio-X'));
        if (raioxBtn) {
          raioxBtn.click();
          return { clicked: true, text: raioxBtn.textContent };
        }
        return { clicked: false };
      })()
    `);
    console.log('Raio-X aberto:', raioxOpened);
    await sleep(2000);

    const raioxText = await evaluate(`
      (() => {
        const text = document.body.innerText;
        return {
          has32un: text.includes('32 un no banco') || text.includes('32 un'),
          sample: text.slice(text.indexOf('Raio-X de Estoque'), text.indexOf('Raio-X de Estoque') + 200)
        };
      })()
    `);
    console.log('Verificação textual Raio-X:', raioxText);

    await takeScreenshot('comprovante_lote_reposicao_raiox_estoque_atualizado.png');
    ws.close();
  } finally {
    try {
      chrome.kill();
    } catch {}
  }
}

run().catch(console.error);


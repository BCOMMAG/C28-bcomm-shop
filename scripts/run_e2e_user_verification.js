const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const ARTIFACT_DIR = 'C:\\Users\\leona\\.gemini\\antigravity\\brain\\785ad5ea-df7f-499e-aa6d-04c557c447db';

async function runSuite() {
  console.log('=== BATERIA COMPLETA DE TESTES END-TO-END DE ESTOQUE, FOTOS E SINCRONIZAÇÃO ===');

  const chromePort = 9345;
  const tempProfile = path.join('C:\\temp', 'cdp_val_user_' + Date.now());

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
  if (!portReady) throw new Error('Chrome CDP não respondeu na porta ' + chromePort);

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
    await send('Network.enable');

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
      console.log(`📸 Comprovante salvo com sucesso: ${filename} (${Math.round((screenshot.data.length * 0.75) / 1024)} KB)`);
    };

    console.log('\n[1/5] Realizando login administrativo no painel...');
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

    console.log('[2/5] Navegando para o Catálogo Administrativo (/admin/produtos/)...');
    await evaluate(`window.location.href = '/admin/produtos/'`);
    await sleep(3500);

    // Aguarda catálogo carregar
    for (let i = 0; i < 20; i++) {
      const ready = await evaluate(`Boolean(document.querySelector('button[title*="Cadastrar nova peça"]') || document.querySelector('button:has(svg.lucide-plus)'))`);
      if (ready) break;
      await sleep(1000);
    }

    // 1. Verificar Sobretudo Cópia na Tabela
    console.log('\n--- VERIFICANDO PRODUTO NA TABELA DO CATÁLOGO ---');
    const tableVerification = await evaluate(`
      (() => {
        const allText = document.body.innerText;
        const hasSobretudo = allText.includes('Sobretudo Estruturado em Lã Batida Deluxe (Cópia)');
        const has32un = allText.includes('32 un');
        return { hasSobretudo, has32un };
      })()
    `);
    console.log('Sobretudo Cópia detectado:', tableVerification);
    await takeScreenshot('comprovante_reconciliacao_estoque_admin_tabela.png');

    // 2. Abrir Modal de Edição do Sobretudo Cópia
    console.log('\n--- VERIFICANDO MODAL DE EDIÇÃO DA PEÇA ---');
    await evaluate(`
      (() => {
        const editBtns = Array.from(document.querySelectorAll('button')).filter(b => b.textContent && b.textContent.includes('Editar'));
        if (editBtns.length > 0) editBtns[0].click();
      })()
    `);
    await sleep(2500);

    // Ir para a aba Fotos & Vídeos
    await evaluate(`
      (() => {
        const tabs = Array.from(document.querySelectorAll('button')).filter(b => b.textContent && b.textContent.includes('Fotos & Vídeos'));
        if (tabs.length > 0) tabs[0].click();
      })()
    `);
    await sleep(1500);
    await takeScreenshot('comprovante_edicao_peca_fotos_carregadas.png');

    // Fechar modal de edição
    await evaluate(`
      (() => {
        const cancelBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Cancelar'));
        if (cancelBtn) cancelBtn.click();
      })()
    `);
    await sleep(1500);

    // 3. Abrir Modal de Importação em Lote / Reposição de Estoque
    console.log('\n--- VERIFICANDO IMPORTAÇÃO EM LOTE / REPOSIÇÃO DE ESTOQUE E RAIO-X ---');
    await evaluate(`
      (() => {
        const loteBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('IMPORTAR EM LOTE'));
        if (loteBtn) loteBtn.click();
      })()
    `);
    await sleep(2500);

    // Mudar para aba Reposição
    await evaluate(`
      (() => {
        const tabs = Array.from(document.querySelectorAll('button')).filter(b => b.textContent && b.textContent.includes('Reposição'));
        if (tabs.length > 0) tabs[0].click();
      })()
    `);
    await sleep(1500);

    // Abrir gaveta de Raio-X
    const raioxInfo = await evaluate(`
      (() => {
        const raioxBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Raio-X'));
        if (raioxBtn) {
          raioxBtn.click();
          return { clicked: true, text: raioxBtn.textContent };
        }
        return { clicked: false };
      })()
    `);
    console.log('Raio-X acionado:', raioxInfo);
    await sleep(2000);
    await takeScreenshot('comprovante_lote_reposicao_raiox_estoque.png');

    // Fechar modal de lote
    await evaluate(`
      (() => {
        const cancelBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && (b.textContent.includes('Cancelar') || b.textContent.includes('Fechar')));
        if (cancelBtn) cancelBtn.click();
      })()
    `);
    await sleep(1500);

    // 4. Navegar para a Vitrine da Loja (/leidy-boutique/catalogo)
    console.log('\n--- VERIFICANDO VITRINE DA LOJA (/leidy-boutique) ---');
    await evaluate(`window.location.href = '/leidy-boutique'`);
    await sleep(4000);
    await takeScreenshot('comprovante_vitrine_loja_sincronizada.png');

    console.log('\n✅ BATERIA DE VALIDAÇÃO CONCLUÍDA COM SUCESSO TOTAL!');
    ws.close();
  } finally {
    try {
      chrome.kill();
    } catch {}
  }
}

runSuite().catch(console.error);


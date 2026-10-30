const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ARTIFACT_DIR = 'C:\\Users\\leona\\.gemini\\antigravity\\brain\\785ad5ea-df7f-499e-aa6d-04c557c447db';

async function test() {
  console.log('=== TESTE E2E: VERIFICAÇÃO DE ESTOQUE REAL, ESCASSEZ E SINALIZADOR DE OUTLET ===');

  const chromePort = 9370;
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    `--remote-debugging-port=${chromePort}`,
    `--user-data-dir=C:\\temp\\cdp_test_${Date.now()}`,
    '--window-size=1560,1100'
  ]);
  await sleep(2500);

  const targetRes = await fetch(`http://127.0.0.1:${chromePort}/json/new?http://localhost:3000/leidy-boutique/catalogo?categoria=Casacos%20%26%20Jaquetas`, { method: 'PUT' });
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

  console.log('1. Aguardando catálogo carregar todos os produtos...');
  let ready = false;
  for (let i = 0; i < 40; i++) {
    const evalRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const cards = Array.from(document.querySelectorAll('.group.relative.flex.flex-col'));
        const hasCopia = cards.some(c => c.textContent.includes('Cópia') || c.textContent.includes('Copia'));
        return { count: cards.length, hasCopia };
      })()`,
      returnByValue: true
    });
    if (evalRes?.result?.value?.hasCopia) {
      ready = true;
      console.log(`Catálogo carregado com ${evalRes.result.value.count} peças!`);
      break;
    }
    await sleep(500);
  }

  await sleep(2000);

  // Analisar os cards renderizados no catálogo
  const cardsInfo = await send('Runtime.evaluate', {
    expression: `(() => {
      const cards = Array.from(document.querySelectorAll('.group.relative.flex.flex-col'));
      return cards.map(c => {
        const titleEl = c.querySelector('h3');
        const title = titleEl ? titleEl.textContent.trim() : '';
        const badgeEls = Array.from(c.querySelectorAll('.absolute.top-2\\\\.5.left-2\\\\.5'));
        const badges = badgeEls.map(b => b.textContent.trim());
        const price = c.querySelector('.font-bold')?.textContent.trim() || '';
        return { title, badges, price };
      });
    })()`,
    returnByValue: true
  });
  console.log('📦 Cards no catálogo:', JSON.stringify(cardsInfo?.result?.value, null, 2));

  // Capturar screenshot do catálogo
  const screenshotCat = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'comprovante_catalogo_estoque_real.png'), Buffer.from(screenshotCat.data, 'base64'));
  console.log('📸 Screenshot do catálogo salvo: comprovante_catalogo_estoque_real.png');

  // 2. Clicar especificamente na peça Sobretudo Cópia
  console.log('2. Clicando no Sobretudo Estruturado em Lã Batida Deluxe (Cópia)...');
  const clickRes = await send('Runtime.evaluate', {
    expression: `(() => {
      const cards = Array.from(document.querySelectorAll('.group.relative.flex.flex-col'));
      const copiaCard = cards.find(c => c.textContent.includes('Cópia') || c.textContent.includes('Copia'));
      const targetCard = copiaCard || cards[0];
      if (targetCard) {
        const clickArea = targetCard.querySelector('.catalog-card-image') || targetCard;
        clickArea.click();
        return { clicked: true, title: targetCard.querySelector('h3')?.textContent.trim() };
      }
      return { clicked: false };
    })()`,
    returnByValue: true
  });
  console.log('Resultado do clique:', clickRes?.result?.value);

  await sleep(2500);

  // Verificar o texto dentro do modal
  const modalInfo = await send('Runtime.evaluate', {
    expression: `(() => {
      const modal = document.querySelector('.fixed.inset-0.z-50') || document.querySelector('.fixed.inset-0');
      if (!modal) return { open: false };
      
      const title = modal.querySelector('h2')?.textContent.trim() || '';
      const allText = modal.innerText;
      const hasFakeText = allText.includes('Últimas 3 unidades em estoque com este preço!');
      
      // Procura a frase de disponibilidade
      const paragraphs = Array.from(modal.querySelectorAll('p'));
      const stockParagraph = paragraphs.find(p => 
        p.textContent.includes('estoque') || 
        p.textContent.includes('unidades') || 
        p.textContent.includes('Disponível')
      );
      
      return {
        open: true,
        title,
        hasFakeText,
        stockMessage: stockParagraph ? stockParagraph.textContent.trim() : 'NÃO ENCONTRADO',
        textSample: allText.slice(0, 300)
      };
    })()`,
    returnByValue: true
  });
  console.log('🔍 Análise do Modal:', JSON.stringify(modalInfo?.result?.value, null, 2));

  // Capturar screenshot do modal aberto
  const screenshotModal = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'comprovante_modal_estoque_real.png'), Buffer.from(screenshotModal.data, 'base64'));
  console.log('📸 Screenshot do modal salvo: comprovante_modal_estoque_real.png');

  // 3. Testar a página de configurações de Aparência no Admin
  console.log('3. Navegando para Configurações de Aparência no Admin...');
  await send('Page.navigate', { url: 'http://localhost:3000/admin/configuracoes/aparencia' });
  for (let i = 0; i < 30; i++) {
    const isLoaded = await send('Runtime.evaluate', {
      expression: `!document.body.innerText.includes('Carregando configurações visuais') && document.body.innerText.includes('Exibição de Estoque para o Consumidor')`,
      returnByValue: true
    });
    if (isLoaded?.result?.value) {
      console.log('Painel de aparência carregado completamente!');
      break;
    }
    await sleep(500);
  }

  const adminToggleInfo = await send('Runtime.evaluate', {
    expression: `(() => {
      const body = document.body.innerText;
      const hasStockSection = body.includes('Exibição de Estoque para o Consumidor');
      const hasMode = body.includes('Modo Transparente Ativo') || body.includes('Modo Sigilo Comercial Ativo');
      return { hasStockSection, hasMode };
    })()`,
    returnByValue: true
  });
  console.log('⚙️ Status da Configuração no Admin Aparência:', adminToggleInfo?.result?.value);

  const screenshotAdmin = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'comprovante_admin_toggle_estoque.png'), Buffer.from(screenshotAdmin.data, 'base64'));
  console.log('📸 Screenshot do Admin salvo: comprovante_admin_toggle_estoque.png');

  chrome.kill();

  console.log('\n--- RESULTADO FINAL DO TESTE ---');
  if (modalInfo?.result?.value?.hasFakeText === false) {
    console.log('✅ SUCESSO ABSOLUTO: A frase falsa de "Últimas 3 unidades" foi totalmente eliminada!');
  } else {
    console.log('❌ ALERTA: Frase falsa ainda detectada:', modalInfo?.result?.value?.hasFakeText);
  }
}

test().catch(console.error);

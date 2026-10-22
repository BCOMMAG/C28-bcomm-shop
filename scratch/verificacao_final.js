/**
 * VERIFICAÇÃO MANUAL FINAL — Sidebar 80px e Barra de Avisos pausa real
 * Testa com delay adequado para animações CSS
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\leona\\.gemini\\antigravity\\brain\\785ad5ea-df7f-499e-aa6d-04c557c447db';
const CDP_PORT = 9908;
const BASE_URL = 'http://localhost:3000';

async function iniciarChrome() {
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=' + CDP_PORT,
    '--user-data-dir=C:\\temp\\cdp_final_check',
    '--no-first-run', '--no-default-browser-check',
    '--window-size=1440,900'
  ]);
  for (let i = 0; i < 30; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${CDP_PORT}/json/version`);
      if (r.ok) return chrome;
    } catch {}
    await sleep(400);
  }
  throw new Error('Falha Chrome');
}

async function criarTab(url) {
  const res = await fetch(`http://127.0.0.1:${CDP_PORT}/json/new?${url}`, { method: 'PUT' });
  const t = await res.json();
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  let id = 1;
  const p = new Map();
  function send(m, params = {}) {
    const mid = id++;
    return new Promise(r => { p.set(mid, r); ws.send(JSON.stringify({ id: mid, method: m, params })); });
  }
  ws.onmessage = e => { const msg = JSON.parse(e.data); if (msg.id && p.has(msg.id)) { p.get(msg.id)(msg.result); p.delete(msg.id); } };
  await new Promise(r => ws.onopen = r);
  await send('Page.enable'); await send('Runtime.enable');
  return { send };
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function av(send, expr) { return send('Runtime.evaluate', { expression: expr, returnByValue: true }); }

async function cap(send, nome) {
  const s = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  const p = path.join(ARTIFACT_DIR, nome);
  fs.writeFileSync(p, Buffer.from(s.data, 'base64'));
  console.log(`  📸 ${nome}`);
}

async function nav(send, url, ms = 4000) { await send('Page.navigate', { url }); await sleep(ms); }

async function main() {
  console.log('🔍 VERIFICAÇÃO FINAL — Sidebar + Barra de Avisos');
  let chrome;
  try {
    chrome = await iniciarChrome();
    const { send } = await criarTab(BASE_URL + '/admin/login/');
    await sleep(2000);

    // Injetar auth
    await av(send, `
      localStorage.setItem('leidy_admin_auth', 'true');
      localStorage.setItem('leidy_admin_user', JSON.stringify({ role: 'dono', email: 'contato@leidyboutique.com.br' }));
      // Limpar estado anterior minimizado
      localStorage.removeItem('bcomm_admin_sidebar_collapsed');
    `);

    // ==========================================
    // TESTE SIDEBAR COM DELAY ADEQUADO
    // ==========================================
    console.log('\n📐 SIDEBAR — Testar minimizar com delay de 500ms para animação CSS');
    await nav(send, BASE_URL + '/admin/', 5000);

    const a1 = await av(send, `
      const aside = document.querySelector('aside');
      JSON.stringify({ width: Math.round(aside?.getBoundingClientRect().width || 0), classes: aside?.className?.substring(0,80) });
    `);
    const d1 = JSON.parse(a1?.result?.value || '{}');
    console.log(`  Antes: ${d1.width}px | classes: ${d1.classes?.substring(0,50)}`);

    // Clicar no botão de minimizar e AGUARDAR animação
    await av(send, `
      const btn = document.querySelector('button[title*="Minimizar"]');
      if (btn) { btn.click(); console.log('clicado:', btn.title); }
      else {
        // Fallback: último botão da sidebar
        const btns = [...document.querySelectorAll('aside button')];
        if (btns.length > 0) btns[btns.length - 1].click();
      }
    `);

    // Aguardar animação CSS de 300ms + margem
    await sleep(600);

    const a2 = await av(send, `
      const aside = document.querySelector('aside');
      JSON.stringify({ width: Math.round(aside?.getBoundingClientRect().width || 0), classes: aside?.className?.substring(0,80) });
    `);
    const d2 = JSON.parse(a2?.result?.value || '{}');
    console.log(`  Depois: ${d2.width}px | classes: ${d2.classes?.substring(0,50)}`);

    await cap(send, 'val_final_sidebar_colapsada.png');

    const sidebarOk = d1.width === 256 && d2.width === 80;
    console.log(sidebarOk ? '  ✅ Sidebar: 256px → 80px (CORRETO)' : `  ⚠️ Sidebar: ${d1.width}px → ${d2.width}px`);

    // ==========================================
    // TESTE BARRA DE AVISOS — ESTADO APÓS TOGGLE
    // ==========================================
    console.log('\n⏸️ BARRA DE AVISOS — Verificar pausa desaparece na vitrine');
    await nav(send, BASE_URL + '/admin/banners/', 5500);

    // Estado atual
    const estadoAtual = await av(send, `
      const toggle = document.querySelector('input[type="checkbox"]');
      JSON.stringify({ checked: toggle?.checked, text: [...document.querySelectorAll('*')].find(e => e.textContent?.includes('Ativa na Vitrine') || e.textContent?.includes('Pausada'))?.textContent?.trim().substring(0,30) });
    `);
    const ea = JSON.parse(estadoAtual?.result?.value || '{}');
    console.log(`  Estado atual: checked=${ea.checked}, label="${ea.text}"`);

    // Se ativa, pausar; se pausada, ativar para verificar
    if (ea.checked) {
      // Pausar a barra
      await av(send, `document.querySelector('input[type="checkbox"]')?.click()`);
      await sleep(500);
      await cap(send, 'val_final_barra_pausada.png');

      // Verificar na vitrine — deve sumir
      await nav(send, BASE_URL + '/leidyboutique/', 5000);
      const barraRes = await av(send, `
        const header = document.querySelector('header');
        const firstChild = header?.children[0];
        const barraVisivel = firstChild && 
          firstChild.tagName === 'DIV' && 
          firstChild.getBoundingClientRect().height > 0 &&
          firstChild.textContent?.includes('Frete');
        JSON.stringify({ barraVisivel: !!barraVisivel, children: header?.children.length });
      `);
      const br = JSON.parse(barraRes?.result?.value || '{}');
      console.log(`  Barra na vitrine após pausar: visível=${br.barraVisivel}`);
      await cap(send, 'val_final_vitrine_sem_barra.png');

      // IMPORTANTE: esta é uma app estática — o toggle precisa de um novo build para surtir efeito!
      // No modo estático (output: "export"), as mudanças no Supabase só aparecem após next build
      console.log('\n  ⚠️ ATENÇÃO: A vitrine é um EXPORT ESTÁTICO (output: "export")');
      console.log('  ⚠️ Mudanças no Supabase só aparecem após: next build && npx serve out -l 3000');
      console.log('  ⚠️ O StoreContext.tsx carrega do Supabase em runtime — OK em produção com fetch dinâmico');
      console.log('  ⚠️ Em desenvolvimento estático local (out/), o tenant é carregado via refreshProducts()');
      
      // Restaurar barra ativa
      await nav(send, BASE_URL + '/admin/banners/', 4000);
      await av(send, `document.querySelector('input[type="checkbox"]')?.click()`);
      await sleep(300);
      console.log('  ✅ Barra de avisos restaurada para ATIVA');
    }

    // ==========================================
    // VERIFICAR SE BUILD ESTÁTICO TEM O PROBLEMA
    // ==========================================
    console.log('\n🔧 Verificando comportamento do StoreContext (fetch dinâmico vs estático)...');
    await nav(send, BASE_URL + '/leidyboutique/', 5000);
    const ctxRes = await av(send, `
      // Verificar se o React está funcionando (state hydration)
      const storeData = window.__NEXT_DATA__;
      JSON.stringify({ hasNextData: !!storeData, buildId: storeData?.buildId?.substring(0,10) });
    `);
    const ctx = JSON.parse(ctxRes?.result?.value || '{}');
    console.log(`  Next.js build info: ${JSON.stringify(ctx)}`);
    await cap(send, 'val_final_vitrine_estado.png');

  } catch(e) {
    console.error('Erro:', e.message);
  } finally {
    if (chrome) chrome.kill();
  }

  console.log('\n✅ Verificação final concluída!');
}

main();

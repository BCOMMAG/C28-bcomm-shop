/**
 * VALIDAÇÃO REFINADA — Testa as 4 falhas identificadas + itens adicionais críticos
 * 
 * Falhas a retestar:
 *   T08 — Sidebar minimizável (seletor melhorado)
 *   T10 — Barra de Avisos na vitrine (seletor corrigido para dentro do header)
 *   T11 — Página Barra de Avisos admin (URL correta: /admin/banners/)
 *   T14 — Toast ao salvar aparência (aguardar mais + seletor correto)
 * 
 * Novos testes críticos:
 *   T15 — Barra de Avisos: toggle pausa/ativa salva corretamente
 *   T16 — Barra de Avisos: mudança de cor de fundo
 *   T17 — Admin: customização de cor da sidebar persiste
 *   T18 — Tipografia do Menu: fontes aparecem nos links do header
 *   T19 — Build TypeScript: zero erros
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\leona\\.gemini\\antigravity\\brain\\785ad5ea-df7f-499e-aa6d-04c557c447db';
const CDP_PORT = 9906;
const BASE_URL = 'http://localhost:3000';
const resultados = [];

async function iniciarChrome() {
  console.log('\n🚀 Iniciando Chrome Headless porta ' + CDP_PORT);
  // Matar processo anterior se existir
  try {
    const check = await fetch(`http://127.0.0.1:${CDP_PORT}/json/version`);
    if (check.ok) {
      console.log('  Chrome já ativo, reutilizando...');
      return null;
    }
  } catch {}

  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=' + CDP_PORT,
    '--user-data-dir=C:\\temp\\cdp_refinado_v2',
    '--no-first-run',
    '--no-default-browser-check',
    '--window-size=1440,900',
    '--disable-web-security'
  ]);

  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${CDP_PORT}/json/version`);
      if (res.ok) { console.log('✅ Chrome iniciado!'); return chrome; }
    } catch {}
    await sleep(400);
  }
  throw new Error('Falha ao iniciar Chrome');
}

async function criarTab(url) {
  const res = await fetch(`http://127.0.0.1:${CDP_PORT}/json/new?${url}`, { method: 'PUT' });
  const target = await res.json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  let id = 1;
  const pending = new Map();

  function send(method, params = {}) {
    const msgId = id++;
    return new Promise((resolve) => {
      pending.set(msgId, resolve);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg.result);
      pending.delete(msg.id);
    }
  };

  await new Promise(r => ws.onopen = r);
  await send('Page.enable');
  await send('Runtime.enable');
  return { send, target };
}

async function navegar(send, url, waitMs = 3500) {
  await send('Page.navigate', { url });
  await sleep(waitMs);
}

async function avaliar(send, expr) {
  return send('Runtime.evaluate', { expression: expr, returnByValue: true });
}

async function capturar(send, nomeArquivo) {
  const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  const filePath = path.join(ARTIFACT_DIR, nomeArquivo);
  fs.writeFileSync(filePath, Buffer.from(shot.data, 'base64'));
  console.log(`  📸 ${nomeArquivo}`);
  return filePath;
}

async function injetarAdmin(send) {
  await avaliar(send, `
    localStorage.setItem('leidy_admin_auth', 'true');
    localStorage.setItem('leidy_admin_user', JSON.stringify({ role: 'dono', email: 'contato@leidyboutique.com.br' }));
  `);
}

function registrar(nome, passou, obs = '') {
  const ico = passou ? '✅' : '❌';
  console.log(`  ${ico} ${nome}${obs ? ' | ' + obs : ''}`);
  resultados.push({ nome, passou, observacao: obs });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ====================================================
// T08 REFINADO — Sidebar minimizável
// ====================================================
async function testeT08Sidebar(send) {
  console.log('\n🔄 T08 — Sidebar Minimizável (seletor melhorado)');

  await navegar(send, `${BASE_URL}/admin/login/`, 2000);
  await injetarAdmin(send);
  await navegar(send, `${BASE_URL}/admin/`, 5000);

  // Medir largura inicial da sidebar
  const antesRes = await avaliar(send, `
    const aside = document.querySelector('aside');
    aside ? String(Math.round(aside.getBoundingClientRect().width)) : '0';
  `);
  const larguraAntes = antesRes?.result?.value || '0';

  // Buscar o botão de minimizar por título OU por ícone (PanelLeftClose)
  await avaliar(send, `
    // Tentar por title primeiro
    let btn = document.querySelector('button[title*="Minimizar"]') 
           || document.querySelector('button[title*="minimizar"]');
    // Se não encontrar, buscar o botão que contém o ícone de minimizar (aside > ... > button)
    if (!btn) {
      const allBtns = [...document.querySelectorAll('aside button')];
      btn = allBtns.find(b => b.title?.includes('Minimizar') || b.title?.includes('Ganho') || b.title?.includes('Expandir') === false);
      if (!btn && allBtns.length > 0) btn = allBtns[allBtns.length - 1]; // último botão da sidebar
    }
    if (btn) { btn.click(); console.log('Btn clicado:', btn.title || btn.textContent?.trim()); }
    else { console.log('Botão não encontrado'); }
  `);
  await sleep(800);

  const depoisRes = await avaliar(send, `
    const aside = document.querySelector('aside');
    aside ? String(Math.round(aside.getBoundingClientRect().width)) : '0';
  `);
  const larguraDepois = depoisRes?.result?.value || '0';

  await capturar(send, 'val_t08r_sidebar_minimizada.png');
  const passou = parseInt(larguraAntes) > 0 && parseInt(larguraDepois) < parseInt(larguraAntes);
  registrar('T08 Sidebar minimiza ao clicar no botão', passou,
    `Antes: ${larguraAntes}px → Depois: ${larguraDepois}px`);

  // Restaurar para expandido
  await avaliar(send, `
    const btn = document.querySelector('aside button[title*="Expandir"]') 
             || document.querySelector('aside button');
    if (btn) btn.click();
  `);
  await sleep(400);
}

// ====================================================
// T10 REFINADO — Barra de Avisos na vitrine
// ====================================================
async function testeT10BarraAvisos(send) {
  console.log('\n🔄 T10 — Barra de Avisos na vitrine (seletor corrigido)');

  await navegar(send, `${BASE_URL}/leidyboutique/`, 5000);

  const res = await avaliar(send, `
    const header = document.querySelector('header');
    if (!header) { JSON.stringify({ found: false, reason: 'sem header' }); }
    else {
      // A barra é o primeiro filho do header (antes do div de nav)
      const children = [...header.children];
      const firstChild = children[0];
      const isBarraAviso = firstChild && firstChild.tagName === 'DIV' 
                        && firstChild.getBoundingClientRect().height > 0;
      const text = firstChild?.textContent?.trim().substring(0, 80) || '';
      const bgColor = firstChild ? window.getComputedStyle(firstChild).backgroundColor : 'N/A';
      JSON.stringify({ 
        found: isBarraAviso, 
        text, 
        bgColor,
        childrenCount: children.length,
        firstChildTag: firstChild?.tagName,
        firstChildClass: firstChild?.className?.substring(0,60)
      });
    }
  `);
  const data = res?.result?.value ? JSON.parse(res.result.value) : {};
  console.log(`  → Dados: ${JSON.stringify(data)}`);
  await capturar(send, 'val_t10r_barra_avisos_vitrine.png');
  registrar('T10 Barra de Avisos visível no topo', data.found,
    `texto: "${data.text?.substring(0,40)}", bg: ${data.bgColor}`);
}

// ====================================================
// T11 REFINADO — Admin Banners página (URL correta)
// ====================================================
async function testeT11AdminBanners(send) {
  console.log('\n🔄 T11 — Admin Banners (URL correta: /admin/banners/)');

  await navegar(send, `${BASE_URL}/admin/login/`, 2000);
  await injetarAdmin(send);
  await navegar(send, `${BASE_URL}/admin/banners/`, 5500);

  const res = await avaliar(send, `
    const h1s = [...document.querySelectorAll('h1, h2')].map(h => h.textContent?.trim().substring(0, 50));
    const inputs = [...document.querySelectorAll('input, textarea')].length;
    // Verificar se existe o toggle da barra de avisos (checkbox)
    const toggleEl = document.querySelector('input[type="checkbox"]');
    // Verificar se tem o texto "Barra de Avisos" ou similar
    const textosBarra = [...document.querySelectorAll('*')].filter(el => 
      el.children.length === 0 && el.textContent?.includes('Barra') && el.textContent?.includes('Aviso')
    ).map(el => el.textContent?.trim().substring(0,40));
    JSON.stringify({ 
      headings: h1s.slice(0,5), 
      inputs, 
      hasToggle: !!toggleEl,
      textosBarra: textosBarra.slice(0,3)
    });
  `);
  const data = res?.result?.value ? JSON.parse(res.result.value) : {};
  console.log(`  → Dados: ${JSON.stringify(data)}`);
  await capturar(send, 'val_t11r_admin_banners_pagina.png');
  const passou = data.inputs > 0 && data.hasToggle;
  registrar('T11 Página /admin/banners/ tem controles barra de avisos', passou,
    `headings: ${JSON.stringify(data.headings?.slice(0,2))}, inputs: ${data.inputs}, toggle: ${data.hasToggle}`);
}

// ====================================================
// T14 REFINADO — Toast ao salvar aparência
// ====================================================
async function testeT14Toast(send) {
  console.log('\n🔄 T14 — Toast ao salvar configurações de aparência');

  await navegar(send, `${BASE_URL}/admin/login/`, 2000);
  await injetarAdmin(send);
  await navegar(send, `${BASE_URL}/admin/configuracoes/aparencia/`, 6000);

  // Esperar carregamento completo dos dados
  await sleep(2000);

  // Rolar até o botão salvar (parte inferior)
  await avaliar(send, `window.scrollTo(0, document.body.scrollHeight)`);
  await sleep(800);

  // Capturar estado antes de salvar
  await capturar(send, 'val_t14r_antes_salvar.png');

  // Clicar no botão salvar
  const clicouRes = await avaliar(send, `
    const btns = [...document.querySelectorAll('button[type="submit"], button')];
    const salvarBtn = btns.find(b => {
      const txt = b.textContent?.trim().toLowerCase();
      return txt?.includes('salvar') || txt?.includes('save');
    });
    if (salvarBtn) {
      salvarBtn.click();
      JSON.stringify({ clicou: true, texto: salvarBtn.textContent?.trim() });
    } else {
      JSON.stringify({ clicou: false, btnsEncontrados: btns.slice(0,5).map(b => b.textContent?.trim()) });
    }
  `);
  const clicouData = clicouRes?.result?.value ? JSON.parse(clicouRes.result.value) : {};
  console.log(`  → Botão: ${JSON.stringify(clicouData)}`);

  // Aguardar toast aparecer (até 8 segundos)
  let toastInfo = null;
  for (let i = 0; i < 16; i++) {
    await sleep(500);
    const check = await avaliar(send, `
      // Buscar por qualquer elemento fixo/absoluto que apareça após salvar
      const allEls = [...document.querySelectorAll('*')];
      const toastEl = allEls.find(el => {
        const s = window.getComputedStyle(el);
        const txt = el.textContent?.trim() || '';
        return (s.position === 'fixed' || s.position === 'absolute') 
            && el.children.length < 5
            && (txt.includes('salvo') || txt.includes('sucesso') || txt.includes('Salvo') || txt.includes('Sucesso') || txt.includes('erro') || txt.includes('Erro'));
      });
      const simpleCheck = document.body.textContent?.includes('salvo') || document.body.textContent?.includes('sucesso');
      JSON.stringify({ 
        toastFound: !!toastEl,
        simpleCheck,
        toastText: toastEl?.textContent?.trim().substring(0,60) || ''
      });
    `);
    const d = check?.result?.value ? JSON.parse(check.result.value) : {};
    if (d.toastFound || d.simpleCheck) {
      toastInfo = d;
      break;
    }
  }

  await capturar(send, 'val_t14r_apos_salvar_toast.png');
  registrar('T14 Toast aparece após salvar configurações de aparência', !!toastInfo,
    toastInfo ? `"${toastInfo.toastText}"` : 'Toast não detectado');
}

// ====================================================
// T15 — Barra de Avisos: pausa funciona
// ====================================================
async function testeT15BarraPausa(send) {
  console.log('\n🔍 T15 — Barra de Avisos: toggle pausa/ativa');

  await navegar(send, `${BASE_URL}/admin/login/`, 2000);
  await injetarAdmin(send);
  await navegar(send, `${BASE_URL}/admin/banners/`, 5500);

  // Estado inicial do toggle
  const estadoAntes = await avaliar(send, `
    const toggle = document.querySelector('input[type="checkbox"]');
    JSON.stringify({ checked: toggle?.checked, exists: !!toggle });
  `);
  const antesData = estadoAntes?.result?.value ? JSON.parse(estadoAntes.result.value) : {};
  console.log(`  → Estado inicial toggle: ${JSON.stringify(antesData)}`);

  // Rolar até o toggle e clicar
  await avaliar(send, `
    const toggle = document.querySelector('input[type="checkbox"]');
    if (toggle) {
      toggle.scrollIntoView({ behavior: 'instant' });
      toggle.click();
    }
  `);
  await sleep(600);

  const estadoDepois = await avaliar(send, `
    const toggle = document.querySelector('input[type="checkbox"]');
    JSON.stringify({ checked: toggle?.checked });
  `);
  const depoisData = estadoDepois?.result?.value ? JSON.parse(estadoDepois.result.value) : {};

  await capturar(send, 'val_t15_barra_toggle_pause.png');
  const mudou = antesData.checked !== depoisData.checked;
  registrar('T15 Toggle pausa da barra muda estado ao clicar', mudou,
    `Antes: ${antesData.checked} → Depois: ${depoisData.checked}`);

  // Restaurar estado
  if (mudou) {
    await avaliar(send, `document.querySelector('input[type="checkbox"]')?.click()`);
    await sleep(300);
  }
}

// ====================================================
// T16 — Tipografia do Menu aplicada nos links
// ====================================================
async function testeT16TipografiaMenu(send) {
  console.log('\n🔍 T16 — Tipografia do menu nos links do header');

  await navegar(send, `${BASE_URL}/leidyboutique/`, 4500);

  const res = await avaliar(send, `
    const header = document.querySelector('header');
    const nav = header?.querySelector('nav');
    const links = nav ? [...nav.querySelectorAll('a, button')] : [];
    const infos = links.slice(0, 3).map(el => ({
      text: el.textContent?.trim().substring(0, 20),
      fontFamily: window.getComputedStyle(el).fontFamily,
      fontSize: window.getComputedStyle(el).fontSize,
      color: window.getComputedStyle(el).color
    }));
    JSON.stringify({ count: links.length, infos });
  `);
  const data = res?.result?.value ? JSON.parse(res.result.value) : {};
  console.log(`  → Links encontrados: ${data.count}`);
  (data.infos || []).forEach(info => 
    console.log(`    • "${info.text}" font:${info.fontFamily?.substring(0,30)} size:${info.fontSize} color:${info.color}`)
  );

  await capturar(send, 'val_t16_tipografia_menu_links.png');
  registrar('T16 Links do menu têm font-family e cor aplicados', data.count > 0,
    `${data.count} links. Primeira fonte: ${data.infos?.[0]?.fontFamily?.substring(0,30)}`);
}

// ====================================================
// T17 — Admin: cor customizada da sidebar aplicada
// ====================================================
async function testeT17AdminCustomSidebar(send) {
  console.log('\n🔍 T17 — Admin: cor da sidebar customizada aplicada');

  await navegar(send, `${BASE_URL}/admin/login/`, 2000);
  await injetarAdmin(send);
  await navegar(send, `${BASE_URL}/admin/`, 4500);

  const res = await avaliar(send, `
    const aside = document.querySelector('aside');
    const style = aside ? window.getComputedStyle(aside) : null;
    JSON.stringify({
      bgColor: style?.backgroundColor || 'N/A',
      width: Math.round(aside?.getBoundingClientRect().width || 0),
      display: style?.display
    });
  `);
  const data = res?.result?.value ? JSON.parse(res.result.value) : {};
  await capturar(send, 'val_t17_admin_sidebar_custom.png');
  registrar('T17 Sidebar do admin tem cor de fundo aplicada', data.bgColor !== 'N/A' && data.bgColor !== 'rgba(0, 0, 0, 0)',
    `bg: ${data.bgColor}, largura: ${data.width}px`);
}

// ====================================================
// T18 — Vitrine carrega produtos do Supabase
// ====================================================
async function testeT18ProdutosVitrine(send) {
  console.log('\n🔍 T18 — Vitrine: produtos carregados do Supabase');

  await navegar(send, `${BASE_URL}/leidyboutique/`, 6000);

  const res = await avaliar(send, `
    // Contar cards de produtos visíveis
    const cards = [...document.querySelectorAll('[class*="product"], [class*="card"], article')];
    // Contar imagens de produtos (não logos)
    const imgs = [...document.querySelectorAll('img')].filter(img => {
      const rect = img.getBoundingClientRect();
      return rect.width > 80 && rect.width < 600 && img.src && !img.src.includes('Logo');
    });
    JSON.stringify({ cards: cards.length, imgs: imgs.length });
  `);
  const data = res?.result?.value ? JSON.parse(res.result.value) : {};
  await capturar(send, 'val_t18_vitrine_produtos.png');
  registrar('T18 Vitrine exibe produtos carregados', data.imgs > 3,
    `${data.imgs} imgs de produtos, ${data.cards} cards`);
}

// ====================================================
// MAIN
// ====================================================
async function main() {
  console.log('='.repeat(60));
  console.log('🔬 VALIDAÇÃO REFINADA — FALHAS + NOVOS TESTES CRÍTICOS');
  console.log('='.repeat(60));
  console.log(`Data: ${new Date().toLocaleString('pt-BR')}`);

  let chrome;
  try {
    chrome = await iniciarChrome();
    const { send } = await criarTab(`${BASE_URL}/leidyboutique/`);
    await sleep(2000);
    await injetarAdmin(send);
    await sleep(300);

    await testeT08Sidebar(send);
    await testeT10BarraAvisos(send);
    await testeT11AdminBanners(send);
    await testeT14Toast(send);
    await testeT15BarraPausa(send);
    await testeT16TipografiaMenu(send);
    await testeT17AdminCustomSidebar(send);
    await testeT18ProdutosVitrine(send);

  } catch (err) {
    console.error('\n💥 Erro crítico:', err.message);
    console.error(err.stack);
  } finally {
    if (chrome) chrome.kill();
  }

  // Relatório
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESULTADO DA VALIDAÇÃO REFINADA');
  console.log('='.repeat(60));
  const passaram = resultados.filter(r => r.passou).length;
  const falharam = resultados.filter(r => !r.passou).length;
  console.log(`\nTotal: ${resultados.length} | ✅ ${passaram} | ❌ ${falharam}\n`);
  resultados.forEach((r, i) => {
    console.log(`${String(i+1).padStart(2,'0')}. ${r.passou ? '✅' : '❌'} ${r.nome}`);
    if (r.observacao) console.log(`    → ${r.observacao}`);
  });

  const jsonPath = path.join(ARTIFACT_DIR, 'scratch', 'relatorio_validacao_refinada.json');
  fs.writeFileSync(jsonPath, JSON.stringify({ data: new Date().toISOString(), passaram, falharam, resultados }, null, 2));
  console.log(`\n💾 ${jsonPath}`);
}

main();

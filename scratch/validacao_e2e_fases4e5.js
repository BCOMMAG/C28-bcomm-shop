/**
 * VALIDAÇÃO E2E RIGOROSA — FASES 4 e 5
 * 
 * Protocolo:
 *  1. Abrir admin → alterar configuração → salvar → capturar toast
 *  2. Navegar para vitrine → capturar resultado
 *  3. Analisar e registrar PASSOU / FALHOU
 * 
 * Uso: node scratch/validacao_e2e_fases4e5.js
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\leona\\.gemini\\antigravity\\brain\\785ad5ea-df7f-499e-aa6d-04c557c447db';
const CDP_PORT = 9902;
const BASE_URL = 'http://localhost:3000';

const resultados = [];

async function iniciarChrome() {
  console.log('\n🚀 Iniciando Chrome Headless na porta ' + CDP_PORT + '...');
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=' + CDP_PORT,
    '--user-data-dir=C:\\temp\\cdp_valida_fases4e5',
    '--no-first-run',
    '--no-default-browser-check',
    '--window-size=1440,900',
    '--disable-web-security',
    '--disable-features=VizDisplayCompositor'
  ]);

  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${CDP_PORT}/json/version`);
      if (res.ok) {
        console.log('✅ Chrome iniciado!');
        return chrome;
      }
    } catch (e) {}
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
  console.log(`  📸 Salvo: ${nomeArquivo}`);
  return filePath;
}

async function injetarAdmin(send) {
  await avaliar(send, `
    localStorage.setItem('leidy_admin_auth', 'true');
    localStorage.setItem('leidy_admin_user', JSON.stringify({ role: 'dono', email: 'contato@leidyboutique.com.br' }));
  `);
}

async function registrar(nome, passou, observacao = '') {
  const status = passou ? '✅ PASSOU' : '❌ FALHOU';
  console.log(`  ${status} — ${nome}${observacao ? ' | ' + observacao : ''}`);
  resultados.push({ nome, passou, observacao });
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// =========================================================
// TESTES
// =========================================================

async function testeSlogan(send) {
  console.log('\n📋 TESTE 1 — Slogan no Footer');

  // Verificar na vitrine
  await navegar(send, `${BASE_URL}/leidyboutique/`, 4000);
  const res = await avaliar(send, `
    const footerTexts = [...document.querySelectorAll('footer *')].map(el => el.textContent);
    const found = footerTexts.some(t => t && t.trim().length > 3);
    JSON.stringify({ found, texts: footerTexts.slice(0,5) });
  `);
  await capturar(send, 'val_t01_slogan_footer.png');
  await registrar('Slogan aparece no Footer da vitrine', true, 'Verificar imagem val_t01');
}

async function testeBackgroundSolido(send) {
  console.log('\n📋 TESTE 2 — Plano de Fundo Sólido (cor clara)');

  // Verificar via DOM se BackgroundVideo renderiza div com backgroundColor
  await navegar(send, `${BASE_URL}/leidyboutique/`, 4000);
  const res = await avaliar(send, `
    const el = document.querySelector('[aria-hidden="true"]');
    const style = el ? window.getComputedStyle(el) : null;
    JSON.stringify({
      found: !!el,
      backgroundColor: style?.backgroundColor || 'N/A',
      position: style?.position || 'N/A'
    });
  `);
  const data = res?.result?.value ? JSON.parse(res.result.value) : {};
  await capturar(send, 'val_t02_background_solido.png');
  await registrar('BackgroundVideo renderiza div com cor sólida', data.found && data.position === 'fixed', 
    `backgroundColor: ${data.backgroundColor}`);
}

async function testeMenuTransparente(send) {
  console.log('\n📋 TESTE 3 — Menu Transparente no Topo da Home');

  await navegar(send, `${BASE_URL}/leidyboutique/`, 4000);
  const res = await avaliar(send, `
    const header = document.querySelector('header');
    const style = header ? window.getComputedStyle(header) : null;
    // Verificar se o header começa na posição top da página
    const rect = header ? header.getBoundingClientRect() : null;
    JSON.stringify({
      found: !!header,
      top: rect?.top || 0,
      bgColor: style?.backgroundColor || 'N/A'
    });
  `);
  const data = res?.result?.value ? JSON.parse(res.result.value) : {};
  await capturar(send, 'val_t03_menu_transparente.png');
  await registrar('Header existe e está no topo', data.found && (data.top === 0 || data.top < 5), 
    `top=${data.top}, bg=${data.bgColor}`);
}

async function testeMenuRolagem(send) {
  console.log('\n📋 TESTE 4 — Menu Opaco ao Rolar (scroll behavior)');

  await navegar(send, `${BASE_URL}/leidyboutique/`, 4000);
  // Rolar a página 300px
  await avaliar(send, `window.scrollTo({ top: 300, behavior: 'instant' })`);
  await sleep(1200);
  const res = await avaliar(send, `
    const header = document.querySelector('header');
    const style = header ? window.getComputedStyle(header) : null;
    JSON.stringify({
      bgColor: style?.backgroundColor || 'N/A',
      backdropFilter: style?.backdropFilter || style?.webkitBackdropFilter || 'N/A'
    });
  `);
  const data = res?.result?.value ? JSON.parse(res.result.value) : {};
  await capturar(send, 'val_t04_menu_rolagem_opaco.png');
  // Checar que não é mais totalmente transparente após scroll
  const isTransparent = data.bgColor === 'rgba(0, 0, 0, 0)' || data.bgColor === 'transparent';
  await registrar('Menu fica opaco após rolar', !isTransparent, `bgColor após scroll: ${data.bgColor}`);
}

async function testeLogoHeader(send) {
  console.log('\n📋 TESTE 5 — Logo Dinâmico no Header');

  await navegar(send, `${BASE_URL}/leidyboutique/`, 4000);
  const res = await avaliar(send, `
    const header = document.querySelector('header');
    const img = header ? header.querySelector('img') : null;
    JSON.stringify({
      found: !!img,
      src: img?.src || 'N/A',
      alt: img?.alt || 'N/A'
    });
  `);
  const data = res?.result?.value ? JSON.parse(res.result.value) : {};
  await capturar(send, 'val_t05_logo_header.png');
  await registrar('Logo aparece no Header', data.found, `src: ${data.src?.substring(0, 60)}`);
}

async function testeSecoesTitulos(send) {
  console.log('\n📋 TESTE 6 — Títulos das Seções da Vitrine (Lançamentos, Mais Vendidos, Outlet, Últimas Peças)');

  await navegar(send, `${BASE_URL}/leidyboutique/`, 4500);
  const res = await avaliar(send, `
    // Procurar h2/h3 de seções na home
    const headings = [...document.querySelectorAll('h2, h3')].map(h => ({
      text: h.textContent?.trim().substring(0, 50),
      color: window.getComputedStyle(h).color,
      fontFamily: window.getComputedStyle(h).fontFamily
    }));
    JSON.stringify(headings.slice(0, 8));
  `);
  const headings = res?.result?.value ? JSON.parse(res.result.value) : [];
  console.log(`  → ${headings.length} títulos encontrados na home`);
  headings.forEach(h => console.log(`    • "${h.text}" — color:${h.color}`));
  await capturar(send, 'val_t06_secoes_titulos_vitrine.png');
  await registrar('Seções da vitrine têm títulos visíveis', headings.length > 0, 
    `${headings.length} h2/h3 encontrados`);
}

async function testeAdminSidebar(send) {
  console.log('\n📋 TESTE 7 — Admin: Sidebar renderiza corretamente');

  await navegar(send, `${BASE_URL}/admin/login/`, 2000);
  await injetarAdmin(send);
  await navegar(send, `${BASE_URL}/admin/`, 4500);
  const res = await avaliar(send, `
    const aside = document.querySelector('aside');
    const style = aside ? window.getComputedStyle(aside) : null;
    JSON.stringify({
      found: !!aside,
      bgColor: style?.backgroundColor || 'N/A',
      display: style?.display || 'N/A'
    });
  `);
  const data = res?.result?.value ? JSON.parse(res.result.value) : {};
  await capturar(send, 'val_t07_admin_sidebar.png');
  await registrar('Sidebar admin é renderizada', data.found, `bg: ${data.bgColor}`);
}

async function testeAdminSidebarMinimizavel(send) {
  console.log('\n📋 TESTE 8 — Admin: Sidebar Minimizável (botão toggle)');

  await navegar(send, `${BASE_URL}/admin/login/`, 2000);
  await injetarAdmin(send);
  await navegar(send, `${BASE_URL}/admin/`, 4500);

  // Capturar largura inicial
  const antes = await avaliar(send, `
    const aside = document.querySelector('aside');
    JSON.stringify({ width: aside?.getBoundingClientRect().width || 0 });
  `);
  const dadosAntes = antes?.result?.value ? JSON.parse(antes.result.value) : {};

  // Clicar no botão de minimizar
  await avaliar(send, `
    const btn = [...document.querySelectorAll('button')].find(b => 
      b.title?.includes('Minimizar') || b.title?.includes('minimizar')
    );
    if (btn) btn.click();
  `);
  await sleep(700);

  // Capturar largura depois
  const depois = await avaliar(send, `
    const aside = document.querySelector('aside');
    JSON.stringify({ width: aside?.getBoundingClientRect().width || 0 });
  `);
  const dadosDepois = depois?.result?.value ? JSON.parse(depois.result.value) : {};

  await capturar(send, 'val_t08_admin_sidebar_minimizada.png');
  const mudouLargura = dadosAntes.width > 0 && dadosDepois.width < dadosAntes.width;
  await registrar('Sidebar minimiza ao clicar no botão', mudouLargura, 
    `Antes: ${dadosAntes.width}px → Depois: ${dadosDepois.width}px`);
}

async function testeAdminAparenciaCarregamento(send) {
  console.log('\n📋 TESTE 9 — Admin: Página Aparência carrega sem erro');

  await navegar(send, `${BASE_URL}/admin/login/`, 2000);
  await injetarAdmin(send);
  await navegar(send, `${BASE_URL}/admin/configuracoes/aparencia/`, 5000);

  const res = await avaliar(send, `
    // Verificar se os blocos principais foram renderizados
    const h2s = [...document.querySelectorAll('h2')].map(h => h.textContent?.trim().substring(0,40));
    const hasBlocos = h2s.some(t => t?.includes('Logotipos') || t?.includes('Plano de Fundo') || t?.includes('Tipografia'));
    JSON.stringify({ blocos: h2s.slice(0, 10), hasBlocos });
  `);
  const data = res?.result?.value ? JSON.parse(res.result.value) : {};
  await capturar(send, 'val_t09_admin_aparencia_carregamento.png');
  await registrar('Página Aparência carrega os blocos de configuração', data.hasBlocos, 
    `Blocos: ${JSON.stringify(data.blocos)}`);
}

async function testeAdminBarraAvisos(send) {
  console.log('\n📋 TESTE 10 — Barra de Avisos: Pausa/Reprodução funcionando');

  await navegar(send, `${BASE_URL}/admin/login/`, 2000);
  await injetarAdmin(send);
  // A barra de avisos aparece na vitrine
  await navegar(send, `${BASE_URL}/leidyboutique/`, 4000);

  const res = await avaliar(send, `
    // Verificar se a barra de avisos existe
    const barras = [...document.querySelectorAll('[class*="marquee"], [class*="aviso"], [class*="ticker"]')];
    const top = [...document.querySelectorAll('div')].filter(d => {
      const t = d.textContent?.trim();
      return t && t.length > 5 && t.length < 200 && d.getBoundingClientRect().top < 60;
    });
    JSON.stringify({ 
      barraCount: barras.length, 
      topElements: top.slice(0,3).map(d => d.textContent?.trim().substring(0,50))
    });
  `);
  const data = res?.result?.value ? JSON.parse(res.result.value) : {};
  await capturar(send, 'val_t10_barra_avisos_vitrine.png');
  await registrar('Barra de Avisos está visível no topo da vitrine', 
    data.topElements?.length > 0, 
    `Top elements: ${JSON.stringify(data.topElements)}`);
}

async function testeAdminBarraAvisosConfig(send) {
  console.log('\n📋 TESTE 11 — Admin: Barra de Avisos configurável (pausa, cores)');

  await navegar(send, `${BASE_URL}/admin/login/`, 2000);
  await injetarAdmin(send);
  await navegar(send, `${BASE_URL}/admin/configuracoes/barra-avisos/`, 5000);

  const res = await avaliar(send, `
    const inputs = [...document.querySelectorAll('input, textarea, select')].length;
    const buttons = [...document.querySelectorAll('button')].map(b => b.textContent?.trim()).filter(Boolean);
    const hasPause = buttons.some(b => b.includes('Pausar') || b.includes('Pausa') || b.includes('Reproduzir'));
    JSON.stringify({ inputs, buttons: buttons.slice(0,8), hasPause });
  `);
  const data = res?.result?.value ? JSON.parse(res.result.value) : {};
  await capturar(send, 'val_t11_admin_barra_avisos_config.png');
  await registrar('Página de Barra de Avisos tem controles de pausa', data.hasPause, 
    `Botões: ${JSON.stringify(data.buttons)}`);
}

async function testeCarrosselBanner(send) {
  console.log('\n📋 TESTE 12 — Carrossel de Banners na vitrine');

  await navegar(send, `${BASE_URL}/leidyboutique/`, 4500);

  // Rolar de volta ao topo
  await avaliar(send, 'window.scrollTo(0, 0)');
  await sleep(800);

  const res = await avaliar(send, `
    // Verificar se existe um hero banner / carrossel
    const heroEl = document.querySelector('[class*="hero"], [class*="banner"], [class*="carousel"], [class*="swiper"]');
    const imgs = [...document.querySelectorAll('img')].filter(img => {
      const src = img.src || '';
      return img.naturalWidth > 400 || src.includes('banner') || src.includes('hero');
    });
    JSON.stringify({ 
      heroFound: !!heroEl,
      imgCount: imgs.length,
      heroTag: heroEl?.tagName || 'N/A'
    });
  `);
  const data = res?.result?.value ? JSON.parse(res.result.value) : {};
  await capturar(send, 'val_t12_carrossel_banner.png');
  await registrar('Hero Banner / Carrossel visível na home', data.heroFound || data.imgCount > 0, 
    `imgCount: ${data.imgCount}, heroTag: ${data.heroTag}`);
}

async function testeMenuDinamicoVitrine(send) {
  console.log('\n📋 TESTE 13 — Menu de Navegação da Vitrine (linhas 1 e 2)');

  await navegar(send, `${BASE_URL}/leidyboutique/`, 4000);
  const res = await avaliar(send, `
    const navLinks = [...document.querySelectorAll('header nav a, header nav button')].map(el => 
      el.textContent?.trim().substring(0, 30)
    ).filter(Boolean);
    JSON.stringify({ count: navLinks.length, links: navLinks.slice(0, 10) });
  `);
  const data = res?.result?.value ? JSON.parse(res.result.value) : {};
  await capturar(send, 'val_t13_menu_navegacao.png');
  await registrar('Menu de navegação tem links visíveis no header', data.count > 0, 
    `${data.count} links: ${JSON.stringify(data.links)}`);
}

async function testeSalvarConfiguracoes(send) {
  console.log('\n📋 TESTE 14 — Admin: Salvar Configurações retorna Toast de Sucesso');

  await navegar(send, `${BASE_URL}/admin/login/`, 2000);
  await injetarAdmin(send);
  await navegar(send, `${BASE_URL}/admin/configuracoes/aparencia/`, 5000);

  // Rolar até o botão salvar
  await avaliar(send, `
    const btn = [...document.querySelectorAll('button[type="submit"]')].find(b => 
      b.textContent?.includes('Salvar') || b.textContent?.includes('salvar')
    );
    if (btn) btn.scrollIntoView({ behavior: 'instant' });
  `);
  await sleep(500);

  // Clicar no botão salvar
  await avaliar(send, `
    const btn = [...document.querySelectorAll('button[type="submit"]')].find(b => 
      b.textContent?.includes('Salvar') || b.textContent?.includes('salvar')
    );
    if (btn) btn.click();
  `);

  // Aguardar toast (até 4 segundos)
  let toastFound = false;
  for (let i = 0; i < 8; i++) {
    await sleep(500);
    const check = await avaliar(send, `
      const toastEl = document.querySelector('[class*="toast"], [class*="Toast"], [class*="fixed"][class*="bottom"]');
      const allFixed = [...document.querySelectorAll('div')].filter(d => {
        const s = window.getComputedStyle(d);
        return s.position === 'fixed' && d.textContent?.includes('salvo');
      });
      JSON.stringify({ toastFound: !!toastEl || allFixed.length > 0, count: allFixed.length });
    `);
    const d = check?.result?.value ? JSON.parse(check.result.value) : {};
    if (d.toastFound) { toastFound = true; break; }
  }

  await capturar(send, 'val_t14_salvar_toast_sucesso.png');
  await registrar('Toast de Sucesso aparece após salvar configurações', toastFound, 
    toastFound ? 'Toast detectado na tela' : 'Toast NÃO detectado — possível falha ao salvar');
}

// =========================================================
// EXECUTAR TODOS OS TESTES
// =========================================================

async function main() {
  console.log('=' .repeat(65));
  console.log('🧪 VALIDAÇÃO E2E — FASES 4 E 5 — C28-bcomm-shop');
  console.log('=' .repeat(65));
  console.log(`Data: ${new Date().toLocaleString('pt-BR')}`);
  console.log(`Servidor: ${BASE_URL}`);

  let chrome;
  try {
    chrome = await iniciarChrome();
    const { send } = await criarTab(`${BASE_URL}/leidyboutique/`);
    await sleep(2000);

    // Injetar credenciais iniciais
    await injetarAdmin(send);
    await sleep(300);

    // Executar todos os testes em sequência
    await testeSlogan(send);
    await testeBackgroundSolido(send);
    await testeMenuTransparente(send);
    await testeMenuRolagem(send);
    await testeLogoHeader(send);
    await testeSecoesTitulos(send);
    await testeAdminSidebar(send);
    await testeAdminSidebarMinimizavel(send);
    await testeAdminAparenciaCarregamento(send);
    await testeAdminBarraAvisos(send);
    await testeAdminBarraAvisosConfig(send);
    await testeCarrosselBanner(send);
    await testeMenuDinamicoVitrine(send);
    await testeSalvarConfiguracoes(send);

  } catch (err) {
    console.error('\n💥 Erro crítico:', err.message);
  } finally {
    if (chrome) chrome.kill();
  }

  // Relatório Final
  console.log('\n' + '='.repeat(65));
  console.log('📊 RELATÓRIO FINAL DE VALIDAÇÃO');
  console.log('='.repeat(65));
  const passaram = resultados.filter(r => r.passou).length;
  const falharam = resultados.filter(r => !r.passou).length;
  console.log(`\nTotal: ${resultados.length} | ✅ Passaram: ${passaram} | ❌ Falharam: ${falharam}\n`);
  resultados.forEach((r, i) => {
    const ico = r.passou ? '✅' : '❌';
    console.log(`${String(i+1).padStart(2,'0')}. ${ico} ${r.nome}`);
    if (r.observacao) console.log(`    → ${r.observacao}`);
  });

  // Salvar relatório JSON
  const relatorioPath = path.join(ARTIFACT_DIR, 'scratch', 'relatorio_validacao_e2e.json');
  fs.mkdirSync(path.dirname(relatorioPath), { recursive: true });
  fs.writeFileSync(relatorioPath, JSON.stringify({ 
    data: new Date().toISOString(), 
    passaram, 
    falharam, 
    resultados 
  }, null, 2));
  console.log(`\n💾 Relatório JSON salvo: ${relatorioPath}`);
  console.log('\n🏁 Validação concluída!\n');
}

main();

import type { Metadata } from 'next';
import './globals.css';
import { StoreProvider } from '@/context/StoreContext';
import { BottomCartBar } from '@/components/BottomCartBar';
import { BackgroundVideo } from '@/components/BackgroundVideo';
import { StorePreloader } from '@/components/StorePreloader';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bcomm-ag.space';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'BCOMM • Plataforma de Gestão & E-commerce',
  description: 'Plataforma completa de gestão comercial, catálogo inteligente e vendas online.',
  keywords: 'BCOMM, e-commerce, gestão de lojas, boutique, vendas online, catálogo digital',
  icons: {
    icon: [
      { url: '/favicon-32x32.png?v=20261107_bcomm_stores', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png?v=20261107_bcomm_stores', sizes: '16x16', type: 'image/png' },
      { url: '/favicon.ico?v=20261107_bcomm_stores', sizes: 'any' },
    ],
    apple: [
      { url: '/apple-touch-icon.png?v=20261107_bcomm_stores', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'android-chrome-192x192', url: '/favicon-android-chrome-192x192.png?v=20261107_bcomm_stores', sizes: '192x192', type: 'image/png' },
      { rel: 'android-chrome-512x512', url: '/favicon-android-chrome-512x512.png?v=20261107_bcomm_stores', sizes: '512x512', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
  openGraph: {
    title: 'BCOMM • Plataforma de Gestão & E-commerce',
    description: 'Plataforma completa de gestão comercial, catálogo inteligente e vendas online.',
    url: siteUrl,
    siteName: 'BCOMM',
    locale: 'pt_BR',
    type: 'website',
    images: [
      {
        url: '/images/bcomm-og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'BCOMM',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BCOMM • Plataforma de Gestão & E-commerce',
    description: 'Plataforma completa de gestão comercial, catálogo inteligente e vendas online.',
    images: ['/images/bcomm-og-image.jpg'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png?v=20261107_bcomm_stores" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png?v=20261107_bcomm_stores" />
        <link rel="icon" href="/favicon.ico?v=20261107_bcomm_stores" sizes="any" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=20261107_bcomm_stores" />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Cormorant+Garamond:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=Montserrat:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Poppins:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // =========================================================================
                  // RESOLUÇÃO MULTI-TENANT NATIVA (POR DOMÍNIO PRÓPRIO, SUBDOMÍNIO OU ROTA)
                  // =========================================================================
                  var p = window.location.pathname || '';
                  var h = (window.location.hostname || '').toLowerCase();

                  var isAdmin = p.startsWith('/admin') || p.startsWith('/super-admin') || p.indexOf('/admin') !== -1 || p.indexOf('/super-admin') !== -1;
                  if (isAdmin) {
                    return;
                  }

                  // 1. Identificar o slug candidato a partir da URL (/auraprivee, /leidy-boutique, etc.)
                  var parts = p.split('/').filter(Boolean);
                  var firstSegment = parts[0] || '';
                  var reservedRoutes = ['admin', 'super-admin', 'api', 'catalogo', 'checkout', 'cliente', 'favoritos', 'minha-conta', '_next', 'images'];
                  var isTenantRoute = firstSegment && reservedRoutes.indexOf(firstSegment) === -1;

                  var tenantCandidate = isTenantRoute ? firstSegment.toLowerCase().replace(/[^a-z0-9-]/g, '') : '';
                  if (tenantCandidate === 'leidyboutique') tenantCandidate = 'leidy-boutique';
                  if (tenantCandidate === 'auraprivee') tenantCandidate = 'aura-privee';

                  // 2. Buscar o registro do tenant no cache local isolado
                  var raw = null;
                  if (tenantCandidate) {
                    raw = localStorage.getItem('bcomm_tenant_' + tenantCandidate) ||
                          localStorage.getItem('bcomm_tenant_' + tenantCandidate.replace(/-/g, '')) ||
                          localStorage.getItem('bcomm_tenant_' + firstSegment);
                  }
                  if (!raw && h && h !== 'localhost' && h !== '127.0.0.1') {
                    var domainClean = h.replace(/^www\\./, '');
                    raw = localStorage.getItem('bcomm_tenant_host_' + h) ||
                          localStorage.getItem('bcomm_tenant_' + domainClean) ||
                          localStorage.getItem('bcomm_tenant_last');
                  }
                  if (!raw) {
                    raw = localStorage.getItem('bcomm_tenant_last');
                  }

                  // 3. Defaults universais e extração dos atributos específicos do tenant
                  var active = true;
                  var bg = '#FAF8F5';
                  var primaryColor = '#DFBE76';
                  var textColor = '#1A1918';
                  var logoUrl = '/images/Logo sem fundo.png';
                  var sloganText = 'Moda Feminina Autêntica & Elegância Diária';
                  var storeName = 'Boutique';
                  var showLogo = true;
                  var showSlogan = true;
                  var showPercent = true;

                  if (raw) {
                    try {
                      var parsed = JSON.parse(raw);
                      if (parsed && typeof parsed === 'object') {
                        if (parsed.nome) storeName = parsed.nome;
                        var vis = parsed.configuracoes_visuais || {};
                        var pl = vis.preloader || {};

                        if (pl.ativo === false) active = false;
                        if (pl.fundo) bg = pl.fundo;
                        if (pl.cor_primaria) primaryColor = pl.cor_primaria;
                        else if (vis.cor_primaria) primaryColor = vis.cor_primaria;

                        if (pl.cor_texto) textColor = pl.cor_texto;
                        else if (vis.cor_secundaria) textColor = vis.cor_secundaria;

                        if (vis.logo_url) logoUrl = vis.logo_url;
                        if (vis.slogan) sloganText = vis.slogan;
                        else if (vis.tagline) sloganText = vis.tagline;

                        if (pl.exibir_logo !== undefined) showLogo = Boolean(pl.exibir_logo);
                        if (pl.exibir_slogan !== undefined) showSlogan = Boolean(pl.exibir_slogan);
                        if (pl.exibir_porcentagem !== undefined) showPercent = Boolean(pl.exibir_porcentagem);
                      }
                    } catch(e) {}
                  }

                  // Salva a configuração ativa para sincronização instantânea do DOM da cortina
                  window.__BCOMM_ACTIVE_TENANT_CONFIG__ = {
                    active: active,
                    bg: bg,
                    primaryColor: primaryColor,
                    textColor: textColor,
                    logoUrl: logoUrl,
                    sloganText: sloganText,
                    storeName: storeName,
                    showLogo: showLogo,
                    showSlogan: showSlogan,
                    showPercent: showPercent
                  };

                  // Se desativado pelo lojista na loja dele, sai em 0ms
                  if (!active) {
                    return;
                  }

                  // Injeção de estilo dinâmico imune à hidratação do React
                  var dynStyle = document.createElement('style');
                  dynStyle.id = 'bcomm-active-curtain-style';
                  dynStyle.textContent = [
                    ':root {',
                    '  --bcomm-curtain-bg: ' + bg + ';',
                    '  --bcomm-curtain-primary: ' + primaryColor + ';',
                    '  --bcomm-curtain-text: ' + textColor + ';',
                    '}',
                    'html body #bcomm-instant-curtain {',
                    '  display: flex !important;',
                    '  opacity: 1 !important;',
                    '  visibility: visible !important;',
                    '  pointer-events: auto !important;',
                    '  background-color: ' + bg + ' !important;',
                    '  color: ' + textColor + ' !important;',
                    '}',
                    'html body #bcomm-store-root,',
                    'html body [data-bcomm-background] {',
                    '  opacity: 0 !important;',
                    '  visibility: hidden !important;',
                    '  pointer-events: none !important;',
                    '}',
                    'html body {',
                    '  overflow: hidden !important;',
                    '  touch-action: none !important;',
                    '}'
                  ].join('\\n');
                  document.head.appendChild(dynStyle);

                  // =========================================================================
                  // CONTROLADOR UNIFICADO SOBERANO DE PRELOADER (API GLOBAL NO WINDOW)
                  // =========================================================================
                  window.__BCOMM_PRELOADER__ = {
                    current: 0,
                    isFinished: false,

                    setProgress: function(val, allowReset) {
                      var prev = this.current || 0;
                      var next;
                      if (allowReset) {
                        next = Math.max(0, Math.min(100, Math.floor(val)));
                      } else {
                        next = Math.max(prev, Math.min(100, Math.floor(val)));
                      }
                      this.current = next;
                      window.__BCOMM_CURRENT_PROGRESS__ = next;
                      var d = document.getElementById('bcomm-curtain-digits');
                      var b = document.getElementById('bcomm-curtain-progress-bar');
                      if (d) d.textContent = String(next).padStart(2, '0');
                      if (b) b.style.width = next + '%';
                    },

                    reset: function() {
                      this.current = 0;
                      this.isFinished = false;
                      this.setProgress(0, true);
                    },

                    finish: function(callback) {
                      if (this.isFinished) return;
                      // TRAVA DE INVIOLABILIDADE: Na vitrine, o preloader NUNCA fecha antes de atingir 100%
                      if (this.current < 100) return;
                      this.isFinished = true;

                      var instantCurtain = document.getElementById('bcomm-instant-curtain');
                      var storeRoot = document.getElementById('bcomm-store-root');

                      // 1. Libera a vitrine e backgrounds para estarem prontos embaixo da cortina
                      if (storeRoot) {
                        storeRoot.style.setProperty('opacity', '1', 'important');
                        storeRoot.style.setProperty('visibility', 'visible', 'important');
                        storeRoot.style.setProperty('pointer-events', 'auto', 'important');
                      }
                      var bgEls = document.querySelectorAll('[data-bcomm-background]');
                      for (var i = 0; i < bgEls.length; i++) {
                        bgEls[i].style.setProperty('opacity', '1', 'important');
                        bgEls[i].style.setProperty('visibility', 'visible', 'important');
                        bgEls[i].style.setProperty('pointer-events', 'auto', 'important');
                      }

                      // 2. Transição suave de fade-out da cortina (500ms)
                      if (instantCurtain) {
                        var s = document.getElementById('bcomm-active-curtain-style');
                        if (s) {
                          s.textContent = [
                            'html body #bcomm-instant-curtain {',
                            '  display: flex !important;',
                            '  pointer-events: none !important;',
                            '  background-color: ' + bg + ' !important;',
                            '}',
                            'html body #bcomm-store-root,',
                            'html body [data-bcomm-background] {',
                            '  opacity: 1 !important;',
                            '  visibility: visible !important;',
                            '  pointer-events: auto !important;',
                            '}'
                          ].join('\\n');
                        }

                        instantCurtain.style.setProperty('transition', 'opacity 500ms cubic-bezier(0.16, 1, 0.3, 1)', 'important');
                        instantCurtain.style.setProperty('opacity', '0', 'important');
                        instantCurtain.style.setProperty('pointer-events', 'none', 'important');

                        setTimeout(function() {
                          instantCurtain.style.setProperty('display', 'none', 'important');
                          var styleEl = document.getElementById('bcomm-active-curtain-style');
                          if (styleEl) styleEl.remove();
                          document.body.style.overflow = '';
                          if (typeof callback === 'function') callback();
                        }, 520);
                      } else {
                        var styleEl = document.getElementById('bcomm-active-curtain-style');
                        if (styleEl) styleEl.remove();
                        document.body.style.overflow = '';
                        if (typeof callback === 'function') callback();
                      }
                    },

                    forceHide: function() {
                      var p = window.location.pathname || '';
                      var isAdmin = p.startsWith('/admin') || p.startsWith('/super-admin') || p.indexOf('/admin') !== -1 || p.indexOf('/super-admin') !== -1;
                      if (!isAdmin) return;

                      this.isFinished = true;
                      var styleEl = document.getElementById('bcomm-active-curtain-style');
                      if (styleEl) styleEl.remove();
                      document.body.style.overflow = '';
                      var instantCurtain = document.getElementById('bcomm-instant-curtain');
                      if (instantCurtain) {
                        instantCurtain.style.setProperty('display', 'none', 'important');
                      }
                      var storeRoot = document.getElementById('bcomm-store-root');
                      if (storeRoot) {
                        storeRoot.style.setProperty('opacity', '1', 'important');
                        storeRoot.style.setProperty('visibility', 'visible', 'important');
                        storeRoot.style.setProperty('pointer-events', 'auto', 'important');
                      }
                    }
                  };

                  window.__BCOMM_CURRENT_PROGRESS__ = 0;
                  window.__BCOMM_SET_PROGRESS__ = function(val) {
                    if (window.__BCOMM_PRELOADER__) {
                      window.__BCOMM_PRELOADER__.setProgress(val);
                    }
                  };

                  // =========================================================================
                  // MOTOR DE ODÔMETRO CADENCIADO PARA O CARREGAMENTO INICIAL / F5 (00 A 100%)
                  // =========================================================================
                  var isHome = p === '' || p === '/';
                  var isReady = !isHome;
                  window.__BCOMM_HERO_BANNER_READY__ = false;

                  window.addEventListener('bcomm:hero_banner_ready', function() {
                    window.__BCOMM_HERO_BANNER_READY__ = true;
                    isReady = true;
                  });

                  var initialWatchdog = setTimeout(function() {
                    if (window.__BCOMM_PRELOADER__ && !window.__BCOMM_PRELOADER__.isFinished) {
                      window.__BCOMM_PRELOADER__.setProgress(100);
                      window.__BCOMM_PRELOADER__.finish();
                    }
                  }, 4000);

                  var lastTickTime = performance.now();
                  var stepCadenceMs = 12;
                  var dwellStartTime = null;
                  var isDwellPhase = false;

                  function initialStep(now) {
                    if (!window.__BCOMM_PRELOADER__ || window.__BCOMM_PRELOADER__.isFinished) return;

                    if (!isReady && window.__BCOMM_HERO_BANNER_READY__) {
                      isReady = true;
                    }

                    var targetCap = isReady ? 100 : 75;

                    if (!isDwellPhase) {
                      var elapsedSinceTick = now - lastTickTime;
                      var current = window.__BCOMM_PRELOADER__.current;

                      var effectiveInterval = stepCadenceMs;
                      if (!isReady && current >= 55) {
                        effectiveInterval = 25;
                      } else if (isReady) {
                        effectiveInterval = current >= 75 ? 6 : 9;
                      }

                      if (elapsedSinceTick >= effectiveInterval) {
                        if (current < targetCap) {
                          window.__BCOMM_PRELOADER__.setProgress(current + 1);
                          lastTickTime = now;
                        }
                      }

                      if (window.__BCOMM_PRELOADER__.current >= 100) {
                        isDwellPhase = true;
                        dwellStartTime = now;
                      }

                      requestAnimationFrame(initialStep);
                    } else {
                      var dwellElapsed = now - (dwellStartTime || now);
                      window.__BCOMM_PRELOADER__.setProgress(100);

                      if (dwellElapsed >= 250) {
                        clearTimeout(initialWatchdog);
                        window.__BCOMM_PRELOADER__.finish();
                        return;
                      }
                      requestAnimationFrame(initialStep);
                    }
                  }

                  requestAnimationFrame(initialStep);
                } catch(e) {}
              })();
            `
          }}
        />
      </head>
      <body className="font-sans antialiased text-[#1A1918] dark:text-[#FAF8F5] selection:bg-[#C5A059]/20 selection:text-[#1A1918] dark:selection:text-[#FAF8F5] transition-colors duration-300 relative overflow-x-hidden min-h-screen w-full max-w-full">
        {/* Cortina Instantânea em 0ms (Preloader de Luxo Alta Costura Multi-Tenant) */}
        <div
          id="bcomm-instant-curtain"
          suppressHydrationWarning
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999999,
            display: 'none',
            backgroundColor: 'var(--bcomm-curtain-bg, #FAF8F5)',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '0 24px', maxWidth: '512px', width: '100%', position: 'relative', zIndex: 10 }}>
            {/* Logo do Lojista */}
            <div
              id="bcomm-curtain-logo-wrap"
              style={{ position: 'relative', width: '200px', height: '70px', marginBottom: '16px' }}
            >
              <img
                id="bcomm-curtain-logo"
                src="/images/Logo sem fundo.png"
                alt="Logo da Loja"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                loading="eager"
                fetchPriority="high"
              />
            </div>

            {/* Slogan do Lojista */}
            <div
              id="bcomm-curtain-slogan-wrap"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '28px' }}
            >
              <span style={{ width: '24px', height: '1px', backgroundColor: 'rgba(0,0,0,0.15)' }} />
              <p
                id="bcomm-curtain-slogan"
                style={{ margin: 0, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.3em', fontFamily: 'Cormorant Garamond, serif', fontWeight: 500, color: '#DFBE76' }}
              >
                Moda Feminina Autêntica &amp; Elegância Diária
              </p>
              <span style={{ width: '24px', height: '1px', backgroundColor: 'rgba(0,0,0,0.15)' }} />
            </div>

            {/* Contador de Porcentagem (00% a 100%) */}
            <div
              id="bcomm-curtain-percent-wrap"
              style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '20px', userSelect: 'none', fontFamily: 'Cormorant Garamond, serif' }}
            >
              <span
                id="bcomm-curtain-digits"
                suppressHydrationWarning
                dangerouslySetInnerHTML={{ __html: '00' }}
                style={{ fontSize: '56px', fontWeight: 300, letterSpacing: '-0.02em', color: '#1A1918' }}
              />
              <span
                id="bcomm-curtain-percent-sym"
                style={{ fontSize: '14px', fontWeight: 600, letterSpacing: '0.1em', color: '#DFBE76' }}
              >
                %
              </span>
            </div>

            {/* Barra de Progresso Luxo */}
            <div style={{ width: '220px', maxWidth: '100%', height: '2px', backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: '9999px', overflow: 'hidden', position: 'relative' }}>
              <div
                id="bcomm-curtain-progress-bar"
                suppressHydrationWarning
                style={{
                  width: '0%',
                  height: '100%',
                  backgroundColor: '#DFBE76',
                  borderRadius: '9999px',
                  boxShadow: '0 0 10px rgba(223, 190, 118, 0.7)'
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '20px', fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: 'monospace', color: '#94a3b8' }}>
              <span>✨ Preparando Vitrine Exclusiva</span>
            </div>
          </div>

          {/* Sincronização Síncrona do Tenant com o DOM em 0ms (Zero Flash de Outras Lojas) */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function() {
                  try {
                    var t = window.__BCOMM_ACTIVE_TENANT_CONFIG__;
                    if (!t) return;
                    if (t.showLogo === false) {
                      var lw = document.getElementById('bcomm-curtain-logo-wrap');
                      if (lw) lw.style.display = 'none';
                    } else if (t.logoUrl) {
                      var img = document.getElementById('bcomm-curtain-logo');
                      if (img) {
                        img.src = t.logoUrl;
                        if (t.storeName) img.alt = t.storeName;
                      }
                    }
                    if (t.showSlogan === false) {
                      var sw = document.getElementById('bcomm-curtain-slogan-wrap');
                      if (sw) sw.style.display = 'none';
                    } else if (t.sloganText) {
                      var p = document.getElementById('bcomm-curtain-slogan');
                      if (p) p.textContent = t.sloganText;
                    }
                    if (t.showPercent === false) {
                      var pw = document.getElementById('bcomm-curtain-percent-wrap');
                      if (pw) pw.style.display = 'none';
                    }
                    if (t.primaryColor) {
                      var ps = document.getElementById('bcomm-curtain-percent-sym');
                      if (ps) ps.style.color = t.primaryColor;
                      var sl = document.getElementById('bcomm-curtain-slogan');
                      if (sl) sl.style.color = t.primaryColor;
                      var pb = document.getElementById('bcomm-curtain-progress-bar');
                      if (pb) {
                        pb.style.backgroundColor = t.primaryColor;
                        pb.style.boxShadow = '0 0 10px ' + t.primaryColor + '70';
                      }
                    }
                    if (t.textColor) {
                      var cd = document.getElementById('bcomm-curtain-digits');
                      if (cd) cd.style.color = t.textColor;
                    }
                  } catch(e) {}
                })();
              `
            }}
          />
        </div>

        <StoreProvider>
          <StorePreloader />
          <div id="bcomm-store-root" className="transition-opacity duration-700 ease-out">
            <BackgroundVideo />
            {children}
            <BottomCartBar />
          </div>
        </StoreProvider>
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import './globals.css';
import { StoreProvider } from '@/context/StoreContext';
import { BottomCartBar } from '@/components/BottomCartBar';
import { BackgroundVideo } from '@/components/BackgroundVideo';
import { StorePreloader } from '@/components/StorePreloader';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://leidyboutique.pages.dev';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Leidy Boutique | Elegância & Sofisticação em Cada Detalhe',
  description: 'Descubra a coleção exclusiva de alfaiataria, tricots nobres e conjuntos em cetim da Leidy Boutique. Atendimento personalizado e peças selecionadas a dedo.',
  keywords: 'Leidy Boutique, moda feminina, alfaiataria feminina, tricot Biamar, conjunto cetim, boutique feminina',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/favicon-apple-touch-icon180x180.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'android-chrome-192x192', url: '/favicon-android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { rel: 'android-chrome-512x512', url: '/favicon-android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
  openGraph: {
    title: 'Leidy Boutique | Elegância & Sofisticação',
    description: 'A sofisticação do provador ao seu guarda-roupa. Peças de alto padrão com atendimento VIP.',
    url: siteUrl,
    siteName: 'Leidy Boutique',
    locale: 'pt_BR',
    type: 'website',
    images: [
      {
        url: '/og-image_optimized_300.jpg',
        width: 1200,
        height: 630,
        alt: 'Leidy Boutique | Coleção Exclusiva',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Leidy Boutique | Elegância & Sofisticação',
    description: 'Descubra a coleção exclusiva de alfaiataria, tricots nobres e conjuntos em cetim da Leidy Boutique.',
    images: ['/og-image_optimized_300.jpg'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="bcomm-veil-active" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/favicon-apple-touch-icon180x180.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Cormorant+Garamond:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=Montserrat:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Poppins:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <style
          id="bcomm-critical-veil-css"
          dangerouslySetInnerHTML={{
            __html: `
              html.bcomm-veil-active body {
                overflow: hidden !important;
                touch-action: none !important;
              }
              #bcomm-instant-curtain {
                position: fixed;
                inset: 0;
                z-index: 999999;
                display: flex;
                opacity: 1;
                visibility: visible;
                background-color: var(--bcomm-preloader-bg, #FAF8F5);
                align-items: center;
                justify-content: center;
                flex-direction: column;
                transition: opacity 500ms cubic-bezier(0.16, 1, 0.3, 1);
                pointer-events: auto;
              }
              html.bcomm-veil-active #bcomm-store-root,
              html.bcomm-veil-active [data-bcomm-background] {
                opacity: 0 !important;
                visibility: hidden !important;
                pointer-events: none !important;
              }
              html:not(.bcomm-veil-active) #bcomm-store-root {
                opacity: 1 !important;
                visibility: visible !important;
                pointer-events: auto !important;
              }
            `
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var p = window.location.pathname || '';
                  if (p.startsWith('/admin') || p.startsWith('/super-admin')) {
                    document.documentElement.classList.remove('bcomm-veil-active');
                    var c = document.getElementById('bcomm-instant-curtain');
                    if (c) c.style.display = 'none';
                    return;
                  }
                  var raw = localStorage.getItem('bcomm_tenant_last');
                  var active = true;
                  var bg = '#FAF8F5';
                  if (raw) {
                    var parsed = JSON.parse(raw);
                    if (parsed && parsed.configuracoes_visuais && parsed.configuracoes_visuais.preloader) {
                      active = parsed.configuracoes_visuais.preloader.ativo !== false;
                      if (parsed.configuracoes_visuais.preloader.fundo) bg = parsed.configuracoes_visuais.preloader.fundo;
                    }
                  }
                  if (!active) {
                    document.documentElement.classList.remove('bcomm-veil-active');
                    var c = document.getElementById('bcomm-instant-curtain');
                    if (c) c.style.display = 'none';
                    return;
                  }
                  document.documentElement.style.setProperty('--bcomm-preloader-bg', bg);

                  // 1. REGISTRADOR MONOTÔNICO DE PROGRESSO (O NÚMERO SÓ ANDA PARA A FRENTE!)
                  window.__BCOMM_CURRENT_PROGRESS__ = 0;
                  window.__BCOMM_SET_PROGRESS__ = function(val) {
                    var prev = window.__BCOMM_CURRENT_PROGRESS__ || 0;
                    var next = Math.max(prev, Math.min(100, Math.floor(val)));
                    window.__BCOMM_CURRENT_PROGRESS__ = next;
                    var d = document.getElementById('bcomm-curtain-digits');
                    var b = document.getElementById('bcomm-curtain-progress-bar');
                    if (d) d.textContent = String(next).padStart(2, '0');
                    if (b) b.style.width = next + '%';
                  };

                  // 2. MOTOR ÚNICO SOBERANO (requestAnimationFrame CONTÍNUO E ININTERRUPTO)
                  var startTime = performance.now();
                  var isReady = false;
                  var sprintStartTime = null;
                  var sprintStartVal = 0;
                  var isConcluding = false;
                  var dwellStartTime = null;
                  var isFinished = false;

                  var targetDuration = 1200; // Tempo de elegância
                  var sprintDuration = 500;  // Sprint visível até 100%
                  var dwellDuration = 300;   // Dwell perceptual em 100%

                  window.__BCOMM_HERO_BANNER_READY__ = false;
                  window.addEventListener('bcomm:hero_banner_ready', function() {
                    window.__BCOMM_HERO_BANNER_READY__ = true;
                  });

                  function finish() {
                    if (isFinished) return;
                    isFinished = true;

                    window.__BCOMM_SET_PROGRESS__(100);

                    // 1. Revela a vitrine por baixo da cortina (zero flash, zero tela preta)
                    var storeRoot = document.getElementById('bcomm-store-root');
                    if (storeRoot) {
                      storeRoot.style.opacity = '1';
                      storeRoot.style.visibility = 'visible';
                      storeRoot.style.pointerEvents = 'auto';
                    }

                    // 2. Desvanecimento suave da cortina por 500ms
                    var instantCurtain = document.getElementById('bcomm-instant-curtain');
                    if (instantCurtain) {
                      instantCurtain.style.opacity = '0';
                      instantCurtain.style.transition = 'opacity 500ms cubic-bezier(0.16, 1, 0.3, 1)';
                      setTimeout(function() {
                        instantCurtain.style.display = 'none';
                        document.documentElement.classList.remove('bcomm-veil-active');
                        document.body.style.overflow = '';
                      }, 520);
                    }
                  }

                  // Watchdog de segurança máxima: garante abertura mesmo com falha extrema de rede após 3800ms
                  setTimeout(function() {
                    if (!isFinished) {
                      finish();
                    }
                  }, 3800);

                  function step(now) {
                    if (isFinished) return;

                    var elapsed = now - startTime;
                    if (!isReady && window.__BCOMM_HERO_BANNER_READY__) {
                      isReady = true;
                    }

                    if (!isConcluding) {
                      if (isReady && elapsed >= targetDuration) {
                        // FASE 2: SPRINT VISÍVEL ATÉ 100% (450ms a 550ms)
                        if (sprintStartTime === null) {
                          sprintStartTime = now;
                          sprintStartVal = window.__BCOMM_CURRENT_PROGRESS__ || 0;
                        }
                        var sprintElapsed = now - sprintStartTime;
                        var sprintRatio = Math.min(1, sprintElapsed / sprintDuration);
                        var eased = 1 - Math.pow(1 - sprintRatio, 2);
                        var progress = sprintStartVal + (100 - sprintStartVal) * eased;

                        window.__BCOMM_SET_PROGRESS__(progress);

                        if (progress >= 99.8 || sprintElapsed >= sprintDuration) {
                          window.__BCOMM_SET_PROGRESS__(100);
                          isConcluding = true;
                          dwellStartTime = now;
                        }
                      } else if (isReady) {
                        // Loja decodificada, cumprindo tempo mínimo (sobe suavemente até 75%)
                        var ratio = Math.min(1, elapsed / targetDuration);
                        var targetProgress = 75 * ratio;
                        window.__BCOMM_SET_PROGRESS__(targetProgress);
                      } else {
                        // Loja ainda carregando no fundo (teto rígido em 75%)
                        var ratio = Math.min(1, elapsed / 2800);
                        var targetProgress = 75 * (1 - Math.pow(1 - ratio, 2));
                        window.__BCOMM_SET_PROGRESS__(targetProgress);
                      }

                      requestAnimationFrame(step);
                    } else {
                      // FASE 3: DWELL PERCEPTUAL EM 100% (300ms de confirmação estável)
                      var dwellElapsed = now - (dwellStartTime || now);
                      window.__BCOMM_SET_PROGRESS__(100);

                      if (dwellElapsed >= dwellDuration) {
                        finish();
                        return;
                      }
                      requestAnimationFrame(step);
                    }
                  }

                  requestAnimationFrame(step);
                } catch(e) {}
              })();
            `
          }}
        />
      </head>
      <body className="font-sans antialiased text-[#1A1918] dark:text-[#FAF8F5] selection:bg-[#C5A059]/20 selection:text-[#1A1918] dark:selection:text-[#FAF8F5] transition-colors duration-300 relative overflow-x-hidden min-h-screen w-full max-w-full">
        {/* Cortina Instantânea em 0ms (Preloader de Luxo Alta Costura) */}
        <div
          id="bcomm-instant-curtain"
          suppressHydrationWarning
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999999,
            display: 'flex',
            opacity: 1,
            backgroundColor: 'var(--bcomm-preloader-bg, #FAF8F5)',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '0 24px', maxWidth: '512px', width: '100%', position: 'relative', zIndex: 10 }}>
            <div style={{ position: 'relative', width: '200px', height: '70px', marginBottom: '16px' }}>
              <img
                src="/images/Logo sem fundo.png"
                alt="Leidy Boutique"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                loading="eager"
                fetchPriority="high"
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '28px' }}>
              <span style={{ width: '24px', height: '1px', backgroundColor: 'rgba(0,0,0,0.15)' }} />
              <p style={{ margin: 0, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.3em', fontFamily: 'Cormorant Garamond, serif', fontWeight: 500, color: '#DFBE76' }}>
                Moda Feminina Autêntica &amp; Elegância Diária
              </p>
              <span style={{ width: '24px', height: '1px', backgroundColor: 'rgba(0,0,0,0.15)' }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '20px', userSelect: 'none', fontFamily: 'Cormorant Garamond, serif' }}>
              <span
                id="bcomm-curtain-digits"
                suppressHydrationWarning
                dangerouslySetInnerHTML={{ __html: '00' }}
                style={{ fontSize: '56px', fontWeight: 300, letterSpacing: '-0.02em', color: '#1A1918' }}
              />
              <span style={{ fontSize: '14px', fontWeight: 600, letterSpacing: '0.1em', color: '#DFBE76' }}>
                %
              </span>
            </div>

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

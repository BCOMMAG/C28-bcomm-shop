'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useStore } from '@/context/StoreContext';
import { StorePreloaderConfig } from '@/types/database';
import { Sparkles, X } from 'lucide-react';

function preloadAndDecodeImage(src: string): Promise<void> {
  if (typeof window === 'undefined' || !src) return Promise.resolve();
  return new Promise((resolve) => {
    const img = new window.Image();
    img.src = src;
    if (img.complete) {
      if ('decode' in img && typeof img.decode === 'function') {
        img.decode().then(() => resolve()).catch(() => resolve());
      } else {
        resolve();
      }
      return;
    }
    img.onload = () => {
      if ('decode' in img && typeof img.decode === 'function') {
        img.decode().then(() => resolve()).catch(() => resolve());
      } else {
        resolve();
      }
    };
    img.onerror = () => resolve(); // Falha graciosa em caso de 404/bloqueio de rede
  });
}

export const StorePreloader: React.FC = () => {
  const pathname = usePathname();
  const { currentTenant, heroBanner, heroBanners, isLoadingProducts } = useStore();

  const [hasMounted, setHasMounted] = useState<boolean>(false);
  const [testConfig, setTestConfig] = useState<StorePreloaderConfig | null>(null);
  const [isTestMode, setIsTestMode] = useState<boolean>(false);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [isRevealing, setIsRevealing] = useState<boolean>(false);

  // Referências diretas ao DOM (Zero Re-renders do React durante o trajeto 0% a 100%)
  const digitsRef = useRef<HTMLSpanElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const isLoadingProductsRef = useRef<boolean>(isLoadingProducts);
  isLoadingProductsRef.current = isLoadingProducts;

  const prevPathnameRef = useRef<string>(pathname);
  const hasLoadedInitialRouteRef = useRef<boolean>(false);
  const isTransitioningRouteRef = useRef<boolean>(false);
  const isAssetsReadyRef = useRef<boolean>(false);

  const isExcludedRoute = useMemo(() => {
    if (!pathname) return false;
    return pathname.startsWith('/admin') || pathname.startsWith('/super-admin');
  }, [pathname]);

  // Resolução da mídia do Banner Hero ativo para o Gatekeeper de Imagem
  const activeBanner = useMemo(() => {
    if (heroBanners && heroBanners.length > 0) {
      return heroBanners.find((b) => b.ativo) || heroBanners[0];
    }
    if (heroBanner && heroBanner.ativo) {
      return heroBanner;
    }
    return null;
  }, [heroBanners, heroBanner]);

  const bannerDeskUrl = activeBanner?.desktop_media_url || '';
  const bannerMobUrl = activeBanner?.mobile_media_url || bannerDeskUrl;
  const isBannerVideo = activeBanner?.tipo_midia === 'video';

  const vis = currentTenant?.configuracoes_visuais as any;
  const siteBg = vis?.plano_fundo_site;
  const bgImageSrc = siteBg?.imagem_url || '/images/plano-de-fundo.webp';

  const config: StorePreloaderConfig = useMemo(() => {
    const p = vis?.preloader;
    return {
      ativo: Boolean(p?.ativo),
      modelo: p?.modelo || 'haute_couture',
      fundo: p?.fundo || '#FAF8F5',
      cor_primaria: p?.cor_primaria || '#DFBE76',
      cor_texto: p?.cor_texto || '#1A1918',
      exibir_porcentagem: p?.exibir_porcentagem !== undefined ? Boolean(p.exibir_porcentagem) : true,
      exibir_logo: p?.exibir_logo !== undefined ? Boolean(p.exibir_logo) : true,
      exibir_slogan: p?.exibir_slogan !== undefined ? Boolean(p.exibir_slogan) : true,
      frequencia: p?.frequencia || 'todas_as_paginas',
      tempo_minimo_ms: Number(p?.tempo_minimo_ms || 1350),
      timeout_seguranca_ms: Number(p?.timeout_seguranca_ms || 3000)
    };
  }, [vis]);

  const effectiveConfig: StorePreloaderConfig = useMemo(() => {
    if (isTestMode && testConfig) {
      return testConfig;
    }
    return config;
  }, [isTestMode, testConfig, config]);

  // Função utilitária para atualizar os dígitos e a barra de carregamento diretamente no DOM
  const updateProgressDOM = useCallback((percent: number, modelo: string) => {
    const clamped = Math.max(0, Math.min(100, Math.floor(percent)));
    if (digitsRef.current) {
      digitsRef.current.textContent = modelo === 'monograma' ? `${clamped}%` : String(clamped).padStart(2, '0');
    }
    if (progressBarRef.current) {
      progressBarRef.current.style.width = `${clamped}%`;
    }
    if (typeof document !== 'undefined') {
      const curtainDigits = document.getElementById('bcomm-curtain-digits');
      const curtainBar = document.getElementById('bcomm-curtain-progress-bar');
      if (curtainDigits) curtainDigits.textContent = String(clamped).padStart(2, '0');
      if (curtainBar) curtainBar.style.width = `${clamped}%`;
    }
  }, []);

  // 1. Montagem inicial no cliente (Proteção absoluta contra Hydration Mismatch)
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // 2. Gatekeeper de Prontidão Visual Real:
  // Só autoriza a saída quando o banner da vitrine e o plano de fundo estiverem decodificados na GPU
  useEffect(() => {
    let isCancelled = false;

    const onHeroBannerReady = () => {
      isAssetsReadyRef.current = true;
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('bcomm:hero_banner_ready', onHeroBannerReady);
      if ((window as any).__BCOMM_HERO_BANNER_READY__) {
        isAssetsReadyRef.current = true;
      }
    }

    const checkReadiness = async () => {
      if (isTestMode) {
        isAssetsReadyRef.current = true;
        return;
      }

      // Se for subpágina (ex: /cliente, /catalogo, /checkout), não trava esperando HeroBanner!
      const isSubpage = typeof window !== 'undefined' &&
        window.location.pathname !== '/' &&
        !window.location.pathname.match(/^\/[^/]+\/?$/);

      if (isSubpage) {
        isAssetsReadyRef.current = true;
        if (typeof window !== 'undefined') {
          (window as any).__BCOMM_HERO_BANNER_READY__ = true;
          window.dispatchEvent(new CustomEvent('bcomm:hero_banner_ready'));
        }
        return;
      }

      const promises: Promise<any>[] = [];

      // 1. Imagem do Banner Hero em alta definição ou Pôster de Vídeo
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
      const targetBannerUrl = isMobile ? bannerMobUrl : bannerDeskUrl;
      if (isBannerVideo) {
        promises.push(preloadAndDecodeImage('/video/header_poster.jpg'));
      } else if (targetBannerUrl) {
        promises.push(preloadAndDecodeImage(targetBannerUrl));
      }

      // 2. Imagem de Plano de Fundo da Loja
      if (bgImageSrc) {
        promises.push(preloadAndDecodeImage(bgImageSrc));
      }

      // 3. Montagem inicial do catálogo de produtos
      if (isLoadingProductsRef.current) {
        promises.push(
          new Promise<void>((resolve) => {
            const checkInterval = setInterval(() => {
              if (!isLoadingProductsRef.current || isCancelled) {
                clearInterval(checkInterval);
                resolve();
              }
            }, 30);
            setTimeout(() => {
              clearInterval(checkInterval);
              resolve();
            }, 1800);
          })
        );
      }

      await Promise.all(promises);
      if (!isCancelled) {
        isAssetsReadyRef.current = true;
        if (typeof window !== 'undefined') {
          (window as any).__BCOMM_HERO_BANNER_READY__ = true;
          window.dispatchEvent(new CustomEvent('bcomm:hero_banner_ready'));
        }
      }
    };

    checkReadiness();

    return () => {
      isCancelled = true;
      if (typeof window !== 'undefined') {
        window.removeEventListener('bcomm:hero_banner_ready', onHeroBannerReady);
      }
    };
  }, [bannerDeskUrl, bannerMobUrl, isBannerVideo, bgImageSrc, isTestMode]);

  // 3. Ouvinte de evento para simulação ao vivo do lojista no painel de aparência
  useEffect(() => {
    const handleTestEvent = (e: any) => {
      const customConfig = e?.detail;
      if (customConfig) {
        setTestConfig(customConfig);
      }
      setIsTestMode(true);
      setIsRevealing(false);
      setIsVisible(true);
    };

    window.addEventListener('bcomm:test_preloader', handleTestEvent);
    return () => {
      window.removeEventListener('bcomm:test_preloader', handleTestEvent);
    };
  }, []);

  // 4. Inicialização na vitrine ao vivo
  useEffect(() => {
    if (!hasMounted) return;

    // Se estiver em rota administrativa e não for teste, desativa
    if (isExcludedRoute && !isTestMode) {
      if (typeof window !== 'undefined' && (window as any).__BCOMM_PRELOADER__) {
        (window as any).__BCOMM_PRELOADER__.forceHide();
      }
      setIsVisible(false);
      return;
    }
  }, [hasMounted, isExcludedRoute, isTestMode]);

  // 5. Atualização de rota interna (Navegação SPA pura e instantânea de 0ms)
  useEffect(() => {
    if (!hasMounted || isExcludedRoute || isTestMode) return;
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname;
    }
  }, [pathname, hasMounted, isExcludedRoute, isTestMode]);

  // 6. MOTOR DE ANIMAÇÃO PARA TESTES DO ADMIN
  useEffect(() => {
    // Apenas para simulação ao vivo no painel de administração da boutique
    if (!isTestMode) {
      return;
    }

    if (!isVisible) {
      document.body.style.overflow = '';
      return;
    }

    // Trava de rolagem da vitrine enquanto a cortina está ativa
    document.body.style.overflow = 'hidden';

    const isInternalTransition = false;
    const initialProgress = 0;
    
    // Atualiza visual no DOM com o valor inicial contínuo
    updateProgressDOM(initialProgress, effectiveConfig.modelo);

    const targetDuration = isTestMode
      ? 1400
      : isInternalTransition
      ? 400
      : Math.max(1200, Number(effectiveConfig.tempo_minimo_ms || 1200));

    const maxTimeout = isTestMode
      ? 2000
      : isInternalTransition
      ? 900
      : Math.max(3500, Number(effectiveConfig.timeout_seguranca_ms || 3500));

    const startTime = Date.now();
    let currentVal = initialProgress;
    let sprintStartTime: number | null = null;
    let sprintStartVal: number = 0;
    let dwellStartTime: number | null = null;
    let isFinished = false;
    let isConcluding = false;
    let rafId: number | null = null;
    let closeTimer: NodeJS.Timeout | null = null;

    const sprintDuration = isInternalTransition ? 250 : 500;
    const dwellDuration = isInternalTransition ? 150 : 300;

    const finish = () => {
      if (isFinished) return;
      isFinished = true;

      if (rafId) cancelAnimationFrame(rafId);

      updateProgressDOM(100, effectiveConfig.modelo);
      setIsRevealing(true);

      if (typeof document !== 'undefined') {
        // 1. Revela a vitrine antes de desvanecer a cortina (zero flash, zero tela preta)
        const storeRoot = document.getElementById('bcomm-store-root');
        if (storeRoot) {
          storeRoot.style.opacity = '1';
          storeRoot.style.visibility = 'visible';
          storeRoot.style.pointerEvents = 'auto';
        }

        // 2. Desvanecimento suave da cortina por 500ms
        const instantCurtain = document.getElementById('bcomm-instant-curtain');
        if (instantCurtain) {
          instantCurtain.style.opacity = '0';
          instantCurtain.style.transition = 'opacity 500ms cubic-bezier(0.16, 1, 0.3, 1)';
          setTimeout(() => {
            instantCurtain.style.display = 'none';
            // 3. Remove o bloqueio do véu crítico SOMENTE após a cortina ter completado o fade-out
            document.documentElement.classList.remove('bcomm-preloader-running', 'bcomm-veil-active');
            document.body.style.overflow = '';
          }, 520);
        }
      }

      closeTimer = setTimeout(() => {
        setIsVisible(false);
        setIsRevealing(false);
        setIsTestMode(false);
        isTransitioningRouteRef.current = false;
        document.body.style.overflow = '';
      }, 520);
    };

    // Watchdog Timer de Segurança: Garante saída mesmo com falha extrema de rede
    const watchdogTimer = setTimeout(() => {
      if (isFinished) return;
      isConcluding = true;
      updateProgressDOM(100, effectiveConfig.modelo);
      setTimeout(finish, dwellDuration);
    }, maxTimeout);

    const step = () => {
      if (isFinished) return;

      const now = Date.now();
      const elapsed = now - startTime;
      const isReady = isTestMode || isInternalTransition
        ? true
        : (isAssetsReadyRef.current || (typeof window !== 'undefined' && Boolean((window as any).__BCOMM_HERO_BANNER_READY__)));

      if (!isConcluding) {
        if (isReady && elapsed >= targetDuration) {
          // FASE 2: SPRINT VISÍVEL E FLUIDO ATÉ 100% (450ms a 550ms legíveis)
          if (sprintStartTime === null) {
            sprintStartTime = now;
            sprintStartVal = currentVal;
          }
          const sprintElapsed = now - sprintStartTime;
          const sprintRatio = Math.min(1, sprintElapsed / sprintDuration);
          // Easing suave (easeOutQuad) para avanço legível de todos os números
          const eased = 1 - Math.pow(1 - sprintRatio, 2);
          currentVal = sprintStartVal + (100 - sprintStartVal) * eased;

          if (currentVal >= 99.8 || sprintElapsed >= sprintDuration) {
            currentVal = 100;
            isConcluding = true;
            dwellStartTime = now;
            clearTimeout(watchdogTimer);
            updateProgressDOM(100, effectiveConfig.modelo);
          }
        } else if (isReady) {
          // Loja decodificada, cumprindo o tempo mínimo de sofisticação (sobe até 75%)
          const ratio = Math.min(1, elapsed / targetDuration);
          const targetProgress = initialProgress + (75 - initialProgress) * ratio;
          currentVal = Math.min(75, Math.max(currentVal, targetProgress));
        } else {
          // Loja ainda carregando no fundo (download de banner, produtos, etc.):
          // Progride suavemente com teto estrito em 75% (NUNCA atinge 100% enquanto a loja não estiver pronta)
          const ratio = Math.min(1, elapsed / maxTimeout);
          const targetProgress = initialProgress + (75 - initialProgress) * (1 - Math.pow(1 - ratio, 2));
          currentVal = Math.min(75, Math.max(currentVal, targetProgress));
        }

        updateProgressDOM(currentVal, effectiveConfig.modelo);
        rafId = requestAnimationFrame(step);
      } else {
        // FASE 3: DWELL PERCEPTUAL EM 100% (300ms de Confirmação Visual Estática)
        const dwellElapsed = now - (dwellStartTime || now);
        updateProgressDOM(100, effectiveConfig.modelo);

        if (dwellElapsed >= dwellDuration) {
          finish();
          return;
        }
        rafId = requestAnimationFrame(step);
      }
    };

    // Inicia loop via RAF único (zero concorrência de timers)
    rafId = requestAnimationFrame(step);

    return () => {
      clearTimeout(watchdogTimer);
      if (closeTimer) clearTimeout(closeTimer);
      if (rafId) cancelAnimationFrame(rafId);
      document.body.style.overflow = '';
    };
  }, [
    isVisible,
    isTestMode,
    effectiveConfig.modelo,
    effectiveConfig.tempo_minimo_ms,
    effectiveConfig.timeout_seguranca_ms,
    updateProgressDOM
  ]);

  // Se não estiver em modo de teste, a cortina da vitrine pública é o elemento único #bcomm-instant-curtain gerenciado acima
  if (!isTestMode) return null;

  const logoUrl = testConfig?.modelo ? '/images/Logo sem fundo.png' : (currentTenant?.configuracoes_visuais?.logo_url || '/images/Logo sem fundo.png');
  const slogan = currentTenant?.configuracoes_visuais?.slogan || 'Moda Feminina Autêntica & Elegância Diária';
  const lojaNome = currentTenant?.nome || 'Leidy Boutique';

  return (
    <aside
      id="bcomm-store-preloader-test"
      aria-label="Simulação de Tela de Abertura"
      role="dialog"
      aria-modal="true"
      suppressHydrationWarning
      className={`fixed inset-0 z-[999999] flex flex-col items-center justify-center select-none overflow-hidden ${
        effectiveConfig.modelo === 'editorial_dark'
          ? `transition-transform duration-700 ease-[cubic-bezier(0.77,0,0.175,1)] ${
              isRevealing ? '-translate-y-full' : 'translate-y-0'
            }`
          : `transition-all duration-600 ease-out ${
              isRevealing ? 'opacity-0 scale-102 pointer-events-none' : 'opacity-100 scale-100'
            }`
      }`}
      style={{ backgroundColor: effectiveConfig.fundo || '#FAF8F5' }}
    >
      {/* Botão de Fechar Teste (Apenas no Modo de Simulação do Admin) */}
      {isTestMode && (
        <button
          type="button"
          onClick={() => {
            setIsVisible(false);
            setIsRevealing(false);
            setIsTestMode(false);
            document.body.style.overflow = '';
            if (typeof document !== 'undefined') {
              document.documentElement.classList.remove('bcomm-preloader-running', 'bcomm-veil-active');
              const instantCurtain = document.getElementById('bcomm-instant-curtain');
              if (instantCurtain) instantCurtain.style.display = 'none';
              const storeRoot = document.getElementById('bcomm-store-root');
              if (storeRoot) {
                storeRoot.style.opacity = '1';
                storeRoot.style.visibility = 'visible';
                storeRoot.style.pointerEvents = 'auto';
              }
            }
          }}
          className="absolute top-5 right-5 z-50 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/80 hover:bg-black text-white text-xs font-bold border border-white/20 backdrop-blur-md cursor-pointer transition-all shadow-2xl active:scale-95"
        >
          <X className="w-3.5 h-3.5 text-amber-400" />
          <span>Fechar Teste</span>
        </button>
      )}

      {/* Sutil Detalhe de Profundidade */}
      <div className="absolute inset-0 bg-radial from-transparent via-black/[0.02] to-black/[0.05] pointer-events-none" />

      {/* ==========================================
          MODELO 3: EDITORIAL DARK LUXURY
          ========================================== */}
      {effectiveConfig.modelo === 'editorial_dark' && (
        <div className="flex flex-col items-center text-center px-6 max-w-md w-full relative z-10 animate-fade-in">
          {effectiveConfig.exibir_logo && (
            <div className="relative w-40 h-16 sm:w-48 sm:h-20 mb-6 drop-shadow-md">
              <Image
                src={logoUrl}
                alt={lojaNome}
                fill
                priority
                className="object-contain brightness-110"
              />
            </div>
          )}

          {effectiveConfig.exibir_slogan && (
            <p
              className="text-[11px] sm:text-xs uppercase tracking-[0.25em] mb-8 font-serif-luxury opacity-85"
              style={{ color: effectiveConfig.cor_primaria || '#DFBE76' }}
            >
              {slogan}
            </p>
          )}

          {effectiveConfig.exibir_porcentagem && (
            <div className="flex items-baseline gap-1 mb-4 font-serif-luxury font-light">
              <span
                ref={digitsRef}
                className="text-5xl sm:text-6xl font-extralight tracking-tight"
                style={{ color: '#FAF8F5' }}
              >
                00
              </span>
              <span
                className="text-xs sm:text-sm font-semibold tracking-widest"
                style={{ color: effectiveConfig.cor_primaria || '#DFBE76' }}
              >
                %
              </span>
            </div>
          )}

          <div className="w-48 sm:w-64 h-[2px] bg-white/10 rounded-full overflow-hidden relative">
            <div
              ref={progressBarRef}
              className="h-full transition-all duration-150 ease-out rounded-full shadow-sm"
              style={{
                width: '0%',
                backgroundColor: effectiveConfig.cor_primaria || '#DFBE76'
              }}
            />
          </div>

          <span className="text-[10px] tracking-widest uppercase text-white/40 mt-5 font-mono">
            Carregando Coleções
          </span>
        </div>
      )}

      {/* ==========================================
          MODELO 2: MONOGRAMA & PULSO MINIMALISTA
          ========================================== */}
      {effectiveConfig.modelo === 'monograma' && (
        <div className="flex flex-col items-center text-center px-6 max-w-sm w-full relative z-10 animate-fade-in">
          {effectiveConfig.exibir_logo && (
            <div className="relative mb-6">
              <div
                className="absolute inset-0 rounded-full animate-ping opacity-25"
                style={{ backgroundColor: effectiveConfig.cor_primaria || '#DFBE76' }}
              />
              <div className="relative w-28 h-14 sm:w-36 sm:h-16">
                <Image
                  src={logoUrl}
                  alt={lojaNome}
                  fill
                  priority
                  className="object-contain"
                />
              </div>
            </div>
          )}

          {effectiveConfig.exibir_porcentagem && (
            <span
              ref={digitsRef}
              className="text-sm font-mono font-bold tracking-widest mb-3"
              style={{ color: effectiveConfig.cor_texto || '#1A1918' }}
            >
              0%
            </span>
          )}

          <div className="w-36 h-[2px] bg-slate-200 rounded-full overflow-hidden">
            <div
              ref={progressBarRef}
              className="h-full transition-all duration-150 ease-out"
              style={{
                width: '0%',
                backgroundColor: effectiveConfig.cor_primaria || '#DFBE76'
              }}
            />
          </div>
        </div>
      )}

      {/* ====================================================
          MODELO 1: HAUTE COUTURE & CONTADOR NUMÉRICO (PADRÃO)
          ==================================================== */}
      {effectiveConfig.modelo === 'haute_couture' && (
        <div className="flex flex-col items-center text-center px-6 max-w-lg w-full relative z-10 animate-fade-in">
          {effectiveConfig.exibir_logo && (
            <div className="relative w-44 h-16 sm:w-56 sm:h-20 mb-5 drop-shadow-sm">
              <Image
                src={logoUrl}
                alt={lojaNome}
                fill
                priority
                className="object-contain"
              />
            </div>
          )}

          {effectiveConfig.exibir_slogan && (
            <div className="flex items-center gap-2 mb-8">
              <span className="w-6 h-[1px] bg-black/15" />
              <p
                className="text-[10px] sm:text-[11px] uppercase tracking-[0.3em] font-serif-luxury font-medium"
                style={{ color: effectiveConfig.cor_primaria || '#DFBE76' }}
              >
                {slogan}
              </p>
              <span className="w-6 h-[1px] bg-black/15" />
            </div>
          )}

          {effectiveConfig.exibir_porcentagem && (
            <div className="flex items-baseline gap-1.5 mb-5 select-none font-serif-luxury">
              <span
                ref={digitsRef}
                className="text-5xl sm:text-6xl font-light tracking-tight transition-all"
                style={{ color: effectiveConfig.cor_texto || '#1A1918' }}
              >
                00
              </span>
              <span
                className="text-sm font-semibold tracking-widest"
                style={{ color: effectiveConfig.cor_primaria || '#DFBE76' }}
              >
                %
              </span>
            </div>
          )}

          <div className="w-48 sm:w-64 h-[2px] bg-black/5 rounded-full overflow-hidden relative shadow-2xs">
            <div
              ref={progressBarRef}
              className="h-full transition-all duration-150 ease-out rounded-full"
              style={{
                width: '0%',
                backgroundColor: effectiveConfig.cor_primaria || '#DFBE76',
                boxShadow: `0 0 10px ${effectiveConfig.cor_primaria || '#DFBE76'}70`
              }}
            />
          </div>

          <div className="flex items-center gap-1.5 mt-5 text-[10px] tracking-widest uppercase font-mono text-slate-400">
            <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" />
            <span>Preparando Vitrine Exclusiva</span>
          </div>
        </div>
      )}
    </aside>
  );
};

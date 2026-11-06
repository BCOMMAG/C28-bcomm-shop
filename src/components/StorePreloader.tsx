'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useStore } from '@/context/StoreContext';
import { StorePreloaderConfig } from '@/types/database';
import { Sparkles, X } from 'lucide-react';

export const StorePreloader: React.FC = () => {
  const pathname = usePathname();
  const { currentTenant, isLoadingProducts } = useStore();

  const [hasMounted, setHasMounted] = useState<boolean>(false);
  const [testConfig, setTestConfig] = useState<StorePreloaderConfig | null>(null);
  const [isTestMode, setIsTestMode] = useState<boolean>(false);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [isRevealing, setIsRevealing] = useState<boolean>(false);

  // Referências diretas ao DOM (Zero Re-renders do React durante o trajeto 0% a 100%)
  const digitsRef = useRef<HTMLSpanElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const prevPathnameRef = useRef<string>(pathname);
  const hasLoadedInitialRouteRef = useRef<boolean>(false);
  const isTransitioningRouteRef = useRef<boolean>(false);

  const isExcludedRoute = useMemo(() => {
    if (!pathname) return false;
    return pathname.startsWith('/admin') || pathname.startsWith('/super-admin');
  }, [pathname]);

  const config: StorePreloaderConfig = useMemo(() => {
    const vis = currentTenant?.configuracoes_visuais as any;
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
      tempo_minimo_ms: Number(p?.tempo_minimo_ms || 650),
      timeout_seguranca_ms: Number(p?.timeout_seguranca_ms || 2200)
    };
  }, [currentTenant]);

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
  }, []);

  // 1. Montagem inicial no cliente (Proteção absoluta contra Hydration Mismatch)
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // 2. Ouvinte de evento para simulação ao vivo do lojista no painel de aparência
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

  // 3. Inicialização na vitrine ao vivo
  useEffect(() => {
    if (!hasMounted) return;

    // Se estiver em rota administrativa e não for teste, desativa
    if (isExcludedRoute && !isTestMode) {
      setIsVisible(false);
      return;
    }

    // No primeiro carregamento da vitrine pública
    if (!hasLoadedInitialRouteRef.current) {
      hasLoadedInitialRouteRef.current = true;
      if (effectiveConfig.ativo) {
        // Verifica se a frequência é 'apenas_entrada' e se já foi visualizada na sessão
        if (effectiveConfig.frequencia === 'apenas_entrada') {
          try {
            const hasSeen = sessionStorage.getItem('bcomm_preloader_seen');
            if (hasSeen === 'true') {
              if (typeof document !== 'undefined') {
                document.documentElement.classList.remove('bcomm-veil-active');
                const instantCurtain = document.getElementById('bcomm-instant-curtain');
                if (instantCurtain) instantCurtain.style.display = 'none';
              }
              return;
            }
            sessionStorage.setItem('bcomm_preloader_seen', 'true');
          } catch {}
        }
        setIsRevealing(false);
        setIsVisible(true);
      } else {
        // Se inativo, garante liberação imediata de qualquer cortina estática
        if (typeof document !== 'undefined') {
          document.documentElement.classList.remove('bcomm-veil-active');
          const instantCurtain = document.getElementById('bcomm-instant-curtain');
          if (instantCurtain) instantCurtain.style.display = 'none';
        }
      }
    }
  }, [hasMounted, isExcludedRoute, isTestMode, effectiveConfig.ativo, effectiveConfig.frequencia]);

  // 4. Transições de rotas internas (Catálogo, Favoritos, etc.)
  useEffect(() => {
    if (!hasMounted || isExcludedRoute || isTestMode) return;

    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname;
      if (effectiveConfig.ativo && effectiveConfig.frequencia === 'todas_as_paginas') {
        isTransitioningRouteRef.current = true;
        setIsRevealing(false);
        setIsVisible(true);
      }
    }
  }, [pathname, hasMounted, isExcludedRoute, isTestMode, effectiveConfig.ativo, effectiveConfig.frequencia]);

  // 5. MOTOR DE ANIMAÇÃO DIRETO NO DOM + WATCHDOG AUTÔNOMO
  useEffect(() => {
    if (!isVisible) {
      document.body.style.overflow = '';
      return;
    }

    // Trava de rolagem da vitrine enquanto a cortina está ativa
    document.body.style.overflow = 'hidden';

    // Reseta visual no DOM imediatamente
    updateProgressDOM(0, effectiveConfig.modelo);

    const isInternalTransition = isTransitioningRouteRef.current;
    const targetDuration = isTestMode
      ? 1400
      : isInternalTransition
      ? 450
      : Math.max(650, effectiveConfig.tempo_minimo_ms || 650);

    const maxTimeout = isTestMode
      ? 1800
      : isInternalTransition
      ? 900
      : Math.max(1800, effectiveConfig.timeout_seguranca_ms || 2200);

    const startTime = Date.now();
    let currentVal = 0;
    let isFinished = false;
    let rafId: number | null = null;
    let intervalId: NodeJS.Timeout | null = null;
    let closeTimer: NodeJS.Timeout | null = null;

    const finish = () => {
      if (isFinished) return;
      isFinished = true;

      if (rafId) cancelAnimationFrame(rafId);
      if (intervalId) clearInterval(intervalId);

      updateProgressDOM(100, effectiveConfig.modelo);
      setIsRevealing(true);

      if (typeof document !== 'undefined') {
        document.documentElement.classList.remove('bcomm-veil-active');
        const instantCurtain = document.getElementById('bcomm-instant-curtain');
        if (instantCurtain) {
          instantCurtain.style.opacity = '0';
          instantCurtain.style.transition = 'opacity 500ms ease-out';
          setTimeout(() => {
            instantCurtain.style.display = 'none';
          }, 500);
        }
      }

      closeTimer = setTimeout(() => {
        setIsVisible(false);
        setIsRevealing(false);
        setIsTestMode(false);
        isTransitioningRouteRef.current = false;
        document.body.style.overflow = '';
      }, 550);
    };

    // Watchdog Timer de Segurança: Garante saída mesmo com falha externa ou aba em segundo plano
    const watchdogTimer = setTimeout(() => {
      finish();
    }, maxTimeout);

    const step = () => {
      if (isFinished) return;

      const elapsed = Date.now() - startTime;
      const contentReady = isTestMode || isInternalTransition ? true : !isLoadingProducts;

      if (elapsed >= maxTimeout || (contentReady && elapsed >= targetDuration)) {
        clearTimeout(watchdogTimer);
        finish();
        return;
      }

      let targetProgress = 0;
      if (contentReady) {
        const ratio = Math.min(1, elapsed / targetDuration);
        targetProgress = 20 + ratio * 80;
      } else {
        const ratio = Math.min(1, elapsed / maxTimeout);
        targetProgress = Math.min(88, ratio * 90);
      }

      currentVal = Math.min(100, currentVal + Math.max(1, (targetProgress - currentVal) * 0.25));

      if (currentVal >= 99.2 && (contentReady && elapsed >= targetDuration)) {
        clearTimeout(watchdogTimer);
        finish();
        return;
      }

      updateProgressDOM(currentVal, effectiveConfig.modelo);
      rafId = requestAnimationFrame(step);
    };

    // Inicia loop via RAF
    rafId = requestAnimationFrame(step);

    // Fallback de segurança a cada 45ms para garantir avanço contínuo se a aba perder foco
    intervalId = setInterval(() => {
      if (!isFinished) {
        step();
      }
    }, 45);

    return () => {
      clearTimeout(watchdogTimer);
      if (closeTimer) clearTimeout(closeTimer);
      if (rafId) cancelAnimationFrame(rafId);
      if (intervalId) clearInterval(intervalId);
      document.body.style.overflow = '';
    };
  }, [
    isVisible,
    isTestMode,
    isLoadingProducts,
    effectiveConfig.modelo,
    effectiveConfig.tempo_minimo_ms,
    effectiveConfig.timeout_seguranca_ms,
    updateProgressDOM
  ]);

  // Se não foi montado no cliente, se estiver excluído, se inativo (e não for teste) ou se invisível
  if (!hasMounted) return null;
  if (isExcludedRoute && !isTestMode) return null;
  if (!effectiveConfig.ativo && !isTestMode) return null;
  if (!isVisible) return null;

  const logoUrl = currentTenant?.configuracoes_visuais?.logo_url || '/images/Logo sem fundo.png';
  const slogan = currentTenant?.configuracoes_visuais?.slogan || 'Moda Feminina Autêntica & Elegância Diária';
  const lojaNome = currentTenant?.nome || 'Leidy Boutique';

  return (
    <aside
      id="bcomm-store-preloader"
      aria-label="Carregando loja"
      role="status"
      aria-live="polite"
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
              document.documentElement.classList.remove('bcomm-veil-active');
              const instantCurtain = document.getElementById('bcomm-instant-curtain');
              if (instantCurtain) instantCurtain.style.display = 'none';
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

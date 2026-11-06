'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useStore } from '@/context/StoreContext';
import { StorePreloaderConfig } from '@/types/database';
import { Sparkles, X } from 'lucide-react';

export const StorePreloader: React.FC = () => {
  const pathname = usePathname();
  const { currentTenant, isLoadingProducts } = useStore();

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
      timeout_seguranca_ms: Number(p?.timeout_seguranca_ms || 2500)
    };
  }, [currentTenant]);

  const [testConfig, setTestConfig] = useState<StorePreloaderConfig | null>(null);
  const [isTestMode, setIsTestMode] = useState<boolean>(false);

  // Hidratação instantânea em 0ms no carregamento inicial da vitrine pública
  const [isVisible, setIsVisible] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        const path = window.location.pathname;
        if (path.startsWith('/admin') || path.startsWith('/super-admin')) {
          return false;
        }
        const last = localStorage.getItem('bcomm_tenant_last');
        if (last) {
          const parsed = JSON.parse(last);
          if (parsed?.configuracoes_visuais?.preloader?.ativo) {
            return true;
          }
        }
      } catch {}
    }
    return Boolean(currentTenant?.configuracoes_visuais?.preloader?.ativo);
  });

  const [isRevealing, setIsRevealing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);

  const prevPathnameRef = useRef<string>(pathname);
  const hasMountedInitialRef = useRef<boolean>(false);
  const startTimeRef = useRef<number>(Date.now());
  const animationFrameRef = useRef<number | null>(null);

  // Escuta evento de teste ao vivo disparado pelo painel administrativo
  useEffect(() => {
    const handleTestEvent = (e: any) => {
      const customConfig = e?.detail;
      if (customConfig) {
        setTestConfig(customConfig);
      }
      setIsTestMode(true);
      setIsRevealing(false);
      setProgress(0);
      setIsVisible(true);
      startTimeRef.current = Date.now();
    };

    window.addEventListener('bcomm:test_preloader', handleTestEvent);
    return () => {
      window.removeEventListener('bcomm:test_preloader', handleTestEvent);
    };
  }, []);

  // Inicialização e sincronização da visibilidade
  useEffect(() => {
    if (isExcludedRoute && !isTestMode) {
      setIsVisible(false);
      return;
    }

    if (!hasMountedInitialRef.current) {
      hasMountedInitialRef.current = true;
      if (config.ativo) {
        setIsVisible(true);
        setIsRevealing(false);
        setProgress(0);
        startTimeRef.current = Date.now();
      }
    }
  }, [config.ativo, isExcludedRoute, isTestMode]);

  // Transição de rotas públicas
  useEffect(() => {
    if (isExcludedRoute) return;

    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname;
      if (config.ativo && config.frequencia === 'todas_as_paginas') {
        setIsRevealing(false);
        setProgress(0);
        setIsVisible(true);
        startTimeRef.current = Date.now();
      }
    }
  }, [pathname, config.ativo, config.frequencia, isExcludedRoute]);

  const effectiveConfig: StorePreloaderConfig = useMemo(() => {
    if (isTestMode && testConfig) {
      return testConfig;
    }
    return config;
  }, [isTestMode, testConfig, config]);

  // Motor de animação e progresso (0% a 100%)
  useEffect(() => {
    if (!isVisible) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      return;
    }

    const minDuration = isTestMode ? 1400 : (effectiveConfig.tempo_minimo_ms || 650);
    const maxTimeout = isTestMode ? 1800 : (effectiveConfig.timeout_seguranca_ms || 2500);
    let hideTimeout: NodeJS.Timeout | null = null;
    let localProgress = 0;

    const updateLoop = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const isContentReady = isTestMode ? true : !isLoadingProducts;
      const hasTimedOut = elapsed >= maxTimeout;

      let targetProgress = 0;

      if (hasTimedOut || (isContentReady && elapsed >= minDuration)) {
        targetProgress = 100;
      } else if (isContentReady) {
        const ratio = Math.min(1, elapsed / minDuration);
        targetProgress = 30 + ratio * 70;
      } else {
        const ratio = Math.min(1, elapsed / maxTimeout);
        targetProgress = Math.min(88, ratio * 90);
      }

      localProgress = Math.min(100, localProgress + Math.max(1, (targetProgress - localProgress) * 0.25));

      if (localProgress >= 99.2 && (hasTimedOut || (isContentReady && elapsed >= minDuration))) {
        localProgress = 100;
      }

      const floored = Math.floor(localProgress);
      setProgress(floored);

      if (floored < 100) {
        animationFrameRef.current = requestAnimationFrame(updateLoop);
      } else {
        setIsRevealing(true);
        hideTimeout = setTimeout(() => {
          setIsVisible(false);
          setIsRevealing(false);
          setIsTestMode(false);
        }, 550);
      }
    };

    animationFrameRef.current = requestAnimationFrame(updateLoop);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (hideTimeout) clearTimeout(hideTimeout);
    };
  }, [isVisible, isTestMode, isLoadingProducts, effectiveConfig.tempo_minimo_ms, effectiveConfig.timeout_seguranca_ms]);

  // Se rota administrativa e não for modo teste: não renderiza
  if (isExcludedRoute && !isTestMode) {
    return null;
  }

  // Se não for teste e não estiver ativo: não renderiza
  if (!effectiveConfig.ativo && !isTestMode) {
    return null;
  }

  if (!isVisible) {
    return null;
  }

  const logoUrl = currentTenant?.configuracoes_visuais?.logo_url || '/images/Logo sem fundo.png';
  const slogan = currentTenant?.configuracoes_visuais?.slogan || 'Moda Feminina Autêntica & Elegância Diária';
  const lojaNome = currentTenant?.nome || 'Leidy Boutique';

  return (
    <aside
      aria-label="Carregando loja"
      role="status"
      aria-live="polite"
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
      {/* Botão de Fechar Teste (Apenas no Modo de Simulação) */}
      {isTestMode && (
        <button
          type="button"
          onClick={() => {
            setIsVisible(false);
            setIsTestMode(false);
          }}
          className="absolute top-5 right-5 z-50 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/70 hover:bg-black text-white text-xs font-bold border border-white/20 backdrop-blur-md cursor-pointer transition-all shadow-xl"
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
                className="text-5xl sm:text-6xl font-extralight tracking-tight"
                style={{ color: '#FAF8F5' }}
              >
                {String(progress).padStart(2, '0')}
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
              className="h-full transition-all duration-150 ease-out rounded-full shadow-sm"
              style={{
                width: `${progress}%`,
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
              className="text-sm font-mono font-bold tracking-widest mb-3"
              style={{ color: effectiveConfig.cor_texto || '#1A1918' }}
            >
              {progress}%
            </span>
          )}

          <div className="w-36 h-[2px] bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-150 ease-out"
              style={{
                width: `${progress}%`,
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
                className="text-5xl sm:text-6xl font-light tracking-tight transition-all"
                style={{ color: effectiveConfig.cor_texto || '#1A1918' }}
              >
                {String(progress).padStart(2, '0')}
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
              className="h-full transition-all duration-150 ease-out rounded-full"
              style={{
                width: `${progress}%`,
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

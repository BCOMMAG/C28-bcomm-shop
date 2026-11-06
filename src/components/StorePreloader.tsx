'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useStore } from '@/context/StoreContext';
import { StorePreloaderConfig } from '@/types/database';
import { Sparkles } from 'lucide-react';

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

  const [isVisible, setIsVisible] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isTestMode, setIsTestMode] = useState(false);

  const prevPathnameRef = useRef<string>(pathname);
  const hasMountedInitialRef = useRef<boolean>(false);
  const startTimeRef = useRef<number>(Date.now());
  const animationFrameRef = useRef<number | null>(null);

  // Escuta evento de teste ao vivo disparado pelo painel administrativo
  useEffect(() => {
    const handleTestEvent = (e: any) => {
      const customConfig = e?.detail;
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

  // Inicialização no primeiro acesso (Hard Reload)
  useEffect(() => {
    if (isExcludedRoute) return;

    if (!hasMountedInitialRef.current) {
      hasMountedInitialRef.current = true;
      if (config.ativo) {
        setIsVisible(true);
        setIsRevealing(false);
        setProgress(0);
        startTimeRef.current = Date.now();
      }
    }
  }, [config.ativo, isExcludedRoute]);

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

  // Motor de animação e progresso (0% a 100%)
  useEffect(() => {
    if (!isVisible) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      return;
    }

    const minDuration = isTestMode ? 900 : (config.tempo_minimo_ms || 650);
    const maxTimeout = isTestMode ? 1500 : (config.timeout_seguranca_ms || 2500);

    const updateLoop = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const isContentReady = !isLoadingProducts;
      const hasTimedOut = elapsed >= maxTimeout;

      let targetProgress = 0;

      if (hasTimedOut || (isContentReady && elapsed >= minDuration)) {
        targetProgress = 100;
      } else if (isContentReady) {
        // Conteúdo pronto, avança suavemente para 100 no tempo mínimo
        const ratio = Math.min(1, elapsed / minDuration);
        targetProgress = 40 + ratio * 60;
      } else {
        // Carregando dados, desacelera perto de 88%
        const ratio = Math.min(1, elapsed / maxTimeout);
        targetProgress = Math.min(88, ratio * 90);
      }

      setProgress((prev) => {
        const next = Math.min(100, prev + Math.max(1, (targetProgress - prev) * 0.2));
        if (next >= 99.5 && (hasTimedOut || (isContentReady && elapsed >= minDuration))) {
          return 100;
        }
        return Math.floor(next);
      });

      if (progress < 100) {
        animationFrameRef.current = requestAnimationFrame(updateLoop);
      } else {
        // Conclusão e início da animação de revelação
        setIsRevealing(true);
        const hideTimeout = setTimeout(() => {
          setIsVisible(false);
          setIsRevealing(false);
          setIsTestMode(false);
        }, 550);
        return () => clearTimeout(hideTimeout);
      }
    };

    animationFrameRef.current = requestAnimationFrame(updateLoop);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isVisible, progress, isLoadingProducts, config.tempo_minimo_ms, config.timeout_seguranca_ms, isTestMode]);

  // Não renderiza nada nas áreas administrativas ou se desativado (e não estiver em modo de teste)
  if (isExcludedRoute || (!config.ativo && !isTestMode) || !isVisible) {
    return null;
  }

  const logoUrl = currentTenant?.configuracoes_visuais?.logo_url || '/images/Logo sem fundo.png';
  const slogan = currentTenant?.configuracoes_visuais?.slogan || 'Moda Feminina Autêntica & Elegância Diária';
  const lojaNome = currentTenant?.nome || 'Leidy Boutique';

  // ==========================================
  // MODELO 3: EDITORIAL DARK LUXURY (CORTINA)
  // ==========================================
  if (config.modelo === 'editorial_dark') {
    return (
      <aside
        aria-label="Carregando loja"
        role="status"
        aria-live="polite"
        className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center select-none overflow-hidden transition-transform duration-700 ease-[cubic-bezier(0.77,0,0.175,1)] ${
          isRevealing ? '-translate-y-full' : 'translate-y-0'
        }`}
        style={{ backgroundColor: config.fundo || '#1A1918' }}
      >
        <div className="flex flex-col items-center text-center px-6 max-w-md w-full relative z-10 animate-fade-in">
          {config.exibir_logo && (
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

          {config.exibir_slogan && (
            <p
              className="text-[11px] sm:text-xs uppercase tracking-[0.25em] mb-8 font-serif-luxury opacity-80"
              style={{ color: config.cor_primaria || '#DFBE76' }}
            >
              {slogan}
            </p>
          )}

          {config.exibir_porcentagem && (
            <div className="flex items-baseline gap-1 mb-4 font-serif-luxury font-light">
              <span
                className="text-4xl sm:text-5xl font-extralight tracking-tight"
                style={{ color: '#FAF8F5' }}
              >
                {String(progress).padStart(2, '0')}
              </span>
              <span
                className="text-xs sm:text-sm font-semibold tracking-widest"
                style={{ color: config.cor_primaria || '#DFBE76' }}
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
                backgroundColor: config.cor_primaria || '#DFBE76'
              }}
            />
          </div>

          <span className="text-[10px] tracking-widest uppercase text-white/40 mt-4 font-mono">
            Carregando Coleções
          </span>
        </div>
      </aside>
    );
  }

  // ==========================================
  // MODELO 2: MONOGRAMA & PULSO MINIMALISTA
  // ==========================================
  if (config.modelo === 'monograma') {
    return (
      <aside
        aria-label="Carregando loja"
        role="status"
        aria-live="polite"
        className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center select-none overflow-hidden transition-all duration-500 ease-in-out ${
          isRevealing ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
        }`}
        style={{ backgroundColor: config.fundo || '#FFFFFF' }}
      >
        <div className="flex flex-col items-center text-center px-6 max-w-sm w-full">
          {config.exibir_logo && (
            <div className="relative mb-6">
              <div
                className="absolute inset-0 rounded-full animate-ping opacity-20"
                style={{ backgroundColor: config.cor_primaria || '#DFBE76' }}
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

          {config.exibir_porcentagem && (
            <span
              className="text-xs font-mono font-bold tracking-widest mb-3"
              style={{ color: config.cor_texto || '#1A1918' }}
            >
              {progress}%
            </span>
          )}

          <div className="w-32 h-[1.5px] bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-150 ease-out"
              style={{
                width: `${progress}%`,
                backgroundColor: config.cor_primaria || '#DFBE76'
              }}
            />
          </div>
        </div>
      </aside>
    );
  }

  // ====================================================
  // MODELO 1: HAUTE COUTURE & CONTADOR NUMÉRICO (PADRÃO)
  // ====================================================
  return (
    <aside
      aria-label="Carregando boutique"
      role="status"
      aria-live="polite"
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center select-none overflow-hidden transition-all duration-600 ease-out ${
        isRevealing ? 'opacity-0 pointer-events-none scale-98' : 'opacity-100 scale-100'
      }`}
      style={{ backgroundColor: config.fundo || '#FAF8F5' }}
    >
      {/* Detalhe Sutil de Fundo */}
      <div className="absolute inset-0 bg-radial from-transparent via-black/[0.02] to-black/[0.04] pointer-events-none" />

      <div className="flex flex-col items-center text-center px-6 max-w-lg w-full relative z-10 animate-fade-in">
        {/* Logotipo Oficial */}
        {config.exibir_logo && (
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

        {/* Slogan com Tipografia de Alta Moda */}
        {config.exibir_slogan && (
          <div className="flex items-center gap-2 mb-8">
            <span className="w-6 h-[1px] bg-black/15" />
            <p
              className="text-[10px] sm:text-[11px] uppercase tracking-[0.3em] font-serif-luxury font-medium"
              style={{ color: config.cor_primaria || '#DFBE76' }}
            >
              {slogan}
            </p>
            <span className="w-6 h-[1px] bg-black/15" />
          </div>
        )}

        {/* Contador Numérico de Grande Porte */}
        {config.exibir_porcentagem && (
          <div className="flex items-baseline gap-1.5 mb-5 select-none font-serif-luxury">
            <span
              className="text-5xl sm:text-6xl font-light tracking-tight transition-all"
              style={{ color: config.cor_texto || '#1A1918' }}
            >
              {String(progress).padStart(2, '0')}
            </span>
            <span
              className="text-sm font-semibold tracking-widest"
              style={{ color: config.cor_primaria || '#DFBE76' }}
            >
              %
            </span>
          </div>
        )}

        {/* Barra de Progresso Ultrafina Champagne */}
        <div className="w-48 sm:w-64 h-[2px] bg-black/5 rounded-full overflow-hidden relative shadow-2xs">
          <div
            className="h-full transition-all duration-150 ease-out rounded-full"
            style={{
              width: `${progress}%`,
              backgroundColor: config.cor_primaria || '#DFBE76',
              boxShadow: `0 0 8px ${config.cor_primaria || '#DFBE76'}60`
            }}
          />
        </div>

        {/* Rodapé do Carregamento */}
        <div className="flex items-center gap-1.5 mt-5 text-[10px] tracking-widest uppercase font-mono text-slate-400">
          <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" />
          <span>Preparando Vitrine Exclusiva</span>
        </div>
      </div>
    </aside>
  );
};


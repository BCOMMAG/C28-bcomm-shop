'use client';

import React, { useEffect, useState } from 'react';
import { RotateCw, LogIn, AlertTriangle, ChevronDown, ChevronUp, ShieldAlert } from 'lucide-react';

export default function AdminError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    console.error('Captured by Admin Error Boundary:', error);
  }, [error]);

  const handleReload = () => {
    if (typeof reset === 'function') {
      try {
        reset();
        return;
      } catch {}
    }
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  const handleGoToLogin = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/admin/login/';
    }
  };

  return (
    <div className="min-h-screen bg-[#07060A] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden selection:bg-purple-600 selection:text-white">
      {/* Luz ambiente de fundo BCOMM */}
      <div className="absolute top-1/4 -left-40 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-40 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg bg-[#100E17] border border-purple-500/20 p-8 shadow-2xl relative rounded-2xl z-10 text-center">
        {/* Ícone de Alerta */}
        <div className="w-16 h-16 mx-auto rounded-2xl bg-purple-950/60 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-6 shadow-lg shadow-purple-900/20">
          <ShieldAlert className="w-8 h-8" />
        </div>

        {/* Título & Descrição */}
        <div className="space-y-2 mb-6">
          <span className="text-[11px] font-bold uppercase tracking-widest text-purple-400 block">
            BCOMM Stores • Console Administrativo
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-wide">
            Instabilidade no Painel Administrativo
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
            Identificamos uma oscilação técnica momentânea ao carregar este módulo. As configurações, produtos e pedidos da loja permanecem 100% seguros e preservados.
          </p>
        </div>

        {/* Ações */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 mb-6">
          <button
            type="button"
            onClick={handleReload}
            className="w-full sm:w-auto px-5 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold tracking-wide flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-purple-900/30 transition-all"
          >
            <RotateCw className="w-4 h-4" />
            <span>Recarregar Módulo</span>
          </button>

          <button
            type="button"
            onClick={handleGoToLogin}
            className="w-full sm:w-auto px-5 py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/60 text-zinc-200 hover:text-white rounded-xl text-xs font-semibold tracking-wide flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <LogIn className="w-4 h-4 text-purple-400" />
            <span>Voltar ao Login</span>
          </button>
        </div>

        {/* Toggle para detalhes técnicos do erro */}
        <div className="border-t border-purple-500/15 pt-4 text-left">
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="w-full flex items-center justify-between text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors py-1 cursor-pointer"
          >
            <span className="flex items-center gap-1.5 font-medium">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              Detalhes técnicos para diagnóstico
            </span>
            {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showDetails && (
            <div className="mt-3 p-3 bg-black/60 rounded-xl border border-zinc-800 text-[11px] font-mono text-zinc-300 break-words max-h-48 overflow-y-auto space-y-1">
              <p className="text-rose-400 font-semibold">{error?.name || 'Error'}: {error?.message || 'Erro não especificado'}</p>
              {error?.digest && <p className="text-zinc-500">Digest: {error.digest}</p>}
              {error?.stack && (
                <pre className="text-[10px] text-zinc-500 whitespace-pre-wrap mt-2 overflow-x-auto">
                  {error.stack}
                </pre>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

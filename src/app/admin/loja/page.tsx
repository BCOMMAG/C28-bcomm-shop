'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LojaVirtualRootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/loja/cupons');
  }, [router]);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 shadow-xs">
      <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
      <span className="text-xs font-semibold text-slate-700">Carregando Configurações da Loja...</span>
    </div>
  );
}


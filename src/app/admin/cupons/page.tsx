'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Tag, ArrowRight } from 'lucide-react';

export default function RedirectCuponsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/loja/cupons');
  }, [router]);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-600 shadow-xs max-w-lg mx-auto mt-12 space-y-4">
      <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
        <Tag className="w-6 h-6 animate-pulse" />
      </div>
      <div>
        <h2 className="text-base font-bold text-slate-900">Cupons & Descontos foi unificado!</h2>
        <p className="text-xs text-slate-500 mt-1">
          Redirecionando você para a nova área integrada em <strong>Configurações da Loja</strong>...
        </p>
      </div>
      <div>
        <Link
          href="/admin/loja/cupons"
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
        >
          <span>Ir para Cupons & Descontos</span>
          <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
        </Link>
      </div>
    </div>
  );
}

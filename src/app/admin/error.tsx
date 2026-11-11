'use client';

import { useEffect } from 'react';

export default function AdminError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Captured by Admin Error Boundary:', error);
    if (typeof window !== 'undefined') {
      window.location.replace('/admin/login/');
    }
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-3 bg-white p-6 rounded-2xl shadow-xl max-w-sm text-center">
        <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold text-slate-800">Redirecionando para o login do painel...</p>
      </div>
    </div>
  );
}


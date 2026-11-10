'use client';

import React from 'react';
import { AlertTriangle, Save, Trash2, X, Loader2 } from 'lucide-react';
import { useAdminUnsavedChanges } from '@/context/AdminUnsavedChangesContext';
import { useAdminI18n } from '@/context/AdminI18nContext';

export const UnsavedChangesModal: React.FC = () => {
  const { t } = useAdminI18n();
  const {
    isModalOpen,
    isSaving,
    formName,
    confirmDiscard,
    cancelNavigation,
    saveAndNavigate
  } = useAdminUnsavedChanges();

  if (!isModalOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-md bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 rounded-2xl shadow-2xl p-6 overflow-hidden space-y-5 animate-in zoom-in-95 duration-200">
        {/* Faixa decorativa superior */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#C5A059] via-amber-400 to-[#DFBE76]" />

        {/* Botão Fechar no Canto */}
        <button
          type="button"
          onClick={cancelNavigation}
          disabled={isSaving}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-stone-200 transition-colors cursor-pointer p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-stone-800 disabled:opacity-50"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Cabeçalho com Ícone */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center shrink-0 text-[#C5A059] shadow-sm">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-stone-100">
              {t.unsavedChangesModal.title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-stone-400 leading-relaxed">
              {t.unsavedChangesModal.description(formName || '')}
            </p>
          </div>
        </div>

        {/* Destaque explicativo */}
        <div className="bg-slate-50 dark:bg-stone-800/60 p-3 rounded-xl border border-slate-200 dark:border-stone-800 text-[11px] text-slate-600 dark:text-stone-300">
          {t.unsavedChangesModal.hint}
        </div>

        {/* Ações em 3 Níveis */}
        <div className="space-y-2 pt-1">
          {/* Ação 1: Salvar e Continuar */}
          <button
            type="button"
            onClick={saveAndNavigate}
            disabled={isSaving}
            className="w-full py-3 px-4 bg-gradient-to-r from-[#C5A059] to-[#b38e46] hover:from-[#d4b067] hover:to-[#c5a059] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/15 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t.unsavedChangesModal.saving}</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{t.unsavedChangesModal.saveAndProceed}</span>
              </>
            )}
          </button>

          <div className="grid grid-cols-2 gap-2">
            {/* Ação 2: Descartar Alterações */}
            <button
              type="button"
              onClick={confirmDiscard}
              disabled={isSaving}
              className="py-2.5 px-3 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 border border-red-200 dark:border-red-900/50 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t.unsavedChangesModal.discard}</span>
            </button>

            {/* Ação 3: Continuar Editando */}
            <button
              type="button"
              onClick={cancelNavigation}
              disabled={isSaving}
              className="py-2.5 px-3 bg-slate-100 dark:bg-stone-800 text-slate-700 dark:text-stone-300 hover:bg-slate-200 dark:hover:bg-stone-700 border border-slate-200 dark:border-stone-700 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <span>Continuar Aqui</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


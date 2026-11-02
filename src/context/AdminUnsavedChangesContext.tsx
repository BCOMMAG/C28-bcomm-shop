'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface AdminUnsavedChangesContextType {
  isDirty: boolean;
  setIsDirty: (dirty: boolean) => void;
  registerSaveHandler: (handler: (() => Promise<boolean | void>) | null) => void;
  requestNavigation: (href: string) => boolean; // retorna true se navegou direto, false se abriu o modal
  isModalOpen: boolean;
  targetHref: string | null;
  isSaving: boolean;
  confirmDiscard: () => void;
  cancelNavigation: () => void;
  saveAndNavigate: () => Promise<void>;
  formName?: string;
  setFormName: (name: string) => void;
}

const AdminUnsavedChangesContext = createContext<AdminUnsavedChangesContextType | null>(null);

export const AdminUnsavedChangesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const [isDirty, setIsDirty] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetHref, setTargetHref] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formName, setFormName] = useState<string>('esta página');

  const saveHandlerRef = useRef<(() => Promise<boolean | void>) | null>(null);

  const registerSaveHandler = useCallback((handler: (() => Promise<boolean | void>) | null) => {
    saveHandlerRef.current = handler;
  }, []);

  // 1. Trava Nativa do Navegador (F5, Fechar Aba, Recarregar)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = ''; // Exibição padrão do navegador
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty]);

  // 2. Intercepta navegações internas no admin
  const requestNavigation = useCallback(
    (href: string): boolean => {
      if (!isDirty) {
        router.push(href);
        return true;
      }

      setTargetHref(href);
      setIsModalOpen(true);
      return false;
    },
    [isDirty, router]
  );

  // 3. Ação: Descartar Alterações e Sair
  const confirmDiscard = useCallback(() => {
    setIsDirty(false);
    setIsModalOpen(false);
    if (targetHref) {
      router.push(targetHref);
      setTargetHref(null);
    }
  }, [targetHref, router]);

  // 4. Ação: Permanecer na Página (Cancelar saída)
  const cancelNavigation = useCallback(() => {
    setIsModalOpen(false);
    setTargetHref(null);
  }, []);

  // 5. Ação: Salvar e Continuar
  const saveAndNavigate = useCallback(async () => {
    setIsSaving(true);
    try {
      if (saveHandlerRef.current) {
        const result = await saveHandlerRef.current();
        // Se a função retornar explicitamente false, interrompe (houve erro de validação)
        if (result === false) {
          setIsSaving(false);
          return;
        }
      }

      setIsDirty(false);
      setIsModalOpen(false);

      if (targetHref) {
        router.push(targetHref);
        setTargetHref(null);
      }
    } catch (err) {
      console.error('Erro ao salvar antes de navegar:', err);
    } finally {
      setIsSaving(false);
    }
  }, [targetHref, router]);

  return (
    <AdminUnsavedChangesContext.Provider
      value={{
        isDirty,
        setIsDirty,
        registerSaveHandler,
        requestNavigation,
        isModalOpen,
        targetHref,
        isSaving,
        confirmDiscard,
        cancelNavigation,
        saveAndNavigate,
        formName,
        setFormName
      }}
    >
      {children}
    </AdminUnsavedChangesContext.Provider>
  );
};

export const useAdminUnsavedChanges = () => {
  const context = useContext(AdminUnsavedChangesContext);
  if (!context) {
    // Fallback gracioso caso seja usado fora do provider
    return {
      isDirty: false,
      setIsDirty: () => {},
      registerSaveHandler: () => {},
      requestNavigation: (href: string) => true,
      isModalOpen: false,
      targetHref: null,
      isSaving: false,
      confirmDiscard: () => {},
      cancelNavigation: () => {},
      saveAndNavigate: async () => {},
      formName: '',
      setFormName: () => {}
    };
  }
  return context;
};

import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'BCOMM • Redefinição de Senha',
  description: 'Recuperação de Acesso e Redefinição de Senha na Plataforma BCOMM'
};

export default function RedefinirSenhaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}


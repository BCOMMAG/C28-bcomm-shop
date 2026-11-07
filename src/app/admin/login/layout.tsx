import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'BCOMM • Painel Administrativo',
  description: 'Acesso ao Painel Administrativo de Gestão da Loja na Plataforma BCOMM'
};

export default function AdminLoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}


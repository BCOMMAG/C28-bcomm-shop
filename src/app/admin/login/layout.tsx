import type { Metadata } from 'next';
import React from 'react';

const v = '20261107_apolo_stores';

export const metadata: Metadata = {
  title: 'BCOMM • Painel Administrativo',
  description: 'Acesso ao Painel Administrativo de Gestão da Loja na Plataforma BCOMM',
  icons: {
    icon: [
      { url: `/admin-favicon/favicon-32x32.png?v=${v}`, sizes: '32x32', type: 'image/png' },
      { url: `/admin-favicon/favicon-16x16.png?v=${v}`, sizes: '16x16', type: 'image/png' },
      { url: `/admin-favicon/favicon.ico?v=${v}`, sizes: 'any' }
    ],
    apple: [
      { url: `/admin-favicon/apple-touch-icon.png?v=${v}`, sizes: '180x180', type: 'image/png' }
    ],
    other: [
      { rel: 'android-chrome-192x192', url: `/admin-favicon/android-chrome-192x192.png?v=${v}`, sizes: '192x192', type: 'image/png' },
      { rel: 'android-chrome-512x512', url: `/admin-favicon/android-chrome-512x512.png?v=${v}`, sizes: '512x512', type: 'image/png' }
    ]
  }
};

export default function AdminLoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

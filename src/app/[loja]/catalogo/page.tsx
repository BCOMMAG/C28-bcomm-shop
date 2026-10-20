import React from 'react';
import CatalogoPage from '@/app/catalogo/page';

export async function generateStaticParams() {
  return [
    { loja: 'leidyboutique' },
    { loja: 'leidy-boutique' },
    { loja: 'auraprivee' },
    { loja: 'aura-privee' }
  ];
}

export default function TenantCatalogoPage() {
  return <CatalogoPage />;
}

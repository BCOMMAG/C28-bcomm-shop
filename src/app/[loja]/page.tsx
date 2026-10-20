import React from 'react';
import { BoutiqueStorefront } from '@/components/BoutiqueStorefront';

export async function generateStaticParams() {
  return [
    { loja: 'leidyboutique' },
    { loja: 'leidy-boutique' },
    { loja: 'auraprivee' },
    { loja: 'aura-privee' }
  ];
}

export default function TenantStorefrontPage() {
  return <BoutiqueStorefront />;
}

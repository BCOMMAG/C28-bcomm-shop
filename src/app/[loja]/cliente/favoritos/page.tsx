import React from 'react';
import { WishlistManager } from '@/components/WishlistManager';

export async function generateStaticParams() {
  return [
    { loja: 'leidyboutique' },
    { loja: 'leidy-boutique' },
    { loja: 'auraprivee' },
    { loja: 'aura-privee' }
  ];
}

export default function TenantFavoritosPage() {
  return <WishlistManager />;
}

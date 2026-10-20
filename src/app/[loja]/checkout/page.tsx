import React from 'react';
import CheckoutPage from '@/app/checkout/page';

export async function generateStaticParams() {
  return [
    { loja: 'leidyboutique' },
    { loja: 'leidy-boutique' },
    { loja: 'auraprivee' },
    { loja: 'aura-privee' }
  ];
}

export default function TenantCheckoutPage() {
  return <CheckoutPage />;
}

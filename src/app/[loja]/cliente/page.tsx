import React from 'react';
import { CustomerVIPDashboard } from '@/components/CustomerVIPDashboard';

export async function generateStaticParams() {
  return [
    { loja: 'leidyboutique' },
    { loja: 'leidy-boutique' },
    { loja: 'auraprivee' },
    { loja: 'aura-privee' }
  ];
}

export default function TenantClientePage() {
  return <CustomerVIPDashboard />;
}

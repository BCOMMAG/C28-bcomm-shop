import type { Metadata } from 'next';
import './globals.css';
import { StoreProvider } from '@/context/StoreContext';
import { BottomCartBar } from '@/components/BottomCartBar';
import { BackgroundVideo } from '@/components/BackgroundVideo';
import { StorePreloader } from '@/components/StorePreloader';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://leidyboutique.pages.dev';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Leidy Boutique | Elegância & Sofisticação em Cada Detalhe',
  description: 'Descubra a coleção exclusiva de alfaiataria, tricots nobres e conjuntos em cetim da Leidy Boutique. Atendimento personalizado e peças selecionadas a dedo.',
  keywords: 'Leidy Boutique, moda feminina, alfaiataria feminina, tricot Biamar, conjunto cetim, boutique feminina',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/favicon-apple-touch-icon180x180.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'android-chrome-192x192', url: '/favicon-android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { rel: 'android-chrome-512x512', url: '/favicon-android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
  openGraph: {
    title: 'Leidy Boutique | Elegância & Sofisticação',
    description: 'A sofisticação do provador ao seu guarda-roupa. Peças de alto padrão com atendimento VIP.',
    url: siteUrl,
    siteName: 'Leidy Boutique',
    locale: 'pt_BR',
    type: 'website',
    images: [
      {
        url: '/og-image_optimized_300.jpg',
        width: 1200,
        height: 630,
        alt: 'Leidy Boutique | Coleção Exclusiva',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Leidy Boutique | Elegância & Sofisticação',
    description: 'Descubra a coleção exclusiva de alfaiataria, tricots nobres e conjuntos em cetim da Leidy Boutique.',
    images: ['/og-image_optimized_300.jpg'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/favicon-apple-touch-icon180x180.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Cormorant+Garamond:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=Montserrat:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Poppins:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased text-[#1A1918] dark:text-[#FAF8F5] selection:bg-[#C5A059]/20 selection:text-[#1A1918] dark:selection:text-[#FAF8F5] transition-colors duration-300 relative overflow-x-hidden min-h-screen w-full max-w-full">
        <StoreProvider>
          <StorePreloader />
          <BackgroundVideo />
          {children}
          <BottomCartBar />
        </StoreProvider>
      </body>
    </html>
  );
}

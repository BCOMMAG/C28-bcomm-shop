'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Product, CartItem } from '@/types';
import { PRODUCTS } from '@/data/products';
import { getStoreProducts } from '@/lib/products';
import { ViaCepResponse } from '@/utils/shipping';
import { Loja, BarraAvisoEstilo } from '@/types/database';
import { getTenantBySlug, getTenantByHost, DEFAULT_LEIDY_TENANT } from '@/lib/tenant';
import { AdminHeroBanner, getAdminHeroBanners } from '@/lib/admin';
import { normalizeTenantSlug } from '@/lib/routes';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { getActiveReservations, ReservaEstoque } from '@/lib/reservas';

export interface VariationAvailability {
  status: 'disponivel' | 'em_reserva' | 'esgotado';
  estoqueFisico: number;
  estoqueDisponivel: number;
  reservedCount: number;
  isReserved: boolean;
}

interface StoreContextType {
  currentTenant: Loja;
  heroBanner: AdminHeroBanner | null;
  heroBanners: AdminHeroBanner[];
  announcementBar: {
    text: string;
    active: boolean;
    estilo?: BarraAvisoEstilo;
  };
  products: Product[];
  isLoadingProducts: boolean;
  refreshProducts: () => Promise<void>;
  getProductById: (id: string) => Product | undefined;
  cartItems: CartItem[];
  wishlistIds: string[];
  isCartOpen: boolean;
  selectedProduct: Product | null;
  isProductModalOpen: boolean;
  isSizeGuideOpen: boolean;
  cartCount: number;
  wishlistCount: number;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  recentlyViewedIds: string[];
  recentlyViewedProducts: Product[];
  addToRecentlyViewed: (productId: string) => void;
  clearRecentlyViewed: () => void;
  savedCep: string;
  savedAddress: ViaCepResponse | null;
  setSavedAddressInfo: (cep: string, address: ViaCepResponse | null) => void;
  activeReservations: ReservaEstoque[];
  refreshReservations: () => Promise<void>;
  notifyStockChangeCrossTab: () => void;
  getItemStock: (productId: string, size: string, color: string) => number;
  getVariationAvailability: (productId: string, color: string, size: string) => VariationAvailability;
  getColorAvailability: (productId: string, color: string) => 'disponivel' | 'em_reserva' | 'esgotado';
  addToCart: (params: {
    product: Product;
    size: string;
    color: string;
    quantity: number;
    openDrawer?: boolean;
  }) => void;
  updateCartQuantity: (id: string, delta: number) => void;
  removeFromCart: (id: string) => void;
  toggleWishlist: (productId: string) => void;
  isWishlisted: (productId: string) => boolean;
  clearCart: () => void;
  isSideDrawerOpen: boolean;
  openSideDrawer: () => void;
  closeSideDrawer: () => void;
  openProduct: (product: Product) => void;
  closeProduct: () => void;
  closeProductSilently: () => void;
  openCart: () => void;
  closeCart: () => void;
  closeCartSilently: () => void;
  openSizeGuide: () => void;
  closeSizeGuide: () => void;
  // Funcionalidade de Embalagem para Presente
  isGift: boolean;
  setIsGift: (val: boolean) => void;
  giftMessage: string;
  setGiftMessage: (msg: string) => void;
  giftFee: number;
  isGiftServiceActive: boolean;
  allowGiftMessage: boolean;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

/**
 * Emite notificação de sincronização instantânea entre abas no mesmo navegador.
 */
export const notifyStockChangeCrossTab = () => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('bcomm_stock_sync_tick', Date.now().toString());
    if ('BroadcastChannel' in window) {
      const bc = new BroadcastChannel('bcomm_stock_sync');
      bc.postMessage({ type: 'reservation_change', timestamp: Date.now() });
      setTimeout(() => bc.close(), 100);
    }
  } catch {}
};

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Inicialização instantânea via cache local (SWR) para eliminar delay visual / FOUC no F5
  const [currentTenant, setCurrentTenant] = useState<Loja>(() => {
    if (typeof window !== 'undefined') {
      try {
        const pathSegments = window.location.pathname.split('/').filter(Boolean);
        const firstSegment = pathSegments[0] || 'leidy-boutique';
        const cached =
          localStorage.getItem(`bcomm_tenant_${firstSegment}`) ||
          localStorage.getItem('bcomm_tenant_last');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.id) return parsed;
        }
      } catch {}
    }
    return DEFAULT_LEIDY_TENANT;
  });
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [recentlyViewedIds, setRecentlyViewedIds] = useState<string[]>([]);
  const [savedCep, setSavedCep] = useState<string>('');
  const [savedAddress, setSavedAddress] = useState<ViaCepResponse | null>(null);
  const [isSideDrawerOpen, setIsSideDrawerOpen] = useState(false);
  const [heroBanner, setHeroBanner] = useState<AdminHeroBanner | null>(null);
  const [heroBanners, setHeroBanners] = useState<AdminHeroBanner[]>([]);

  // Estados de Embalagem para Presente
  const [isGift, setIsGift] = useState<boolean>(false);
  const [giftMessage, setGiftMessage] = useState<string>('');

  // Configurações dinâmicas de presente do banco de dados
  const { giftFee, isGiftServiceActive, allowGiftMessage } = useMemo(() => {
    const vis = currentTenant?.configuracoes_visuais as any;
    const fee = Number(vis?.taxa_presente ?? 12.00);
    const active = vis?.presente_ativo !== undefined ? Boolean(vis.presente_ativo) : true;
    const allowMsg = vis?.permitir_mensagem_presente !== undefined ? Boolean(vis.permitir_mensagem_presente) : true;
    return { giftFee: fee, isGiftServiceActive: active, allowGiftMessage: allowMsg };
  }, [currentTenant]);

  // Barra de avisos superior sincronizada com o banco
  const announcementBar = useMemo(() => {
    const vis = currentTenant?.configuracoes_visuais as any;
    const text = vis?.barra_aviso || 'Frete Grátis para todo o Brasil em compras acima de R$ 350 | Atendimento VIP via WhatsApp';
    const active = vis?.barra_aviso_ativa !== undefined ? Boolean(vis.barra_aviso_ativa) : true;
    const estilo: BarraAvisoEstilo | undefined = vis?.barra_aviso_estilo;
    return { text, active, estilo };
  }, [currentTenant]);

  // Reservas de estoque ativas e pausadas sincronizadas com o banco
  const [activeReservations, setActiveReservations] = useState<ReservaEstoque[]>([]);

  const refreshReservations = async () => {
    const tenantId = currentTenant?.id || DEFAULT_LEIDY_TENANT.id;
    if (!tenantId) return;
    try {
      const res = await getActiveReservations(tenantId);
      setActiveReservations(res || []);
    } catch (e) {
      console.warn('Erro ao carregar reservas ativas na vitrine:', e);
    }
  };

  // Carrega produtos dinâmicos e hero banner do Supabase na inicialização com suporte a rotas limpas /:slug/ e ?loja=slug
  const refreshProducts = async () => {
    setIsLoadingProducts(true);
    try {
      let tenant = DEFAULT_LEIDY_TENANT;
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const slugParam = urlParams.get('loja');
        const pathSegments = window.location.pathname.split('/').filter(Boolean);
        const firstSegment = pathSegments[0];
        const knownRoutes = ['admin', 'super-admin', 'catalogo', 'checkout', 'favoritos', 'minha-conta', 'cliente'];

        if (slugParam) {
          tenant = await getTenantBySlug(slugParam);
          // Transição suave para a rota limpa sem query param feio
          try {
            const canonicalSlug = normalizeTenantSlug(slugParam);
            const cleanPath = window.location.pathname === '/' 
              ? `/${canonicalSlug}/` 
              : window.location.pathname;
            window.history.replaceState({}, '', cleanPath);
          } catch (e) {
            console.warn('Erro ao atualizar URL limpa:', e);
          }
        } else if (firstSegment && !knownRoutes.includes(firstSegment)) {
          tenant = await getTenantBySlug(firstSegment);
        } else {
          tenant = await getTenantByHost(window.location.hostname);
        }
        setCurrentTenant(tenant);
        if (typeof window !== 'undefined' && tenant) {
          try {
            localStorage.setItem(`bcomm_tenant_${tenant.slug}`, JSON.stringify(tenant));
            localStorage.setItem('bcomm_tenant_last', JSON.stringify(tenant));
          } catch {}
        }
      }
      const [dynamicProds, heroBanners] = await Promise.all([
        getStoreProducts(tenant.id),
        getAdminHeroBanners(tenant.id)
      ]);
      if (dynamicProds && dynamicProds.length > 0) {
        setProducts(dynamicProds);
      }
      if (heroBanners && heroBanners.length > 0) {
        const activeList = heroBanners.filter((b) => b.ativo);
        const resolvedList = activeList.length > 0 ? activeList : [heroBanners[0]];
        setHeroBanners(resolvedList);
        setHeroBanner(resolvedList[0]);
      }
    } catch (err) {
      console.error('Falha ao carregar produtos e banners dinâmicos:', err);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  useEffect(() => {
    refreshProducts();
    refreshReservations();

    const handleUpdate = () => {
      refreshProducts();
      refreshReservations();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('bcomm:tenant_updated', handleUpdate);
      window.addEventListener('bcomm:banners_updated', handleUpdate);
      return () => {
        window.removeEventListener('bcomm:tenant_updated', handleUpdate);
        window.removeEventListener('bcomm:banners_updated', handleUpdate);
      };
    }
  }, [currentTenant?.id]);

  // Sincronização em Tempo Real (Tripla Camada: Supabase WebSocket + Cross-Tab Sync + Heartbeat)
  useEffect(() => {
    if (!currentTenant?.id) return;

    const supabase = getSupabaseBrowserClient();
    const channelName = `store-stock-sync-${currentTenant.id}`;

    // Camada 1: Supabase Realtime WebSocket sem filtros restritivos (para capturar INSERT, UPDATE e DELETE sem perdas)
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'variacoes_produto'
        },
        () => {
          refreshProducts();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'produtos'
        },
        () => {
          refreshProducts();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reservas_estoque'
        },
        (payload: any) => {
          if (payload.eventType === 'DELETE' && payload.old?.id) {
            setActiveReservations((prev) => prev.filter((r) => r.id !== payload.old.id));
          } else if (payload.eventType === 'INSERT' && payload.new?.id) {
            setActiveReservations((prev) => [payload.new, ...prev.filter((r) => r.id !== payload.new.id)]);
          } else if (payload.eventType === 'UPDATE' && payload.new?.id) {
            setActiveReservations((prev) =>
              prev.map((r) => (r.id === payload.new.id ? { ...r, ...payload.new } : r))
            );
          }
          refreshReservations();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`📡 [Realtime] Canal ${channelName} conectado com sucesso!`);
        }
      });

    // Camada 2: Sincronização Instantânea Entre Abas (Cross-Tab via BroadcastChannel e localStorage)
    let bc: BroadcastChannel | null = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        bc = new BroadcastChannel('bcomm_stock_sync');
        bc.onmessage = (event) => {
          if (event.data?.type === 'reservation_change' || event.data === 'sync') {
            refreshReservations();
            refreshProducts();
          }
        };
      }
    } catch {}

    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === 'bcomm_stock_sync_tick') {
        refreshReservations();
        refreshProducts();
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageEvent);
    }

    // Camada 3: Pulso Leve de Heartbeat (a cada 8 segundos) e revalidação ao focar aba
    const heartbeatTimer = setInterval(() => {
      refreshReservations();
    }, 8000);

    const handleVisibilityChange = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        refreshProducts();
        refreshReservations();
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    return () => {
      supabase.removeChannel(channel);
      clearInterval(heartbeatTimer);
      if (bc) {
        try { bc.close(); } catch {}
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', handleStorageEvent);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    };
  }, [currentTenant?.id]);

  const getProductById = (id: string) => {
    return products.find((p) => p.id === id) || PRODUCTS.find((p) => p.id === id);
  };

  const openSideDrawer = () => setIsSideDrawerOpen(true);
  const closeSideDrawer = () => setIsSideDrawerOpen(false);

  const clearCart = () => {
    setCartItems([]);
    setIsGift(false);
    setGiftMessage('');
    try {
      const tenantKey = normalizeTenantSlug(currentTenant.slug) || 'leidyboutique';
      localStorage.removeItem(`bcomm_cart_${tenantKey}`);
      localStorage.removeItem(`bcomm_gift_${tenantKey}`);
      localStorage.removeItem(`bcomm_gift_msg_${tenantKey}`);
    } catch (e) {
      console.error(e);
    }
  };

  // Carregar dados exclusivos do tenant atual sempre que o tenant for inicializado ou alterado
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const tenantKey = normalizeTenantSlug(currentTenant.slug) || 'leidyboutique';
      const savedWishlist = localStorage.getItem(`bcomm_wishlist_${tenantKey}`);
      setWishlistIds(savedWishlist ? JSON.parse(savedWishlist) : []);

      const savedCart = localStorage.getItem(`bcomm_cart_${tenantKey}`);
      setCartItems(savedCart ? JSON.parse(savedCart) : []);

      const savedGift = localStorage.getItem(`bcomm_gift_${tenantKey}`);
      if (savedGift) setIsGift(JSON.parse(savedGift));

      const savedGiftMsg = localStorage.getItem(`bcomm_gift_msg_${tenantKey}`);
      if (savedGiftMsg) setGiftMessage(savedGiftMsg);

      const savedRecent = localStorage.getItem(`bcomm_recent_${tenantKey}`);
      setRecentlyViewedIds(savedRecent ? JSON.parse(savedRecent) : []);

      const savedCepStorage = localStorage.getItem(`bcomm_saved_cep_${tenantKey}`);
      setSavedCep(savedCepStorage || '');

      const savedAddressStorage = localStorage.getItem(`bcomm_saved_address_${tenantKey}`);
      setSavedAddress(savedAddressStorage ? JSON.parse(savedAddressStorage) : null);

      const savedTheme = localStorage.getItem('bcomm_theme') as 'light' | 'dark' | null;
      if (savedTheme) {
        setTheme(savedTheme);
        if (savedTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setTheme('dark');
        document.documentElement.classList.add('dark');
      }
    } catch (e) {
      console.error(e);
    }
  }, [currentTenant.id, currentTenant.slug]);

  // Sincronização reativa de Favicon da Aba, OG Image e Metatags Sociais
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const vis = currentTenant?.configuracoes_visuais as any;
    if (!vis) return;

    // 1. Atualizar Favicon se houver URL personalizada no Cloudflare R2
    if (vis.favicon_url) {
      const existingIcons = document.querySelectorAll<HTMLLinkElement>("link[rel*='icon']");
      if (existingIcons.length > 0) {
        existingIcons.forEach((el) => {
          el.href = vis.favicon_url;
        });
      } else {
        const link = document.createElement('link');
        link.rel = 'icon';
        link.href = vis.favicon_url;
        document.head.appendChild(link);
      }
    }

    // 2. Atualizar OG Image se houver URL personalizada
    if (vis.og_image_url) {
      let ogMeta = document.querySelector<HTMLMetaElement>("meta[property='og:image']");
      if (!ogMeta) {
        ogMeta = document.createElement('meta');
        ogMeta.setAttribute('property', 'og:image');
        document.head.appendChild(ogMeta);
      }
      ogMeta.content = vis.og_image_url;

      let twitterMeta = document.querySelector<HTMLMetaElement>("meta[name='twitter:image']");
      if (!twitterMeta) {
        twitterMeta = document.createElement('meta');
        twitterMeta.setAttribute('name', 'twitter:image');
        document.head.appendChild(twitterMeta);
      }
      twitterMeta.content = vis.og_image_url;
    }

    // 3. Atualizar Slogan / Descrição
    if (vis.slogan) {
      let ogDesc = document.querySelector<HTMLMetaElement>("meta[property='og:description']");
      if (ogDesc) ogDesc.content = vis.slogan;
      let desc = document.querySelector<HTMLMetaElement>("meta[name='description']");
      if (desc) desc.content = vis.slogan;
    }
  }, [currentTenant]);

  const toggleTheme = () => {
    setTheme((prev) => {
      const nextTheme = prev === 'light' ? 'dark' : 'light';
      if (nextTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      try {
        localStorage.setItem('bcomm_theme', nextTheme);
      } catch (e) {
        console.error(e);
      }
      return nextTheme;
    });
  };

  // Salvar favoritos no localStorage para a loja atual
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const tenantKey = normalizeTenantSlug(currentTenant.slug) || 'leidyboutique';
      localStorage.setItem(`bcomm_wishlist_${tenantKey}`, JSON.stringify(wishlistIds));
    } catch (e) {
      console.error(e);
    }
  }, [wishlistIds, currentTenant.slug]);

  // Salvar carrinho e opções de presente no localStorage para a loja atual
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const tenantKey = normalizeTenantSlug(currentTenant.slug) || 'leidyboutique';
      localStorage.setItem(`bcomm_cart_${tenantKey}`, JSON.stringify(cartItems));
      localStorage.setItem(`bcomm_gift_${tenantKey}`, JSON.stringify(isGift));
      localStorage.setItem(`bcomm_gift_msg_${tenantKey}`, giftMessage);
    } catch (e) {
      console.error(e);
    }
  }, [cartItems, isGift, giftMessage, currentTenant.slug]);

  // Avaliação detalhada de disponibilidade de uma combinação específica (Produto + Cor + Tamanho)
  const getVariationAvailability = useCallback(
    (productId: string, color: string, size: string): VariationAvailability => {
      const prod = products.find((p) => p.id === productId) || PRODUCTS.find((p) => p.id === productId);
      if (!prod) {
        return {
          status: 'disponivel',
          estoqueFisico: 99,
          estoqueDisponivel: 99,
          reservedCount: 0,
          isReserved: false
        };
      }

      let estoqueFisico = 0;
      let variacaoId: string | undefined = undefined;

      const cleanColor = (color || '').trim().toLowerCase();
      const cleanSize = (size || '').trim().toLowerCase();

      if (prod.variations && prod.variations.length > 0) {
        const v = prod.variations.find(
          (item) =>
            item.color.trim().toLowerCase() === cleanColor &&
            item.size.trim().toLowerCase() === cleanSize
        );
        if (v !== undefined) {
          estoqueFisico = Number(v.stock ?? 0);
          variacaoId = (v as any).id;
        }
      } else if (prod.totalStock !== undefined) {
        estoqueFisico = Number(prod.totalStock);
      } else {
        estoqueFisico = Number(prod.remainingPieces ?? 10);
      }

      // Desconta reservas ativas e reservas pausadas (congeladas)
      let reservedCount = 0;
      if (activeReservations && activeReservations.length > 0) {
        activeReservations.forEach((res) => {
          const isTargetRes = res.status === 'ativa' || res.status === 'pausada';
          if (!isTargetRes) return;

          const matchVar = variacaoId && res.variacao_id ? res.variacao_id === variacaoId : false;
          const matchProd =
            res.produto_id === prod.id &&
            (res.cor || '').trim().toLowerCase() === cleanColor &&
            (res.tamanho || '').trim().toLowerCase() === cleanSize;

          if (matchVar || matchProd) {
            reservedCount += Number(res.quantidade || 1);
          }
        });
      }

      const estoqueDisponivel = Math.max(0, estoqueFisico - reservedCount);
      const isReserved = estoqueFisico > 0 && estoqueDisponivel <= 0;

      let status: 'disponivel' | 'em_reserva' | 'esgotado' = 'disponivel';
      if (estoqueDisponivel > 0) {
        status = 'disponivel';
      } else if (isReserved) {
        status = 'em_reserva';
      } else {
        status = 'esgotado';
      }

      return {
        status,
        estoqueFisico,
        estoqueDisponivel,
        reservedCount,
        isReserved
      };
    },
    [products, activeReservations]
  );

  // Avaliação do status agregado de uma Cor (analisando todos os tamanhos daquela cor)
  const getColorAvailability = useCallback(
    (productId: string, colorName: string): 'disponivel' | 'em_reserva' | 'esgotado' => {
      const prod = products.find((p) => p.id === productId) || PRODUCTS.find((p) => p.id === productId);
      if (!prod) return 'disponivel';

      const sizes = prod.sizes && prod.sizes.length > 0 ? prod.sizes : ['Tamanho Único'];
      const availabilities = sizes.map((size) => getVariationAvailability(productId, colorName, size));

      // Se pelo menos um tamanho tiver estoque líquido > 0, a cor está disponível
      const hasAvailable = availabilities.some((a) => a.status === 'disponivel');
      if (hasAvailable) return 'disponivel';

      // Se não tem disponível, mas pelo menos um tamanho tem peça em reserva (físico > 0)
      const hasReserved = availabilities.some((a) => a.status === 'em_reserva');
      if (hasReserved) return 'em_reserva';

      // Caso contrário, está esgotada no estoque físico
      return 'esgotado';
    },
    [products, getVariationAvailability]
  );

  // Consulta do estoque líquido disponível de uma variante específica (descontando reservas ativas/pausadas)
  const getItemStock = useCallback(
    (productId: string, size: string, color: string): number => {
      const availability = getVariationAvailability(productId, color, size);
      return availability.estoqueDisponivel;
    },
    [getVariationAvailability]
  );

  // Revalidação Silenciosa da Sacola quando o catálogo/estoque ou reservas são atualizados
  useEffect(() => {
    if (!products || products.length === 0) return;
    setCartItems((prev) => {
      let changed = false;
      const updated = prev
        .map((item) => {
          const availableStock = getItemStock(item.productId, item.size, item.color);
          if (availableStock <= 0) {
            changed = true;
            return null; // Peça esgotou ou entrou em reserva
          }
          if (item.quantity > availableStock) {
            changed = true;
            return { ...item, quantity: availableStock, maxStock: availableStock };
          }
          if (item.maxStock !== availableStock) {
            changed = true;
            return { ...item, maxStock: availableStock };
          }
          return item;
        })
        .filter(Boolean) as CartItem[];

      return changed ? updated : prev;
    });
  }, [products, activeReservations]);

  const addToCart = ({
    product,
    size,
    color,
    quantity,
    openDrawer = false
  }: {
    product: Product;
    size: string;
    color: string;
    quantity: number;
    openDrawer?: boolean;
  }) => {
    const itemKey = `${product.id}-${size}-${color}`;
    const maxStock = getItemStock(product.id, size, color);
    if (maxStock <= 0) {
      return;
    }

    setCartItems((prev) => {
      const existing = prev.find((i) => i.id === itemKey);
      if (existing) {
        const currentQty = existing.quantity;
        const finalQty = Math.min(maxStock, currentQty + quantity);
        return prev.map((i) =>
          i.id === itemKey ? { ...i, quantity: finalQty, maxStock } : i
        );
      }
      const initialQty = Math.min(maxStock, quantity);
      return [
        ...prev,
        {
          id: itemKey,
          productId: product.id,
          name: product.name,
          price: product.price,
          image: product.thumbnail,
          size,
          color,
          quantity: initialQty,
          maxStock
        }
      ];
    });
    if (openDrawer) {
      openCart();
    }
  };

  const updateCartQuantity = (id: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const maxStock = getItemStock(item.productId, item.size, item.color);
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            const clampedQty = Math.min(maxStock, newQty);
            return { ...item, quantity: clampedQty, maxStock };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const toggleWishlist = (productId: string) => {
    setWishlistIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const isWishlisted = (productId: string) => wishlistIds.includes(productId);

  const addToRecentlyViewed = (productId: string) => {
    setRecentlyViewedIds((prev) => {
      const updated = [productId, ...prev.filter((id) => id !== productId)].slice(0, 8);
      try {
        localStorage.setItem('leidy_recently_viewed', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  const clearRecentlyViewed = () => {
    setRecentlyViewedIds([]);
    try {
      localStorage.removeItem('leidy_recently_viewed');
    } catch (e) {
      console.error(e);
    }
  };

  const setSavedAddressInfo = (cep: string, address: ViaCepResponse | null) => {
    setSavedCep(cep);
    setSavedAddress(address);
    try {
      if (cep) localStorage.setItem('leidy_saved_cep', cep);
      else localStorage.removeItem('leidy_saved_cep');
      if (address) localStorage.setItem('leidy_saved_address', JSON.stringify(address));
      else localStorage.removeItem('leidy_saved_address');
    } catch (e) {
      console.error(e);
    }
  };

  const recentlyViewedProducts = useMemo(() => {
    return recentlyViewedIds
      .map((id) => products.find((p) => p.id === id) || PRODUCTS.find((p) => p.id === id))
      .filter(Boolean) as Product[];
  }, [recentlyViewedIds, products]);

  const openProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsProductModalOpen(true);
    addToRecentlyViewed(product.id);
  };

  const closeProduct = () => {
    setIsProductModalOpen(false);
  };

  const closeProductSilently = () => {
    setIsProductModalOpen(false);
  };

  const openCart = () => {
    setIsCartOpen(true);
  };

  const closeCart = () => {
    setIsCartOpen(false);
  };

  const closeCartSilently = () => {
    setIsCartOpen(false);
  };

  const openSizeGuide = () => setIsSizeGuideOpen(true);
  const closeSizeGuide = () => setIsSizeGuideOpen(false);

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const wishlistCount = wishlistIds.length;

  return (
    <StoreContext.Provider
      value={{
        currentTenant,
        heroBanner,
        heroBanners,
        announcementBar,
        products,
        isLoadingProducts,
        refreshProducts,
        getProductById,
        cartItems,
        wishlistIds,
        isCartOpen,
        selectedProduct,
        isProductModalOpen,
        isSizeGuideOpen,
        cartCount,
        wishlistCount,
        theme,
        toggleTheme,
        searchQuery,
        setSearchQuery,
        recentlyViewedIds,
        recentlyViewedProducts,
        addToRecentlyViewed,
        clearRecentlyViewed,
        savedCep,
        savedAddress,
        setSavedAddressInfo,
        activeReservations,
        refreshReservations,
        notifyStockChangeCrossTab,
        getItemStock,
        getVariationAvailability,
        getColorAvailability,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        toggleWishlist,
        isWishlisted,
        clearCart,
        isSideDrawerOpen,
        openSideDrawer,
        closeSideDrawer,
        openProduct,
        closeProduct,
        closeProductSilently,
        openCart,
        closeCart,
        closeCartSilently,
        openSizeGuide,
        closeSizeGuide,
        // Funcionalidade de Embalagem para Presente
        isGift,
        setIsGift,
        giftMessage,
        setGiftMessage,
        giftFee,
        isGiftServiceActive,
        allowGiftMessage
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};

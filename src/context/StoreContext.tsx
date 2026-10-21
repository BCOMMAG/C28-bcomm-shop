'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
import { Product, CartItem } from '@/types';
import { PRODUCTS } from '@/data/products';
import { getStoreProducts } from '@/lib/products';
import { ViaCepResponse } from '@/utils/shipping';
import { Loja, BarraAvisoEstilo } from '@/types/database';
import { getTenantBySlug, getTenantByHost, DEFAULT_LEIDY_TENANT } from '@/lib/tenant';
import { AdminHeroBanner, getAdminHeroBanners } from '@/lib/admin';
import { normalizeTenantSlug } from '@/lib/routes';

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

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTenant, setCurrentTenant] = useState<Loja>(DEFAULT_LEIDY_TENANT);
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

    const handleUpdate = () => {
      refreshProducts();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('bcomm:tenant_updated', handleUpdate);
      window.addEventListener('bcomm:banners_updated', handleUpdate);
      return () => {
        window.removeEventListener('bcomm:tenant_updated', handleUpdate);
        window.removeEventListener('bcomm:banners_updated', handleUpdate);
      };
    }
  }, []);

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
    setCartItems((prev) => {
      const existing = prev.find((i) => i.id === itemKey);
      if (existing) {
        return prev.map((i) =>
          i.id === itemKey ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
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
          quantity
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
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
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

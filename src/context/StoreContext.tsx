'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
import { Product, CartItem } from '@/types';
import { PRODUCTS } from '@/data/products';
import { ViaCepResponse } from '@/utils/shipping';

interface StoreContextType {
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
  openCart: () => void;
  closeCart: () => void;
  openSizeGuide: () => void;
  closeSizeGuide: () => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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

  const openSideDrawer = () => setIsSideDrawerOpen(true);
  const closeSideDrawer = () => setIsSideDrawerOpen(false);

  const clearCart = () => {
    setCartItems([]);
    try {
      localStorage.removeItem('leidy_cart');
    } catch (e) {
      console.error(e);
    }
  };

  // Carregar dados e tema do localStorage na montagem
  useEffect(() => {
    try {
      const savedWishlist = localStorage.getItem('leidy_wishlist');
      if (savedWishlist) {
        setWishlistIds(JSON.parse(savedWishlist));
      }
      const savedCart = localStorage.getItem('leidy_cart');
      if (savedCart) {
        setCartItems(JSON.parse(savedCart));
      }
      const savedRecent = localStorage.getItem('leidy_recently_viewed');
      if (savedRecent) {
        setRecentlyViewedIds(JSON.parse(savedRecent));
      }
      const savedCepStorage = localStorage.getItem('leidy_saved_cep');
      if (savedCepStorage) {
        setSavedCep(savedCepStorage);
      }
      const savedAddressStorage = localStorage.getItem('leidy_saved_address');
      if (savedAddressStorage) {
        setSavedAddress(JSON.parse(savedAddressStorage));
      }
      const savedTheme = localStorage.getItem('leidy_theme') as 'light' | 'dark' | null;
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
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => {
      const nextTheme = prev === 'light' ? 'dark' : 'light';
      if (nextTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      try {
        localStorage.setItem('leidy_theme', nextTheme);
      } catch (e) {
        console.error(e);
      }
      return nextTheme;
    });
  };

  // Salvar favoritos no localStorage
  useEffect(() => {
    try {
      localStorage.setItem('leidy_wishlist', JSON.stringify(wishlistIds));
    } catch (e) {
      console.error(e);
    }
  }, [wishlistIds]);

  // Salvar carrinho no localStorage
  useEffect(() => {
    try {
      localStorage.setItem('leidy_cart', JSON.stringify(cartItems));
    } catch (e) {
      console.error(e);
    }
  }, [cartItems]);

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

  // Controle de histórico do navegador/mobile para fechar o modal ou sacola com o botão "Voltar" do celular
  const productModalHistoryPushedRef = useRef(false);
  const cartDrawerHistoryPushedRef = useRef(false);

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
      .map((id) => PRODUCTS.find((p) => p.id === id))
      .filter(Boolean) as Product[];
  }, [recentlyViewedIds]);

  const openProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsProductModalOpen(true);
    addToRecentlyViewed(product.id);

    if (typeof window !== 'undefined') {
      try {
        window.history.pushState(
          { leidyModal: 'product', productId: product.id },
          '',
          window.location.href
        );
        productModalHistoryPushedRef.current = true;
      } catch (e) {
        console.error(e);
      }
    }
  };

  const closeProduct = () => {
    setIsProductModalOpen(false);
    if (typeof window !== 'undefined' && productModalHistoryPushedRef.current) {
      productModalHistoryPushedRef.current = false;
      window.history.back();
    }
  };

  const openCart = () => {
    setIsCartOpen(true);
    if (typeof window !== 'undefined' && !cartDrawerHistoryPushedRef.current) {
      try {
        window.history.pushState(
          { leidyModal: 'cart' },
          '',
          window.location.href
        );
        cartDrawerHistoryPushedRef.current = true;
      } catch (e) {
        console.error(e);
      }
    }
  };

  const closeCart = () => {
    setIsCartOpen(false);
    if (typeof window !== 'undefined' && cartDrawerHistoryPushedRef.current) {
      cartDrawerHistoryPushedRef.current = false;
      window.history.back();
    }
  };

  // Interceptador do evento popstate (botão voltar do celular ou navegador)
  useEffect(() => {
    const handlePopState = () => {
      if (cartDrawerHistoryPushedRef.current) {
        cartDrawerHistoryPushedRef.current = false;
        setIsCartOpen(false);
      }
      if (productModalHistoryPushedRef.current) {
        productModalHistoryPushedRef.current = false;
        setIsProductModalOpen(false);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const openSizeGuide = () => setIsSizeGuideOpen(true);
  const closeSizeGuide = () => setIsSizeGuideOpen(false);

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const wishlistCount = wishlistIds.length;

  return (
    <StoreContext.Provider
      value={{
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
        openCart,
        closeCart,
        openSizeGuide,
        closeSizeGuide
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

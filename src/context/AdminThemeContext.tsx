'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type AdminPaletteKey =
  | 'midnight-gold'
  | 'obsidian-minimal'
  | 'emerald-prestige'
  | 'royal-sapphire'
  | 'bordeaux-rose'
  | 'clean-light';

export interface AdminPaletteConfig {
  id: AdminPaletteKey;
  name: string;
  category: string;
  description: string;
  isDarkSidebar: boolean;
  colors: {
    sidebarBg: string;
    sidebarHover: string;
    sidebarActive: string;
    sidebarActiveBorder: string;
    sidebarText: string;
    sidebarTextActive: string;
    sidebarMuted: string;
    sidebarBorder: string;
    primary: string;
    primaryHover: string;
    primaryText: string;
    accent: string;
    accentSoft: string;
    badgeBg: string;
    badgeText: string;
    ring: string;
  };
  preview: {
    swatchSidebar: string;
    swatchAccent: string;
    swatchBg: string;
  };
}

export const ADMIN_PALETTES: Record<AdminPaletteKey, AdminPaletteConfig> = {
  'midnight-gold': {
    id: 'midnight-gold',
    name: 'Midnight Luxury',
    category: 'Alta Costura & Dourado',
    description: 'Sidebar grafite executivo com toques quentes em dourado e âmbar.',
    isDarkSidebar: true,
    colors: {
      sidebarBg: '#0B132B',
      sidebarHover: '#162244',
      sidebarActive: '#1C2D5A',
      sidebarActiveBorder: '#F59E0B',
      sidebarText: '#94A3B8',
      sidebarTextActive: '#FFFFFF',
      sidebarMuted: '#64748B',
      sidebarBorder: '#1E293B',
      primary: '#B45309',
      primaryHover: '#92400E',
      primaryText: '#FFFFFF',
      accent: '#F59E0B',
      accentSoft: '#FEF3C7',
      badgeBg: '#FEF3C7',
      badgeText: '#92400E',
      ring: '#F59E0B'
    },
    preview: {
      swatchSidebar: '#0B132B',
      swatchAccent: '#F59E0B',
      swatchBg: '#F8FAFC'
    }
  },
  'obsidian-minimal': {
    id: 'obsidian-minimal',
    name: 'Obsidian Minimal',
    category: 'Preto & Grafite Puro',
    description: 'Estética monocromática suíça com contrastes cirúrgicos e neutros.',
    isDarkSidebar: true,
    colors: {
      sidebarBg: '#09090B',
      sidebarHover: '#18181B',
      sidebarActive: '#27272A',
      sidebarActiveBorder: '#FFFFFF',
      sidebarText: '#A1A1AA',
      sidebarTextActive: '#FAFAFA',
      sidebarMuted: '#71717A',
      sidebarBorder: '#27272A',
      primary: '#18181B',
      primaryHover: '#09090B',
      primaryText: '#FFFFFF',
      accent: '#71717A',
      accentSoft: '#F4F4F5',
      badgeBg: '#F4F4F5',
      badgeText: '#18181B',
      ring: '#71717A'
    },
    preview: {
      swatchSidebar: '#09090B',
      swatchAccent: '#FFFFFF',
      swatchBg: '#F8FAFC'
    }
  },
  'emerald-prestige': {
    id: 'emerald-prestige',
    name: 'Emerald Prestige',
    category: 'Verde Esmeralda Nobre',
    description: 'Tons floresta escuros e esmeralda polida, transmitindo solidez e prosperidade.',
    isDarkSidebar: true,
    colors: {
      sidebarBg: '#022C22',
      sidebarHover: '#064E3B',
      sidebarActive: '#065F46',
      sidebarActiveBorder: '#10B981',
      sidebarText: '#A7F3D0',
      sidebarTextActive: '#FFFFFF',
      sidebarMuted: '#6EE7B7',
      sidebarBorder: '#064E3B',
      primary: '#059669',
      primaryHover: '#047857',
      primaryText: '#FFFFFF',
      accent: '#10B981',
      accentSoft: '#D1FAE5',
      badgeBg: '#ECFDF5',
      badgeText: '#065F46',
      ring: '#10B981'
    },
    preview: {
      swatchSidebar: '#022C22',
      swatchAccent: '#10B981',
      swatchBg: '#F8FAFC'
    }
  },
  'royal-sapphire': {
    id: 'royal-sapphire',
    name: 'Royal Sapphire',
    category: 'Azul Executivo Fintech',
    description: 'Azul marinho internacional e safira vibrante com atmosfera corporativa moderna.',
    isDarkSidebar: true,
    colors: {
      sidebarBg: '#0F172A',
      sidebarHover: '#1E293B',
      sidebarActive: '#1E3A8A',
      sidebarActiveBorder: '#3B82F6',
      sidebarText: '#94A3B8',
      sidebarTextActive: '#FFFFFF',
      sidebarMuted: '#64748B',
      sidebarBorder: '#1E293B',
      primary: '#2563EB',
      primaryHover: '#1D4ED8',
      primaryText: '#FFFFFF',
      accent: '#3B82F6',
      accentSoft: '#DBEAFE',
      badgeBg: '#EFF6FF',
      badgeText: '#1E40AF',
      ring: '#3B82F6'
    },
    preview: {
      swatchSidebar: '#0F172A',
      swatchAccent: '#3B82F6',
      swatchBg: '#F8FAFC'
    }
  },
  'bordeaux-rose': {
    id: 'bordeaux-rose',
    name: 'Bordeaux Rose',
    category: 'Vinho Tinto & Blush',
    description: 'Vinho profundo com acentos em rosé nobre, ideal para moda feminina e beleza.',
    isDarkSidebar: true,
    colors: {
      sidebarBg: '#2D0612',
      sidebarHover: '#4C0519',
      sidebarActive: '#881337',
      sidebarActiveBorder: '#F43F5E',
      sidebarText: '#FECDD3',
      sidebarTextActive: '#FFFFFF',
      sidebarMuted: '#FDA4AF',
      sidebarBorder: '#4C0519',
      primary: '#BE123C',
      primaryHover: '#9F1239',
      primaryText: '#FFFFFF',
      accent: '#F43F5E',
      accentSoft: '#FFE4E6',
      badgeBg: '#FFF1F2',
      badgeText: '#9F1239',
      ring: '#F43F5E'
    },
    preview: {
      swatchSidebar: '#2D0612',
      swatchAccent: '#F43F5E',
      swatchBg: '#F8FAFC'
    }
  },
  'clean-light': {
    id: 'clean-light',
    name: 'Clean Minimal',
    category: 'Minimalista Claro',
    description: 'Estrutura leve com fundo branco e acentos slate para alta luminosidade.',
    isDarkSidebar: false,
    colors: {
      sidebarBg: '#FFFFFF',
      sidebarHover: '#F8FAFC',
      sidebarActive: '#F1F5F9',
      sidebarActiveBorder: '#0F172A',
      sidebarText: '#64748B',
      sidebarTextActive: '#0F172A',
      sidebarMuted: '#94A3B8',
      sidebarBorder: '#E2E8F0',
      primary: '#0F172A',
      primaryHover: '#1E293B',
      primaryText: '#FFFFFF',
      accent: '#475569',
      accentSoft: '#F1F5F9',
      badgeBg: '#F1F5F9',
      badgeText: '#0F172A',
      ring: '#0F172A'
    },
    preview: {
      swatchSidebar: '#FFFFFF',
      swatchAccent: '#0F172A',
      swatchBg: '#F8FAFC'
    }
  }
};

interface AdminThemeContextType {
  palette: AdminPaletteKey;
  paletteConfig: AdminPaletteConfig;
  setPalette: (key: AdminPaletteKey) => void;
  availablePalettes: AdminPaletteConfig[];
}

const AdminThemeContext = createContext<AdminThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'bcomm_admin_palette_theme';

export const AdminThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [palette, setPaletteState] = useState<AdminPaletteKey>('midnight-gold');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as AdminPaletteKey | null;
      if (saved && ADMIN_PALETTES[saved]) {
        setPaletteState(saved);
      }
    } catch {
      // Ignora erro em ambientes restritos de storage
    }
  }, []);

  const setPalette = (key: AdminPaletteKey) => {
    if (!ADMIN_PALETTES[key]) return;
    setPaletteState(key);
    try {
      localStorage.setItem(STORAGE_KEY, key);
    } catch {
      // fallback seguro
    }
  };

  const paletteConfig = ADMIN_PALETTES[palette] || ADMIN_PALETTES['midnight-gold'];

  // Aplica variáveis CSS no container
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const c = paletteConfig.colors;

    root.style.setProperty('--admin-sidebar-bg', c.sidebarBg);
    root.style.setProperty('--admin-sidebar-hover', c.sidebarHover);
    root.style.setProperty('--admin-sidebar-active', c.sidebarActive);
    root.style.setProperty('--admin-sidebar-active-border', c.sidebarActiveBorder);
    root.style.setProperty('--admin-sidebar-text', c.sidebarText);
    root.style.setProperty('--admin-sidebar-text-active', c.sidebarTextActive);
    root.style.setProperty('--admin-sidebar-muted', c.sidebarMuted);
    root.style.setProperty('--admin-sidebar-border', c.sidebarBorder);

    root.style.setProperty('--admin-primary', c.primary);
    root.style.setProperty('--admin-primary-hover', c.primaryHover);
    root.style.setProperty('--admin-primary-text', c.primaryText);
    root.style.setProperty('--admin-accent', c.accent);
    root.style.setProperty('--admin-accent-soft', c.accentSoft);
    root.style.setProperty('--admin-badge-bg', c.badgeBg);
    root.style.setProperty('--admin-badge-text', c.badgeText);
  }, [paletteConfig]);

  return (
    <AdminThemeContext.Provider
      value={{
        palette,
        paletteConfig,
        setPalette,
        availablePalettes: Object.values(ADMIN_PALETTES)
      }}
    >
      {children}
    </AdminThemeContext.Provider>
  );
};

export const useAdminTheme = (): AdminThemeContextType => {
  const context = useContext(AdminThemeContext);
  if (!context) {
    // Retorna fallback gracioso caso renderizado fora do provider
    return {
      palette: 'midnight-gold',
      paletteConfig: ADMIN_PALETTES['midnight-gold'],
      setPalette: () => {},
      availablePalettes: Object.values(ADMIN_PALETTES)
    };
  }
  return context;
};

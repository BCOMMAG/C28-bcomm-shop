'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useStore } from '@/context/StoreContext';
import { AdminCustomThemeConfig, DEFAULT_ADMIN_CUSTOM_THEME } from '@/lib/admin';

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
      primary: '#0F172A',
      primaryHover: '#1E293B',
      primaryText: '#FFFFFF',
      accent: '#C5A059',
      accentSoft: '#FEF3C7',
      badgeBg: '#FEF3C7',
      badgeText: '#92400E',
      ring: '#C5A059'
    },
    preview: {
      swatchSidebar: '#0B132B',
      swatchAccent: '#C5A059',
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
      primary: '#1E3A8A',
      primaryHover: '#172554',
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
      primary: '#881337',
      primaryHover: '#4C0519',
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

export function getFontFamilyCss(fontName?: string): string {
  switch (fontName) {
    case 'Plus Jakarta Sans':
      return 'var(--font-plus-jakarta), "Plus Jakarta Sans", sans-serif';
    case 'Poppins':
      return 'var(--font-poppins), Poppins, sans-serif';
    case 'Montserrat':
      return 'var(--font-montserrat), Montserrat, sans-serif';
    case 'Playfair Display':
      return 'var(--font-playfair), "Playfair Display", Georgia, serif';
    case 'Cinzel':
      return 'var(--font-cinzel), Cinzel, Georgia, serif';
    case 'Cormorant Garamond':
      return 'var(--font-cormorant), "Cormorant Garamond", Georgia, serif';
    case 'Inter':
    default:
      return 'var(--font-inter), Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  }
}

export function getRadiusPixels(radiusKey?: string): string {
  switch (radiusKey) {
    case 'rounded-none':
      return '0px';
    case 'rounded-lg':
      return '8px';
    case 'rounded-xl':
      return '12px';
    case 'rounded-2xl':
      return '16px';
    case 'rounded-3xl':
      return '24px';
    case 'rounded-full':
      return '9999px';
    default:
      return '12px';
  }
}

export function getShadowCss(shadowKey?: string): string {
  switch (shadowKey) {
    case 'shadow-none':
      return 'none';
    case 'shadow-2xs':
      return '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
    case 'shadow-xs':
      return '0 1px 3px 0 rgba(0, 0, 0, 0.08), 0 1px 2px -1px rgba(0, 0, 0, 0.08)';
    case 'shadow-sm':
      return '0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.04)';
    default:
      return '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
  }
}

export function getContrastingTextColor(hexColor?: string): string {
  if (!hexColor || hexColor.length < 4) return '#FFFFFF';
  let c = hexColor.replace('#', '');
  if (c.length === 3) c = c.split('').map((x) => x + x).join('');
  const r = parseInt(c.substring(0, 2), 16) || 0;
  const g = parseInt(c.substring(2, 4), 16) || 0;
  const b = parseInt(c.substring(4, 6), 16) || 0;
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 160 ? '#0F172A' : '#FFFFFF';
}

interface AdminThemeContextType {
  palette: AdminPaletteKey;
  paletteConfig: AdminPaletteConfig;
  setPalette: (key: AdminPaletteKey) => void;
  availablePalettes: AdminPaletteConfig[];
  customTheme: AdminCustomThemeConfig;
  setCustomTheme: React.Dispatch<React.SetStateAction<AdminCustomThemeConfig>>;
  updateThemeSection: <K extends keyof AdminCustomThemeConfig>(section: K, values: Partial<AdminCustomThemeConfig[K]>) => void;
  applyPaletteToCustom: (key: AdminPaletteKey) => void;
  resetToDefault: () => void;
}

const AdminThemeContext = createContext<AdminThemeContextType | undefined>(undefined);

const STORAGE_PALETTE_KEY = 'bcomm_admin_palette_theme';
const STORAGE_CUSTOM_KEY = 'bcomm_admin_custom_theme';

export const AdminThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentTenant } = useStore();
  const visuais = (currentTenant?.configuracoes_visuais as any) || {};
  const tenantPalette = visuais.admin_palette as AdminPaletteKey | undefined;
  const tenantCustom = visuais.admin_custom as AdminCustomThemeConfig | undefined;

  const [palette, setPaletteState] = useState<AdminPaletteKey>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_PALETTE_KEY) as AdminPaletteKey | null;
        if (saved && ADMIN_PALETTES[saved]) return saved;
      } catch {}
    }
    return tenantPalette || 'midnight-gold';
  });

  const [customTheme, setCustomTheme] = useState<AdminCustomThemeConfig>(() => {
    return {
      ...DEFAULT_ADMIN_CUSTOM_THEME,
      ...(tenantCustom || {}),
      typography: {
        ...DEFAULT_ADMIN_CUSTOM_THEME.typography,
        ...(tenantCustom?.typography || {})
      },
      buttons: {
        ...DEFAULT_ADMIN_CUSTOM_THEME.buttons,
        ...(tenantCustom?.buttons || {})
      },
      cards: {
        ...DEFAULT_ADMIN_CUSTOM_THEME.cards,
        ...(tenantCustom?.cards || {})
      },
      sidebar: {
        ...DEFAULT_ADMIN_CUSTOM_THEME.sidebar,
        ...(tenantCustom?.sidebar || {})
      },
      accents: {
        ...DEFAULT_ADMIN_CUSTOM_THEME.accents,
        ...(tenantCustom?.accents || {})
      }
    };
  });

  // Sincroniza quando o tenant do StoreContext é atualizado (reatividade em tempo real)
  useEffect(() => {
    if (tenantPalette && ADMIN_PALETTES[tenantPalette]) {
      setPaletteState(tenantPalette);
    }
    if (tenantCustom) {
      setCustomTheme((prev) => ({
        ...prev,
        ...tenantCustom,
        typography: {
          ...prev.typography,
          ...(tenantCustom.typography || {})
        },
        buttons: {
          ...prev.buttons,
          ...(tenantCustom.buttons || {})
        },
        cards: {
          ...prev.cards,
          ...(tenantCustom.cards || {})
        },
        sidebar: {
          ...prev.sidebar,
          ...(tenantCustom.sidebar || {})
        },
        accents: {
          ...prev.accents,
          ...(tenantCustom.accents || {})
        }
      }));
    }
  }, [tenantPalette, tenantCustom]);

  const setPalette = (key: AdminPaletteKey) => {
    if (!ADMIN_PALETTES[key]) return;
    setPaletteState(key);
    try {
      localStorage.setItem(STORAGE_PALETTE_KEY, key);
    } catch {}
  };

  const applyPaletteToCustom = (key: AdminPaletteKey) => {
    const pal = ADMIN_PALETTES[key];
    if (!pal) return;
    setPalette(key);
    setCustomTheme((prev) => ({
      ...prev,
      buttons: {
        ...prev.buttons,
        primaryBg: pal.colors.primary,
        primaryText: pal.colors.primaryText,
        primaryHoverBg: pal.colors.primaryHover
      },
      sidebar: {
        ...prev.sidebar,
        background: pal.colors.sidebarBg,
        text: pal.colors.sidebarText,
        activeBackground: pal.colors.sidebarActive,
        activeText: pal.colors.sidebarTextActive,
        activeBorder: pal.colors.sidebarActiveBorder
      },
      accents: {
        ...prev.accents,
        primaryAccent: pal.colors.accent,
        softAccent: pal.colors.accentSoft
      }
    }));
  };

  const updateThemeSection = <K extends keyof AdminCustomThemeConfig>(
    section: K,
    values: Partial<AdminCustomThemeConfig[K]>
  ) => {
    setCustomTheme((prev) => ({
      ...prev,
      [section]: {
        ...(prev[section] as any),
        ...values
      }
    }));
  };

  const resetToDefault = () => {
    setPalette('midnight-gold');
    setCustomTheme(DEFAULT_ADMIN_CUSTOM_THEME);
  };

  const paletteConfig = ADMIN_PALETTES[palette] || ADMIN_PALETTES['midnight-gold'];

  // Aplicação Dinâmica de CSS Variables diretamente em :root
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    const typo = customTheme.typography || DEFAULT_ADMIN_CUSTOM_THEME.typography!;
    const btns = customTheme.buttons || DEFAULT_ADMIN_CUSTOM_THEME.buttons!;
    const crds = customTheme.cards || DEFAULT_ADMIN_CUSTOM_THEME.cards!;
    const side = customTheme.sidebar || DEFAULT_ADMIN_CUSTOM_THEME.sidebar!;
    const accs = customTheme.accents || DEFAULT_ADMIN_CUSTOM_THEME.accents!;
    const pageBg = customTheme.pageBackground || '#F8FAFC';

    // Tipografia
    root.style.setProperty('--admin-heading-font', getFontFamilyCss(typo.headingFont));
    root.style.setProperty('--admin-body-font', getFontFamilyCss(typo.bodyFont));
    root.style.setProperty('--admin-heading-color', typo.headingColor || '#0F172A');
    root.style.setProperty('--admin-text-color', typo.textColor || '#334155');
    root.style.setProperty('--admin-text-muted', typo.textMutedColor || '#64748B');

    // Botões Primários
    root.style.setProperty('--admin-btn-primary-bg', btns.primaryBg || '#0F172A');
    root.style.setProperty('--admin-btn-primary-text', btns.primaryText || '#FFFFFF');
    root.style.setProperty('--admin-btn-primary-hover', btns.primaryHoverBg || '#1E293B');

    // Botões Secundários
    root.style.setProperty('--admin-btn-secondary-bg', btns.secondaryBg || '#FFFFFF');
    root.style.setProperty('--admin-btn-secondary-text', btns.secondaryText || '#334155');
    root.style.setProperty('--admin-btn-secondary-border', btns.secondaryBorder || '#E2E8F0');
    root.style.setProperty('--admin-btn-secondary-hover', btns.secondaryHoverBg || '#F8FAFC');

    // Botões Geometria
    root.style.setProperty('--admin-btn-radius', getRadiusPixels(btns.borderRadius));

    // Cards
    root.style.setProperty('--admin-card-bg', crds.background || '#FFFFFF');
    root.style.setProperty('--admin-card-border', crds.border || '#E2E8F0');
    root.style.setProperty('--admin-card-radius', getRadiusPixels(crds.borderRadius));
    root.style.setProperty('--admin-card-shadow', getShadowCss(crds.shadow));

    // Sidebar
    root.style.setProperty('--admin-sidebar-bg', side.background || paletteConfig.colors.sidebarBg);
    root.style.setProperty('--admin-sidebar-text', side.text || paletteConfig.colors.sidebarText);
    root.style.setProperty('--admin-sidebar-active', side.activeBackground || paletteConfig.colors.sidebarActive);
    root.style.setProperty('--admin-sidebar-active-text', side.activeText || paletteConfig.colors.sidebarTextActive);
    root.style.setProperty('--admin-sidebar-active-border', side.activeBorder || paletteConfig.colors.sidebarActiveBorder);
    root.style.setProperty('--admin-sidebar-hover', paletteConfig.colors.sidebarHover);
    root.style.setProperty('--admin-sidebar-muted', paletteConfig.colors.sidebarMuted);
    root.style.setProperty('--admin-sidebar-border', paletteConfig.colors.sidebarBorder);

    // Accents & Page
    root.style.setProperty('--admin-accent', accs.primaryAccent || paletteConfig.colors.accent);
    root.style.setProperty('--admin-accent-soft', accs.softAccent || paletteConfig.colors.accentSoft);
    root.style.setProperty('--admin-page-bg', pageBg);
  }, [customTheme, paletteConfig]);

  return (
    <AdminThemeContext.Provider
      value={{
        palette,
        paletteConfig,
        setPalette,
        availablePalettes: Object.values(ADMIN_PALETTES),
        customTheme,
        setCustomTheme,
        updateThemeSection,
        applyPaletteToCustom,
        resetToDefault
      }}
    >
      {children}
    </AdminThemeContext.Provider>
  );
};

export const useAdminTheme = (): AdminThemeContextType => {
  const context = useContext(AdminThemeContext);
  if (!context) {
    return {
      palette: 'midnight-gold',
      paletteConfig: ADMIN_PALETTES['midnight-gold'],
      setPalette: () => {},
      availablePalettes: Object.values(ADMIN_PALETTES),
      customTheme: DEFAULT_ADMIN_CUSTOM_THEME,
      setCustomTheme: () => {},
      updateThemeSection: () => {},
      applyPaletteToCustom: () => {},
      resetToDefault: () => {}
    };
  }
  return context;
};

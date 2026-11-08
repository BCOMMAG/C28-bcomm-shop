import { SupportedLocale, TranslationDictionary } from './types';
import { pt } from './dictionaries/pt';
import { en } from './dictionaries/en';
import { es } from './dictionaries/es';

export * from './types';

const dictionaries: Record<SupportedLocale, TranslationDictionary> = {
  pt,
  en,
  es
};

export interface LocaleOption {
  id: SupportedLocale;
  name: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_LOCALES: LocaleOption[] = [
  { id: 'pt', name: 'Português', nativeName: 'Português (BR)', flag: '🇧🇷' },
  { id: 'en', name: 'English', nativeName: 'English (US)', flag: '🇺🇸' },
  { id: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' }
];

export const STORAGE_LOCALE_KEY = 'bcomm_locale';

/**
 * Retorna o dicionário de tradução correspondente ao locale.
 */
export function getTranslation(locale: SupportedLocale = 'pt'): TranslationDictionary {
  return dictionaries[locale] || dictionaries.pt;
}

/**
 * Detecta o idioma padrão do navegador com fallback para 'pt'.
 */
export function detectBrowserLocale(): SupportedLocale {
  if (typeof window === 'undefined') return 'pt';

  try {
    const navLangs = navigator.languages || [navigator.language || ''];
    for (const lang of navLangs) {
      const clean = lang.toLowerCase();
      if (clean.startsWith('en')) return 'en';
      if (clean.startsWith('es')) return 'es';
      if (clean.startsWith('pt')) return 'pt';
    }
  } catch {}

  return 'pt';
}

/**
 * Lê o locale persistido no localStorage ou realiza auto-detecção.
 */
export function getStoredLocale(): SupportedLocale {
  if (typeof window === 'undefined') return 'pt';

  try {
    const saved = localStorage.getItem(STORAGE_LOCALE_KEY) as SupportedLocale | null;
    if (saved && (saved === 'pt' || saved === 'en' || saved === 'es')) {
      return saved;
    }
  } catch {}

  const detected = detectBrowserLocale();
  try {
    localStorage.setItem(STORAGE_LOCALE_KEY, detected);
  } catch {}
  return detected;
}

/**
 * Salva a preferência de locale no localStorage e dispara evento para atualização instantânea.
 */
export function setStoredLocale(locale: SupportedLocale): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_LOCALE_KEY, locale);
    window.dispatchEvent(new CustomEvent('bcomm_locale_change', { detail: { locale } }));
  } catch {}
}

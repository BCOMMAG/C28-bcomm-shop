'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';
import {
  SupportedLocale,
  SUPPORTED_LOCALES,
  getStoredLocale,
  setStoredLocale,
  STORAGE_LOCALE_KEY
} from '@/lib/i18n';

interface LanguageSelectorProps {
  variant?: 'pills' | 'dropdown';
  className?: string;
  onLocaleChange?: (locale: SupportedLocale) => void;
}

export function LanguageSelector({
  variant = 'dropdown',
  className = '',
  onLocaleChange
}: LanguageSelectorProps) {
  const [currentLocale, setCurrentLocale] = useState<SupportedLocale>('pt');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentLocale(getStoredLocale());

    const handleLocaleChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ locale: SupportedLocale }>;
      if (customEvent.detail?.locale) {
        setCurrentLocale(customEvent.detail.locale);
      }
    };

    window.addEventListener('bcomm_locale_change', handleLocaleChange);
    return () => window.removeEventListener('bcomm_locale_change', handleLocaleChange);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (locale: SupportedLocale) => {
    setCurrentLocale(locale);
    setStoredLocale(locale);
    setIsOpen(false);
    if (onLocaleChange) {
      onLocaleChange(locale);
    }
  };

  const activeOption = SUPPORTED_LOCALES.find((opt) => opt.id === currentLocale) || SUPPORTED_LOCALES[0];

  if (variant === 'pills') {
    return (
      <div className={`inline-flex items-center bg-black/40 border border-white/10 p-1 rounded-xl gap-1 ${className}`}>
        {SUPPORTED_LOCALES.map((option) => {
          const isActive = option.id === currentLocale;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => handleSelect(option.id)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                isActive
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>{option.flag}</span>
              <span className="uppercase text-[11px]">{option.id}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-black/40 hover:bg-black/60 border border-white/10 hover:border-purple-500/40 rounded-xl text-zinc-300 hover:text-white transition-all cursor-pointer backdrop-blur-xs"
        aria-expanded={isOpen}
      >
        <Globe className="w-3.5 h-3.5 text-purple-400" />
        <span className="text-sm">{activeOption.flag}</span>
        <span className="font-semibold text-[11px] tracking-wide uppercase">{activeOption.id}</span>
        <ChevronDown className={`w-3 h-3 text-zinc-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-44 rounded-xl bg-[#120F1A] border border-purple-500/30 shadow-2xl py-1 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400 border-b border-white/5">
            Language / Idioma
          </div>
          {SUPPORTED_LOCALES.map((option) => {
            const isActive = option.id === currentLocale;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => handleSelect(option.id)}
                className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-purple-600/20 text-purple-200 font-semibold'
                    : 'text-zinc-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{option.flag}</span>
                  <span>{option.nativeName}</span>
                </div>
                {isActive && <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

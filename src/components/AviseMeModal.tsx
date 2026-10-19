'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { X, Bell, CheckCircle2, AlertCircle, Sparkles, MessageCircle, ArrowRight } from 'lucide-react';
import { Product } from '@/types';
import { createAviseMeLead } from '@/lib/aviseme';
import { STORE_INFO } from '@/data/products';

interface AviseMeModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  selectedColor?: string;
  selectedSize: string;
  lojaId?: string;
}

export function AviseMeModal({
  isOpen,
  onClose,
  product,
  selectedColor,
  selectedSize,
  lojaId
}: AviseMeModalProps) {
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen || !product) return null;

  const formatPhone = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 11);
    if (raw.length <= 2) return raw;
    if (raw.length <= 7) return `(${raw.slice(0, 2)}) ${raw.slice(2)}`;
    return `(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTelefone(formatPhone(e.target.value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await createAviseMeLead({
        lojaId,
        produtoId: product.id,
        produtoNome: product.name,
        cor: selectedColor,
        tamanho: selectedSize,
        nome,
        telefone,
        email
      });

      if (res.success) {
        setIsSuccess(true);
      } else {
        setErrorMsg(res.error || 'Não foi possível cadastrar seu pedido de aviso.');
      }
    } catch {
      setErrorMsg('Erro inesperado de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsSuccess(false);
    setNome('');
    setTelefone('');
    setEmail('');
    setErrorMsg('');
    onClose();
  };

  // Imagem do produto selecionado
  const displayImage = product.colors?.find((c) => c.name === selectedColor)?.imageSrc || product.thumbnail || product.media?.[0]?.src || '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#FAF8F5] dark:bg-[#1A1918] rounded-none shadow-2xl border border-[#C5A059]/40 p-6 sm:p-7 text-[#1A1918] dark:text-[#FAF8F5] overflow-hidden">
        
        {/* Botão Fechar */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-[#57534E] dark:text-[#A8A29E] hover:text-[#1A1918] dark:hover:text-white hover:bg-white dark:hover:bg-[#252220] transition-colors cursor-pointer"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {isSuccess ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-14 h-14 rounded-full bg-[#C5A059]/15 border border-[#C5A059]/40 text-[#C5A059] flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="text-[11px] uppercase tracking-widest text-[#C5A059] font-bold block mb-1">
                Fila VIP Confirmada
              </span>
              <h3 className="font-serif-luxury text-xl sm:text-2xl font-medium">
                Você será a primeira a saber!
              </h3>
              <p className="text-xs text-[#78716C] dark:text-[#A8A29E] mt-2 max-w-xs mx-auto leading-relaxed">
                Assim que a peça <strong>{product.name}</strong> ({selectedSize} {selectedColor && `• ${selectedColor}`}) for reestocada, enviaremos um aviso exclusivo no seu WhatsApp.
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <a
                href={`https://wa.me/${STORE_INFO.whatsapp}?text=Ol%C3%A1%20Leidy!%20Me%20cadastrei%20no%20avise-me%20para%20o%20${encodeURIComponent(product.name)}%20(Tam%20${encodeURIComponent(selectedSize)}).%20Tem%20previs%C3%A3o%20de%20chegada?`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Consultar Previsão no WhatsApp</span>
              </a>

              <button
                type="button"
                onClick={handleClose}
                className="w-full py-2.5 px-4 bg-white dark:bg-[#252220] border border-[#C5A059]/30 text-[#1A1918] dark:text-white text-xs font-semibold hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                Continuar Navegando
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Header */}
            <div className="flex items-center gap-2.5 mb-4">
              <div className="p-2 bg-[#C5A059]/15 text-[#C5A059]">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif-luxury text-xl font-medium">
                  Avise-me Quando Chegar
                </h3>
                <p className="text-xs text-[#78716C] dark:text-[#A8A29E]">
                  Seja notificada com prioridade assim que a peça for reposta
                </p>
              </div>
            </div>

            {/* Card com prévia da peça e tamanho esgotado */}
            <div className="bg-white dark:bg-[#22201E] border border-[#C5A059]/30 p-3 flex items-center gap-3 mb-4 shadow-2xs">
              <div className="relative w-12 h-16 shrink-0 bg-neutral-100 dark:bg-neutral-800">
                <Image
                  src={displayImage}
                  alt={product.name}
                  fill
                  className="object-cover object-top"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold truncate text-[#1A1918] dark:text-white">
                  {product.name}
                </h4>
                <div className="flex items-center gap-2 text-[11px] text-[#78716C] dark:text-[#A8A29E] mt-0.5">
                  {selectedColor && <span>Cor: <strong>{selectedColor}</strong></span>}
                  <span>Tamanho: <strong className="text-[#C5A059]">{selectedSize}</strong></span>
                </div>
                <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 border border-rose-200 dark:border-rose-900">
                  Esgotado no momento
                </span>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 mb-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Formulário de 10 segundos */}
            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#1A1918] dark:text-[#FAF8F5] font-bold mb-1">
                  Seu Nome:
                </label>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Amanda Ferreira"
                  className="w-full bg-white dark:bg-[#252220] border border-[#C5A059]/40 p-2.5 text-xs text-[#1A1918] dark:text-white focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div>
                <label className="block text-[#1A1918] dark:text-[#FAF8F5] font-bold mb-1">
                  Seu WhatsApp (com DDD):
                </label>
                <input
                  type="tel"
                  required
                  value={telefone}
                  onChange={handlePhoneChange}
                  placeholder="(00) 00000-0000"
                  className="w-full bg-white dark:bg-[#252220] border border-[#C5A059]/40 p-2.5 text-xs text-[#1A1918] dark:text-white font-mono focus:outline-none focus:border-[#C5A059]"
                />
                <span className="text-[10px] text-[#78716C] dark:text-[#A8A29E] mt-0.5 block">
                  Enviaremos o link direto no WhatsApp assim que houver reposição.
                </span>
              </div>

              <div>
                <label className="block text-[#1A1918] dark:text-[#FAF8F5] font-semibold mb-1 text-[11px]">
                  E-mail (opcional):
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="amanda@exemplo.com"
                  className="w-full bg-white dark:bg-[#252220] border border-[#C5A059]/40 p-2 text-xs text-[#1A1918] dark:text-white focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-[#1A1918] dark:bg-[#C5A059] text-white dark:text-[#1A1918] hover:bg-[#C5A059] dark:hover:bg-[#DFBE76] text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4 text-[#C5A059] dark:text-[#1A1918]" />
                  <span>{loading ? 'Cadastrando...' : 'Quero Ser Avisada no WhatsApp'}</span>
                </button>
              </div>

              <p className="text-[10px] text-center text-[#78716C] dark:text-[#A8A29E] mt-1">
                🔒 Respeitamos sua privacidade. Seus dados são utilizados exclusivamente para o aviso desta peça.
              </p>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

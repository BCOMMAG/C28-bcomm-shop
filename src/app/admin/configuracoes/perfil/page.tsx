'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  User,
  Camera,
  Mail,
  Phone,
  Shield,
  MessageSquare,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Crown,
  Globe
} from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { uploadBrowserFileToR2 } from '@/lib/r2';
import { DEFAULT_TENANT_ID } from '@/lib/products';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { isMasterUser } from '@/lib/team';
import { getStoredLocale, setStoredLocale, SupportedLocale } from '@/lib/i18n';
import { useAdminI18n } from '@/context/AdminI18nContext';

export default function UserProfileSettingsPage() {
  const { currentTenant } = useStore();
  const { t, locale, setLocale } = useAdminI18n();
  const isLeidy = currentTenant?.slug === 'leidy-boutique' || currentTenant?.slug === 'leidyboutique';
  const tenantSlug = currentTenant?.slug || '';
  const tenantId = currentTenant?.id || DEFAULT_TENANT_ID;

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Estados do Perfil
  const [nome, setNome] = useState(isLeidy ? 'Leidyane Cristina' : '');
  const [apelido, setApelido] = useState(isLeidy ? 'Leidy' : '');
  const [email, setEmail] = useState(isLeidy ? 'contato@leidyboutique.com.br' : '');
  const [telefone, setTelefone] = useState(isLeidy ? '554197347601' : '');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [assinaturaWhatsapp, setAssinaturaWhatsapp] = useState(
    isLeidy ? 'Com carinho,\nLeidy | Leidy Boutique ✨' : ''
  );

  // Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    setLocale(getStoredLocale());
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const supabase = getSupabaseBrowserClient();
        // Busca o membro dono da equipe ou dados da loja
        const { data: member } = await supabase
          .from('equipe_loja')
          .select('*')
          .eq('loja_id', tenantId)
          .eq('cargo', 'dono')
          .maybeSingle();

        if (member) {
          setNome(member.nome || (isLeidy ? 'Leidyane Cristina' : ''));
          setEmail(member.email || (isLeidy ? 'contato@leidyboutique.com.br' : ''));
          setTelefone(member.telefone || (isLeidy ? '554197347601' : ''));
          if ((member as any).avatar_url) setAvatarUrl((member as any).avatar_url);
          if ((member as any).apelido) setApelido((member as any).apelido);
          if ((member as any).assinatura_whatsapp) setAssinaturaWhatsapp((member as any).assinatura_whatsapp);
        } else {
          // Fallback nos dados salvos localmente
          const localAvatar = localStorage.getItem(`profile_avatar_${tenantId}`);
          if (localAvatar) setAvatarUrl(localAvatar);
          const localAssinatura = localStorage.getItem(`profile_assinatura_${tenantId}`);
          if (localAssinatura) setAssinaturaWhatsapp(localAssinatura);
        }
      } catch (err) {
        console.error('Erro ao buscar perfil:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [tenantId]);

  // Upload de Foto de Perfil para o Cloudflare R2
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Por favor selecione uma imagem válida (PNG, JPG, WEBP).', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('A imagem deve ter no máximo 5MB.', 'error');
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const res = await uploadBrowserFileToR2(file, tenantSlug, 'avatars');
      if (res.success && res.url) {
        setAvatarUrl(res.url);
        localStorage.setItem(`profile_avatar_${tenantId}`, res.url);
        showToast('Foto de perfil atualizada com sucesso!');
      } else {
        showToast(res.error || 'Erro ao enviar foto de perfil.', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Falha no upload do avatar.', 'error');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const supabase = getSupabaseBrowserClient();

      const cleanEmail = email.trim().toLowerCase();

      // 1. Atualiza na tabela equipe_loja (dispara trigger automático para auth.users)
      const { data: member } = await supabase
        .from('equipe_loja')
        .select('id, auth_user_id')
        .eq('loja_id', tenantId)
        .eq('cargo', 'dono')
        .maybeSingle();

      if (member) {
        await supabase
          .from('equipe_loja')
          .update({
            nome,
            email: cleanEmail,
            telefone: telefone.replace(/\D/g, ''),
            updated_at: new Date().toISOString()
          })
          .eq('id', member.id);
      }

      // 2. Atualiza e-mail principal na tabela lojas
      await supabase
        .from('lojas')
        .update({
          email: cleanEmail,
          updated_at: new Date().toISOString()
        })
        .eq('id', tenantId);

      // 3. Atualiza usuário ativo no Supabase Auth com preferências e idioma
      try {
        await supabase.auth.updateUser({
          email: cleanEmail,
          data: { nome, apelido, locale }
        });
      } catch (authErr) {
        console.warn('Aviso ao sincronizar auth.users:', authErr);
      }

      // Salva preferências no localStorage e sincroniza i18n
      setStoredLocale(locale);
      localStorage.setItem(`profile_avatar_${tenantId}`, avatarUrl);
      localStorage.setItem(`profile_apelido_${tenantId}`, apelido);
      localStorage.setItem(`profile_assinatura_${tenantId}`, assinaturaWhatsapp);

      showToast('Perfil atualizado com sucesso!');
    } catch (err: any) {
      showToast(err?.message || 'Erro ao salvar perfil.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center text-slate-500 shadow-xs">
        <RefreshCw className="w-6 h-6 animate-spin text-amber-600 mx-auto mb-2" />
        <span className="text-xs font-medium">Carregando dados do perfil...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSaveProfile} className="space-y-6">
      {/* Toast flutuante */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl text-white shadow-xl border animate-in fade-in slide-in-from-bottom-3 duration-200 ${
            toast.type === 'success' ? 'bg-slate-900 border-slate-700' : 'bg-rose-900 border-rose-700'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span className="text-xs font-semibold">{toast.message}</span>
        </div>
      )}

      {/* BLOCO 1: FOTO & IDENTIFICAÇÃO PESSOAL */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-bold">
            <User className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              {t.generalSettings.sec1Title}
            </h2>
            <p className="text-[11px] text-slate-500">
              {t.generalSettings.sec1Desc}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center shrink-0">
            <div className="relative group">
              <div className="w-24 h-24 rounded-2xl border-2 border-slate-200 overflow-hidden bg-slate-100 flex items-center justify-center shadow-inner">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt={nome}
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-900 text-amber-400 flex items-center justify-center font-extrabold text-2xl font-sans">
                    {apelido.slice(0, 2).toUpperCase() || 'LB'}
                  </div>
                )}
              </div>

              {/* Botão de Câmera */}
              <label
                htmlFor="avatar-upload"
                className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 shadow-md cursor-pointer transition-transform hover:scale-105"
                title="Alterar foto de perfil"
              >
                {isUploadingAvatar ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                ) : (
                  <Camera className="w-4 h-4 text-amber-400" />
                )}
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  disabled={isUploadingAvatar}
                  className="hidden"
                />
              </label>
            </div>
            <span className="text-[10px] text-slate-400 mt-3 font-medium text-center">
              PNG, JPG ou WEBP até 5MB
            </span>
          </div>

          {/* Dados do Usuário */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs w-full">
            <div>
              <label className="block text-slate-700 mb-1 font-bold">{t.generalSettings.fullName}</label>
              <input
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Seu Nome Completo"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-slate-700 mb-1 font-bold">{t.generalSettings.displayName}</label>
              <input
                type="text"
                required
                value={apelido}
                onChange={(e) => setApelido(e.target.value)}
                placeholder="Ex: Como prefere ser chamado"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-slate-700 mb-1 font-bold">{t.generalSettings.primaryEmail}</label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu.email@loja.com.br"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 mb-1 font-bold">{t.generalSettings.directPhone}</label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="554197347601"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 text-slate-900 font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Cargo e Nível de Acesso */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between bg-amber-50/40 rounded-xl p-3.5 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-100 text-amber-800">
              <Crown className="w-4 h-4" />
            </div>
            <div>
              {isMasterUser(email) ? (
                <>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">Cargo: Engenharia BCOMM (Modo Master)</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500 text-slate-950 border border-amber-600 shadow-2xs">
                      👑 Acesso Global Master SaaS
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    {t.generalSettings.roleMasterDesc}
                  </p>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{t.generalSettings.roleOwner}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-200/80 text-amber-900 border border-amber-300">
                      {locale === 'en' ? 'Full Access (Owner)' : locale === 'es' ? 'Acceso Total (Propietaria)' : 'Acesso Total (Proprietária)'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {t.generalSettings.roleDesc}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* BLOCO 2: ASSINATURA AUTOMÁTICA DE ATENDIMENTO */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              {t.generalSettings.sec2Title}
            </h2>
            <p className="text-[11px] text-slate-500">
              {t.generalSettings.sec2Desc}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 text-xs">
          <div>
            <label className="block text-slate-700 mb-1 font-bold">{t.generalSettings.sigText}</label>
            <textarea
              rows={4}
              value={assinaturaWhatsapp}
              onChange={(e) => setAssinaturaWhatsapp(e.target.value)}
              placeholder="Ex: Atenciosamente,\nEquipe de Atendimento ✨"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-xs font-medium"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              {t.generalSettings.sigTip}
            </span>
          </div>

          {/* Prévia do Balão de WhatsApp */}
          <div>
            <label className="block text-slate-700 mb-1 font-bold">{t.generalSettings.sigPreview}</label>
            <div className="bg-[#EFEAE2] p-4 rounded-xl border border-slate-200 flex flex-col justify-end min-h-[110px]">
              <div className="bg-white rounded-xl rounded-tr-none p-3 shadow-xs max-w-sm self-end space-y-1.5 text-[11px] text-slate-800">
                <p>
                  Olá, Mariana! Seu vestido alfaiataria já foi separado com muito amor e está a caminho! 👗📦
                </p>
                <div className="pt-1.5 border-t border-slate-100 whitespace-pre-line text-slate-600 font-medium italic">
                  {assinaturaWhatsapp}
                </div>
                <div className="flex justify-end text-[9px] text-slate-400 font-mono">
                  14:32 ✓✓
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BLOCO 3: IDIOMA DE PREFERÊNCIA DO PAINEL */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-bold">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              3. Idioma de Preferência do Painel (i18n)
            </h2>
            <p className="text-[11px] text-slate-500">
              Selecione o idioma utilizado na interface do painel administrativo, menus e notificações operacionais.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { id: 'pt' as SupportedLocale, flag: '🇧🇷', name: 'Português', desc: 'Português do Brasil (Padrão)' },
            { id: 'en' as SupportedLocale, flag: '🇺🇸', name: 'English', desc: 'United States & Global' },
            { id: 'es' as SupportedLocale, flag: '🇪🇸', name: 'Español', desc: 'América Latina y España' }
          ].map((item) => {
            const isSelected = locale === item.id;
            return (
              <button
                type="button"
                key={item.id}
                onClick={() => {
                  setLocale(item.id);
                  setStoredLocale(item.id);
                }}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? 'border-amber-500 bg-amber-50/50 ring-2 ring-amber-400/30 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/40 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{item.flag}</span>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">{item.name}</span>
                    <span className="text-[10px] text-slate-500 block">{item.desc}</span>
                  </div>
                </div>
                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                    ✓
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* BOTÃO SALVAR */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs font-bold uppercase tracking-wider shadow-md transition-all cursor-pointer disabled:opacity-50"
        >
          {isSaving ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>{isSaving ? t.common.saving : t.common.save}</span>
        </button>
      </div>
    </form>
  );
}

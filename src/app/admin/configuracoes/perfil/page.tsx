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
  Globe,
  KeyRound,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { uploadBrowserFileToR2 } from '@/lib/r2';
import { DEFAULT_TENANT_ID } from '@/lib/products';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { isMasterUser, getStoredActiveMember, MembroEquipe, CargoColaborador } from '@/lib/team';
import { getStoredLocale, setStoredLocale, SupportedLocale } from '@/lib/i18n';
import { useAdminI18n } from '@/context/AdminI18nContext';

export default function UserProfileSettingsPage() {
  const { currentTenant } = useStore();
  const { t, locale, setLocale } = useAdminI18n();
  const tenantSlug = currentTenant?.slug || '';
  const tenantId = currentTenant?.id || DEFAULT_TENANT_ID;

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Colaborador ativo identificado na sessão
  const [activeColab, setActiveColab] = useState<MembroEquipe | null>(null);
  const [isMaster, setIsMaster] = useState(false);

  // Estados do Perfil
  const [nome, setNome] = useState('');
  const [apelido, setApelido] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cargo, setCargo] = useState<string>('atendente');
  const [pin, setPin] = useState<string>('••••');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [assinaturaWhatsapp, setAssinaturaWhatsapp] = useState('');

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
        const masterStatus = isMasterUser();
        setIsMaster(masterStatus);

        if (masterStatus) {
          // Perfil Master SaaS
          setNome('Super Admin BCOMM');
          setApelido('Master');
          setEmail('superadmin@bcomm.com.br');
          setTelefone('5541999999999');
          setCargo('master');
          setPin('0000');
          setAssinaturaWhatsapp('Atenciosamente,\nEngenharia BCOMM Platform 🚀');
          setLoading(false);
          return;
        }

        const supabase = getSupabaseBrowserClient();
        const stored = getStoredActiveMember();
        const { data: sessionData } = await supabase.auth.getSession();
        const sessionEmail = sessionData?.session?.user?.email?.toLowerCase();

        let memberFound: any = null;

        // 1. Busca prioritariamente pelo colaborador ativo armazenado na sessão
        if (stored?.id) {
          const { data } = await supabase
            .from('equipe_loja')
            .select('*')
            .eq('id', stored.id)
            .maybeSingle();
          if (data) memberFound = data;
        }

        // 2. Se não encontrou pelo ID salvo, busca pelo e-mail da sessão Supabase Auth
        if (!memberFound && sessionEmail) {
          const { data } = await supabase
            .from('equipe_loja')
            .select('*')
            .eq('loja_id', tenantId)
            .ilike('email', sessionEmail)
            .maybeSingle();
          if (data) memberFound = data;
        }

        // 3. Fallback: se nenhum colaborador subordinado estiver logado, busca a dona da loja
        if (!memberFound) {
          const { data } = await supabase
            .from('equipe_loja')
            .select('*')
            .eq('loja_id', tenantId)
            .eq('cargo', 'dono')
            .maybeSingle();
          if (data) memberFound = data;
        }

        if (memberFound) {
          setActiveColab(memberFound);
          setNome(memberFound.nome || '');
          setApelido(memberFound.apelido || memberFound.nome?.split(' ')[0] || '');
          setEmail(memberFound.email || '');
          setTelefone(memberFound.telefone || '');
          setCargo(memberFound.cargo || 'atendente');
          setPin(memberFound.pin_hash || '••••');
          setAvatarUrl(memberFound.avatar_url || '');
          setAssinaturaWhatsapp(
            memberFound.assinatura_whatsapp ||
              `Com carinho,\n${memberFound.nome} | ${currentTenant?.nome || 'Leidy Boutique'} ✨`
          );
        } else {
          // Fallback mínimo
          setNome(stored?.nome || 'Colaborador');
          setApelido(stored?.nome?.split(' ')[0] || 'Equipe');
          setEmail(stored?.email || '');
          setCargo(stored?.cargo || 'atendente');
        }
      } catch (err) {
        console.error('Erro ao buscar perfil do colaborador:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [tenantId, currentTenant?.nome]);

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
        if (activeColab?.id) {
          const supabase = getSupabaseBrowserClient();
          await supabase
            .from('equipe_loja')
            .update({ avatar_url: res.url, updated_at: new Date().toISOString() })
            .eq('id', activeColab.id);
        }
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
      if (isMaster) {
        setStoredLocale(locale);
        showToast('Preferências de Master salvas com sucesso!');
        return;
      }

      const supabase = getSupabaseBrowserClient();
      const cleanEmail = email.trim().toLowerCase();

      if (activeColab?.id) {
        // Atualiza EXCLUSIVAMENTE o colaborador logado
        const updates: any = {
          nome: nome.trim(),
          telefone: telefone.replace(/\D/g, ''),
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString()
        };

        // Proprietária pode alterar o próprio e-mail e dados da loja
        if (activeColab.cargo === 'dono') {
          updates.email = cleanEmail;
          await supabase
            .from('lojas')
            .update({
              email: cleanEmail,
              updated_at: new Date().toISOString()
            })
            .eq('id', tenantId);
        }

        const { error: updErr } = await supabase
          .from('equipe_loja')
          .update(updates)
          .eq('id', activeColab.id);

        if (updErr) throw updErr;

        // Atualiza o colaborador salvo no localStorage da sessão
        const updatedLocalColab = {
          ...activeColab,
          ...updates
        };
        localStorage.setItem('leidy_admin_colaborador', JSON.stringify(updatedLocalColab));
        localStorage.setItem('bcomm_admin_colaborador', JSON.stringify(updatedLocalColab));
        setActiveColab(updatedLocalColab);
      }

      setStoredLocale(locale);
      showToast('Perfil atualizado com sucesso!');
    } catch (err: any) {
      showToast(err?.message || 'Erro ao salvar perfil.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const isOwner = isMaster || cargo === 'dono';
  const isManager = cargo === 'gerente';
  const isAttendant = cargo === 'atendente';
  const isStock = cargo === 'estoquista';

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center text-slate-500 shadow-xs">
        <RefreshCw className="w-6 h-6 animate-spin text-amber-600 mx-auto mb-2" />
        <span className="text-xs font-medium">Carregando dados do seu perfil...</span>
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

      {/* BLOCO 1: FOTO & IDENTIFICAÇÃO PESSOAL DO COLABORADOR */}
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
              Seus dados de identificação individual e credenciais na equipe da boutique.
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
                    {(apelido || nome).slice(0, 2).toUpperCase() || 'OP'}
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
              <div className="flex items-center justify-between mb-1">
                <label className="block text-slate-700 font-bold">{t.generalSettings.primaryEmail}</label>
                {!isOwner && (
                  <span className="text-[10px] text-slate-400 italic">E-mail institucional</span>
                )}
              </div>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  disabled={!isOwner}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu.email@loja.com.br"
                  className={`w-full border rounded-lg pl-9 pr-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                    !isOwner
                      ? 'bg-slate-100/80 border-slate-200 text-slate-600 cursor-not-allowed font-mono'
                      : 'bg-slate-50 border-slate-200 focus:bg-white font-mono'
                  }`}
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
                  placeholder="5541999999999"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 text-slate-900 font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Cargo e Nível de Acesso Individual */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/80 rounded-xl p-3.5 text-xs">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-lg ${
                isMaster
                  ? 'bg-amber-500 text-slate-950 font-extrabold'
                  : isOwner
                  ? 'bg-amber-100 text-amber-800'
                  : isManager
                  ? 'bg-sky-100 text-sky-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {isMaster || isOwner ? <Crown className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-slate-900">
                  {isMaster
                    ? 'Engenharia BCOMM (Modo Master)'
                    : isOwner
                    ? 'Proprietária da Boutique'
                    : isManager
                    ? 'Gerente Geral da Loja'
                    : isAttendant
                    ? 'Atendente & Frente de Loja'
                    : 'Estoque & Expedição'}
                </span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    isMaster
                      ? 'bg-amber-400 text-slate-950 border border-amber-500 shadow-2xs'
                      : isOwner
                      ? 'bg-amber-200/80 text-amber-900 border border-amber-300'
                      : isManager
                      ? 'bg-sky-100 text-sky-800 border border-sky-300'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  }`}
                >
                  {isMaster
                    ? '👑 God Mode'
                    : isOwner
                    ? 'Acesso Total'
                    : isManager
                    ? 'Alçada Gerencial'
                    : 'Atendimento & CRM'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {isMaster
                  ? 'Acesso irrestrito a todos os tenants e infraestrutura global da plataforma.'
                  : isOwner
                  ? 'Alçada total para configurações, estoque, finanças e gestão da equipe.'
                  : isManager
                  ? 'Alçada para supervisão de vendas, redefinição de senhas de subordinados e estoque.'
                  : 'Acesso seguro restrito ao processamento de pedidos, CRM de clientes e balcão PDV.'}
              </p>
            </div>
          </div>

          {/* PIN Balcão Individual */}
          {pin && (
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shrink-0">
              <KeyRound className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-[10px] font-bold text-slate-500 uppercase">PIN Balcão:</span>
              <span className="font-mono font-extrabold text-xs text-amber-900 tracking-widest">{pin}</span>
            </div>
          )}
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
              Sua assinatura personalizada anexada automaticamente em mensagens aos clientes via WhatsApp.
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
              placeholder="Ex: Com carinho,\nSeu Nome | Leidy Boutique ✨"
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
                  Olá! Seu pedido já foi separado com muito carinho e elegância! 👗📦
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
              Selecione o idioma utilizado na sua interface do painel administrativo, menus e notificações.
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

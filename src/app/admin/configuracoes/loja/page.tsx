'use client';

import React, { useState, useEffect } from 'react';
import {
  Store,
  Building,
  MapPin,
  Clock,
  Phone,
  Mail,
  FileText,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  ExternalLink,
  ShieldCheck,
  Video,
  Globe,
  Copy,
  Check
} from 'lucide-react';

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}
import { useStore } from '@/context/StoreContext';
import { DEFAULT_TENANT_ID } from '@/lib/products';
import {
  getStoreSettings,
  saveStoreGeneralSettings,
  StoreSettingsData
} from '@/lib/admin';

export default function StoreSettingsPage() {
  const { currentTenant, refreshProducts } = useStore();
  const tenantId = currentTenant?.id || DEFAULT_TENANT_ID;

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSearchingCep, setIsSearchingCep] = useState(false);

  // Estados dos Campos
  const [nome, setNome] = useState('');
  const [slug, setSlug] = useState('');
  const [dominioProprio, setDominioProprio] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [razaoSocial, setRazaoSocial] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [inscricaoEstadual, setInscricaoEstadual] = useState('');

  // Endereço
  const [cep, setCep] = useState('');
  const [logradouro, setLogradouro] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');

  // Horários
  const [horarioSemana, setHorarioSemana] = useState('');
  const [horarioSabado, setHorarioSabado] = useState('');
  const [horarioDomingo, setHorarioDomingo] = useState('');

  // Canais
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [instagram, setInstagram] = useState('');
  const [tiktok, setTiktok] = useState('');

  // Políticas
  const [politicaTrocas, setPoliticaTrocas] = useState('');
  const [politicaPrivacidade, setPoliticaPrivacidade] = useState('');
  const [termosUso, setTermosUso] = useState('');

  // Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getStoreSettings(tenantId);
      if (data) {
        setNome(data.nome || '');
        setSlug(data.slug || '');
        setDominioProprio(data.dominioProprio || '');
        setRazaoSocial(data.razaoSocial || '');
        setCnpj(data.cnpj || '');
        setInscricaoEstadual(data.inscricaoEstadual || '');

        setCep(data.cep || '');
        setLogradouro(data.logradouro || '');
        setNumero(data.numero || '');
        setComplemento(data.complemento || '');
        setBairro(data.bairro || '');
        setCidade(data.cidade || '');
        setEstado(data.estado || '');

        setHorarioSemana(data.horarioSemana || '');
        setHorarioSabado(data.horarioSabado || '');
        setHorarioDomingo(data.horarioDomingo || '');

        setWhatsapp(data.whatsapp || '');
        setEmail(data.email || '');
        setInstagram(data.instagram || '');
        setTiktok(data.tiktok || '');

        setPoliticaTrocas(data.politicaTrocas || '');
        setPoliticaPrivacidade(data.politicaPrivacidade || '');
        setTermosUso(data.termosUso || '');
      }
    } catch (err: any) {
      console.error('Erro ao carregar dados da loja:', err);
      showToast('Falha ao carregar configurações da loja.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [tenantId]);

  // Consulta automática no ViaCEP
  const handleCepLookup = async (cepInput: string) => {
    const cleanCep = cepInput.replace(/\D/g, '');
    setCep(cepInput);

    if (cleanCep.length === 8) {
      setIsSearchingCep(true);
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const info = await res.json();
        if (!info.erro) {
          if (info.logradouro) setLogradouro(info.logradouro);
          if (info.bairro) setBairro(info.bairro);
          if (info.localidade) setCidade(info.localidade);
          if (info.uf) setEstado(info.uf);
          showToast(`Endereço de ${info.localidade}/${info.uf} preenchido via CEP!`);
        } else {
          showToast('CEP não encontrado na base dos Correios.', 'error');
        }
      } catch {
        // Falha silenciosa no ViaCEP
      } finally {
        setIsSearchingCep(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const res = await saveStoreGeneralSettings(tenantId, {
        nome,
        dominioProprio,
        whatsapp,
        email,
        razaoSocial,
        cnpj,
        inscricaoEstadual,
        cep,
        logradouro,
        numero,
        complemento,
        bairro,
        cidade,
        estado,
        horarioSemana,
        horarioSabado,
        horarioDomingo,
        instagram,
        tiktok,
        politicaTrocas,
        politicaPrivacidade,
        termosUso
      });

      if (res.success) {
        try {
          await refreshProducts();
        } catch {}
        showToast('Dados da loja e políticas salvos com sucesso!');
      } else {
        showToast(res.error || 'Erro ao salvar configurações.', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Erro inesperado.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center text-slate-500 shadow-xs">
        <RefreshCw className="w-6 h-6 animate-spin text-amber-600 mx-auto mb-2" />
        <span className="text-xs font-medium">Carregando dados cadastrais da loja...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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

      {/* BLOCO 1: DADOS CADASTRAIS & FISCAIS */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-bold">
              <Building className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                1. Identificação Cadastral & Fiscal
              </h2>
              <p className="text-[11px] text-slate-500">
                Informações da empresa utilizadas em notas fiscais, rodapé da loja e canais oficiais.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono">
            {slug}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block text-slate-700 mb-1 font-bold">Nome Fantasia (Boutique)</label>
            <input
              type="text"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Leidy Boutique"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-slate-700 mb-1 font-bold">Razão Social Oficial</label>
            <input
              type="text"
              value={razaoSocial}
              onChange={(e) => setRazaoSocial(e.target.value)}
              placeholder="Ex: Leidyane Cristina da Silva ME"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-slate-700 mb-1 font-bold">CNPJ</label>
            <input
              type="text"
              value={cnpj}
              onChange={(e) => setCnpj(e.target.value)}
              placeholder="00.000.000/0001-00"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-slate-700 mb-1 font-bold">Inscrição Estadual (IE)</label>
            <input
              type="text"
              value={inscricaoEstadual}
              onChange={(e) => setInscricaoEstadual(e.target.value)}
              placeholder="Ex: ISENTO ou 90812345-67"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-slate-700 mb-1 font-bold">Identificador Único da Loja (Slug)</label>
            <input
              type="text"
              disabled
              value={slug}
              className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2.5 text-slate-600 font-mono text-xs cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* BLOCO: ENDEREÇO DA VITRINE & DOMÍNIO PRÓPRIO */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-bold">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                Endereço da Vitrine & Domínio Próprio
              </h2>
              <p className="text-[11px] text-slate-500">
                Configure como suas clientes acessam sua loja. Use o subdomínio oficial BCOMM ou conecte seu domínio exclusivo.
              </p>
            </div>
          </div>
          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
            dominioProprio.trim() 
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
              : 'bg-amber-50 text-amber-800 border-amber-200'
          }`}>
            {dominioProprio.trim() ? '🌐 Domínio Próprio Ativo' : '🟢 Subdomínio BCOMM Ativo'}
          </span>
        </div>

        {/* 1. Endereço Padrão da Plataforma */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold text-slate-800 block">
                Subdomínio Oficial Gratuito (Sempre Disponível)
              </span>
              <span className="text-[11px] text-slate-500">
                Funciona imediatamente para compartilhar catálogos, pedidos no WhatsApp e campanhas.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const url = `https://bcomm-shop.pages.dev/${slug || 'leidy-boutique'}`;
                  navigator.clipboard.writeText(url);
                  setCopiedLink(true);
                  setTimeout(() => setCopiedLink(false), 2500);
                  showToast('Link da vitrine copiado para a área de transferência!');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer shadow-2xs transition-colors"
                title="Copiar link da vitrine"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                <span>{copiedLink ? 'Copiado!' : 'Copiar Link'}</span>
              </button>

              <a
                href={`https://bcomm-shop.pages.dev/${slug || 'leidy-boutique'}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                title="Abrir vitrine em nova aba"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Abrir Vitrine ↗</span>
              </a>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-2.5 font-mono text-xs text-amber-900 font-semibold break-all select-all flex items-center justify-between">
            <span>https://bcomm-shop.pages.dev/{slug || 'leidy-boutique'}</span>
          </div>
        </div>

        {/* 2. Campo de Domínio Personalizado */}
        <div className="space-y-3 pt-2">
          <div>
            <label className="block text-slate-800 text-xs font-bold mb-1">
              Conectar Domínio Próprio Personalizado (Opcional)
            </label>
            <p className="text-[11px] text-slate-500 mb-2">
              Se você possui um domínio registrado (ex.: Registro.br, GoDaddy, Cloudflare), insira o endereço abaixo.
            </p>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-mono text-xs bg-slate-100 px-3 py-2.5 rounded-lg border border-slate-200 shrink-0 font-semibold">
                https://
              </span>
              <input
                type="text"
                value={dominioProprio}
                onChange={(e) => setDominioProprio(e.target.value)}
                placeholder="Ex: www.minhaboutique.com.br"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-mono text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
              />
              {dominioProprio.trim() && (
                <button
                  type="button"
                  onClick={() => setDominioProprio('')}
                  className="px-2.5 py-2.5 text-xs text-slate-400 hover:text-rose-600 border border-slate-200 rounded-lg bg-white shrink-0 cursor-pointer"
                  title="Limpar domínio próprio e voltar ao subdomínio oficial"
                >
                  Limpar
                </button>
              )}
            </div>
          </div>

          {/* Guia de Configuração DNS */}
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4 text-xs space-y-2">
            <span className="font-bold text-amber-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-700" />
              Como apontar seu domínio no Registro.br ou Cloudflare:
            </span>
            <p className="text-amber-800 text-[11px] leading-relaxed">
              Acesse a zona de DNS do seu provedor de domínio e crie a seguinte entrada:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-white/80 p-2.5 rounded-lg border border-amber-200 font-mono text-[11px]">
              <div><strong className="text-slate-500 block text-[9px] uppercase font-sans">Tipo:</strong> CNAME</div>
              <div><strong className="text-slate-500 block text-[9px] uppercase font-sans">Nome / Host:</strong> www</div>
              <div><strong className="text-slate-500 block text-[9px] uppercase font-sans">Destino / Valor:</strong> bcomm-shop.pages.dev</div>
            </div>
            <p className="text-slate-500 text-[10px] italic">
              * Após salvar as alterações nesta página, todos os botões &quot;Abrir Vitrine da Loja&quot; do painel redirecionarão automaticamente para seu domínio próprio com certificado SSL seguro.
            </p>
          </div>
        </div>
      </div>

      {/* BLOCO 2: ENDEREÇO DA BOUTIQUE FÍSICA & SEDE */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-700 border border-sky-200 flex items-center justify-center font-bold">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              2. Endereço da Boutique Física & Retiradas
            </h2>
            <p className="text-[11px] text-slate-500">
              Endereço exibido na página de retirada presencial e no rodapé institucional.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block text-slate-700 mb-1 font-bold">CEP (Busca Automática)</label>
            <div className="relative">
              <input
                type="text"
                value={cep}
                onChange={(e) => handleCepLookup(e.target.value)}
                placeholder="80000-000"
                maxLength={9}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 pr-8 text-slate-900 font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
              />
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                {isSearchingCep ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-600" />
                ) : (
                  <Search className="w-3.5 h-3.5 text-slate-400" />
                )}
              </div>
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-slate-700 mb-1 font-bold">Logradouro (Rua / Av.)</label>
            <input
              type="text"
              value={logradouro}
              onChange={(e) => setLogradouro(e.target.value)}
              placeholder="Ex: Rua XV de Novembro"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-slate-700 mb-1 font-bold">Número</label>
            <input
              type="text"
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              placeholder="Ex: 1234"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-slate-700 mb-1 font-bold">Complemento</label>
            <input
              type="text"
              value={complemento}
              onChange={(e) => setComplemento(e.target.value)}
              placeholder="Ex: Loja 02 - Térreo"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-slate-700 mb-1 font-bold">Bairro</label>
            <input
              type="text"
              value={bairro}
              onChange={(e) => setBairro(e.target.value)}
              placeholder="Ex: Centro"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-slate-700 mb-1 font-bold">Cidade</label>
            <input
              type="text"
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
              placeholder="Ex: Curitiba"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-slate-700 mb-1 font-bold">Estado (UF)</label>
            <input
              type="text"
              value={estado}
              maxLength={2}
              onChange={(e) => setEstado(e.target.value.toUpperCase())}
              placeholder="PR"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-mono font-bold uppercase focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
            />
          </div>
        </div>
      </div>

      {/* BLOCO 3: HORÁRIOS & ATENDIMENTO */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-700 border border-violet-200 flex items-center justify-center font-bold">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              3. Horários de Atendimento & Canais Oficiais
            </h2>
            <p className="text-[11px] text-slate-500">
              Canais que recebem os pedidos finalizados no WhatsApp e links sociais.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block text-slate-700 mb-1 font-bold">Segunda a Sexta-Feira</label>
            <input
              type="text"
              value={horarioSemana}
              onChange={(e) => setHorarioSemana(e.target.value)}
              placeholder="09:00 às 19:00"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-slate-700 mb-1 font-bold">Sábados</label>
            <input
              type="text"
              value={horarioSabado}
              onChange={(e) => setHorarioSabado(e.target.value)}
              placeholder="09:00 às 17:00"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-slate-700 mb-1 font-bold">Domingos e Feriados</label>
            <input
              type="text"
              value={horarioDomingo}
              onChange={(e) => setHorarioDomingo(e.target.value)}
              placeholder="Fechado"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs pt-2">
          <div>
            <label className="block text-slate-700 mb-1 font-bold">WhatsApp Oficial (com DDD)</label>
            <div className="relative">
              <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="554197347601"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 text-slate-900 font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 mb-1 font-bold">E-mail de Contato</label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contato@leidyboutique.com.br"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 mb-1 font-bold">Instagram Oficial</label>
            <div className="relative">
              <InstagramIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="@leidyboutique_oficial"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 mb-1 font-bold">TikTok / Vídeos</label>
            <div className="relative">
              <Video className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={tiktok}
                onChange={(e) => setTiktok(e.target.value)}
                placeholder="@leidyboutique"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* BLOCO 4: POLÍTICAS LEGAIS & TERMOS */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              4. Políticas da Loja & Conformidade Jurídica
            </h2>
            <p className="text-[11px] text-slate-500">
              Textos exibidos no rodapé da vitrine, modal de políticas e checkout (CDC Art. 49 e LGPD).
            </p>
          </div>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 mb-1 font-bold">
              Política de Trocas e Devoluções (Código de Defesa do Consumidor)
            </label>
            <textarea
              rows={3}
              value={politicaTrocas}
              onChange={(e) => setPoliticaTrocas(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-xs"
            />
          </div>

          <div>
            <label className="block text-slate-700 mb-1 font-bold">
              Política de Privacidade e Proteção de Dados (LGPD)
            </label>
            <textarea
              rows={3}
              value={politicaPrivacidade}
              onChange={(e) => setPoliticaPrivacidade(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-xs"
            />
          </div>

          <div>
            <label className="block text-slate-700 mb-1 font-bold">
              Termos de Uso & Condições Gerais de Compra
            </label>
            <textarea
              rows={3}
              value={termosUso}
              onChange={(e) => setTermosUso(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-xs"
            />
          </div>
        </div>
      </div>

      {/* BOTÃO SALVAR FIXO/RODAPÉ */}
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
          <span>{isSaving ? 'Salvando Alterações...' : 'Salvar Dados da Loja'}</span>
        </button>
      </div>
    </form>
  );
}

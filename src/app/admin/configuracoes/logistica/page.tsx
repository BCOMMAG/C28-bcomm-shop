'use client';

import React, { useState, useEffect } from 'react';
import {
  Truck,
  Package,
  MapPin,
  Clock,
  Sparkles,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Store,
  DollarSign,
  Info,
  ShieldCheck,
  Zap,
  Key,
  Eye,
  EyeOff,
  Sliders,
  Check,
  ChevronDown,
  ChevronUp,
  ArrowRight
} from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { DEFAULT_TENANT_ID } from '@/lib/products';
import {
  getStoreSettings,
  saveStoreGeneralSettings
} from '@/lib/admin';
import {
  LogisticaAvancadaConfig,
  CONFIG_LOGISTICA_DEFAULT,
  SERVICOS_PADRAO_MELHOR_ENVIO,
  TransportadoraHabilitada,
  FaixaDescontoProgressivo
} from '@/lib/shipping-engine';
import { fetchAddressByCep, fetchStoreShippingOptions } from '@/utils/shipping';

export default function ShippingSettingsPage() {
  const { currentTenant, refreshProducts } = useStore();
  const tenantId = currentTenant?.id || DEFAULT_TENANT_ID;

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTestingToken, setIsTestingToken] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; rates?: any[] } | null>(null);

  // Simulador de Frete ao Vivo no Admin
  const [simuladorCep, setSimuladorCep] = useState('01001000');
  const [simuladorSubtotal, setSimuladorSubtotal] = useState(380);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simuladorResult, setSimuladorResult] = useState<any[] | null>(null);

  // Visibilidade do Token
  const [showToken, setShowToken] = useState(false);

  // Estados de Configuração Avançada
  const [config, setConfig] = useState<LogisticaAvancadaConfig>(CONFIG_LOGISTICA_DEFAULT);

  // Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await getStoreSettings(tenantId);
        if (data) {
          if (data.logisticaAvancada) {
            setConfig({
              ...CONFIG_LOGISTICA_DEFAULT,
              ...data.logisticaAvancada,
              servicos_habilitados: data.logisticaAvancada.servicos_habilitados || SERVICOS_PADRAO_MELHOR_ENVIO
            });
          } else {
            // Retrocompatibilidade
            setConfig((prev) => ({
              ...prev,
              regras_frete_gratis: {
                ...prev.regras_frete_gratis,
                valor_minimo_padrao: Number(data.freteGratisValor || 350)
              },
              prazo_manuseio_dias: Number(data.prazoManuseioDias ?? 1),
              retirada_boutique_ativa: data.retiradaBoutiqueAtiva ?? true,
              instrucoes_retirada: data.instrucoesRetirada || prev.instrucoes_retirada,
              entrega_local_ativa: data.entregaLocalAtiva ?? true,
              entrega_local_taxa: Number(data.entregaLocalTaxa ?? 18.00),
              entrega_local_bairros: data.entregaLocalBairros || prev.entrega_local_bairros
            }));
          }
        }
      } catch (err) {
        console.error('Erro ao buscar parâmetros de envio:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tenantId]);

  // Busca endereço automático ao digitar CEP de origem
  const handleCepOrigemChange = async (novoCep: string) => {
    const clean = novoCep.replace(/\D/g, '').slice(0, 8);
    setConfig((prev) => ({ ...prev, cep_origem: clean }));

    if (clean.length === 8) {
      try {
        const addr = await fetchAddressByCep(clean);
        if (addr) {
          showToast(`Origem localizada: ${addr.localidade}/${addr.uf} (${addr.bairro || 'Centro'})`);
        }
      } catch {}
    }
  };

  // Toggle de transportadora específica
  const toggleServico = (codigo: string) => {
    setConfig((prev) => {
      const atualizados = prev.servicos_habilitados.map((s) => {
        if (s.codigo === codigo) {
          return { ...s, ativo: !s.ativo };
        }
        return s;
      });
      return { ...prev, servicos_habilitados: atualizados };
    });
  };

  // Alteração de nome personalizado do serviço (White-Label)
  const handleNomePersonalizadoChange = (codigo: string, nome: string) => {
    setConfig((prev) => {
      const atualizados = prev.servicos_habilitados.map((s) => {
        if (s.codigo === codigo) {
          return { ...s, nome_personalizado: nome };
        }
        return s;
      });
      return { ...prev, servicos_habilitados: atualizados };
    });
  };

  // Testar Conexão com o Melhor Envio ao Vivo
  const handleTestConnection = async () => {
    if (!config.token_melhor_envio) {
      showToast('Por favor insira o Token de Acesso do Melhor Envio.', 'error');
      return;
    }

    setIsTestingToken(true);
    setTestResult(null);

    try {
      const data = await fetchStoreShippingOptions({
        lojaId: tenantId,
        config,
        cepDestino: '01001000', // Praça da Sé, SP
        subtotal: 250,
        totalPecas: 1,
        ufDestino: 'SP',
        cidadeDestino: 'São Paulo'
      });

      if (data.options?.length > 0) {
        setTestResult({
          success: true,
          message: `Conexão bem-sucedida! ${data.options.length} modalidades calculadas em tempo real com sucesso.`,
          rates: data.options
        });
        showToast('Conexão com Melhor Envio validada com sucesso!');
      } else {
        setTestResult({
          success: false,
          message: 'Não foi possível cotar frete com as credenciais informadas.'
        });
        showToast('Falha na validação do token.', 'error');
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || 'Erro inesperado ao conectar à API.'
      });
      showToast('Erro de conexão.', 'error');
    } finally {
      setIsTestingToken(false);
    }
  };

  // Executar Simulação no Simulador ao Vivo
  const handleRunSimulation = async () => {
    const cleanCep = simuladorCep.replace(/\D/g, '');
    if (cleanCep.length !== 8) {
      showToast('Digite um CEP válido com 8 dígitos para simular.', 'error');
      return;
    }

    setIsSimulating(true);
    try {
      const data = await fetchStoreShippingOptions({
        lojaId: tenantId,
        config,
        cepDestino: cleanCep,
        subtotal: Number(simuladorSubtotal),
        totalPecas: Math.max(1, Math.round(Number(simuladorSubtotal) / 150))
      });

      if (data.options) {
        setSimuladorResult(data.options);
      }
    } catch (err) {
      console.error('Erro na simulação:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const res = await saveStoreGeneralSettings(tenantId, {
        freteGratisValor: Number(config.regras_frete_gratis?.valor_minimo_padrao || 350),
        prazoManuseioDias: Number(config.prazo_manuseio_dias || 1),
        retiradaBoutiqueAtiva: Boolean(config.retirada_boutique_ativa),
        instrucoesRetirada: config.instrucoes_retirada,
        entregaLocalAtiva: Boolean(config.entrega_local_ativa),
        entregaLocalTaxa: Number(config.entrega_local_taxa || 18.00),
        entregaLocalBairros: config.entrega_local_bairros,
        logisticaAvancada: config
      });

      if (res.success) {
        try {
          await refreshProducts();
        } catch {}
        showToast('Todas as configurações de frete e regras comerciais foram salvas!');
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
        <span className="text-xs font-medium">Carregando parâmetros logísticos...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl">
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

      {/* CABEÇALHO */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-serif-luxury">
              Logística, Frete & Descontos Comerciais
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-600" /> Autonomia Total
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Configure o cálculo automático de frete, selecione quais transportadoras exibir, crie regras de frete grátis por região e subsídios progressivos.
          </p>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs font-bold uppercase tracking-wider shadow-md transition-all cursor-pointer disabled:opacity-50 self-start sm:self-auto shrink-0"
        >
          {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{isSaving ? 'Salvando...' : 'Salvar Configurações'}</span>
        </button>
      </div>

      {/* BLOCO 1: PROVEDOR DE CÁLCULO & CREDENCIAIS (MELHOR ENVIO) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-700 border border-sky-200 flex items-center justify-center font-bold">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                1. Integração Automática (Melhor Envio) & CEP de Origem
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">
                Correios + Jadlog
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Conexão com a maior rede de envio com desconto do Brasil. O cálculo é feito instantaneamente na sacola e no checkout.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
          {/* Provedor e Ambiente */}
          <div className="space-y-4">
            <div>
              <label className="block text-slate-700 mb-1 font-bold">
                Motor de Frete Ativo
              </label>
              <select
                value={config.provedor}
                onChange={(e) => setConfig((prev) => ({ ...prev, provedor: e.target.value as any }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
              >
                <option value="melhor_envio">Melhor Envio (Cálculo Automático Correios & Jadlog)</option>
                <option value="manual">Tabela Regional Própria (Cálculo Fixo)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 mb-1 font-bold">
                Ambiente de Conexão
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setConfig((prev) => ({ ...prev, ambiente: 'sandbox' }))}
                  className={`p-2.5 rounded-lg border text-center font-bold text-xs transition-all cursor-pointer ${
                    config.ambiente === 'sandbox'
                      ? 'border-sky-600 bg-sky-50 text-sky-900 ring-2 ring-sky-600/20'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  🧪 Sandbox (Testes)
                </button>
                <button
                  type="button"
                  onClick={() => setConfig((prev) => ({ ...prev, ambiente: 'production' }))}
                  className={`p-2.5 rounded-lg border text-center font-bold text-xs transition-all cursor-pointer ${
                    config.ambiente === 'production'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-600/20'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  🚀 Produção Oficial
                </button>
              </div>
            </div>

            <div>
              <label className="block text-slate-700 mb-1 font-bold">
                CEP de Origem (De onde saem os pacotes da loja)
              </label>
              <div className="relative">
                <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={config.cep_origem}
                  onChange={(e) => handleCepOrigemChange(e.target.value)}
                  placeholder="83005000"
                  maxLength={9}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Utilizado para calcular a distância e prazo exatos até o CEP da cliente.
              </span>
            </div>
          </div>

          {/* Token e Botão Testar Conexão */}
          <div className="space-y-4 flex flex-col justify-between">
            <div>
              <label className="block text-slate-700 mb-1 font-bold">
                Token de Acesso do Melhor Envio (Bearer Token)
              </label>
              <div className="relative">
                <Key className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showToken ? 'text' : 'password'}
                  required
                  value={config.token_melhor_envio || ''}
                  onChange={(e) => setConfig((prev) => ({ ...prev, token_melhor_envio: e.target.value }))}
                  placeholder="Cole aqui o token gerado na sua conta..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-10 py-2.5 text-slate-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  title={showToken ? 'Ocultar' : 'Exibir'}
                >
                  {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Gerado na aba <em>Integrações &gt; Permissões de Acesso</em> da sua conta do Melhor Envio.
              </span>
            </div>

            {/* Resultado do Teste de Conexão */}
            {testResult && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                  testResult.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div className="text-[11px] leading-relaxed">
                  <strong>{testResult.success ? 'Conexão Estabelecida!' : 'Atenção:'}</strong> {testResult.message}
                </div>
              </div>
            )}

            <div className="pt-2">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTestingToken}
                className="w-full py-2.5 px-4 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
              >
                {isTestingToken ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-sky-600" />
                )}
                <span>{isTestingToken ? 'Validando Token com a API...' : 'Testar Conexão em Tempo Real'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* BLOCO 2: AUTONOMIA DE MODALIDADES & NOMES EXIBIDOS (FILTRO POR SWITCH) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-bold">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                2. Autonomia de Modalidades (Quais Transportadoras Você Quer Exibir?)
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                Controle Total
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Você não é obrigado a mostrar todas as opções da API. Desmarque as que não quiser e personalize o nome exibido na loja.
            </p>
          </div>
        </div>

        {/* Tabela de Serviços com Switches */}
        <div className="space-y-3">
          {config.servicos_habilitados.map((servico) => (
            <div
              key={servico.codigo}
              className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs ${
                servico.ativo
                  ? 'bg-white border-slate-200 shadow-2xs'
                  : 'bg-slate-50/70 border-slate-200 opacity-60'
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id={`servico_${servico.codigo}`}
                  checked={servico.ativo}
                  onChange={() => toggleServico(servico.codigo)}
                  className="mt-1 w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300 cursor-pointer"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <label
                      htmlFor={`servico_${servico.codigo}`}
                      className="font-bold text-slate-900 cursor-pointer text-sm"
                    >
                      {servico.transportadora} {servico.nome}
                    </label>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        servico.ativo
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {servico.ativo ? 'Visível na Loja' : 'Oculto para Clientes'}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    Código interno: <code className="font-mono text-slate-600">{servico.codigo}</code>
                  </span>
                </div>
              </div>

              {servico.ativo && (
                <div className="flex-1 max-w-sm">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Nome Exibido na Vitrine / Checkout:
                  </label>
                  <input
                    type="text"
                    value={servico.nome_personalizado || servico.nome}
                    onChange={(e) => handleNomePersonalizadoChange(servico.codigo, e.target.value)}
                    placeholder="Ex: Entrega Expressa Prioritária"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white text-xs"
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* MODO DE APRESENTAÇÃO */}
        <div className="pt-4 border-t border-slate-100">
          <label className="block text-slate-800 font-bold mb-2 text-xs">
            Modo de Apresentação ao Consumidor (White-Label):
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div
              onClick={() => setConfig((prev) => ({ ...prev, modo_exibicao: 'transparente' }))}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                config.modo_exibicao === 'transparente'
                  ? 'border-amber-600 bg-amber-50/60 ring-2 ring-amber-600/20'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="font-bold text-slate-900 flex items-center gap-1.5 mb-1">
                <span>Transparência Total</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Exibe o nome real das transportadoras (ex: <em>&quot;SEDEX (Correios)&quot;</em> e <em>&quot;Jadlog&quot;</em>).
              </p>
            </div>

            <div
              onClick={() => setConfig((prev) => ({ ...prev, modo_exibicao: 'white_label' }))}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                config.modo_exibicao === 'white_label'
                  ? 'border-amber-600 bg-amber-50/60 ring-2 ring-amber-600/20'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="font-bold text-slate-900 flex items-center gap-1.5 mb-1">
                <span>White-Label / Marca Própria</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Oculta as empresas e mostra apenas termos da boutique: <em>&quot;Entrega Expressa&quot;</em> e <em>&quot;Econômica&quot;</em>.
              </p>
            </div>

            <div
              onClick={() => setConfig((prev) => ({ ...prev, modo_exibicao: 'tarifa_unica' }))}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                config.modo_exibicao === 'tarifa_unica'
                  ? 'border-amber-600 bg-amber-50/60 ring-2 ring-amber-600/20'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="font-bold text-slate-900 flex items-center gap-1.5 mb-1">
                <span>Tarifa Única Mais Barata</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Calcula tudo nos bastidores e exibe apenas a menor tarifa. Você decide no balcão por onde despachar.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* BLOCO 3: REGRAS DE FRETE GRÁTIS & DESCONTO PROGRESSIVO (SUBSÍDIO) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                3. Frete Grátis & Descontos Progressivos (Subsídio de Frete)
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Incentivo de Vendas
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Parametrize metas de frete grátis e descontos automáticos proporcionais ao valor da compra da cliente.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
          {/* Meta Padrão de Frete Grátis */}
          <div>
            <label className="block text-slate-700 mb-1 font-bold">
              Valor Mínimo para Frete Grátis (R$)
            </label>
            <div className="relative">
              <span className="text-slate-400 font-bold absolute left-3 top-1/2 -translate-y-1/2">R$</span>
              <input
                type="number"
                min="0"
                step="10"
                value={config.regras_frete_gratis?.valor_minimo_padrao || 350}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    regras_frete_gratis: {
                      ...prev.regras_frete_gratis,
                      valor_minimo_padrao: Number(e.target.value)
                    }
                  }))
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-3 py-2.5 text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              Refletido na régua de progresso da sacola (&quot;Faltam R$ X para Frete Grátis&quot;).
            </span>
          </div>

          {/* Teto de Isenção (Proteção contra frete muito caro) */}
          <div>
            <label className="block text-slate-700 mb-1 font-bold">
              Teto Máximo de Isenção (R$)
            </label>
            <div className="relative">
              <span className="text-slate-400 font-bold absolute left-3 top-1/2 -translate-y-1/2">R$</span>
              <input
                type="number"
                min="0"
                step="5"
                value={config.regras_frete_gratis?.teto_maximo_subsidio || 50}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    regras_frete_gratis: {
                      ...prev.regras_frete_gratis,
                      teto_maximo_subsidio: Number(e.target.value)
                    }
                  }))
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-3 py-2.5 text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              Proteção de margem: se o frete der R$ 65 e o teto for R$ 50, a loja cobre R$ 50 e o cliente paga só R$ 15.
            </span>
          </div>
        </div>

        {/* Desconto Progressivo por Faixas */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              Faixas de Desconto Progressivo no Frete (Subsídio Escalonado)
            </span>
            <span className="text-[10px] font-bold text-slate-500">Incentiva pedidos de ticket alto</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-1">
            <div className="bg-white p-3 rounded-lg border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">A partir de R$ 500</span>
              <strong className="text-emerald-700 text-sm font-bold block mt-0.5">R$ 15,00 OFF no frete</strong>
              <span className="text-[10px] text-slate-500">Abatimento automático</span>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">A partir de R$ 1.000</span>
              <strong className="text-emerald-700 text-sm font-bold block mt-0.5">R$ 30,00 OFF no frete</strong>
              <span className="text-[10px] text-slate-500">Abatimento automático</span>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">A partir de R$ 2.000</span>
              <strong className="text-emerald-700 text-sm font-bold block mt-0.5">R$ 60,00 OFF no frete</strong>
              <span className="text-[10px] text-slate-500">Abatimento automático</span>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">A partir de R$ 3.000</span>
              <strong className="text-emerald-700 text-sm font-bold block mt-0.5">Frete 100% Grátis</strong>
              <span className="text-[10px] text-slate-500">Qualquer transportadora</span>
            </div>
          </div>
        </div>
      </div>

      {/* BLOCO 4: PACOTE DE MODA, DIAS DE MANUSEIO & EMBALAGEM */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center font-bold">
            <Package className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              4. Pacote Padrão de Moda, Custos de Embalagem & Manuseio
            </h2>
            <p className="text-[11px] text-slate-500">
              Piloto automático: você não precisa pesar nem medir cada vestido na balança. O sistema faz o cálculo multiplicando pela quantidade de peças.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block text-slate-700 mb-1 font-bold">
              Peso Médio por Peça (Gramas)
            </label>
            <div className="relative">
              <input
                type="number"
                min="50"
                step="50"
                value={config.peso_padrao_peca_gramas || 300}
                onChange={(e) => setConfig((prev) => ({ ...prev, peso_padrao_peca_gramas: Number(e.target.value) }))}
                placeholder="300"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">g</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              3 peças no carrinho = 900g enviadas aos Correios.
            </span>
          </div>

          <div>
            <label className="block text-slate-700 mb-1 font-bold">
              Sobretaxa de Embalagem / Caixa (R$)
            </label>
            <div className="relative">
              <span className="text-slate-400 font-bold absolute left-3 top-1/2 -translate-y-1/2">R$</span>
              <input
                type="number"
                min="0"
                step="0.5"
                value={config.sobretaxa_embalagem_reais ?? 2.50}
                onChange={(e) => setConfig((prev) => ({ ...prev, sobretaxa_embalagem_reais: Number(e.target.value) }))}
                placeholder="2.50"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
              />
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              Cobre papel de seda, caixa e fita da boutique.
            </span>
          </div>

          <div>
            <label className="block text-slate-700 mb-1 font-bold">
              Prazo Adicional de Manuseio (Dias)
            </label>
            <div className="relative">
              <Clock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="number"
                min="0"
                max="10"
                value={config.prazo_manuseio_dias ?? 1}
                onChange={(e) => setConfig((prev) => ({ ...prev, prazo_manuseio_dias: Number(e.target.value) }))}
                placeholder="1"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
              />
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              Dias úteis somados ao prazo para passar e embalar.
            </span>
          </div>
        </div>
      </div>

      {/* BLOCO 5: ENTREGAS LOCAIS (MOTOBOY & RETIRADA NA BOUTIQUE) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-700 border border-violet-200 flex items-center justify-center font-bold">
            <Store className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              5. Modalidades Locais (Boutique Física)
            </h2>
            <p className="text-[11px] text-slate-500">
              Opções exibidas automaticamente apenas para clientes que moram na cidade e região da loja.
            </p>
          </div>
        </div>

        {/* Motoboy Express */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-slate-900 block">Entrega Expressa via Motoboy</span>
                <span className="text-[11px] text-slate-500">Entrega no mesmo dia para pedidos locais</span>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.entrega_local_ativa}
                onChange={(e) => setConfig((prev) => ({ ...prev, entrega_local_ativa: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
            </label>
          </div>

          {config.entrega_local_ativa && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-slate-700 mb-1 font-bold">Taxa Fixa do Motoboy (R$)</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={config.entrega_local_taxa ?? 18.00}
                  onChange={(e) => setConfig((prev) => ({ ...prev, entrega_local_taxa: Number(e.target.value) }))}
                  placeholder="18.00"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-700 mb-1 font-bold">Cidades e Bairros Atendidos</label>
                <input
                  type="text"
                  value={config.entrega_local_bairros || ''}
                  onChange={(e) => setConfig((prev) => ({ ...prev, entrega_local_bairros: e.target.value }))}
                  placeholder="Curitiba e Região Metropolitana"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>
            </div>
          )}
        </div>

        {/* Retirada na Boutique */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-700 border border-violet-200 flex items-center justify-center font-bold">
                <Store className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-slate-900 block">Retirada na Boutique Física</span>
                <span className="text-[11px] text-slate-500">A cliente compra online e retira no balcão sem pagar frete</span>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.retirada_boutique_ativa}
                onChange={(e) => setConfig((prev) => ({ ...prev, retirada_boutique_ativa: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600" />
            </label>
          </div>

          {config.retirada_boutique_ativa && (
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-slate-700 mb-1 font-bold">Instruções para Retirada Presencial</label>
              <textarea
                rows={2}
                value={config.instrucoes_retirada || ''}
                onChange={(e) => setConfig((prev) => ({ ...prev, instrucoes_retirada: e.target.value }))}
                placeholder="Ex: Disponível para retirada em até 2 horas úteis..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white text-xs"
              />
            </div>
          )}
        </div>
      </div>

      {/* BLOCO 6: SIMULADOR DE TESTE AO VIVO NO ADMIN */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-700 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-amber-400" />
              <h3 className="font-bold text-sm text-white">Simulador de Frete ao Vivo (Visão da Cliente)</h3>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Digite um CEP de teste para ver na hora como as suas regras e os descontos aparecem na vitrine.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={simuladorCep}
              onChange={(e) => setSimuladorCep(e.target.value)}
              placeholder="01001000"
              maxLength={9}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-amber-500 w-28 text-center"
            />
            <button
              type="button"
              onClick={handleRunSimulation}
              disabled={isSimulating}
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSimulating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
              <span>Simular</span>
            </button>
          </div>
        </div>

        {simuladorResult && simuladorResult.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
            {simuladorResult.map((opt: any) => (
              <div
                key={opt.id}
                className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs">{opt.name}</span>
                    <span
                      className={`text-[11px] font-black font-mono ${
                        opt.price === 0 ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {opt.formattedPrice}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-1">{opt.description}</span>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-700/60 flex items-center justify-between text-[10px] text-slate-400">
                  <span>Prazo: {opt.deliveryDays}</span>
                  <span className="text-emerald-400 font-semibold">Ativo na Loja</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 text-center py-4">
            Clique em &quot;Simular&quot; para rodar a cotação em tempo real com as regras configuradas acima.
          </p>
        )}
      </div>

      {/* BOTÃO SALVAR RODAPÉ */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs font-bold uppercase tracking-wider shadow-md transition-all cursor-pointer disabled:opacity-50"
        >
          {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{isSaving ? 'Salvando Configurações...' : 'Salvar Todas as Regras de Frete'}</span>
        </button>
      </div>
    </form>
  );
}

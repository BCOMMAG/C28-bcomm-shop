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
  ArrowRight,
  Copy,
  Trash2,
  Plus
} from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { useAdminUnsavedChanges } from '@/context/AdminUnsavedChangesContext';
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
  FaixaDescontoProgressivo,
  EntregaMotoboyConfig,
  CoordenadasGeograficas,
  fetchCepCoordinates
} from '@/lib/shipping-engine';
import { fetchAddressByCep, fetchStoreShippingOptions } from '@/utils/shipping';
import { LogisticsRadiusMap } from '@/components/admin/LogisticsRadiusMap';
import { useAdminI18n } from '@/context/AdminI18nContext';

export default function ShippingSettingsPage() {
  const { currentTenant, refreshProducts } = useStore();
  const { t, locale, formatCurrency, currency } = useAdminI18n();
  const currencySymbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : 'R$';
  const tenantId = currentTenant?.id || DEFAULT_TENANT_ID;

  const initialConfigRef = React.useRef<string>('');
  const { setIsDirty, registerSaveHandler, setFormName } = useAdminUnsavedChanges();

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTestingToken, setIsTestingToken] = useState(false);
  const [isImportingAddress, setIsImportingAddress] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; rates?: any[] } | null>(null);

  // Registra nome do formulário para o modal de proteção
  useEffect(() => {
    setFormName(t.storeLogistics.formName);
  }, [setFormName]);

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
            let loadedConfig: LogisticaAvancadaConfig = {
              ...CONFIG_LOGISTICA_DEFAULT,
              ...data.logisticaAvancada,
              servicos_habilitados: data.logisticaAvancada.servicos_habilitados || SERVICOS_PADRAO_MELHOR_ENVIO
            };

            // Auto-cura de coordenadas legadas ou corrompidas (ex: ponto antigo de Cascatinha)
            const cleanOrigin = (loadedConfig.cep_origem || '').replace(/\D/g, '');
            const isLegacyCascatinha =
              cleanOrigin === '82010600' &&
              (loadedConfig.origem_coordenadas?.bairro === 'Cascatinha' ||
                Math.abs((loadedConfig.origem_coordenadas?.latitude || 0) - (-25.4055)) < 0.005);

            if (isLegacyCascatinha || !loadedConfig.origem_coordenadas?.latitude) {
              const freshCoords = await fetchCepCoordinates(cleanOrigin || '82010600');
              if (freshCoords) {
                loadedConfig.origem_coordenadas = freshCoords;
                if (loadedConfig.entrega_motoboy) {
                  loadedConfig.entrega_motoboy.origem_coordenadas = freshCoords;
                }
              }
            }

            setConfig(loadedConfig);
            initialConfigRef.current = JSON.stringify(loadedConfig);
          } else {
            // Retrocompatibilidade
            const fallbackConfig: LogisticaAvancadaConfig = {
              ...CONFIG_LOGISTICA_DEFAULT,
              regras_frete_gratis: {
                ...CONFIG_LOGISTICA_DEFAULT.regras_frete_gratis,
                valor_minimo_padrao: Number(data.freteGratisValor || 350)
              },
              prazo_manuseio_dias: Number(data.prazoManuseioDias ?? 1),
              retirada_boutique_ativa: data.retiradaBoutiqueAtiva ?? true,
              instrucoes_retirada: data.instrucoesRetirada || CONFIG_LOGISTICA_DEFAULT.instrucoes_retirada,
              entrega_local_ativa: data.entregaLocalAtiva ?? true,
              entrega_local_taxa: Number(data.entregaLocalTaxa ?? 18.00),
              entrega_local_bairros: data.entregaLocalBairros || CONFIG_LOGISTICA_DEFAULT.entrega_local_bairros
            };
            setConfig(fallbackConfig);
            initialConfigRef.current = JSON.stringify(fallbackConfig);
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

  // Monitora alterações pendentes e atualiza o estado dirty
  useEffect(() => {
    if (!loading && initialConfigRef.current) {
      const isChanged = JSON.stringify(config) !== initialConfigRef.current;
      setIsDirty(isChanged);
    }
  }, [config, loading, setIsDirty]);

  // Importa endereço completo cadastrado em Dados da Loja
  const handleImportStoreAddress = async () => {
    setIsImportingAddress(true);
    try {
      const data = await getStoreSettings(tenantId);
      if (data) {
        const cleanCep = (data.cep || '').replace(/\D/g, '');
        const coords = await fetchCepCoordinates(cleanCep || '82010600', {
          rua: data.logradouro,
          numero: data.numero,
          bairro: data.bairro,
          cidade: data.cidade,
          uf: data.estado
        });

        const newCoords: CoordenadasGeograficas = {
          latitude: coords?.latitude || -25.4223,
          longitude: coords?.longitude || -49.3346,
          cidade: data.cidade || 'Curitiba',
          uf: data.estado || 'PR',
          bairro: data.bairro || 'Santo Inácio',
          logradouro: data.logradouro || 'Rua José Boiko',
          numero: data.numero || '',
          complemento: data.complemento || '',
          cep: cleanCep || '82010600',
          precision: coords?.precision
        };

        setConfig((prev) => ({
          ...prev,
          cep_origem: cleanCep || prev.cep_origem,
          origem_coordenadas: newCoords,
          entrega_motoboy: {
            ...(prev.entrega_motoboy || {
              ativo: true,
              raio_maximo_km: 15,
              taxa_tipo: 'fixa',
              taxa_fixa_reais: 18.00,
              horario_limite_mesmo_dia: '14:00',
              dias_semana_disponiveis: [1, 2, 3, 4, 5, 6]
            }),
            origem_coordenadas: newCoords
          }
        }));

        const streetInfo = newCoords.logradouro
          ? `${newCoords.logradouro}${newCoords.numero ? `, Nº ${newCoords.numero}` : ''}`
          : cleanCep;
        showToast(t.storeLogistics.importedAddressSuccess(streetInfo));
      }
    } catch (err) {
      showToast(t.storeLogistics.importedAddressError, 'error');
    } finally {
      setIsImportingAddress(false);
    }
  };

  // Atualiza campos específicos do endereço completo de expedição
  const handleAddressFieldChange = async (field: keyof CoordenadasGeograficas, value: string) => {
    setConfig((prev) => {
      const current = prev.origem_coordenadas || {
        latitude: -25.4223,
        longitude: -49.3346,
        cidade: 'Curitiba',
        uf: 'PR',
        cep: prev.cep_origem || '82010600'
      };
      const updatedCoords: CoordenadasGeograficas = {
        ...current,
        [field]: value
      };
      return {
        ...prev,
        origem_coordenadas: updatedCoords,
        entrega_motoboy: prev.entrega_motoboy
          ? { ...prev.entrega_motoboy, origem_coordenadas: updatedCoords }
          : undefined
      };
    });

    if ((field === 'numero' || field === 'logradouro') && value.trim().length >= 1) {
      try {
        const cleanCep = (config.cep_origem || '').replace(/\D/g, '');
        const targetRua = field === 'logradouro' ? value : config.origem_coordenadas?.logradouro;
        const targetNum = field === 'numero' ? value : config.origem_coordenadas?.numero;

        const coords = await fetchCepCoordinates(cleanCep, {
          rua: targetRua,
          numero: targetNum,
          bairro: config.origem_coordenadas?.bairro,
          cidade: config.origem_coordenadas?.cidade,
          uf: config.origem_coordenadas?.uf
        });

        if (coords?.latitude && coords?.longitude) {
          setConfig((prev) => {
            const freshCoords: CoordenadasGeograficas = {
              ...(prev.origem_coordenadas || {}),
              latitude: coords.latitude,
              longitude: coords.longitude,
              cidade: coords.cidade || prev.origem_coordenadas?.cidade,
              uf: coords.uf || prev.origem_coordenadas?.uf,
              bairro: coords.bairro || prev.origem_coordenadas?.bairro,
              logradouro: targetRua || coords.logradouro || prev.origem_coordenadas?.logradouro,
              numero: targetNum || coords.numero || prev.origem_coordenadas?.numero,
              cep: cleanCep,
              precision: coords.precision
            };
            return {
              ...prev,
              origem_coordenadas: freshCoords,
              entrega_motoboy: prev.entrega_motoboy
                ? { ...prev.entrega_motoboy, origem_coordenadas: freshCoords }
                : undefined
            };
          });
        }
      } catch {}
    }
  };

  // Busca coordenadas geográficas e endereço automático ao digitar CEP de origem
  const handleCepOrigemChange = async (novoCep: string) => {
    const clean = novoCep.replace(/\D/g, '').slice(0, 8);
    setConfig((prev) => ({ ...prev, cep_origem: clean }));

    if (clean.length === 8) {
      try {
        // 1. Busca coordenadas geográficas para atualizar o mapa e o círculo instantaneamente
        const coords = await fetchCepCoordinates(clean, {
          numero: config.origem_coordenadas?.numero
        });
        if (coords && coords.latitude && coords.longitude) {
          setConfig((prev) => {
            const freshCoords: CoordenadasGeograficas = {
              ...(prev.origem_coordenadas || {}),
              latitude: coords.latitude,
              longitude: coords.longitude,
              cidade: coords.cidade || prev.origem_coordenadas?.cidade,
              uf: coords.uf || prev.origem_coordenadas?.uf,
              bairro: coords.bairro || prev.origem_coordenadas?.bairro,
              logradouro: coords.logradouro || prev.origem_coordenadas?.logradouro,
              cep: clean,
              precision: coords.precision
            };
            return {
              ...prev,
              origem_coordenadas: freshCoords,
              entrega_motoboy: {
                ...(prev.entrega_motoboy || {
                  ativo: true,
                  raio_maximo_km: 15,
                  taxa_tipo: 'fixa',
                  taxa_fixa_reais: 18.00,
                  horario_limite_mesmo_dia: '14:00',
                  dias_semana_disponiveis: [1, 2, 3, 4, 5, 6]
                }),
                origem_coordenadas: freshCoords
              }
            };
          });
          const streetInfo = coords.logradouro
            ? `${coords.logradouro}, ${coords.bairro || ''} (${coords.cidade}/${coords.uf})`
            : `${coords.cidade || 'Origem'}/${coords.uf || 'UF'}`;
          showToast(`Loja localizada no mapa: ${streetInfo}`);
        } else {
          const addr = await fetchAddressByCep(clean);
          if (addr) {
            showToast(`Origem localizada: ${addr.localidade}/${addr.uf} (${addr.bairro || 'Centro'})`);
          }
        }
      } catch (err) {
        console.warn('Erro ao atualizar coordenadas do CEP de origem:', err);
      }
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

  // Testar Conexão Oficial com o Melhor Envio ao Vivo
  const handleTestConnection = async () => {
    setIsTestingToken(true);
    setTestResult(null);

    try {
      const data = await fetchStoreShippingOptions({
        lojaId: tenantId,
        config: {
          ...config,
          token_melhor_envio: config.token_melhor_envio || CONFIG_LOGISTICA_DEFAULT.token_melhor_envio
        },
        cepDestino: '01001000', // Praça da Sé, SP
        subtotal: 250,
        totalPecas: 1,
        ufDestino: 'SP',
        cidadeDestino: 'São Paulo'
      });

      if (data.options?.length > 0) {
        setTestResult({
          success: true,
          message: t.storeLogistics.testConnSuccess(data.options.length, data.options.map((o: any) => o.name).join(', ')),
          rates: data.options
        });
        showToast(t.storeLogistics.testConnSuccessToast);
      } else {
        setTestResult({
          success: false,
          message: t.storeLogistics.testConnQuoteFail
        });
        showToast('Falha na resposta das transportadoras.', 'error');
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || 'Erro inesperado ao conectar à API do Melhor Envio.'
      });
      showToast(t.storeLogistics.testConnError, 'error');
    } finally {
      setIsTestingToken(false);
    }
  };

  // Adicionar Nova Faixa de Desconto Progressivo
  const handleAddFaixaDesconto = () => {
    setConfig((prev) => {
      const faixasAtuais = prev.desconto_progressivo?.faixas || [];
      const ultimoValor = faixasAtuais.length > 0
        ? Math.max(...faixasAtuais.map(f => Number(f.a_partir_de) || 0)) + 500
        : 500;
      const novaFaixa: FaixaDescontoProgressivo = {
        a_partir_de: ultimoValor,
        desconto_reais: 20
      };
      return {
        ...prev,
        desconto_progressivo: {
          ...prev.desconto_progressivo,
          ativo: true,
          faixas: [...faixasAtuais, novaFaixa].sort((a, b) => a.a_partir_de - b.a_partir_de)
        }
      };
    });
  };

  // Atualizar Faixa Específica de Desconto
  const handleUpdateFaixaDesconto = (index: number, updates: Partial<FaixaDescontoProgressivo>) => {
    setConfig((prev) => {
      const faixas = [...(prev.desconto_progressivo?.faixas || [])];
      if (faixas[index]) {
        faixas[index] = { ...faixas[index], ...updates };
      }
      return {
        ...prev,
        desconto_progressivo: {
          ...prev.desconto_progressivo,
          ativo: prev.desconto_progressivo?.ativo ?? true,
          faixas: faixas.sort((a, b) => a.a_partir_de - b.a_partir_de)
        }
      };
    });
  };

  // Remover Faixa Específica de Desconto
  const handleRemoveFaixaDesconto = (index: number) => {
    setConfig((prev) => {
      const faixas = (prev.desconto_progressivo?.faixas || []).filter((_, i) => i !== index);
      return {
        ...prev,
        desconto_progressivo: {
          ...prev.desconto_progressivo,
          ativo: prev.desconto_progressivo?.ativo ?? true,
          faixas
        }
      };
    });
  };

  // Executar Simulação no Simulador ao Vivo
  const handleRunSimulation = async () => {
    const cleanCep = simuladorCep.replace(/\D/g, '');
    if (cleanCep.length !== 8) {
      showToast(t.storeLogistics.simulateCepInvalid, 'error');
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

  const handleSalvarConfiguracoes = async (): Promise<boolean> => {
    setIsSaving(true);

    try {
      const configToSave: LogisticaAvancadaConfig = {
        ...config,
        token_melhor_envio: config.token_melhor_envio || CONFIG_LOGISTICA_DEFAULT.token_melhor_envio
      };

      const res = await saveStoreGeneralSettings(tenantId, {
        freteGratisValor: Number(config.regras_frete_gratis?.valor_minimo_padrao || 350),
        prazoManuseioDias: Number(config.prazo_manuseio_dias || 1),
        retiradaBoutiqueAtiva: Boolean(config.retirada_boutique_ativa),
        instrucoesRetirada: config.instrucoes_retirada,
        entregaLocalAtiva: Boolean(config.entrega_motoboy?.ativo ?? config.entrega_local_ativa),
        entregaLocalTaxa: Number(config.entrega_motoboy?.taxa_fixa_reais ?? config.entrega_local_taxa ?? 18.00),
        entregaLocalBairros: config.entrega_local_bairros,
        logisticaAvancada: configToSave
      });

      if (res.success) {
        try {
          await refreshProducts();
        } catch {}
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('bcomm_tenant_updated', { detail: { tenantId } }));
        }
        initialConfigRef.current = JSON.stringify(config);
        setIsDirty(false);
        showToast(t.storeLogistics.allRulesSaved);
        return true;
      } else {
        showToast(res.error || t.storeLogistics.toastError, 'error');
        return false;
      }
    } catch (err: any) {
      showToast(err?.message || 'Erro inesperado.', 'error');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSalvarConfiguracoes();
  };

  useEffect(() => {
    registerSaveHandler(handleSalvarConfiguracoes);
    return () => registerSaveHandler(null);
  }, [config, tenantId, registerSaveHandler]);

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center text-slate-500 shadow-xs">
        <RefreshCw className="w-6 h-6 animate-spin text-amber-600 mx-auto mb-2" />
        <span className="text-xs font-medium">{t.storeLogistics.loadingLogistics}</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full">
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
              {t.storeLogistics.pageTitle}
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-600" /> Autonomia Total
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {t.storeLogistics.pageSubtitle}
          </p>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs font-bold uppercase tracking-wider shadow-md transition-all cursor-pointer disabled:opacity-50 self-start sm:self-auto shrink-0"
        >
          {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{isSaving ? t.storeLogistics.savingBtn : t.storeLogistics.saveBtn}</span>
        </button>
      </div>

      {/* BLOCO 1: PROVEDOR DE CÁLCULO & EXPEDIÇÃO (MELHOR ENVIO NATIVO) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-700 border border-sky-200 flex items-center justify-center font-bold">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                {t.storeLogistics.secProviderTitle}
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">
                Correios + Jadlog
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              {t.storeLogistics.secProviderDesc}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
          {/* COLUNA ESQUERDA: MOTOR & CONEXÃO OFICIAL */}
          <div className="space-y-4">
            <div>
              <label className="block text-slate-700 mb-1 font-bold">
                {t.storeLogistics.engineLabel}
              </label>
              <select
                value={config.provedor}
                onChange={(e) => setConfig((prev) => ({ ...prev, provedor: e.target.value as any }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white cursor-pointer"
              >
                <option value="melhor_envio">{t.storeLogistics.engineMelhorEnvio}</option>
                <option value="manual">{t.storeLogistics.engineManual}</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 mb-1 font-bold">
                {t.storeLogistics.envTitle}
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
                  {t.storeLogistics.envProduction}
                </button>
              </div>
            </div>

            {/* Card de Status da Integração Oficial (Sigilo Total do Token) */}
            <div className="p-4 rounded-xl border border-sky-200 bg-sky-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-bold text-slate-900 text-xs">{t.storeLogistics.officialStatusTitle}</span>
                </div>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Pronto para Envio
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                {t.storeLogistics.melhorEnvioDesc}
              </p>

              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTestingToken}
                className="w-full py-2.5 px-4 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isTestingToken ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
                <span>{isTestingToken ? t.storeLogistics.testingConn : t.storeLogistics.testConnBtn}</span>
              </button>

              {/* Resultado do Teste de Conexão */}
              {testResult && (
                <div
                  className={`p-3 rounded-lg border text-xs flex items-start gap-2 ${
                    testResult.success
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-semibold'
                      : 'bg-rose-50 border-rose-300 text-rose-950 font-semibold'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div className="text-[11px] leading-relaxed">
                    {testResult.message}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* COLUNA DIREITA: ENDEREÇO DE EXPEDIÇÃO */}
          <div className="space-y-3 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200/80">
              <label className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-amber-600" />
                <span>{t.storeLogistics.originAddressTitle}</span>
              </label>
              <button
                type="button"
                onClick={handleImportStoreAddress}
                disabled={isImportingAddress}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 hover:text-amber-950 bg-amber-100 hover:bg-amber-200/80 px-2.5 py-1 rounded-lg border border-amber-300 transition-colors cursor-pointer disabled:opacity-50"
                title={t.storeLogistics.importAddressBtn}
              >
                <Copy className="w-3 h-3" />
                <span>{isImportingAddress ? 'Importando...' : 'Copiar de Dados da Loja'}</span>
              </button>
            </div>

            {/* Linha 1: CEP e Número */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="sm:col-span-2">
                <label className="block text-[11px] text-slate-700 mb-1 font-semibold">
                  CEP de Origem (Saída) *
                </label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={config.cep_origem}
                    onChange={(e) => handleCepOrigemChange(e.target.value)}
                    placeholder="82010600"
                    maxLength={9}
                    className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-slate-900 font-mono font-bold text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-700 mb-1 font-semibold">
                  Nº Predial *
                </label>
                <input
                  type="text"
                  required
                  value={config.origem_coordenadas?.numero || ''}
                  onChange={(e) => handleAddressFieldChange('numero', e.target.value)}
                  placeholder="Ex: 888"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono font-bold text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Linha 2: Rua / Logradouro */}
            <div>
              <label className="block text-[11px] text-slate-700 mb-1 font-semibold">
                Rua / Logradouro *
              </label>
              <input
                type="text"
                required
                value={config.origem_coordenadas?.logradouro || ''}
                onChange={(e) => handleAddressFieldChange('logradouro', e.target.value)}
                placeholder={t.storeLogistics.originStreet}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Linha 3: Complemento e Bairro */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] text-slate-700 mb-1 font-semibold">
                  Complemento
                </label>
                <input
                  type="text"
                  value={config.origem_coordenadas?.complemento || ''}
                  onChange={(e) => handleAddressFieldChange('complemento', e.target.value)}
                  placeholder={t.storeLogistics.originComplement}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-700 mb-1 font-semibold">
                  Bairro *
                </label>
                <input
                  type="text"
                  value={config.origem_coordenadas?.bairro || ''}
                  onChange={(e) => handleAddressFieldChange('bairro', e.target.value)}
                  placeholder="Ex: Tingui"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Linha 4: Cidade e UF */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="col-span-2">
                <label className="block text-[11px] text-slate-700 mb-1 font-semibold">
                  Cidade *
                </label>
                <input
                  type="text"
                  value={config.origem_coordenadas?.cidade || ''}
                  onChange={(e) => handleAddressFieldChange('cidade', e.target.value)}
                  placeholder="Ex: Curitiba"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-700 mb-1 font-semibold">
                  UF *
                </label>
                <input
                  type="text"
                  value={config.origem_coordenadas?.uf || ''}
                  onChange={(e) => handleAddressFieldChange('uf', e.target.value)}
                  placeholder="PR"
                  maxLength={2}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono text-xs uppercase focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Ponto de Saída Fixado com Contraste Impecável */}
            {config.origem_coordenadas?.logradouro && (
              <div className="mt-2 p-3 rounded-lg border border-slate-200 bg-white text-slate-800 text-[11px] space-y-1 shadow-2xs">
                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span>
                    {t.storeLogistics.originExitPoint} {config.origem_coordenadas.logradouro}{config.origem_coordenadas.numero ? `, Nº ${config.origem_coordenadas.numero}` : ''} • {config.origem_coordenadas.bairro ? `${config.origem_coordenadas.bairro}, ` : ''}{config.origem_coordenadas.cidade}/{config.origem_coordenadas.uf}
                  </span>
                </div>
                {config.origem_coordenadas?.latitude && (
                  <p className="text-[10px] text-slate-500 pl-3.5">
                    Coordenadas GPS: {config.origem_coordenadas.latitude.toFixed(5)}, {config.origem_coordenadas.longitude.toFixed(5)}
                  </p>
                )}
              </div>
            )}
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
                {t.storeLogistics.secServicesTitle}
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                Controle Total
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              {t.storeLogistics.secServicesSubtitle}
            </p>
          </div>
        </div>

        {/* Grade de Serviços em 2 Colunas Equilibradas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {config.servicos_habilitados.map((servico) => (
            <div
              key={servico.codigo}
              className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 text-xs ${
                servico.ativo
                  ? 'bg-white border-slate-200 shadow-2xs'
                  : 'bg-slate-50/70 border-slate-200 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id={`servico_${servico.codigo}`}
                    checked={servico.ativo}
                    onChange={() => toggleServico(servico.codigo)}
                    className="mt-1 w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300 cursor-pointer"
                  />
                  <div>
                    <label
                      htmlFor={`servico_${servico.codigo}`}
                      className="font-bold text-slate-900 cursor-pointer text-sm block"
                    >
                      {servico.transportadora} {servico.nome}
                    </label>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      {t.storeLogistics.codeLabel} <code className="font-mono text-slate-600">{servico.codigo}</code>
                    </span>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                    servico.ativo
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {servico.ativo ? t.storeLogistics.statusVisible : t.storeLogistics.statusHidden}
                </span>
              </div>

              {servico.ativo && (
                <div className="pt-2 border-t border-slate-100">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Nome Exibido na Vitrine / Checkout:
                  </label>
                  <input
                    type="text"
                    value={servico.nome_personalizado || servico.nome}
                    onChange={(e) => handleNomePersonalizadoChange(servico.codigo, e.target.value)}
                    placeholder={t.storeLogistics.customNamePlaceholder}
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
            {t.storeLogistics.whiteLabelTitle}
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
                <span>{t.storeLogistics.modeFullTransparency}</span>
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
                <span>{t.storeLogistics.modeWhiteLabel}</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                {t.storeLogistics.modeWhiteLabelDesc}
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
                <span>{t.storeLogistics.modeCheapest}</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                {t.storeLogistics.modeCheapestDesc}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* BLOCO 3: REGRAS DE FRETE GRÁTIS & DESCONTO PROGRESSIVO (SUBSÍDIO) COM AUTONOMIA TOTAL */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                {t.storeLogistics.secFreeShippingTitle}
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Incentivo de Vendas
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              {t.storeLogistics.secFreeShippingDesc}
            </p>
          </div>
        </div>

        {/* PARTE A: FRETE GRÁTIS GERAL DA LOJA */}
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/70">
            <div>
              <span className="font-bold text-slate-900 block text-xs">
                {t.storeLogistics.enableFreeShippingGlobal}
              </span>
              <span className="text-[11px] text-slate-500 block">
                {t.storeLogistics.freeShippingDesc}
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={config.regras_frete_gratis?.ativo ?? true}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    regras_frete_gratis: {
                      ...prev.regras_frete_gratis,
                      ativo: e.target.checked
                    }
                  }))
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {(config.regras_frete_gratis?.ativo ?? true) ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs pt-1">
              {/* Meta Padrão de Frete Grátis */}
              <div>
                <label className="block text-slate-700 mb-1 font-bold">
                  `${t.storeLogistics.freeShippingMinOrderLabel} (${currencySymbol})`
                </label>
                <div className="relative">
                  <span className="text-slate-400 font-bold absolute left-3 top-1/2 -translate-y-1/2">{currencySymbol}</span>
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
                  {t.storeLogistics.freeShippingCapHint}
                </span>
              </div>

              {/* Teto de Isenção (Proteção contra frete muito caro) */}
              <div>
                <label className="block text-slate-700 mb-1 font-bold">
                  `${t.storeLogistics.freeShippingCapLabel} (${currencySymbol})`
                </label>
                <div className="relative">
                  <span className="text-slate-400 font-bold absolute left-3 top-1/2 -translate-y-1/2">{currencySymbol}</span>
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
                  {t.storeLogistics.freeShippingCapProtection}
                </span>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/70 text-xs text-amber-900 flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{t.storeLogistics.freeShippingDisabledNotice}</span>
            </div>
          )}
        </div>

        {/* PARTE B: SUBSÍDIO PROGRESSIVO (DESCONTO ESCALONADO) */}
        <div className="pt-4 border-t border-slate-200 space-y-4">
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/70">
            <div>
              <span className="font-bold text-slate-900 block text-xs">
                {t.storeLogistics.progressiveDiscountTitle}
              </span>
              <span className="text-[11px] text-slate-500 block">
                {t.storeLogistics.progressiveDiscountDesc}
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={config.desconto_progressivo?.ativo ?? true}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    desconto_progressivo: {
                      ...prev.desconto_progressivo,
                      ativo: e.target.checked
                    }
                  }))
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {(config.desconto_progressivo?.ativo ?? true) ? (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    {t.storeLogistics.progressiveDiscountTitle}
                  </span>
                  <p className="text-[11px] text-slate-500">
                    {t.storeLogistics.progressiveDiscountDesc}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAddFaixaDesconto}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer self-start sm:self-auto shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t.storeLogistics.addTierBtn}</span>
                </button>
              </div>

              {/* Lista Dinâmica de Faixas Editáveis */}
              {(!config.desconto_progressivo?.faixas || config.desconto_progressivo.faixas.length === 0) ? (
                <div className="py-8 text-center bg-white rounded-lg border border-dashed border-slate-300 text-slate-500">
                  <p className="font-medium text-xs">Nenhuma faixa de desconto configurada.</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{t.storeLogistics.tiersEmptyDesc}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                  {config.desconto_progressivo.faixas.map((faixa, idx) => {
                    const isTotal = Boolean(faixa.isencao_total);

                    return (
                      <div
                        key={idx}
                        className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs space-y-3 relative group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            Faixa #{idx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveFaixaDesconto(idx)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                            title={t.storeLogistics.removeTierBtn}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Campo: A partir de R$ */}
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            A partir de (Valor da Compra):
                          </label>
                          <div className="relative">
                            <span className="text-slate-400 font-bold text-xs absolute left-2.5 top-1/2 -translate-y-1/2">R$</span>
                            <input
                              type="number"
                              min="0"
                              step="50"
                              value={faixa.a_partir_de}
                              onChange={(e) =>
                                handleUpdateFaixaDesconto(idx, {
                                  a_partir_de: Number(e.target.value)
                                })
                              }
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-2.5 py-1.5 text-slate-900 font-mono font-bold text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                            />
                          </div>
                        </div>

                        {/* Tipo de Benefício */}
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            {t.storeLogistics.tierBenefitType}
                          </label>
                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateFaixaDesconto(idx, {
                                  isencao_total: false,
                                  desconto_reais: faixa.desconto_reais || 20
                                })
                              }
                              className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                                !isTotal
                                  ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-1 ring-emerald-500'
                                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              Desconto R$
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateFaixaDesconto(idx, {
                                  isencao_total: true,
                                  desconto_reais: undefined
                                })
                              }
                              className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                                isTotal
                                  ? 'bg-emerald-600 border-emerald-600 text-white'
                                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              {t.storeLogistics.tier100Free}
                            </button>
                          </div>
                        </div>

                        {/* Valor do Abatimento (se não for isenção total) */}
                        {!isTotal && (
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              Valor do Abatimento:
                            </label>
                            <div className="relative">
                              <span className="text-slate-400 font-bold text-xs absolute left-2.5 top-1/2 -translate-y-1/2">R$</span>
                              <input
                                type="number"
                                min="1"
                                step="5"
                                value={faixa.desconto_reais || 20}
                                onChange={(e) =>
                                  handleUpdateFaixaDesconto(idx, {
                                    desconto_reais: Number(e.target.value)
                                  })
                                }
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-2.5 py-1.5 text-slate-900 font-mono font-bold text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                              />
                            </div>
                          </div>
                        )}

                        <div className="pt-1 border-t border-slate-100 text-[10px] text-emerald-700 font-medium">
                          {isTotal
                            ? t.storeLogistics.tierFreeFrom(String(faixa.a_partir_de))
                            : `✓ R$ ${(faixa.desconto_reais || 0).toFixed(2).replace('.', ',')} de desconto em compras acima de R$ ${faixa.a_partir_de}`}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 rounded-xl border border-slate-200 bg-slate-100/60 text-xs text-slate-600 flex items-center gap-2">
              <Info className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{t.storeLogistics.tiersDisabledNotice}</span>
            </div>
          )}
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
              {t.storeLogistics.secPackagePilotTitle}
            </h2>
            <p className="text-[11px] text-slate-500">
              {t.storeLogistics.secPackagePilotDesc}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block text-slate-700 mb-1 font-bold">
              {t.storeLogistics.avgWeightLabel}
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
              {t.storeLogistics.avgWeightHint}
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
              {t.storeLogistics.handlingDaysHintText}
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
              5. ${t.storeLogistics.secLocalDeliveryTitle}
            </h2>
            <p className="text-[11px] text-slate-500">
              {t.storeLogistics.secLocalDeliverySubtitle}
            </p>
          </div>
        </div>

        {/* Motoboy Express com Raio Geográfico e Mapa Interativo */}
        <div className="p-5 rounded-xl border border-slate-200 bg-white space-y-5 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold">
                <Truck className="w-4.5 h-4.5" />
              </div>
              <div>
                <span className="font-bold text-slate-900 text-sm block">Entrega Expressa via Motoboy</span>
                <span className="text-[11px] text-slate-500">
                  {t.storeLogistics.localSmartRadius}
                </span>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.entrega_motoboy?.ativo ?? config.entrega_local_ativa ?? true}
                onChange={(e) => {
                  const val = e.target.checked;
                  setConfig((prev) => ({
                    ...prev,
                    entrega_local_ativa: val,
                    entrega_motoboy: {
                      ...(prev.entrega_motoboy || {
                        ativo: val,
                        raio_maximo_km: 15,
                        taxa_tipo: 'fixa',
                        taxa_fixa_reais: Number(prev.entrega_local_taxa || 18.00),
                        horario_limite_mesmo_dia: '14:00',
                        dias_semana_disponiveis: [1, 2, 3, 4, 5, 6]
                      }),
                      ativo: val
                    }
                  }));
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
            </label>
          </div>

          {(config.entrega_motoboy?.ativo ?? config.entrega_local_ativa ?? true) && (
            <div className="space-y-5 pt-3 border-t border-slate-100 animate-fadeIn">
              {/* Nome de Exibição e Raio */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Nome Exibido na Vitrine / Checkout</label>
                  <input
                    type="text"
                    value={config.entrega_motoboy?.nome_personalizado || 'Entrega Expressa via Motoboy'}
                    onChange={(e) => {
                      const val = e.target.value;
                      setConfig((prev) => ({
                        ...prev,
                        entrega_motoboy: {
                          ...(prev.entrega_motoboy || {
                            ativo: true,
                            raio_maximo_km: 15,
                            taxa_tipo: 'fixa',
                            taxa_fixa_reais: 18.00,
                            horario_limite_mesmo_dia: '14:00',
                            dias_semana_disponiveis: [1, 2, 3, 4, 5, 6]
                          }),
                          nome_personalizado: val
                        }
                      }));
                    }}
                    placeholder="Ex: Motoboy Express • Mesmo Dia"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-slate-700 font-bold">{t.storeLogistics.localRadiusKmLabel}</label>
                    <span className="text-emerald-700 font-mono font-bold text-sm bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {config.entrega_motoboy?.raio_maximo_km || 15} km
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    step="1"
                    value={config.entrega_motoboy?.raio_maximo_km || 15}
                    onChange={(e) => {
                      const km = Number(e.target.value);
                      setConfig((prev) => ({
                        ...prev,
                        entrega_motoboy: {
                          ...(prev.entrega_motoboy || {
                            ativo: true,
                            raio_maximo_km: 15,
                            taxa_tipo: 'fixa',
                            taxa_fixa_reais: 18.00,
                            horario_limite_mesmo_dia: '14:00',
                            dias_semana_disponiveis: [1, 2, 3, 4, 5, 6]
                          }),
                          raio_maximo_km: km
                        }
                      }));
                    }}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                  <div className="flex gap-1.5 mt-2">
                    {[5, 10, 15, 20, 25, 35].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          setConfig((prev) => ({
                            ...prev,
                            entrega_motoboy: {
                              ...(prev.entrega_motoboy || {
                                ativo: true,
                                raio_maximo_km: 15,
                                taxa_tipo: 'fixa',
                                taxa_fixa_reais: 18.00,
                                horario_limite_mesmo_dia: '14:00',
                                dias_semana_disponiveis: [1, 2, 3, 4, 5, 6]
                              }),
                              raio_maximo_km: preset
                            }
                          }));
                        }}
                        className={`flex-1 py-1 text-[10px] font-bold rounded border transition-colors cursor-pointer ${
                          (config.entrega_motoboy?.raio_maximo_km || 15) === preset
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-emerald-500'
                        }`}
                      >
                        {preset} km
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* MAPA INTERATIVO AO VIVO */}
              <div className="pt-2">
                <label className="block text-slate-700 mb-2 font-bold flex items-center justify-between">
                  <span>{t.storeLogistics.mapSpatialView}</span>
                  <span className="text-[11px] text-slate-500 font-normal">
                    {t.storeLogistics.mapDragPin}
                  </span>
                </label>
                <LogisticsRadiusMap
                  center={
                    config.origem_coordenadas ||
                    config.entrega_motoboy?.origem_coordenadas || {
                      latitude: -25.4223,
                      longitude: -49.3346,
                      cidade: 'Curitiba',
                      uf: 'PR',
                      bairro: 'Santo Inácio',
                      logradouro: 'Rua José Boiko',
                      numero: '150',
                      cep: config.cep_origem || '82010600'
                    }
                  }
                  radiusKm={config.entrega_motoboy?.raio_maximo_km || 15}
                  storeName={currentTenant?.nome || 'Boutique Física'}
                  onCoordinatesChange={(newCoords) => {
                    setConfig((prev) => ({
                      ...prev,
                      origem_coordenadas: newCoords,
                      entrega_motoboy: {
                        ...(prev.entrega_motoboy || {
                          ativo: true,
                          raio_maximo_km: 15,
                          taxa_tipo: 'fixa',
                          taxa_fixa_reais: 18.00,
                          horario_limite_mesmo_dia: '14:00',
                          dias_semana_disponiveis: [1, 2, 3, 4, 5, 6]
                        }),
                        origem_coordenadas: newCoords
                      }
                    }));
                  }}
                  onRadiusChange={(newRadius) => {
                    setConfig((prev) => ({
                      ...prev,
                      entrega_motoboy: {
                        ...(prev.entrega_motoboy || {
                          ativo: true,
                          raio_maximo_km: 15,
                          taxa_tipo: 'fixa',
                          taxa_fixa_reais: 18.00,
                          horario_limite_mesmo_dia: '14:00',
                          dias_semana_disponiveis: [1, 2, 3, 4, 5, 6]
                        }),
                        raio_maximo_km: newRadius
                      }
                    }));
                  }}
                />
              </div>

              {/* Modelo de Cobrança: Taxa Fixa vs Faixas por Distância */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <label className="block text-slate-800 font-bold">{t.storeLogistics.localFeeModelLabel}</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    className={`p-3 border rounded-xl flex items-start gap-2.5 cursor-pointer transition-all ${
                      (config.entrega_motoboy?.taxa_tipo || 'fixa') === 'fixa'
                        ? 'bg-emerald-50/50 border-emerald-500 shadow-xs ring-1 ring-emerald-500/30'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="taxa_tipo"
                      checked={(config.entrega_motoboy?.taxa_tipo || 'fixa') === 'fixa'}
                      onChange={() => {
                        setConfig((prev) => ({
                          ...prev,
                          entrega_motoboy: {
                            ...(prev.entrega_motoboy || {
                              ativo: true,
                              raio_maximo_km: 15,
                              taxa_tipo: 'fixa',
                              taxa_fixa_reais: 18.00,
                              horario_limite_mesmo_dia: '14:00',
                              dias_semana_disponiveis: [1, 2, 3, 4, 5, 6]
                            }),
                            taxa_tipo: 'fixa'
                          }
                        }));
                      }}
                      className="accent-emerald-600 mt-0.5"
                    />
                    <div>
                      <span className="font-bold text-slate-900 block text-xs">{t.storeLogistics.localFeeFixed}</span>
                      <span className="text-[11px] text-slate-500">{t.storeLogistics.localFeeFixedDesc}</span>
                    </div>
                  </label>

                  <label
                    className={`p-3 border rounded-xl flex items-start gap-2.5 cursor-pointer transition-all ${
                      config.entrega_motoboy?.taxa_tipo === 'por_faixa_km'
                        ? 'bg-emerald-50/50 border-emerald-500 shadow-xs ring-1 ring-emerald-500/30'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="taxa_tipo"
                      checked={config.entrega_motoboy?.taxa_tipo === 'por_faixa_km'}
                      onChange={() => {
                        setConfig((prev) => ({
                          ...prev,
                          entrega_motoboy: {
                            ...(prev.entrega_motoboy || {
                              ativo: true,
                              raio_maximo_km: 15,
                              taxa_tipo: 'por_faixa_km',
                              taxa_fixa_reais: 18.00,
                              horario_limite_mesmo_dia: '14:00',
                              dias_semana_disponiveis: [1, 2, 3, 4, 5, 6]
                            }),
                            taxa_tipo: 'por_faixa_km',
                            faixas_distancia: prev.entrega_motoboy?.faixas_distancia || [
                              { ate_km: 5, valor_reais: 12.00 },
                              { ate_km: 15, valor_reais: 18.00 },
                              { ate_km: 25, valor_reais: 28.00 }
                            ]
                          }
                        }));
                      }}
                      className="accent-emerald-600 mt-0.5"
                    />
                    <div>
                      <span className="font-bold text-slate-900 block text-xs">{t.storeLogistics.localFeeTiers}</span>
                      <span className="text-[11px] text-slate-500">{t.storeLogistics.localFeeTiersDesc}</span>
                    </div>
                  </label>
                </div>

                {/* Input de Taxa Fixa */}
                {(config.entrega_motoboy?.taxa_tipo || 'fixa') === 'fixa' ? (
                  <div className="pt-2">
                    <label className="block text-slate-700 mb-1 font-bold">Valor da Taxa Fixa (R$)</label>
                    <div className="relative max-w-xs">
                      <span className="absolute left-3 top-2.5 text-slate-400 font-bold">R$</span>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={config.entrega_motoboy?.taxa_fixa_reais ?? config.entrega_local_taxa ?? 18.00}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setConfig((prev) => ({
                            ...prev,
                            entrega_local_taxa: val,
                            entrega_motoboy: {
                              ...(prev.entrega_motoboy || {
                                ativo: true,
                                raio_maximo_km: 15,
                                taxa_tipo: 'fixa',
                                taxa_fixa_reais: 18.00,
                                horario_limite_mesmo_dia: '14:00',
                                dias_semana_disponiveis: [1, 2, 3, 4, 5, 6]
                              }),
                              taxa_fixa_reais: val
                            }
                          }));
                        }}
                        className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                ) : (
                  /* Tabela de Faixas por Distância */
                  <div className="pt-2 space-y-2">
                    <span className="text-[11px] font-bold text-slate-700 block">Faixas Configuradas:</span>
                    <div className="space-y-1.5">
                      {(config.entrega_motoboy?.faixas_distancia || [
                        { ate_km: 5, valor_reais: 12.00 },
                        { ate_km: 15, valor_reais: 18.00 },
                        { ate_km: 25, valor_reais: 28.00 }
                      ]).map((faixa, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200">
                          <span className="text-slate-500 text-[11px]">{t.storeLogistics.tierMinLabel}</span>
                          <input
                            type="number"
                            min="1"
                            max="50"
                            value={faixa.ate_km}
                            onChange={(e) => {
                              const km = Number(e.target.value);
                              setConfig((prev) => {
                                const current = [...(prev.entrega_motoboy?.faixas_distancia || [])];
                                current[idx] = { ...current[idx], ate_km: km };
                                return {
                                  ...prev,
                                  entrega_motoboy: { ...prev.entrega_motoboy!, faixas_distancia: current }
                                };
                              });
                            }}
                            className="w-16 bg-slate-50 border border-slate-200 rounded px-2 py-1 font-mono font-bold text-xs"
                          />
                          <span className="text-slate-500 text-[11px]">km → Valor: R$</span>
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={faixa.valor_reais}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setConfig((prev) => {
                                const current = [...(prev.entrega_motoboy?.faixas_distancia || [])];
                                current[idx] = { ...current[idx], valor_reais: val };
                                return {
                                  ...prev,
                                  entrega_motoboy: { ...prev.entrega_motoboy!, faixas_distancia: current }
                                };
                              });
                            }}
                            className="w-20 bg-slate-50 border border-slate-200 rounded px-2 py-1 font-mono font-bold text-xs"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Horário de Corte e Valor Mínimo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">{t.storeLogistics.cutoffTimeLabel}</label>
                  <input
                    type="time"
                    value={config.entrega_motoboy?.horario_limite_mesmo_dia || '14:00'}
                    onChange={(e) => {
                      const val = e.target.value;
                      setConfig((prev) => ({
                        ...prev,
                        entrega_motoboy: {
                          ...(prev.entrega_motoboy || {
                            ativo: true,
                            raio_maximo_km: 15,
                            taxa_tipo: 'fixa',
                            taxa_fixa_reais: 18.00,
                            horario_limite_mesmo_dia: '14:00',
                            dias_semana_disponiveis: [1, 2, 3, 4, 5, 6]
                          }),
                          horario_limite_mesmo_dia: val
                        }
                      }));
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    {t.storeLogistics.cutoffTimeHint}
                  </span>
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-bold">{t.storeLogistics.minCartLabel}</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400 font-bold">R$</span>
                    <input
                      type="number"
                      min="0"
                      step="5"
                      value={config.entrega_motoboy?.valor_minimo_pedido || 0}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setConfig((prev) => ({
                          ...prev,
                          entrega_motoboy: {
                            ...(prev.entrega_motoboy || {
                              ativo: true,
                              raio_maximo_km: 15,
                              taxa_tipo: 'fixa',
                              taxa_fixa_reais: 18.00,
                              horario_limite_mesmo_dia: '14:00',
                              dias_semana_disponiveis: [1, 2, 3, 4, 5, 6]
                            }),
                            valor_minimo_pedido: val
                          }
                        }));
                      }}
                      placeholder={t.storeLogistics.minCartPlaceholder}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Deixe 0 para permitir motoboy em qualquer valor de compra.
                  </span>
                </div>
              </div>

              {/* Exceções: Bairros Excluídos */}
              <div>
                <label className="block text-slate-700 mb-1 font-bold">{t.storeLogistics.excludedNeighborhoodsLabel}</label>
                <input
                  type="text"
                  value={(config.entrega_motoboy?.bairros_excluidos || []).join(', ')}
                  onChange={(e) => {
                    const list = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                    setConfig((prev) => ({
                      ...prev,
                      entrega_motoboy: {
                        ...(prev.entrega_motoboy || {
                          ativo: true,
                          raio_maximo_km: 15,
                          taxa_tipo: 'fixa',
                          taxa_fixa_reais: 18.00,
                          horario_limite_mesmo_dia: '14:00',
                          dias_semana_disponiveis: [1, 2, 3, 4, 5, 6]
                        }),
                        bairros_excluidos: list
                      }
                    }));
                  }}
                  placeholder={t.storeLogistics.excludedNeighborhoodsPlaceholder}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  {t.storeLogistics.excludedNeighborhoodsHint}
                </span>
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
                <span className="font-bold text-slate-900 block">{t.storeLogistics.secStorePickupTitle}</span>
                <span className="text-[11px] text-slate-500">{t.storeLogistics.pickupFreeBadge}</span>
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
              <label className="block text-slate-700 mb-1 font-bold">{t.storeLogistics.pickupInstructionsLabel}</label>
              <textarea
                rows={2}
                value={config.instrucoes_retirada || ''}
                onChange={(e) => setConfig((prev) => ({ ...prev, instrucoes_retirada: e.target.value }))}
                placeholder={t.storeLogistics.pickupInstructionsPlaceholder}
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
              <h3 className="font-bold text-sm text-white">{t.storeLogistics.liveSimTitle}</h3>
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
                  <span className="text-emerald-400 font-semibold">{t.storeLogistics.activeInStore}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 text-center py-4">
            {t.storeLogistics.liveSimEmptyDesc}
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
          <span>{isSaving ? t.storeLogistics.savingBtn : t.storeLogistics.saveBtn}</span>
        </button>
      </div>
    </form>
  );
}

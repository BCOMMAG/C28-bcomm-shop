'use client';

import React, { useState, useEffect } from 'react';
import {
  Bell,
  Volume2,
  AlertTriangle,
  Play,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Layers,
  Inbox
} from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { DEFAULT_TENANT_ID } from '@/lib/products';
import {
  getStoreSettings,
  saveStoreGeneralSettings
} from '@/lib/admin';

export default function NotificationsSettingsPage() {
  const { currentTenant, refreshProducts } = useStore();
  const tenantId = currentTenant?.id || DEFAULT_TENANT_ID;

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Estados dos Alertas
  const [somNovaVendaAtivo, setSomNovaVendaAtivo] = useState(true);
  const [alertaEstoqueMinimo, setAlertaEstoqueMinimo] = useState(3);
  const [notificarListaEsperaEmail, setNotificarListaEsperaEmail] = useState(true);

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
          if (data.somNovaVendaAtivo !== undefined) setSomNovaVendaAtivo(data.somNovaVendaAtivo);
          if (data.alertaEstoqueMinimo !== undefined) setAlertaEstoqueMinimo(data.alertaEstoqueMinimo);
          if (data.notificarListaEsperaEmail !== undefined) setNotificarListaEsperaEmail(data.notificarListaEsperaEmail);
        }
      } catch (err) {
        console.error('Erro ao buscar parâmetros de notificação:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tenantId]);

  // Função para testar o som via Web Audio API (Chime de Caixa Registradora / Venda)
  const handleTestSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

      const playTone = (freq: number, start: number, duration: number) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + start);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + start + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + start);
        osc.stop(audioCtx.currentTime + start + duration);
      };

      // Sequência harmônica de caixa registradora (Do - Mi - Sol - Do agudo)
      playTone(523.25, 0, 0.15); // C5
      playTone(659.25, 0.1, 0.15); // E5
      playTone(783.99, 0.2, 0.2); // G5
      playTone(1046.50, 0.3, 0.4); // C6

      showToast('Efeito sonoro de venda reproduzido!');
    } catch {
      showToast('Navegador bloqueou reprodução de áudio automático.', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const res = await saveStoreGeneralSettings(tenantId, {
        somNovaVendaAtivo,
        alertaEstoqueMinimo: Number(alertaEstoqueMinimo),
        notificarListaEsperaEmail
      });

      if (res.success) {
        try {
          await refreshProducts();
        } catch {}
        showToast('Configurações de notificações e sons salvas com sucesso!');
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
        <span className="text-xs font-medium">Carregando configurações de notificações...</span>
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

      {/* BLOCO 1: SOM DE NOVA VENDA EM TEMPO REAL */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-bold">
              <Volume2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  1. Notificação Sonora de Vendas em Tempo Real
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Ao Vivo
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Toque de sino / caixa registradora sempre que um novo pedido for finalizado na boutique.
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={somNovaVendaAtivo}
              onChange={(e) => setSomNovaVendaAtivo(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600" />
          </label>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-amber-50/50 border border-amber-200 text-xs">
          <div className="space-y-1">
            <span className="font-bold text-amber-950 block">
              Efeito Sonoro Padrão: Caixa Registradora Elegance
            </span>
            <p className="text-[11px] text-amber-900">
              Harmonia sutil e discreta para ser usada em loja física, balcão ou escritório.
            </p>
          </div>

          <button
            type="button"
            onClick={handleTestSound}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-all shadow-xs cursor-pointer self-start sm:self-auto"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Ouvir Som de Teste</span>
          </button>
        </div>
      </div>

      {/* BLOCO 2: GATILHO DE ALERTA DE ESTOQUE BAIXO */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 flex items-center justify-center font-bold">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              2. Gatilhos de Estoque Baixo & Reposição
            </h2>
            <p className="text-[11px] text-slate-500">
              Critério para disparo de avisos na listagem de produtos e sugestão de reabastecimento.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
          <div>
            <label className="block text-slate-700 mb-1 font-bold">
              Gatilho de Estoque Baixo (Peças Restantes)
            </label>
            <input
              type="number"
              min="1"
              max="50"
              value={alertaEstoqueMinimo}
              onChange={(e) => setAlertaEstoqueMinimo(Number(e.target.value))}
              placeholder="3"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Produtos ou tamanhos com estoque menor ou igual a esse número ganham a etiqueta &quot;Estoque Crítico&quot;.
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col justify-center text-[11px] text-slate-600">
            <span>
              Qualquer peça com <strong>{alertaEstoqueMinimo} unidades ou menos</strong> em estoque gerará um alerta no resumo de estoque da vitrine e no painel do estoquista.
            </span>
          </div>
        </div>
      </div>

      {/* BLOCO 3: ALERTA DE LISTA DE ESPERA (AVISE-ME) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-700 border border-violet-200 flex items-center justify-center font-bold">
              <Inbox className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                3. Alertas da Lista de Espera (&quot;Avise-me Quando Chegar&quot;)
              </h2>
              <p className="text-[11px] text-slate-500">
                Receba avisos instantâneos quando clientes solicitarem reposição de tamanhos esgotados.
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={notificarListaEsperaEmail}
              onChange={(e) => setNotificarListaEsperaEmail(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600" />
          </label>
        </div>

        <p className="text-xs text-slate-600">
          Com este recurso habilitado, as solicitações da lista de espera geram badges visuais no catálogo de produtos do painel administrativo, permitindo disparar mensagens de reposição via WhatsApp com 1 clique.
        </p>
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
          <span>{isSaving ? 'Salvando...' : 'Salvar Alertas & Notificações'}</span>
        </button>
      </div>
    </form>
  );
}

'use client';

import React, { useState } from 'react';
import { X, Shield, Clock, Key, Check, AlertCircle, Save } from 'lucide-react';
import { CargoColaborador, MembroEquipe, PermissoesColaborador, updateTeamMember } from '@/lib/team';

interface EditMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: MembroEquipe;
  onMemberUpdated: (updated: MembroEquipe) => void;
  lojaId: string;
}

export function EditMemberModal({ isOpen, onClose, member, onMemberUpdated, lojaId }: EditMemberModalProps) {
  const [cargo, setCargo] = useState<CargoColaborador>(member.cargo);
  const [alcadaDesconto, setAlcadaDesconto] = useState(member.alcada_desconto_percentual.toString());
  const [comissao, setComissao] = useState(member.comissao_percentual.toString());
  const [metaVendas, setMetaVendas] = useState(member.meta_vendas_mensal.toString());
  const [codigoVendedora, setCodigoVendedora] = useState(member.codigo_vendedora || '');
  const [horarioRestrito, setHorarioRestrito] = useState(member.horario_restrito);
  const [horarioInicio, setHorarioInicio] = useState(member.horario_inicio?.substring(0, 5) || '08:00');
  const [horarioFim, setHorarioFim] = useState(member.horario_fim?.substring(0, 5) || '19:00');
  const [modoPlantao, setModoPlantao] = useState(member.modo_plantao_liberado);
  const [pin, setPin] = useState(member.pin_hash || '');
  const [permissoes, setPermissoes] = useState<PermissoesColaborador>(member.permissoes);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const togglePermission = (key: keyof PermissoesColaborador) => {
    setPermissoes((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const updates: Partial<MembroEquipe> = {
        cargo,
        alcada_desconto_percentual: parseFloat(alcadaDesconto) || 0,
        comissao_percentual: parseFloat(comissao) || 0,
        meta_vendas_mensal: parseFloat(metaVendas) || 0,
        codigo_vendedora: codigoVendedora.trim().toLowerCase(),
        horario_restrito: horarioRestrito,
        horario_inicio: `${horarioInicio}:00`,
        horario_fim: `${horarioFim}:00`,
        modo_plantao_liberado: modoPlantao,
        pin_hash: pin.trim(),
        permissoes
      };

      const res = await updateTeamMember(lojaId, member.id, updates, 'Leidyane Cristina');
      if (res.success && res.member) {
        setSuccessMsg('Alterações salvas com sucesso!');
        onMemberUpdated(res.member);
        setTimeout(() => {
          onClose();
        }, 800);
      } else {
        setErrorMsg(res.error || 'Erro ao atualizar colaborador.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro inesperado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[92vh] overflow-y-auto">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 sticky top-0 bg-white/95 backdrop-blur-xs z-10">
          <div>
            <h2 className="text-base font-bold text-slate-900">Editar Permissões & Alçadas</h2>
            <p className="text-xs text-slate-500">Colaborador: <strong className="text-slate-800">{member.nome}</strong> ({member.email})</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Cargo */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">Cargo na Loja</label>
            <select
              value={cargo}
              onChange={(e) => setCargo(e.target.value as CargoColaborador)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-600 font-semibold"
            >
              <option value="dono">👑 Proprietário (Acesso Total)</option>
              <option value="gerente">👔 Gerente (Operação Geral & Alçada 15%)</option>
              <option value="atendente">💬 Atendente / Vendedora (Vendas & WhatsApp)</option>
              <option value="estoquista">📦 Estoque & Expedição (Físico & Romaneio)</option>
            </select>
          </div>

          {/* Alçadas e Metas */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <span className="text-xs font-bold text-slate-800 block">Alçadas & Metas de Vendas</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Alçada Máx. Desconto</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    value={alcadaDesconto}
                    onChange={(e) => setAlcadaDesconto(e.target.value)}
                    className="w-full pr-7 pl-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-amber-600 font-bold"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Comissão %</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={comissao}
                    onChange={(e) => setComissao(e.target.value)}
                    className="w-full pr-7 pl-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-amber-600 font-bold"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Meta Mensal (R$)</label>
                <input
                  type="number"
                  step="500"
                  value={metaVendas}
                  onChange={(e) => setMetaVendas(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-amber-600 font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Código de Vendedora (Link/Cupom)</label>
                <input
                  type="text"
                  value={codigoVendedora}
                  onChange={(e) => setCodigoVendedora(e.target.value)}
                  placeholder="ex: carla"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-amber-600 font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">PIN Balcão (4 dígitos)</label>
                <input
                  type="text"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-amber-600 font-mono font-bold tracking-widest text-center"
                />
              </div>
            </div>
          </div>

          {/* Governança CLT */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>Horário de Atendimento & CLT</span>
              </span>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={horarioRestrito}
                  onChange={(e) => setHorarioRestrito(e.target.checked)}
                  className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 h-3.5 w-3.5"
                />
                <span className="text-xs font-semibold text-slate-700">Bloquear fora do horário</span>
              </label>
            </div>

            {horarioRestrito && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Início do Turno</label>
                  <input
                    type="time"
                    value={horarioInicio}
                    onChange={(e) => setHorarioInicio(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Término do Turno</label>
                  <input
                    type="time"
                    value={horarioFim}
                    onChange={(e) => setHorarioFim(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-800 block">Modo Plantão / Live Shop</span>
                <span className="text-[10px] text-slate-500">Libera acesso temporário fora do horário para eventos especiais</span>
              </div>
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={modoPlantao}
                  onChange={(e) => setModoPlantao(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                />
              </label>
            </div>
          </div>

          {/* Switches Individuais de Permissão */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-2">
              Permissões Modulares Individuais
            </label>
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {[
                { key: 'ver_financeiro', label: 'Ver Financeiro & DRE Consolidada', desc: 'Faturamento real da boutique e balanço' },
                { key: 'ver_cmv', label: 'Ver Preço de Custo (CMV) e Margem', desc: 'Preço que o lojista pagou na fábrica' },
                { key: 'editar_catalogo', label: 'Cadastrar & Editar Peças', desc: 'Fotos, descrições, preços e tecidos' },
                { key: 'excluir_catalogo', label: 'Excluir ou Arquivar Peças', desc: 'Remoção de produtos do catálogo' },
                { key: 'ajustar_estoque', label: 'Ajustar Estoque de Peças', desc: 'Alterar saldo na arara física' },
                { key: 'gerenciar_pedidos', label: 'Gerenciar Pedidos & WhatsApp', desc: 'Ver pedidos e alterar status' },
                { key: 'acessar_crm', label: 'Acessar CRM de Clientes', desc: 'Ver histórico de compras das clientes' },
                { key: 'exportar_clientes', label: 'Exportar Base de Clientes (LGPD)', desc: 'Download de relatórios CSV' },
                { key: 'gerenciar_cupons', label: 'Criar & Editar Cupons', desc: 'Gerenciar códigos de desconto' },
                { key: 'configuracoes_loja', label: 'Configurações & Chave PIX', desc: 'Dados bancários e visual da loja' },
                { key: 'gerenciar_equipe', label: 'Gerenciar Membros da Equipe', desc: 'Criar e editar outros acessos' }
              ].map((p) => {
                const k = p.key as keyof PermissoesColaborador;
                return (
                  <div
                    key={p.key}
                    onClick={() => togglePermission(k)}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <div>
                      <span className="text-xs font-semibold text-slate-800 block">{p.label}</span>
                      <span className="text-[10px] text-slate-400">{p.desc}</span>
                    </div>
                    <div
                      className={`w-9 h-5 flex items-center rounded-full p-1 transition-colors ${
                        permissoes[k] ? 'bg-amber-600 justify-end' : 'bg-slate-300 justify-start'
                      }`}
                    >
                      <div className="w-3.5 h-3.5 rounded-full bg-white shadow-xs" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="py-2.5 px-5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Salvando...' : 'Salvar Permissões'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { X, Shield, Clock, Key, Check, AlertCircle, Save, Eye, EyeOff, Copy, Lock, KeyRound } from 'lucide-react';
import { CargoColaborador, MembroEquipe, PermissoesColaborador, updateTeamMember } from '@/lib/team';
import { useAdminI18n } from '@/context/AdminI18nContext';

interface EditMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: MembroEquipe;
  onMemberUpdated: (updated: MembroEquipe) => void;
  lojaId: string;
  operadorNome?: string;
  canViewPassword?: boolean;
}

export function EditMemberModal({
  isOpen,
  onClose,
  member,
  onMemberUpdated,
  lojaId,
  operadorNome = 'Administrador',
  canViewPassword = false
}: EditMemberModalProps) {
  const { t, formatCurrency } = useAdminI18n();
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
  const [showPassword, setShowPassword] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);

  if (!isOpen) return null;

  const togglePermission = (key: keyof PermissoesColaborador) => {
    setPermissoes((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleCopyPassword = () => {
    if (!member.senha_acesso) return;
    navigator.clipboard.writeText(member.senha_acesso);
    setCopiedPassword(true);
    setTimeout(() => setCopiedPassword(false), 2500);
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

      const res = await updateTeamMember(lojaId, member.id, updates, operadorNome);
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
            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
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

          {/* Bloco de Credenciais (Apenas para Dono e Master) */}
          {canViewPassword && (
            <div className="p-4 bg-indigo-50/70 border border-indigo-200/80 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-indigo-700" />
                  <span>Credenciais de Acesso ao Painel</span>
                </span>
                <span className="text-[10px] font-semibold text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200">
                  Acesso Restrito
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[11px] text-slate-500 block">E-mail de Login</span>
                  <strong className="text-slate-900 font-mono text-[11px] block truncate">{member.email}</strong>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 block">Senha de Acesso</span>
                    {member.senha_acesso && (
                      <button
                        type="button"
                        onClick={handleCopyPassword}
                        className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                      >
                        {copiedPassword ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedPassword ? 'Copiada!' : 'Copiar'}</span>
                      </button>
                    )}
                  </div>
                  {member.senha_acesso ? (
                    <div className="flex items-center justify-between bg-white px-2.5 py-1 rounded border border-indigo-200/80 mt-0.5">
                      <span className="font-mono text-xs font-bold text-slate-900">
                        {showPassword ? member.senha_acesso : '••••••••••••'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-400 italic block mt-0.5">Nenhuma senha cadastrada</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Cargo */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">Cargo na Loja</label>
            <select
              value={cargo}
              onChange={(e) => setCargo(e.target.value as CargoColaborador)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-600 font-semibold cursor-pointer"
            >
              <option value="dono">👑 Proprietário (Acesso Total)</option>
              <option value="gerente">👔 Gerente (Operação Geral & Alçada 15%)</option>
              <option value="atendente">👗 Atendente / Vendedora (Foco em Vendas & Alçada 5%)</option>
              <option value="estoquista">📦 Estoquista / Expedição (Foco em Inventário & Alçada 0%)</option>
            </select>
          </div>

          {/* Alçadas & Metas */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Desconto Máximo (%)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={alcadaDesconto}
                onChange={(e) => setAlcadaDesconto(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-600 font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Comissão (%)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="50"
                value={comissao}
                onChange={(e) => setComissao(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-600 font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Meta Mensal (R$)</label>
              <input
                type="number"
                step="100"
                min="0"
                value={metaVendas}
                onChange={(e) => setMetaVendas(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-600 font-semibold"
              />
            </div>
          </div>

          {/* Código de Vendedora & PIN de Balcão */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Código de Vendedora</label>
              <input
                type="text"
                value={codigoVendedora}
                onChange={(e) => setCodigoVendedora(e.target.value)}
                placeholder="Ex: mariana"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-600 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">PIN de Balcão (4 Dígitos)</label>
              <input
                type="text"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="Ex: 4321"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-600 font-mono tracking-widest font-bold"
              />
            </div>
          </div>

          {/* Controle de Horário CLT */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-bold text-slate-800">Restrição de Horário (Art. 244 CLT)</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={horarioRestrito}
                  onChange={(e) => setHorarioRestrito(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
              </label>
            </div>

            {horarioRestrito && (
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/60">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Início do Turno</label>
                  <input
                    type="time"
                    value={horarioInicio}
                    onChange={(e) => setHorarioInicio(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Fim do Turno</label>
                  <input
                    type="time"
                    value={horarioFim}
                    onChange={(e) => setHorarioFim(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Matriz de Permissões Granulares */}
          <div className="space-y-2 pt-2 border-t border-slate-200/60">
            <label className="block text-xs font-bold text-slate-800">Permissões de Módulos</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2 p-2 bg-slate-50 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={permissoes.ver_financeiro}
                  onChange={() => togglePermission('ver_financeiro')}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <span className="font-semibold text-slate-700">Ver Módulo Financeiro</span>
              </label>

              <label className="flex items-center gap-2 p-2 bg-slate-50 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={permissoes.ver_cmv}
                  onChange={() => togglePermission('ver_cmv')}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <span className="font-semibold text-slate-700">Ver Preço de Custo (CMV)</span>
              </label>

              <label className="flex items-center gap-2 p-2 bg-slate-50 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={permissoes.editar_catalogo}
                  onChange={() => togglePermission('editar_catalogo')}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <span className="font-semibold text-slate-700">Editar Catálogo & Fotos</span>
              </label>

              <label className="flex items-center gap-2 p-2 bg-slate-50 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={permissoes.ajustar_estoque}
                  onChange={() => togglePermission('ajustar_estoque')}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <span className="font-semibold text-slate-700">Ajustar Estoque Físico</span>
              </label>

              <label className="flex items-center gap-2 p-2 bg-slate-50 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={permissoes.acessar_crm}
                  onChange={() => togglePermission('acessar_crm')}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <span className="font-semibold text-slate-700">Acessar CRM de Clientes</span>
              </label>

              <label className="flex items-center gap-2 p-2 bg-slate-50 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={permissoes.gerenciar_cupons}
                  onChange={() => togglePermission('gerenciar_cupons')}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <span className="font-semibold text-slate-700">Criar & Editar Cupons</span>
              </label>

              <label className="flex items-center gap-2 p-2 bg-slate-50 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={permissoes.configuracoes_loja}
                  onChange={() => togglePermission('configuracoes_loja')}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <span className="font-semibold text-slate-700">Configurações da Loja</span>
              </label>

              <label className="flex items-center gap-2 p-2 bg-slate-50 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={permissoes.gerenciar_equipe}
                  onChange={() => togglePermission('gerenciar_equipe')}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <span className="font-semibold text-slate-700">Gerenciar Equipe & Acessos</span>
              </label>
            </div>
          </div>

          {/* Botões */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 sticky bottom-0 bg-white/95 backdrop-blur-xs">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Salvando...' : 'Salvar Alterações'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

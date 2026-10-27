'use client';

import React, { useState } from 'react';
import { X, UserPlus, Phone, Mail, Shield, Percent, DollarSign, MessageSquare, Check, Sparkles, Clock } from 'lucide-react';
import { CargoColaborador, CreateTeamMemberInput, createTeamMember, MembroEquipe } from '@/lib/team';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMemberCreated: (member: MembroEquipe) => void;
  lojaId: string;
}

export function InviteMemberModal({ isOpen, onClose, onMemberCreated, lojaId }: InviteMemberModalProps) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cargo, setCargo] = useState<CargoColaborador>('atendente');
  const [alcadaDesconto, setAlcadaDesconto] = useState('5.0');
  const [comissao, setComissao] = useState('2.5');
  const [metaVendas, setMetaVendas] = useState('15000');
  const [horarioRestrito, setHorarioRestrito] = useState(true);
  const [horarioInicio, setHorarioInicio] = useState('08:00');
  const [horarioFim, setHorarioFim] = useState('19:00');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [createdSuccess, setCreatedSuccess] = useState<MembroEquipe | null>(null);

  if (!isOpen) return null;

  const handleCargoChange = (newCargo: CargoColaborador) => {
    setCargo(newCargo);
    if (newCargo === 'atendente') {
      setAlcadaDesconto('5.0');
      setComissao('2.5');
      setMetaVendas('15000');
      setHorarioRestrito(true);
    } else if (newCargo === 'gerente') {
      setAlcadaDesconto('15.0');
      setComissao('3.0');
      setMetaVendas('25000');
      setHorarioRestrito(false);
    } else if (newCargo === 'estoquista') {
      setAlcadaDesconto('0.0');
      setComissao('0.0');
      setMetaVendas('0');
      setHorarioRestrito(true);
    } else if (newCargo === 'dono') {
      setAlcadaDesconto('100.0');
      setComissao('0.0');
      setMetaVendas('50000');
      setHorarioRestrito(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const input: CreateTeamMemberInput = {
        nome: nome.trim(),
        email: email.trim(),
        telefone: telefone.trim(),
        cargo,
        alcada_desconto_percentual: parseFloat(alcadaDesconto) || 0,
        comissao_percentual: parseFloat(comissao) || 0,
        meta_vendas_mensal: parseFloat(metaVendas) || 0,
        horario_restrito: horarioRestrito,
        horario_inicio: `${horarioInicio}:00`,
        horario_fim: `${horarioFim}:00`,
        pin: pin.trim() || undefined
      };

      const res = await createTeamMember(lojaId, input, 'Leidyane Cristina');
      if (res.success && res.member) {
        setCreatedSuccess(res.member);
        onMemberCreated(res.member);
      } else {
        setErrorMsg(res.error || 'Não foi possível cadastrar o colaborador.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro inesperado ao cadastrar.');
    } finally {
      setLoading(false);
    }
  };

  const getWhatsAppInviteUrl = (member: MembroEquipe) => {
    const cleanPhone = member.telefone.replace(/\D/g, '');
    const phoneWithDDI = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    const primeiroNome = member.nome.split(' ')[0];
    const panelUrl = typeof window !== 'undefined' ? `${window.location.origin}/admin/login` : 'https://bcomm-shop.pages.dev/admin/login';
    const msg = encodeURIComponent(
      `Olá ${primeiroNome}! Seu acesso ao Painel da Leidy Boutique foi criado com sucesso com perfil de ${member.cargo.toUpperCase()}.\n\nSeu PIN rápido de balcão é: *${member.pin_hash}*\n\nPara acessar a qualquer momento, utilize o link: ${panelUrl}`
    );
    return `https://wa.me/${phoneWithDDI}?text=${msg}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[90vh] overflow-y-auto">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 sticky top-0 bg-white/95 backdrop-blur-xs z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200/60">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Novo Membro da Equipe</h2>
              <p className="text-xs text-slate-500">Cadastre um colaborador e defina sua alçada de acesso</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sucesso pós cadastro */}
        {createdSuccess ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-sm">
              <Check className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Colaborador Cadastrado com Sucesso!</h3>
              <p className="text-xs text-slate-600 mt-1">
                <strong>{createdSuccess.nome}</strong> agora tem acesso configurado como <strong>{createdSuccess.cargo.toUpperCase()}</strong>.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left text-xs space-y-2">
              <div className="flex justify-between items-center text-slate-600">
                <span>E-mail:</span>
                <strong className="text-slate-900">{createdSuccess.email}</strong>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>PIN Balcão:</span>
                <span className="font-mono font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded text-sm">
                  {createdSuccess.pin_hash}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Alçada de Desconto:</span>
                <strong className="text-emerald-700">Até {createdSuccess.alcada_desconto_percentual}%</strong>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <a
                href={getWhatsAppInviteUrl(createdSuccess)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Enviar Dados no WhatsApp</span>
              </a>
              <button
                onClick={onClose}
                className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
              >
                Fechar
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                {errorMsg}
              </div>
            )}

            {/* Seleção Visual do Cargo */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-2">
                Cargo e Nível de Acesso
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'atendente', label: 'Atendente', icon: '💬', desc: 'Vendas & WhatsApp' },
                  { id: 'gerente', label: 'Gerente', icon: '👔', desc: 'Operação Geral' },
                  { id: 'estoquista', label: 'Estoque', icon: '📦', desc: 'Expedição & Arara' },
                  { id: 'dono', label: 'Proprietário', icon: '👑', desc: 'Acesso Irrestrito' }
                ].map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleCargoChange(c.id as CargoColaborador)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      cargo === c.id
                        ? 'border-amber-600 bg-amber-50/60 ring-2 ring-amber-600/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <span className="text-lg">{c.icon}</span>
                    <span className="text-xs font-bold text-slate-900 mt-2 block">{c.label}</span>
                    <span className="text-[10px] text-slate-500">{c.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Dados Pessoais */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Carla Santos"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-amber-600 transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    E-mail Corporativo
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="carla@leidyboutique.com.br"
                      className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-amber-600 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    WhatsApp para Acesso
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={telefone}
                      onChange={(e) => setTelefone(e.target.value)}
                      placeholder="(11) 99876-5432"
                      className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-amber-600 transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Alçadas e Metas Comerciais */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <Shield className="w-3.5 h-3.5 text-amber-600" />
                <span>Alçadas Comerciais & Comissionamento</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Alçada Máx. Desconto
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="100"
                      value={alcadaDesconto}
                      onChange={(e) => setAlcadaDesconto(e.target.value)}
                      className="w-full pr-7 pl-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-amber-600"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">%</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Excesso exige PIN Master</span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Comissão sobre Venda
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="50"
                      value={comissao}
                      onChange={(e) => setComissao(e.target.value)}
                      className="w-full pr-7 pl-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-amber-600"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">%</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Calculada nos pedidos</span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Meta de Vendas (R$)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="500"
                      min="0"
                      value={metaVendas}
                      onChange={(e) => setMetaVendas(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-amber-600"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Meta mensal da equipe</span>
                </div>
              </div>
            </div>

            {/* Governança CLT e Horário de Expediente */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Proteção CLT & Horário de Atendimento</span>
                </div>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={horarioRestrito}
                    onChange={(e) => setHorarioRestrito(e.target.checked)}
                    className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 h-3.5 w-3.5"
                  />
                  <span className="text-xs font-semibold text-slate-700">Bloquear fora do expediente</span>
                </label>
              </div>

              {horarioRestrito && (
                <div className="grid grid-cols-2 gap-3 pt-1">
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
            </div>

            {/* PIN Rápido Balcão */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                PIN de 4 dígitos para Balcão / Tablet (Opcional - Gerado automaticamente se vazio)
              </label>
              <input
                type="text"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="Ex: 2580"
                className="w-32 px-3 py-2 text-center font-mono font-bold tracking-widest text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-600"
              />
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
                {loading ? 'Salvando...' : 'Criar Colaborador'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

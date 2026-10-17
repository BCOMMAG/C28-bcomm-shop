// src/lib/export.ts
// Utilitários de exportação de dados em CSV formatados para Excel e padrão contábil brasileiro

import { CustomerOrder } from './orders';

/**
 * Dispara o download de um arquivo CSV no navegador com suporte a acentos no Excel (BOM UTF-8)
 */
export function downloadCsv(filename: string, content: string): void {
  if (typeof window === 'undefined') return;

  const bom = '\uFEFF';
  const blob = new Blob([bom + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exporta a listagem de pedidos para formato CSV (Excel PT-BR)
 */
export function exportOrdersToCsv(orders: any[], customFilename?: string): void {
  const headers = [
    'Número do Pedido',
    'Data/Hora',
    'Cliente',
    'Telefone/WhatsApp',
    'Status',
    'Método Pagamento',
    'Subtotal (R$)',
    'Desconto (R$)',
    'Frete (R$)',
    'Total (R$)',
    'Qtd Peças',
    'Itens Comprados',
    'Código Rastreio',
    'Cidade/UF'
  ];

  const rows = orders.map((ord: any) => {
    const rawData = ord.created_at || ord.data;
    const dataHora = rawData ? new Date(rawData).toLocaleString('pt-BR') : '';
    const numPedido = ord.numero_pedido || ord.id || 'S/N';
    const clienteNome = ord.cliente_nome || ord.clientes_loja?.nome || 'Cliente VIP';
    const clienteTel = ord.cliente_telefone || ord.clientes_loja?.telefone || '';

    const statusLabel =
      ord.status === 'pago'
        ? 'Pago'
        : ord.status === 'em_separacao'
        ? 'Em Separação'
        : ord.status === 'enviado'
        ? 'Enviado'
        : ord.status === 'entregue'
        ? 'Entregue'
        : ord.status === 'cancelado'
        ? 'Cancelado'
        : 'Aguardando WhatsApp';

    const metodoPagamento =
      ord.metodo_pagamento === 'pix'
        ? 'PIX'
        : ord.metodo_pagamento === 'cartao' || ord.metodo_pagamento === 'credit_card'
        ? 'Cartão de Crédito'
        : 'WhatsApp';

    const itemsList = ord.itens_pedido || ord.itens || [];
    const itensDesc = itemsList
      .map((i: any) => `${i.quantidade}x ${i.nome_produto || i.nome} (${i.cor || ''} ${i.tamanho || ''})`)
      .join(' | ');

    const cidade = ord.endereco_entrega?.cidade || ord.cidade || '';
    const uf = ord.endereco_entrega?.uf || ord.uf || '';
    const cidadeUf = cidade ? `${cidade}/${uf}` : '';
    const qtdTotal = ord.quantidade_pecas || itemsList.reduce((acc: number, i: any) => acc + (i.quantidade || 1), 0);

    return [
      `"#${numPedido}"`,
      `"${dataHora}"`,
      `"${clienteNome.replace(/"/g, '""')}"`,
      `"${clienteTel}"`,
      `"${statusLabel}"`,
      `"${metodoPagamento}"`,
      `"${(ord.subtotal || ord.total || 0).toFixed(2).replace('.', ',')}"`,
      `"${(ord.valor_desconto || 0).toFixed(2).replace('.', ',')}"`,
      `"${(ord.valor_frete || 0).toFixed(2).replace('.', ',')}"`,
      `"${(ord.total || 0).toFixed(2).replace('.', ',')}"`,
      `"${qtdTotal}"`,
      `"${itensDesc.replace(/"/g, '""')}"`,
      `"${ord.codigo_rastreio || ''}"`,
      `"${cidadeUf}"`
    ].join(';');
  });

  const csvContent = [headers.join(';'), ...rows].join('\r\n');
  const filename = customFilename || `pedidos_bcomm_${new Date().toISOString().slice(0, 10)}.csv`;
  downloadCsv(filename, csvContent);
}

export interface FinanceExportData {
  periodoNome: string;
  faturamentoBruto: number;
  cmvTotal: number;
  lucroBruto: number;
  despesasOperacionais: number;
  lucroLiquido: number;
  margemPercent: number;
  pedidosFaturados: number;
  pecasVendidas: number;
  ticketMedio: number;
  topProdutos: Array<{
    nome: string;
    quantidadeVendida: number;
    faturamento: number;
    lucro: number;
  }>;
}

/**
 * Exporta o demonstrativo contábil DRE para formato CSV (Excel PT-BR)
 */
export function exportFinanceDREToCsv(data: FinanceExportData, customFilename?: string): void {
  const lines: string[] = [
    'DEMONSTRATIVO DE RESULTADO DO EXERCÍCIO (DRE GERENCIAL)',
    `Período Analisado;${data.periodoNome}`,
    `Data da Exportação;${new Date().toLocaleString('pt-BR')}`,
    '',
    'INDICADOR FINANCEIRO;VALOR (R$);% SOBRE FATURAMENTO',
    `(+) FATURAMENTO BRUTO;${data.faturamentoBruto.toFixed(2).replace('.', ',')};100,0%`,
    `(-) Custo das Mercadorias Vendidas (CMV);${data.cmvTotal.toFixed(2).replace('.', ',')};${((data.cmvTotal / (data.faturamentoBruto || 1)) * 100).toFixed(1).replace('.', ',')}%`,
    `(=) LUCRO BRUTO OPERACIONAL;${data.lucroBruto.toFixed(2).replace('.', ',')};${((data.lucroBruto / (data.faturamentoBruto || 1)) * 100).toFixed(1).replace('.', ',')}%`,
    `(-) Despesas Operacionais e Embalagens;${data.despesasOperacionais.toFixed(2).replace('.', ',')};${((data.despesasOperacionais / (data.faturamentoBruto || 1)) * 100).toFixed(1).replace('.', ',')}%`,
    `(=) LUCRO LÍQUIDO REAL NO CAIXA;${data.lucroLiquido.toFixed(2).replace('.', ',')};${data.margemPercent.toFixed(1).replace('.', ',')}%`,
    '',
    'MÉTRICAS DE EFICIÊNCIA OPERACIONAL',
    `Pedidos Faturados;${data.pedidosFaturados}`,
    `Peças Físicas Vendidas;${data.pecasVendidas}`,
    `Ticket Médio por Venda;R$ ${data.ticketMedio.toFixed(2).replace('.', ',')}`,
    '',
    'TOP PRODUTOS MAIS LUCRATIVOS DO PERÍODO',
    'Peça / Modelo;Qtd Vendida;Faturamento (R$);Lucro Gerado (R$)'
  ];

  data.topProdutos.forEach((p) => {
    lines.push(
      `"${p.nome.replace(/"/g, '""')}";${p.quantidadeVendida};${p.faturamento.toFixed(2).replace('.', ',')};${p.lucro.toFixed(2).replace('.', ',')}`
    );
  });

  const csvContent = lines.join('\r\n');
  const filename = customFilename || `dre_financeiro_${new Date().toISOString().slice(0, 10)}.csv`;
  downloadCsv(filename, csvContent);
}

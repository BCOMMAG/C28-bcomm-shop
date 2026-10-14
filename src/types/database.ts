// ==============================================================================
// 🏛️ DEFINIÇÃO DE TIPOS DO BANCO DE DADOS (SUPABASE POSTGRESQL MULTI-TENANT)
// ==============================================================================

export interface LojaConfiguracoesVisuais {
  cor_primaria: string;
  cor_secundaria: string;
  cor_fundo: string;
  logo_url: string;
  tagline: string;
  frete_gratis_valor: number;
}

export interface LojaModulosAtivos {
  frete_automatico?: boolean;
  rastreio_whatsapp?: boolean;
  recuperacao_carrinho?: boolean;
  checkout_transparente?: boolean;
  [key: string]: boolean | undefined;
}

export interface Loja {
  id: string;
  nome: string;
  slug: string;
  dominio_proprio: string | null;
  whatsapp: string;
  email: string | null;
  configuracoes_visuais: LojaConfiguracoesVisuais;
  modulos_ativos: LojaModulosAtivos;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface CategoriaDB {
  id: string;
  loja_id: string;
  nome: string;
  slug: string;
  display_order: number;
  created_at: string;
}

export interface ProdutoDB {
  id: string;
  loja_id: string;
  categoria_id: string | null;
  nome: string;
  slug: string;
  descricao: string | null;
  preco: number;
  preco_promocional: number | null;
  tecido: string | null;
  modelagem: string | null;
  linha: string | null;
  status_badges: string[];
  destaque: boolean;
  outlet: boolean;
  mais_vendido: boolean;
  ultimas_pecas: boolean;
  estoque_total: number;
  rating: number;
  review_count: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface VariacaoProdutoDB {
  id: string;
  loja_id: string;
  produto_id: string;
  cor_nome: string;
  cor_hex: string;
  tamanho: string;
  estoque: number;
  sku: string | null;
  created_at: string;
}

export interface MidiaProdutoDB {
  id: string;
  loja_id: string;
  produto_id: string;
  tipo: 'image' | 'video';
  url: string;
  label: string | null;
  display_order: number;
  created_at: string;
}

export interface HeroBannerDB {
  id: string;
  loja_id: string;
  titulo: string | null;
  subtitulo: string | null;
  cta_texto: string | null;
  cta_link: string | null;
  tipo_midia: 'image' | 'video';
  desktop_media_url: string;
  mobile_media_url: string;
  display_order: number;
  ativo: boolean;
  created_at: string;
}

export interface MenuNavegacaoDB {
  id: string;
  loja_id: string;
  parent_id: string | null;
  label: string;
  href: string;
  badge_texto: string | null;
  display_order: number;
  ativo: boolean;
  created_at: string;
  submenus?: MenuNavegacaoDB[];
}

export interface ClienteLojaDB {
  id: string;
  loja_id: string;
  nome: string;
  telefone: string;
  email: string | null;
  cpf: string | null;
  preferencias: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface PedidoDB {
  id: string;
  loja_id: string;
  numero_pedido: string;
  cliente_id: string | null;
  status: 'pendente' | 'aguardando_whatsapp' | 'pago' | 'em_separacao' | 'enviado' | 'entregue' | 'cancelado';
  subtotal: number;
  valor_frete: number;
  valor_desconto: number;
  total: number;
  metodo_pagamento: string;
  endereco_entrega: Record<string, unknown>;
  codigo_rastreio: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ItemPedidoDB {
  id: string;
  pedido_id: string;
  loja_id: string;
  produto_id: string | null;
  nome_produto: string;
  cor: string;
  tamanho: string;
  preco_unitario: number;
  quantidade: number;
  imagem_url: string | null;
}

export interface CupomDB {
  id: string;
  loja_id: string;
  codigo: string;
  tipo_desconto: 'percent' | 'fixed';
  valor_desconto: number;
  valor_minimo: number;
  limite_usos: number | null;
  usos_atuais: number;
  data_validade: string | null;
  ativo: boolean;
  created_at: string;
}

// ==============================================================================
// 🏛️ DEFINIÇÃO DE TIPOS DO BANCO DE DADOS (SUPABASE POSTGRESQL MULTI-TENANT)
// ==============================================================================

export interface BarraAvisoEstilo {
  modo: 'unificado' | 'independente';
  bg_light: string;
  text_light: string;
  bg_dark: string;
  text_dark: string;
  font_family: string;
  icone?: 'sparkles' | 'truck' | 'gift' | 'heart' | 'tag' | 'none';
}

export interface ProgramaVIPBeneficios {
  frete_gratis_sem_minimo?: boolean;
  frete_gratis_valor_minimo?: number;
  presente_gratis?: boolean;
  desconto_percentual?: number;
}

export interface ProgramaVIPCriterios {
  ltv_minimo?: number;
  pedidos_minimos?: number;
  ticket_medio_minimo?: number;
}

export interface ProgramaVIPConfig {
  ativo: boolean;
  modo: 'manual' | 'hibrido' | 'automatico';
  criterios_automaticos?: ProgramaVIPCriterios;
  beneficios?: ProgramaVIPBeneficios;
  mensagem_reconhecimento?: string;
}

export interface StorePreloaderConfig {
  ativo: boolean;
  modelo: 'haute_couture' | 'monograma' | 'editorial_dark';
  fundo: string;
  cor_primaria: string;
  cor_texto: string;
  exibir_porcentagem: boolean;
  exibir_logo: boolean;
  exibir_slogan: boolean;
  frequencia: 'apenas_entrada' | 'todas_as_paginas';
  tempo_minimo_ms?: number;
  timeout_seguranca_ms?: number;
}

export interface ColecaoLojaItem {
  id: string;
  nome: string;
  slug: string;
  descricao?: string;
  badge_texto?: string;
  badge_cor?: string;
  banner_url?: string;
  ativo: boolean;
  exibir_na_home: boolean;
  ordem: number;
  produto_ids: string[];
  is_sistema?: boolean;
  created_at: string;
  updated_at: string;
}

export interface CategoriaNode {
  id: string;                      // UUID único e estável da categoria/ramo
  loja_id: string;                 // Isolamento multi-tenant
  nome: string;                    // Nome visível (ex.: "Tricots de Gola Alta")
  slug: string;                    // Slug amigável (ex.: "tricots-gola-alta")
  parent_id: string | null;        // ID da categoria-mãe (null = Raiz / Nível 1)
  nivel: number;                   // Profundidade (0 = Raiz, 1 = Sub, 2 = Sub-sub...)
  display_order: number;           // Ordem entre os irmãos do mesmo pai
  ativo: boolean;                  // Status de exibição na loja
  icone?: string;                  // Emoji ou ícone decorativo (ex.: "🧶", "🧥")
  descricao?: string;              // Descrição opcional para banners do catálogo
  banner_url?: string;             // Imagem de capa para o catálogo da categoria
  caminho_completo?: string;       // ex: "Roupas > Parte Superior > Tricots"
  slug_path?: string;              // ex: "roupas/parte-superior/tricots"
  filhos?: CategoriaNode[];        // Sub-ramos recursivos
  total_produtos_diretos?: number; // Peças vinculadas diretamente a este nó
  total_produtos_arvore?: number;  // Peças deste nó + todos os seus descendentes
  caminho_slugs?: string;          // ex: "roupas/parte-superior/tricots"
  created_at?: string;
  updated_at?: string;
}

export interface TabelaMedidasLinha {
  id: string;
  tamanho: string;
  manequim: string;
  busto: string;
  cintura: string;
  quadril: string;
  comprimento?: string;
  busto_min?: number;
  busto_max?: number;
  cintura_min?: number;
  cintura_max?: number;
  quadril_min?: number;
  quadril_max?: number;
  is_adaptavel?: boolean;
}

export interface GradePredefinida {
  id: string;
  nome: string;
  tamanhos: string[];
}

export interface LojaGuiaMedidas {
  ativo: boolean;
  titulo?: string;
  subtitulo?: string;
  dica_caimento?: string;
  provador_virtual_ativo?: boolean;
  linhas: TabelaMedidasLinha[];
  whatsapp_duvidas_ativo?: boolean;
}

export interface LojaConfiguracoesVisuais {
  cor_primaria: string;
  cor_secundaria: string;
  cor_fundo: string;
  logo_url: string;
  logo_dark_url?: string;
  favicon_url?: string;
  og_image_url?: string;
  tagline: string;
  frete_gratis_valor: number;
  barra_aviso?: string;
  barra_aviso_ativa?: boolean;
  barra_aviso_estilo?: BarraAvisoEstilo;
  exibir_quantidade_estoque_consumidor?: boolean;
  programa_vip?: ProgramaVIPConfig;
  preloader?: StorePreloaderConfig;
  colecoes_personalizadas?: ColecaoLojaItem[];
  arvore_categorias?: CategoriaNode[];
  guia_medidas?: LojaGuiaMedidas;
  [key: string]: any;
}

export interface LojaModulosAtivos {
  frete_automatico?: boolean;
  rastreio_whatsapp?: boolean;
  recuperacao_carrinho?: boolean;
  checkout_transparente?: boolean;
  [key: string]: boolean | undefined;
}

export interface LojaConfiguracoesFinanceiras {
  imposto_padrao?: number;
  taxa_cartao_padrao?: number;
  custo_embalagem_padrao?: number;
  chave_pix?: string;
  tipo_chave_pix?: 'telefone' | 'cnpj' | 'email' | 'aleatoria';
  pix_titular?: string;
  pix_banco?: string;
  pix_desconto_percent?: number;
  pix_expiracao_minutos?: number;
  pix_whatsapp_comprovante?: string;
  max_parcelas_sem_juros?: number;
  parcela_minima_valor?: number;
  parcelamento_ativo?: boolean;
  [key: string]: any;
}

export interface Loja {
  id: string;
  nome: string;
  slug: string;
  dominio_proprio: string | null;
  whatsapp: string;
  email: string | null;
  configuracoes_visuais: LojaConfiguracoesVisuais;
  configuracoes_financeiras?: LojaConfiguracoesFinanceiras;
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

export interface AdminHeroBanner {
  id: string;
  titulo?: string | null;
  subtitulo?: string | null;
  cta_texto?: string | null;
  cta_link?: string | null;
  tipo_midia: 'video' | 'image';
  desktop_media_url: string;
  mobile_media_url: string;
  display_order?: number;
  ativo: boolean;
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

export interface ClienteLojaPreferenciasVIP {
  is_vip_manual?: boolean;
  vip_motivo?: string;
  vip_atribuido_em?: string;
  vip_atribuido_por?: string;
  vip_validade?: 'vitalicio' | '30d' | '90d' | '180d' | '365d';
  tamanho_habitual?: string;
  notas_internas?: string;
  cidade?: string;
  uf?: string;
  [key: string]: unknown;
}

export interface ClienteLojaDB {
  id: string;
  loja_id: string;
  nome: string;
  telefone: string;
  email: string | null;
  cpf: string | null;
  preferencias: ClienteLojaPreferenciasVIP;
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

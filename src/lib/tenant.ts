import { Loja, AdminHeroBanner } from '@/types/database';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

// Cache em memória para resolução rápida de lojas (evita roundtrips desnecessários)
const tenantCache = new Map<string, { loja: Loja; expiresAt: number }>();
const CACHE_TTL_MS = 60 * 1000; // 1 minuto de cache

/**
 * Limpa o cache de tenants em memória para refletir alterações imediatas do painel admin
 */
export function clearTenantCache(): void {
  tenantCache.clear();
}

/**
 * Normaliza qualquer variação de slug para o slug canônico cadastrado no banco Supabase
 */
export function getCanonicalDbSlug(slug?: string | null): string {
  const clean = (slug || '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
  if (clean === 'leidyboutique' || clean === 'leidy-boutique' || clean === '') {
    return 'leidy-boutique';
  }
  if (clean === 'auraprivee' || clean === 'aura-privee') {
    return 'aura-privee';
  }
  return clean;
}

// Configuração padrão da Leidy Boutique (Tenant #1 Oficial)
export const DEFAULT_LEIDY_TENANT: Loja = {
  "id": "e8b7f890-4e3a-4a89-9c56-8e1234567890",
  "nome": "Leidy Boutique",
  "slug": "leidy-boutique",
  "dominio_proprio": "www.boutiqueleidy.com.br",
  "whatsapp": "554197347601",
  "email": "contato@leidyboutique.com.br",
  "configuracoes_visuais": {
    "slogan": "Moda Feminina Autêntica & Elegância Diária",
    "tagline": "Curadoria Exclusiva em Moda Feminina",
    "logo_url": "/images/Logo sem fundo.png",
    "cor_fundo": "#FAF8F5",
    "preloader": {
      "ativo": false,
      "fundo": "#FAF8F5",
      "modelo": "haute_couture",
      "cor_texto": "#1A1918",
      "frequencia": "apenas_entrada",
      "exibir_logo": true,
      "cor_primaria": "#DFBE76",
      "exibir_slogan": true,
      "tempo_minimo_ms": 650,
      "exibir_porcentagem": true,
      "timeout_seguranca_ms": 2500
    },
    "barra_aviso": "Frete Grátis para todo o Brasil acima de R$ 350 | Atendimento VIP via WhatsApp",
    "favicon_url": "",
    "admin_custom": {
      "buttonBg": "#0F172A",
      "sidebarBg": "#0B132B",
      "buttonText": "#F59E0B",
      "fontFamily": "Montserrat",
      "pageBgDark": "#0B132B",
      "pageBgLight": "#ffffff",
      "sidebarText": "#94A3B8",
      "buttonRadius": "rounded-xl"
    },
    "cor_primaria": "#DFBE76",
    "og_image_url": "",
    "logo_dark_url": "",
    "taxa_presente": 12,
    "cor_secundaria": "#1A1918",
    "presente_ativo": false,
    "secoes_vitrine": {
      "global": {
        "ativo": true,
        "tituloFont": "Playfair Display",
        "tituloCorDark": "#FFFFFF",
        "tituloCorLight": "#FFFFFF",
        "subtituloCorDark": "#FAF8F5",
        "subtituloCorLight": "#FAF8F5"
      },
      "outlet": {
        "ativo": true,
        "titulo": "Bazar & Oportunidades",
        "subtitulo": "Peças selecionadas com condições especiais por tempo limitado.",
        "tituloFont": "Playfair Display",
        "tituloCorDark": "#FFFFFF",
        "tituloCorLight": "#FFFFFF",
        "subtituloCorDark": "#FAF8F5",
        "subtituloCorLight": "#FAF8F5"
      },
      "lancamentos": {
        "ativo": true,
        "titulo": "Lançamentos Exclusivos",
        "subtitulo": "As últimas novidades que acabaram de chegar na boutique, com tecidos nobres e acabamento impecável.",
        "tituloFont": "Playfair Display",
        "tituloCorDark": "#FFFFFF",
        "tituloCorLight": "#FFFFFF",
        "subtituloCorDark": "#FAF8F5",
        "subtituloCorLight": "#FAF8F5"
      },
      "secoesLista": [
        {
          "id": "lancamentos",
          "tipo": "nativa_lancamentos",
          "ativo": true,
          "ordem": 0,
          "titulo": "Lançamentos Exclusivos",
          "subtitulo": "As últimas novidades que acabaram de chegar na boutique, com tecidos nobres e acabamento impecável.",
          "tituloFont": "Playfair Display",
          "tituloCorDark": "#FFFFFF",
          "tituloCorLight": "#FFFFFF",
          "subtituloCorDark": "#FAF8F5",
          "subtituloCorLight": "#FAF8F5"
        },
        {
          "id": "mais-vendidos",
          "tipo": "nativa_mais_vendidos",
          "ativo": true,
          "ordem": 1,
          "titulo": "Mais Vendidos & Queridinhos",
          "subtitulo": "As criações favoritas e mais desejadas pelas nossas clientes.",
          "tituloFont": "Playfair Display",
          "tituloCorDark": "#FFFFFF",
          "tituloCorLight": "#FFFFFF",
          "subtituloCorDark": "#FAF8F5",
          "subtituloCorLight": "#FAF8F5"
        },
        {
          "id": "outlet",
          "tipo": "nativa_outlet",
          "ativo": true,
          "ordem": 2,
          "titulo": "Bazar & Oportunidades",
          "subtitulo": "Peças selecionadas com condições especiais por tempo limitado.",
          "tituloFont": "Playfair Display",
          "tituloCorDark": "#FFFFFF",
          "tituloCorLight": "#FFFFFF",
          "subtituloCorDark": "#FAF8F5",
          "subtituloCorLight": "#FAF8F5"
        },
        {
          "id": "ultimas-pecas",
          "tipo": "nativa_ultimas_pecas",
          "ativo": true,
          "ordem": 3,
          "titulo": "Últimas Peças",
          "subtitulo": "Poucas unidades restantes em estoque. Garanta a sua antes que esgote definitivamente.",
          "tituloFont": "Playfair Display",
          "tituloCorDark": "#FFFFFF",
          "tituloCorLight": "#FFFFFF",
          "subtituloCorDark": "#FAF8F5",
          "subtituloCorLight": "#FAF8F5"
        },
        {
          "id": "todas-as-pecas",
          "tipo": "nativa_todas_pecas",
          "ativo": true,
          "ordem": 4,
          "titulo": "Todas as Peças",
          "subtitulo": "Conheça todas as criações e modelos exclusivos disponíveis na boutique.",
          "tituloFont": "Playfair Display",
          "tituloCorDark": "#FFFFFF",
          "tituloCorLight": "#FFFFFF",
          "subtituloCorDark": "#FAF8F5",
          "subtituloCorLight": "#FAF8F5"
        }
      ],
      "maisVendidos": {
        "ativo": true,
        "titulo": "Mais Vendidos & Queridinhos",
        "subtitulo": "As criações favoritas e mais desejadas pelas nossas clientes.",
        "tituloFont": "Playfair Display",
        "tituloCorDark": "#FFFFFF",
        "tituloCorLight": "#FFFFFF",
        "subtituloCorDark": "#FAF8F5",
        "subtituloCorLight": "#FAF8F5"
      },
      "todasAsPecas": {
        "ativo": true,
        "titulo": "Todas as Peças",
        "subtitulo": "Conheça todas as criações e modelos exclusivos disponíveis na boutique.",
        "tituloFont": "Playfair Display",
        "tituloCorDark": "#FFFFFF",
        "tituloCorLight": "#FFFFFF",
        "subtituloCorDark": "#FAF8F5",
        "subtituloCorLight": "#FAF8F5"
      },
      "ultimasPecas": {
        "ativo": true,
        "titulo": "Últimas Peças",
        "subtitulo": "Poucas unidades restantes em estoque. Garanta a sua antes que esgote definitivamente.",
        "tituloFont": "Playfair Display",
        "tituloCorDark": "#FFFFFF",
        "tituloCorLight": "#FFFFFF",
        "subtituloCorDark": "#FAF8F5",
        "subtituloCorLight": "#FAF8F5"
      },
      "modoIndependente": false
    },
    "tipografia_menu": {
      "fontSize": "12px",
      "fontFamily": "Montserrat",
      "corHoverDark": "#DFBE76",
      "corTextoDark": "#FAF8F5",
      "corHoverLight": "#C5A059",
      "corTextoLight": "#1A1918"
    },
    "plano_fundo_menu": {
      "tipo": "transparente",
      "bg_dark": "#141312",
      "bg_light": "#FAF8F5"
    },
    "plano_fundo_site": {
      "tipo": "imagem",
      "bg_dark": "#121110",
      "bg_light": "#FAF8F5",
      "video_url": "/video/plano-de-fundo.mp4",
      "imagem_url": "/images/plano-de-fundo.webp",
      "overlay_opacidade": 50
    },
    "barra_aviso_ativa": true,
    "barra_aviso_estilo": {
      "modo": "unificado",
      "icone": "gift",
      "bg_dark": "#0D0C0B",
      "bg_light": "#1A1918",
      "text_dark": "#EED59B",
      "text_light": "#ffffff",
      "font_family": "'Montserrat', sans-serif"
    },
    "entrega_local_taxa": 18,
    "frete_gratis_valor": 350,
    "logistica_avancada": {
      "ambiente": "sandbox",
      "provedor": "melhor_envio",
      "cep_origem": "82620045",
      "modo_exibicao": "transparente",
      "entrega_motoboy": {
        "ativo": false,
        "taxa_tipo": "fixa",
        "modo_cobertura": "raio_km",
        "raio_maximo_km": 15,
        "taxa_fixa_reais": 18,
        "faixas_distancia": [
          {
            "ate_km": 5,
            "valor_reais": 12
          },
          {
            "ate_km": 15,
            "valor_reais": 18
          },
          {
            "ate_km": 25,
            "valor_reais": 28
          }
        ],
        "descricao_vitrine": "Entrega no mesmo dia para pedidos aprovados até as 14h",
        "nome_personalizado": "Entrega Expressa via Motoboy",
        "origem_coordenadas": {
          "uf": "PR",
          "cep": "82620045",
          "bairro": "Tingui",
          "cidade": "Curitiba",
          "numero": "898",
          "latitude": -25.3835608,
          "longitude": -49.2284958,
          "precision": "predial",
          "logradouro": "Rua João Batista Trentin"
        },
        "valor_minimo_pedido": 0,
        "permite_frete_gratis": false,
        "dias_semana_disponiveis": [
          1,
          2,
          3,
          4,
          5,
          6
        ],
        "horario_limite_mesmo_dia": "14:00"
      },
      "dimensoes_pacote": {
        "altura": 8,
        "largura": 20,
        "comprimento": 25
      },
      "entrega_local_taxa": 18,
      "origem_coordenadas": {
        "uf": "PR",
        "cep": "82620045",
        "bairro": "Tingui",
        "cidade": "Curitiba",
        "numero": "898",
        "latitude": -25.3835608,
        "longitude": -49.2284958,
        "precision": "predial",
        "logradouro": "Rua João Batista Trentin"
      },
      "token_melhor_envio": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiI5NTYiLCJqdGkiOiI5NTM0MDIxNWVkZTU2MmU3ZWI3YjVlNmU0ODc3MzY4YmZjNTQwZTk4NzE4OWY1YmE3Yjg2YzliMTQ1NTY2ZmEzMGVlNDcyOGU2ZGIyMTEyZSIsImlhdCI6MTc5MzU2NzQ2Ni4yODIwMywibmJmIjoxNzkzNTY3NDY2LjI4MjAzMiwiZXhwIjoxODI1MTAzNDY2LjI3MjA4NCwic3ViIjoiYTMxZmI3OTItMWE2Mi00ZTNkLTlkMDctNDYxMDE5YjM5N2EzIiwic2NvcGVzIjpbImNhcnQtcmVhZCIsImNhcnQtd3JpdGUiLCJjb21wYW5pZXMtcmVhZCIsImNvbXBhbmllcy13cml0ZSIsImNvdXBvbnMtcmVhZCIsImNvdXBvbnMtd3JpdGUiLCJub3RpZmljYXRpb25zLXJlYWQiLCJvcmRlcnMtcmVhZCIsInByb2R1Y3RzLXJlYWQiLCJwcm9kdWN0cy1kZXN0cm95IiwicHJvZHVjdHMtd3JpdGUiLCJwdXJjaGFzZXMtcmVhZCIsInNoaXBwaW5nLWNhbGN1bGF0ZSIsInNoaXBwaW5nLWNhbmNlbCIsInNoaXBwaW5nLWNoZWNrb3V0Iiwic2hpcHBpbmctY29tcGFuaWVzIiwic2hpcHBpbmctZ2VuZXJhdGUiLCJzaGlwcGluZy1wcmV2aWV3Iiwic2hpcHBpbmctcHJpbnQiLCJzaGlwcGluZy1zaGFyZSIsInNoaXBwaW5nLXRyYWNraW5nIiwiZWNvbW1lcmNlLXNoaXBwaW5nIiwidHJhbnNhY3Rpb25zLXJlYWQiLCJ1c2Vycy1yZWFkIiwidXNlcnMtd3JpdGUiLCJ3ZWJob29rcy1yZWFkIiwid2ViaG9va3Mtd3JpdGUiLCJ3ZWJob29rcy1kZWxldGUiLCJ0ZGVhbGVyLXdlYmhvb2siLCJtY3A6dXNlIl19.HafmTl0rZqNmis2sl6mBJ4otIaRodVEzDlhjM5bqAcGepJfKZUQo83FnjXUMoEfZiz5hAaZTEzCn40sqV_W7T_bpKMJW-XS8rdohCWqcTNi7U9es3c6KSNNGasw7oD3B1nRPU768DxfMKHcfxeqVq5wK-0XhpwYr-PjHKwxtwBczWjxf6wzepeKDHRY-yS_Ez0XycIvV_AqsuPG93Tn1Gu61vQLXles-lahxnoIdfAN7oHpPKLrUMdUQ2ChjQzOwkp7Oypn7x881Q3zbMIAGVgpAIM7nqpb4I812YhmRMdMG-rA_MrVfu4bHLi11aKULuBpAkx8nO7mnCf0sVLcgerdBOYgCz9tzJPT0ICV3au88eKKtk7ea9peJkj666ZlmD6ThS5gUrnaJZIMpFK1mLu3rShxFVQQxIJxPrrB5aOlOPlI3aJT9wJ2EeHYrAdwBWEoUUVigQLaBpzPlVx-Z-qmtzxcnRE61AXiEMeoP2r5AgbeLLcGnkfpFvXdttvePAeR4z8uoQotRGILSQZTg7a97-wczSbnsVe93Djkky1j1NjAU-avVCN9rXNoMgOTwDJVy6DJi1r_TdL-6NH2mwNhSJmXkbXRhfJkZZEGNYBj9iV6m9tzstUO0bVhj2J-uouRo6vekb9A7rS8sfxJdIMxfX4eP3QcEwoO3YiezWWw",
      "entrega_local_ativa": false,
      "instrucoes_retirada": "Retirada disponível em até 2 horas úteis após a confirmação do pagamento. Apresentar documento de identificação com foto e número do pedido.",
      "prazo_manuseio_dias": 1,
      "regras_frete_gratis": {
        "ativo": false,
        "regras_regionais": [
          {
            "uf": "PR",
            "valor_minimo": 200
          },
          {
            "regiao": "SUDESTE",
            "valor_minimo": 300
          },
          {
            "regiao": "SUL",
            "valor_minimo": 300
          }
        ],
        "valor_minimo_padrao": 350,
        "teto_maximo_subsidio": 50,
        "aplicar_apenas_economico": true
      },
      "desconto_progressivo": {
        "ativo": false,
        "faixas": [
          {
            "a_partir_de": 500,
            "desconto_reais": 15
          },
          {
            "a_partir_de": 1000,
            "desconto_reais": 30
          },
          {
            "a_partir_de": 2000,
            "desconto_reais": 60
          },
          {
            "a_partir_de": 3000,
            "isencao_total": true
          }
        ]
      },
      "servicos_habilitados": [
        {
          "id": 1,
          "nome": "SEDEX",
          "ativo": true,
          "codigo": "correios_sedex",
          "transportadora": "Correios",
          "nome_personalizado": "SEDEX Express Prioritário",
          "permite_frete_gratis": false,
          "prazo_adicional_dias": 0
        },
        {
          "id": 2,
          "nome": "PAC",
          "ativo": false,
          "codigo": "correios_pac",
          "transportadora": "Correios",
          "nome_personalizado": "PAC Econômico Segurado",
          "permite_frete_gratis": true,
          "prazo_adicional_dias": 0
        },
        {
          "id": 3,
          "nome": ".Com",
          "ativo": false,
          "codigo": "jadlog_com",
          "transportadora": "Jadlog",
          "nome_personalizado": "Jadlog Express",
          "permite_frete_gratis": false,
          "prazo_adicional_dias": 0
        },
        {
          "id": 4,
          "nome": ".Package",
          "ativo": false,
          "codigo": "jadlog_package",
          "transportadora": "Jadlog",
          "nome_personalizado": "Jadlog Econômico",
          "permite_frete_gratis": true,
          "prazo_adicional_dias": 0
        }
      ],
      "entrega_local_bairros": "Curitiba e Região Metropolitana (São José dos Pinhais, Colombo, Pinhais)",
      "peso_padrao_peca_gramas": 300,
      "retirada_boutique_ativa": true,
      "sobretaxa_embalagem_reais": 2.5
    },
    "entrega_local_ativa": false,
    "instrucoes_retirada": "Retirada disponível em até 2 horas úteis após a confirmação do pagamento. Apresentar documento de identificação com foto e número do pedido.",
    "pedido_minimo_valor": 0,
    "prazo_manuseio_dias": 1,
    "_teste_e2e_timestamp": 1792612811741,
    "entrega_local_bairros": "Curitiba e Região Metropolitana (São José dos Pinhais, Colombo, Pinhais)",
    "reserva_estoque_ativa": true,
    "tempo_reserva_minutos": 20,
    "retirada_boutique_ativa": true,
    "exibir_badges_na_vitrine": false,
    "destino_inativos_whatsapp": "coluna_inativos",
    "exibir_selo_escassez_foto": false,
    "permitir_mensagem_presente": true,
    "prazo_inatividade_whatsapp_dias": 7,
    "auto_descartar_inativos_whatsapp": true,
    "exibir_quantidade_estoque_consumidor": false
  },
  "modulos_ativos": {
    "frete_automatico": true,
    "rastreio_whatsapp": false,
    "recuperacao_carrinho": false,
    "checkout_transparente": false
  },
  "ativo": true,
  "created_at": "2026-10-14T16:19:01.168355+00:00",
  "updated_at": "2026-11-07T18:43:08.129+00:00",
  "configuracoes_financeiras": {
    "chave_pix": "554197347601",
    "pix_banco": "Nu Pagamentos S.A. (Nubank)",
    "pix_titular": "Leidyane Cristina da Silva",
    "imposto_padrao": 4,
    "tipo_chave_pix": "telefone",
    "taxa_cartao_padrao": 3.5,
    "custo_embalagem_padrao": 8
  }
};

// Banners oficiais da vitrine da Leidy Boutique (sincronizados com o banco)
export const DEFAULT_LEIDY_BANNERS: AdminHeroBanner[] = [
  {
    "id": "fec989f1-d03f-4a0d-a104-1363a651e76f",
    "titulo": "Lançamentos Biamar & Tricots Nobres",
    "subtitulo": "Tricots de luxo, fios nobres e caimento sofisticado para todas as estações",
    "cta_texto": "Ver Tricots",
    "cta_link": "/catalogo?categoria=tricots",
    "tipo_midia": "image",
    "desktop_media_url": "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1920&auto=format&fit=crop",
    "mobile_media_url": "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1080&auto=format&fit=crop",
    "display_order": 0,
    "ativo": true
  },
  {
    "id": "02eb6787-9c04-41b4-b0d1-ca4a41b51774",
    "titulo": "Coleção Elegance & Alfaiataria",
    "subtitulo": "Curadoria Exclusiva em Moda Feminina",
    "cta_texto": "Conhecer Coleção",
    "cta_link": "#lancamentos",
    "tipo_midia": "video",
    "desktop_media_url": "/video/header_video.mp4",
    "mobile_media_url": "/video/header_video.mp4",
    "display_order": 0,
    "ativo": false
  }
];

// Configuração padrão da Aura Privée (Tenant #2 Modelo / Prospecção)
export const DEFAULT_AURA_PRIVEE_TENANT: Loja = {
  id: 'f9c8e7d6-5b4a-3c2d-1e0f-9876543210ab',
  nome: 'Aura Privée',
  slug: 'aura-privee',
  dominio_proprio: 'auraprivee.com.br',
  whatsapp: '5511999998888',
  email: 'contato@auraprivee.com.br',
  configuracoes_visuais: {
    cor_primaria: '#E0A99A',
    cor_secundaria: '#18181B',
    cor_fundo: '#FAF8F5',
    logo_url: '/images/Logo sem fundo.png',
    tagline: 'Alta Costura & Alfaiataria Feminina Exclusiva',
    frete_gratis_valor: 400.00,
    barra_aviso: 'Lançamento Coleção Aura Privée: Peças exclusivas sob encomenda',
    barra_aviso_ativa: true
  },
  configuracoes_financeiras: {
    imposto_padrao: 4,
    taxa_cartao_padrao: 3.5,
    custo_embalagem_padrao: 8.0,
    chave_pix: '5511999998888',
    tipo_chave_pix: 'telefone',
    pix_titular: 'Aura Privée Moda de Luxo LTDA',
    pix_banco: 'Banco Inter'
  },
  modulos_ativos: {
    frete_automatico: true,
    rastreio_whatsapp: true,
    recuperacao_carrinho: false,
    checkout_transparente: false
  },
  ativo: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

/**
 * Resolve a loja pelo ID (UUID)
 */
export async function getTenantById(lojaId: string): Promise<Loja | null> {
  if (!lojaId) return null;
  const cached = tenantCache.get(`id:${lojaId}`);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.loja;
  }
  try {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from('lojas')
      .select('*')
      .eq('id', lojaId)
      .eq('ativo', true)
      .maybeSingle();

    if (!error && data) {
      const loja = data as Loja;
      tenantCache.set(`id:${lojaId}`, { loja, expiresAt: Date.now() + CACHE_TTL_MS });
      tenantCache.set(`slug:${loja.slug}`, { loja, expiresAt: Date.now() + CACHE_TTL_MS });
      return loja;
    }
  } catch (e) {
    console.warn(`Erro ao resolver tenant por ID ${lojaId}:`, e);
  }
  return null;
}

/**
 * Resolve a loja pelo hostname (domínio próprio ou subdomínio)
 */
export async function getTenantByHost(host: string): Promise<Loja> {
  const cleanHost = host.split(':')[0].toLowerCase();
  const rawHost = cleanHost.replace(/^www\./, '');

  // 1. Se for ambiente local ou raiz padrão da Cloudflare Pages ou domínio da plataforma, consulta pelo slug padrão
  if (
    cleanHost === 'localhost' ||
    cleanHost === '127.0.0.1' ||
    cleanHost === 'bcomm-shop.pages.dev' ||
    cleanHost === 'bcomm-ag.space' ||
    cleanHost === 'www.bcomm-ag.space'
  ) {
    return getTenantBySlug('leidy-boutique');
  }

  // 2. Detecção de Subdomínio SaaS da Plataforma (ex: leidy.bcomm-ag.space, auraprivee.bcomm-ag.space)
  const saasDomains = ['bcomm-ag.space', 'bcomm.shop', 'bcomm.com.br', 'bcomm-shop.pages.dev'];
  for (const baseDom of saasDomains) {
    if (cleanHost.endsWith(`.${baseDom}`)) {
      const subdomain = cleanHost.replace(`.${baseDom}`, '').replace(/^www\./, '');
      const reservedPrefixes = ['www', 'app', 'admin', 'super-admin', 'api', 'stage', 'preview'];
      if (subdomain && !reservedPrefixes.includes(subdomain)) {
        return getTenantBySlug(subdomain);
      }
    }
  }

  // 3. Verifica cache em memória para o host
  const cached = tenantCache.get(cleanHost) || tenantCache.get(rawHost);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.loja;
  }

  // 4. Busca por Domínio Próprio Customizado no Supabase (com ou sem 'www.')
  try {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from('lojas')
      .select('*')
      .or(`dominio_proprio.eq.${cleanHost},dominio_proprio.eq.${rawHost}`)
      .eq('ativo', true);

    if (!error && data && data.length > 0) {
      const loja = data[0] as Loja;
      tenantCache.set(cleanHost, { loja, expiresAt: Date.now() + CACHE_TTL_MS });
      tenantCache.set(rawHost, { loja, expiresAt: Date.now() + CACHE_TTL_MS });
      tenantCache.set(`slug:${loja.slug}`, { loja, expiresAt: Date.now() + CACHE_TTL_MS });
      return loja;
    }
  } catch (error) {
    console.warn(`Erro ao resolver tenant para o host ${cleanHost}:`, error);
  }

  // 5. Se for um domínio próprio não encontrado no banco (evita vazamento de produtos entre lojas)
  const isPlatformHost =
    cleanHost === 'localhost' ||
    cleanHost === '127.0.0.1' ||
    cleanHost.endsWith('.pages.dev') ||
    cleanHost === 'bcomm-ag.space' ||
    cleanHost === 'www.bcomm-ag.space' ||
    cleanHost.endsWith('.bcomm-ag.space') ||
    cleanHost === 'bcomm.com.br' ||
    cleanHost === 'www.bcomm.com.br' ||
    cleanHost === 'bcomm.shop' ||
    cleanHost === 'www.bcomm.shop';

  if (!isPlatformHost) {
    return {
      id: `unregistered-${rawHost}`,
      nome: 'Loja em Configuração',
      slug: 'em-configuracao',
      dominio_proprio: cleanHost,
      whatsapp: '',
      email: '',
      configuracoes_visuais: {
        cor_primaria: '#DFBE76',
        cor_secundaria: '#1A1918',
        cor_fundo: '#FAF8F5',
        logo_url: '/images/Logo sem fundo.png',
        frete_gratis_valor: 0,
        slogan: 'Este domínio está em processo de vinculação na plataforma BCOMM.',
        tagline: 'Em Breve Uma Nova Loja Exclusiva',
        barra_aviso: 'Domínio em fase de configuração de DNS.',
        barra_aviso_ativa: true
      },
      modulos_ativos: {
        frete_automatico: false,
        rastreio_whatsapp: false,
        recuperacao_carrinho: false,
        checkout_transparente: false
      },
      ativo: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  return DEFAULT_LEIDY_TENANT;
}

/**
 * Resolve a loja pelo slug único (ex: 'leidyboutique', 'leidy-boutique', 'aura-privee')
 */
export async function getTenantBySlug(slug: string): Promise<Loja> {
  const cleanSlug = (slug || '').trim().toLowerCase() || 'leidy-boutique';
  const dbSlug = getCanonicalDbSlug(cleanSlug);

  const cached = tenantCache.get(`slug:${dbSlug}`) || tenantCache.get(`slug:${cleanSlug}`);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.loja;
  }

  try {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from('lojas')
      .select('*')
      .eq('slug', dbSlug)
      .eq('ativo', true);

    if (!error && data && data.length > 0) {
      const tenantFound = data[0] as Loja;
      tenantCache.set(`slug:${dbSlug}`, { loja: tenantFound, expiresAt: Date.now() + CACHE_TTL_MS });
      tenantCache.set(`slug:${cleanSlug}`, { loja: tenantFound, expiresAt: Date.now() + CACHE_TTL_MS });
      return tenantFound;
    }
  } catch (error) {
    console.warn(`Erro ao resolver tenant para o slug ${cleanSlug} (dbSlug: ${dbSlug}):`, error);
  }

  if (dbSlug === 'leidy-boutique') {
    return DEFAULT_LEIDY_TENANT;
  }
  if (dbSlug === 'aura-privee') {
    return DEFAULT_AURA_PRIVEE_TENANT;
  }

  // Gera um Tenant dinâmico para o slug (nunca cai na Leidy Boutique)
  const formattedName = cleanSlug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  return {
    id: `custom-${cleanSlug}`,
    nome: formattedName,
    slug: cleanSlug,
    dominio_proprio: null,
    whatsapp: '5511999999999',
    email: `contato@${cleanSlug}.com.br`,
    configuracoes_visuais: {
      cor_primaria: '#DFBE76',
      cor_secundaria: '#1A1918',
      cor_fundo: '#FAF8F5',
      logo_url: '/images/Logo sem fundo.png',
      tagline: 'Boutique & Moda Feminina Exclusiva',
      frete_gratis_valor: 350.00,
      barra_aviso: 'Atendimento VIP & Peças Exclusivas',
      barra_aviso_ativa: true
    },
    modulos_ativos: {
      frete_automatico: true,
      rastreio_whatsapp: false,
      recuperacao_carrinho: false,
      checkout_transparente: false
    },
    ativo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

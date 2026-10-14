-- ==============================================================================
-- 🏛️ SCRIPT SQL MESTRE: MODELAGEM MULTI-TENANT PARA SUPABASE (POSTGRESQL)
-- PROJETO: Plataforma Multi-Tenant de E-commerce White-Label / SaaS
-- LOJA PILOTO (TENANT #1): Leidy Boutique
-- ==============================================================================

-- 1. HABILITAR EXTENSÃO DE UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 2. TABELA DE LOJAS (TENANTS PRINCIPAIS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.lojas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    dominio_proprio TEXT UNIQUE,
    whatsapp TEXT NOT NULL,
    email TEXT,
    configuracoes_visuais JSONB DEFAULT '{
        "cor_primaria": "#C5A059",
        "cor_secundaria": "#1A1918",
        "cor_fundo": "#FAF8F5",
        "logo_url": "/images/Logo sem fundo.png",
        "tagline": "Curadoria Exclusiva em Moda Feminina",
        "frete_gratis_valor": 350.00
    }'::jsonb,
    modulos_ativos JSONB DEFAULT '{
        "frete_automatico": false,
        "rastreio_whatsapp": false,
        "recuperacao_carrinho": false,
        "checkout_transparente": false
    }'::jsonb,
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 3. TABELA DE CATEGORIAS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.categorias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    loja_id UUID NOT NULL REFERENCES public.lojas(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    slug TEXT NOT NULL,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(loja_id, slug)
);

-- ==============================================================================
-- 4. TABELA DE PRODUTOS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.produtos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    loja_id UUID NOT NULL REFERENCES public.lojas(id) ON DELETE CASCADE,
    categoria_id UUID REFERENCES public.categorias(id) ON DELETE SET NULL,
    nome TEXT NOT NULL,
    slug TEXT NOT NULL,
    descricao TEXT,
    preco NUMERIC(10,2) NOT NULL,
    preco_promocional NUMERIC(10,2),
    tecido TEXT,
    modelagem TEXT,
    linha TEXT,
    status_badges TEXT[] DEFAULT ARRAY[]::TEXT[],
    destaque BOOLEAN DEFAULT false,
    outlet BOOLEAN DEFAULT false,
    mais_vendido BOOLEAN DEFAULT false,
    ultimas_pecas BOOLEAN DEFAULT false,
    estoque_total INT DEFAULT 0,
    rating NUMERIC(2,1) DEFAULT 5.0,
    review_count INT DEFAULT 0,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(loja_id, slug)
);

-- ==============================================================================
-- 5. TABELA DE VARIAÇÕES DE PRODUTO (CORES & TAMANHOS COM ESTOQUE INDIVIDUAL)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.variacoes_produto (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    loja_id UUID NOT NULL REFERENCES public.lojas(id) ON DELETE CASCADE,
    produto_id UUID NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
    cor_nome TEXT NOT NULL,
    cor_hex TEXT NOT NULL,
    tamanho TEXT NOT NULL,
    estoque INT NOT NULL DEFAULT 0,
    sku TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 6. TABELA DE MÍDIAS DOS PRODUTOS (FOTOS WEBP & VÍDEOS DE PROVADOR)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.midias_produto (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    loja_id UUID NOT NULL REFERENCES public.lojas(id) ON DELETE CASCADE,
    produto_id UUID NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL CHECK (tipo IN ('image', 'video')),
    url TEXT NOT NULL,
    label TEXT,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 7. TABELA DE HERO BANNERS (CMS VISUAL RESPONSIVO MOBILE 9:16 E DESKTOP 16:9)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.hero_banners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    loja_id UUID NOT NULL REFERENCES public.lojas(id) ON DELETE CASCADE,
    titulo TEXT,
    subtitulo TEXT,
    cta_texto TEXT,
    cta_link TEXT,
    tipo_midia TEXT NOT NULL DEFAULT 'video' CHECK (tipo_midia IN ('image', 'video')),
    desktop_media_url TEXT NOT NULL,
    mobile_media_url TEXT NOT NULL,
    display_order INT DEFAULT 0,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 8. TABELA DE MENUS DE NAVEGAÇÃO (HEADER BUILDER COM SUBMENUS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.menus_navegacao (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    loja_id UUID NOT NULL REFERENCES public.lojas(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public.menus_navegacao(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    href TEXT NOT NULL,
    badge_texto TEXT,
    display_order INT DEFAULT 0,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 9. TABELA DE CLIENTES DA LOJA (PASSWORDLESS POR CELULAR)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.clientes_loja (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    loja_id UUID NOT NULL REFERENCES public.lojas(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    telefone TEXT NOT NULL,
    email TEXT,
    cpf TEXT,
    preferencias JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(loja_id, telefone)
);

-- ==============================================================================
-- 10. TABELA DE PEDIDOS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.pedidos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    loja_id UUID NOT NULL REFERENCES public.lojas(id) ON DELETE CASCADE,
    numero_pedido TEXT NOT NULL,
    cliente_id UUID REFERENCES public.clientes_loja(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aguardando_whatsapp', 'pago', 'em_separacao', 'enviado', 'entregue', 'cancelado')),
    subtotal NUMERIC(10,2) NOT NULL,
    valor_frete NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    valor_desconto NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    total NUMERIC(10,2) NOT NULL,
    metodo_pagamento TEXT NOT NULL DEFAULT 'pix',
    endereco_entrega JSONB NOT NULL,
    codigo_rastreio TEXT,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(loja_id, numero_pedido)
);

-- ==============================================================================
-- 11. TABELA DE ITENS DO PEDIDO
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.itens_pedido (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pedido_id UUID NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
    loja_id UUID NOT NULL REFERENCES public.lojas(id) ON DELETE CASCADE,
    produto_id UUID REFERENCES public.produtos(id) ON DELETE SET NULL,
    nome_produto TEXT NOT NULL,
    cor TEXT NOT NULL,
    tamanho TEXT NOT NULL,
    preco_unitario NUMERIC(10,2) NOT NULL,
    quantidade INT NOT NULL DEFAULT 1,
    imagem_url TEXT
);

-- ==============================================================================
-- 12. TABELA DE CUPONS DE DESCONTO
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.cupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    loja_id UUID NOT NULL REFERENCES public.lojas(id) ON DELETE CASCADE,
    codigo TEXT NOT NULL,
    tipo_desconto TEXT NOT NULL CHECK (tipo_desconto IN ('percent', 'fixed')),
    valor_desconto NUMERIC(10,2) NOT NULL,
    valor_minimo NUMERIC(10,2) DEFAULT 0.00,
    limite_usos INT,
    usos_atuais INT DEFAULT 0,
    data_validade TIMESTAMP WITH TIME ZONE,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(loja_id, codigo)
);

-- ==============================================================================
-- 13. ÍNDICES DE PERFORMANCE (MÁXIMA VELOCIDADE DE BUSCA)
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_lojas_slug ON public.lojas(slug);
CREATE INDEX IF NOT EXISTS idx_lojas_dominio ON public.lojas(dominio_proprio);
CREATE INDEX IF NOT EXISTS idx_produtos_loja_id ON public.produtos(loja_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_loja_id ON public.pedidos(loja_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_cliente ON public.pedidos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_clientes_telefone ON public.clientes_loja(loja_id, telefone);

-- ==============================================================================
-- 14. ROW LEVEL SECURITY (RLS) - SEGURANÇA TOTAL ENTRE LOJAS
-- ==============================================================================
ALTER TABLE public.lojas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variacoes_produto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.midias_produto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hero_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menus_navegacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes_loja ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_pedido ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cupons ENABLE ROW LEVEL SECURITY;

-- Políticas de Leitura Pública para Vitrine (Qualquer visitante pode ver lojas, produtos e banners)
CREATE POLICY "Leitura pública de lojas ativas" ON public.lojas FOR SELECT USING (ativo = true);
CREATE POLICY "Leitura pública de categorias" ON public.categorias FOR SELECT USING (true);
CREATE POLICY "Leitura pública de produtos ativos" ON public.produtos FOR SELECT USING (ativo = true);
CREATE POLICY "Leitura pública de variacoes" ON public.variacoes_produto FOR SELECT USING (true);
CREATE POLICY "Leitura pública de midias" ON public.midias_produto FOR SELECT USING (true);
CREATE POLICY "Leitura pública de banners ativos" ON public.hero_banners FOR SELECT USING (ativo = true);
CREATE POLICY "Leitura pública de menus ativos" ON public.menus_navegacao FOR SELECT USING (ativo = true);
CREATE POLICY "Leitura pública de cupons ativos" ON public.cupons FOR SELECT USING (ativo = true);

-- Políticas para Criação de Pedidos e Clientes no Checkout
CREATE POLICY "Clientes anônimos podem criar cadastro no checkout" ON public.clientes_loja FOR INSERT WITH CHECK (true);
CREATE POLICY "Clientes anônimos podem registrar pedidos no checkout" ON public.pedidos FOR INSERT WITH CHECK (true);
CREATE POLICY "Clientes anônimos podem registrar itens do pedido" ON public.itens_pedido FOR INSERT WITH CHECK (true);

-- ==============================================================================
-- 15. SEED INICIAL: CADASTRO DA LEIDY BOUTIQUE (TENANT #1 OFICIAL)
-- ==============================================================================
INSERT INTO public.lojas (
    id,
    nome,
    slug,
    dominio_proprio,
    whatsapp,
    email,
    configuracoes_visuais,
    modulos_ativos,
    ativo
) VALUES (
    'e8b7f890-4e3a-4a89-9c56-8e1234567890',
    'Leidy Boutique',
    'leidy-boutique',
    'leidyboutique.com.br',
    '554197347601',
    'contato@leidyboutique.com.br',
    '{
        "cor_primaria": "#C5A059",
        "cor_secundaria": "#1A1918",
        "cor_fundo": "#FAF8F5",
        "logo_url": "/images/Logo sem fundo.png",
        "tagline": "Curadoria Exclusiva em Moda Feminina",
        "frete_gratis_valor": 350.00
    }'::jsonb,
    '{
        "frete_automatico": true,
        "rastreio_whatsapp": false,
        "recuperacao_carrinho": false,
        "checkout_transparente": false
    }'::jsonb,
    true
)
ON CONFLICT (slug) DO UPDATE SET
    nome = EXCLUDED.nome,
    whatsapp = EXCLUDED.whatsapp,
    configuracoes_visuais = EXCLUDED.configuracoes_visuais;

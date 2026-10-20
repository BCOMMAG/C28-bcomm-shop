# 🏛️ ESPECIFICAÇÃO DE ARQUITETURA E DIRETRIZES TÉCNICAS
## PROJETO: Plataforma Multi-Tenant de E-commerce White-Label / SaaS
**Loja Piloto / Tenant #1:** Leidy Boutique  
**Data de Criação:** Outubro / 2026  
**Status do Projeto:** Em Desenvolvimento e Transição para Multi-Tenant  

---

## 1. 🎯 VISÃO DO PRODUTO & MODELO DE NEGÓCIO

1. **Modelo Multi-Tenant com Código Único (Single Codebase):**
   - Uma única aplicação Next.js atenderá dezenas de lojas virtuais diferentes.
   - **Regra de Ouro:** NUNCA criar branches separadas ou pastas clonadas por cliente. Toda e qualquer tabela e registro de negócio pertence a um `loja_id`.
   - Uma melhoria no checkout, na vitrine ou na velocidade beneficia automaticamente todas as lojas ativas.

2. **Domínios Próprios por Loja (White-Label):**
   - Cada lojista responderá em seu próprio domínio personalizado (ex: `www.leidyboutique.com.br`, `www.lojadopedro.com.br`) ou no subdomínio gratuito da plataforma (ex: `leidy.plataforma.pages.dev`).
   - A resolução é feita dinamicamente no Middleware pelo cabeçalho `Host`.

3. **Modelo de Monetização Modular (Estilo Shopify):**
   - A mensalidade base cobre a sustentação da infraestrutura própria (servidor em nuvem isolado, banco de dados seguro e backups).
   - Funcionalidades adicionais (cotação dinâmica de frete por API, disparo automático de rastreio no WhatsApp, recuperação de carrinhos abandonados por bot) são módulos ativáveis por flag no banco (`lojas.modulos_ativos`), permitindo cobrança escalonável.

4. **Os Três Níveis de Acesso (Interfaces):**
   - **COMPRADOR FINAL (Vitrine + `/minha-conta`):**
     - Navega na vitrine da loja correspondente.
     - Login **Passwordless por Celular/WhatsApp** (sem senhas burocráticas).
     - Histórico de pedidos, linha do tempo de status (Pendente ➔ Pago ➔ Em Separação ➔ Enviado ➔ Entregue), código de rastreio e avaliações.
   - **LOJISTA (`/admin`):**
     - Painel exclusivo do dono da loja (ex: Leidy).
     - Gestão completa de catálogo (CRUD de produtos, preços De/Por, variações de cor/tamanho com estoque individual).
     - Gestão de mídias (fotos WebP e vídeos de provador).
     - CMS da Home: banners diferenciados para celular (9:16) e desktop (16:9).
     - Header Builder: gerenciamento de links e submenus dropdown.
     - Central de pedidos: alteração de status e inserção de rastreio.
     - Vitrine de Módulos adicionais para contratação.
   - **SUPER ADMIN / DONO DA PLATAFORMA (`/super-admin`):**
     - O seu painel de comando global.
     - Cadastro de novas lojas em 60 segundos (gerando slug e credenciais).
     - Mapeamento e autorização de domínios próprios (`dominio_proprio`).
     - Gestão global de faturamento e ativação/desativação de módulos contratados.

---

## 2. ⚡ PILHA DE TECNOLOGIAS E ESTRATÉGIA EM 2 FASES

### 🟢 FASE 1: DESENVOLVIMENTO & VALIDAÇÃO (CUSTO: R$ 0,00)
- **Frontend & Full-Stack:** Next.js 16 (App Router + React 19 + Turbopack + Tailwind CSS v4).
- **Hospedagem & CDN:** **Cloudflare Pages** conectada diretamente ao repositório GitHub (`.pages.dev`). Deploys contínuos a cada commit, tráfego ilimitado e zero aquecimento do computador local.
- **Segurança de Borda:** Cloudflare CDN (cache no Brasil), Cloudflare WAF (proteção contra ataques) e SSL automático gratuitos.
- **Banco de Dados em Nuvem:** **Supabase (PostgreSQL)** no plano gratuito. Um único banco de alta confiabilidade com isolamento via RLS (*Row Level Security*).
- **Armazenamento de Mídias:** **Cloudflare R2** (10 GB gratuitos/mês, compatível com S3 e **taxa zero de tráfego** para fotos WebP e vídeos).
- **Domínios Personalizados:** **Cloudflare for SaaS** (primeiros 100 domínios personalizados 100% gratuitos).

### 🚀 FASE 2: PRODUÇÃO & EXPANSÃO (APÓS A 1ª VENDA)
*Ativada assim que fechar a primeira venda (Faturamento de R$ 2.497 + R$ 197/mês vs. Custo de ~R$ 180/mês)*:
- **Upgrade Supabase:** Plano Pro ($25/mês ~ R$ 140) para backups automáticos diários em nuvem e banco sem pausa.
- **VPS Dedicada:** Contabo Cloud VPS 4 (~$7.28/mês ~ R$ 42) com Ubuntu Linux e Docker.
- **Gerenciador de Containers:** **Coolify** rodando na VPS com deploy de containers em 1 clique.
- **Serviços Extras em Background:** Instalação da Evolution API (open-source) dentro da VPS para disparo automático de mensagens, avisos de rastreio e recuperação de carrinhos no WhatsApp da loja.

---

## 3. 🖼️ DIRETRIZES DE MÍDIA & PERFORMANCE (ZERO LENTIDÃO)

1. **Compressão Automática no Navegador (Client-Side):**
   - Todo upload de foto de produto ou banner no painel admin é comprimido antes do envio via canvas/WebP no navegador da lojista.
   - Formato padrão: `.webp` com largura máxima de 1200px (reduz arquivos de 10 MB para ~150 KB).
   - NUNCA salvar base64 nem arquivos no banco de dados. Todas as mídias vão para o Cloudflare R2 / Supabase Storage.
2. **Imagens com Lazy Loading:**
   - Todas as tags `<img>` e componentes `<Image>` da vitrine implementam carregamento postergado (`loading="lazy"`).
3. **Vídeos Verticais de Provador (Estilo Reels):**
   - Suporte a links externos (YouTube Shorts, Vimeo) e upload de vídeos curtos com limite de 20 MB / 60 segundos em MP4/WebM.
4. **Banners Responsivos Diferenciados:**
   - 🖥️ **Desktop:** 16:9 widescreen (ex: `1920x1080`).
   - 📱 **Mobile:** 9:16 vertical imersivo (ex: `1080x1920`), eliminando cortes feios na tela do celular.

---

## 4. 🔀 ROTEAMENTO DINÂMICO MULTI-TENANT (MIDDLEWARE)

O `middleware.ts` do Next.js intercepta todas as requisições:
1. Extrai o host (`req.headers.get('host')`).
2. Consulta o tenant no banco pelo `dominio_proprio` ou `slug`.
3. Injeta o `loja_id`, o nome da loja e as `configuracoes_visuais` no contexto da aplicação.
4. Renderiza a vitrine correspondente. Se o domínio não existir, exibe página amigável de "Loja não encontrada".

---

## 5. 🌐 PADRONIZAÇÃO CANÔNICA DE URLS & ROTEAMENTO WHITE-LABEL (OUTUBRO/2026)

Para garantir máxima credibilidade comercial e uma experiência de compra sofisticada, a plataforma adota o **Padrão Canônico de URLs Limpas**:

1. **Estrutura de Rotas Limpas em Demonstrações & Subdomínios:**
   - **Vitrine:** `/:loja/` (ex: `/leidyboutique/`, `/auraprivee/`)
   - **Central VIP da Cliente:** `/:loja/cliente/`
   - **Favoritos & Lista de Desejos:** `/:loja/cliente/favoritos/`
   - **Catálogo de Peças:** `/:loja/catalogo/`
   - **Checkout Seguro:** `/:loja/checkout/`
   - Elimina completamente parâmetros técnicos provisórios (`?loja=...`).

2. **Estrutura de Rotas em Domínios Próprios (`dominio.com.br`):**
   - **Vitrine:** `/`
   - **Central VIP da Cliente:** `/cliente/`
   - **Favoritos & Lista de Desejos:** `/cliente/favoritos/`
   - **Catálogo de Peças:** `/catalogo/`
   - **Checkout Seguro:** `/checkout/`

3. **Herança Universal em Novas Lojas (Single Codebase):**
   - Qualquer nova loja provisionada via Super Admin (`/super-admin/nova-loja`) herda instantaneamente a Central VIP de 5 abas, o gerenciador de desejos com seletor inline, o cálculo de subtotal e a navegação blindada no Header e Footer.

4. **Isolamento de Storage por Loja & Sincronização Bidirecional:**
   - O `localStorage` da cliente utiliza chaves unificadas com o slug canônico (`bcomm_customer_${slug}_*`, `bcomm_cart_${slug}`, `bcomm_wishlist_${slug}`).
   - Endereço e perfil cadastrados na Central da Cliente sincronizam em 1 clique com os campos do Checkout (`/checkout`), eliminando redigitação.

5. **Fallback SPA Universal em Cloudflare Pages:**
   - O componente `not-found.tsx` atua como roteador cliente para novas lojas criadas em tempo de execução no banco, mantendo a URL limpa intacta na barra de navegação sem flashes nem redirecionamentos.

---
*Este documento é a referência canônica para qualquer decisão de código ou infraestrutura deste projeto.*

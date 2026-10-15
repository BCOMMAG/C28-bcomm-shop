# 🗺️ ROADMAP DE EXECUÇÃO & CHECKLIST MESTRE
## Plataforma Multi-Tenant de E-commerce White-Label / SaaS
**Legenda de Status:**  
- `[x]` Concluído e Validado em Produção  
- `[-]` Em Execução Ativa  
- `[ ]` Planejado / Próximo Passo  

---

### 📊 PROGRESSO GERAL DA PLATAFORMA: [ 85% ]

- [x] **FASE 0: FRONTEND DE LUXO E CHECKOUT FASEADO (LEIDY BOUTIQUE)**
  - [x] Identidade visual e vitrine de alta conversão (Dourado/Preto).
  - [x] Seções estratégicas (Lançamentos, Mais Vendidos, Outlet, Últimas Peças).
  - [x] Vídeos de provador nos cards de produto.
  - [x] Sacola lateral deslizante (*CartDrawer*) e barra inferior (*BottomCartBar*).
  - [x] Checkout faseado em 4 etapas no mobile sem scroll e envio estruturado para o WhatsApp da loja.
  - [x] Criação da pasta de governança e persistência viva (`/docs`).

---

### 🚀 ETAPAS DE TRANSIÇÃO PARA A PLATAFORMA MULTI-TENANT

#### 🔹 ETAPA 1: MODELAGEM SQL NO SUPABASE & SEED DA LEIDY BOUTIQUE
- [x] Criar tabelas com isolamento `loja_id`: `lojas`, `categorias`, `produtos`, `variacoes_produto`, `midias_produto`, `hero_banners`, `menus_navegacao`, `pedidos`, `itens_pedido`, `clientes_loja`, `cupons`.
- [x] Ativar Row Level Security (RLS) em todas as tabelas.
- [x] Criar índices de performance nos campos `loja_id` e `slug`.
- [x] Executar script de inserção do **Tenant #1 (Leidy Boutique)** no banco.

#### 🔹 ETAPA 2: MIDDLEWARE MULTI-TENANT & BUILD CLOUDFLARE PAGES
- [x] Instalar o pacote de integração Supabase (`@supabase/supabase-js`, `@supabase/ssr`).
- [x] Criar o cliente Supabase unificado (`src/lib/supabase/client.ts` e `server.ts`).
- [x] Criar tipos TypeScript estruturados do banco (`src/types/database.ts`).
- [x] Implementar `src/lib/tenant.ts` com cache e fallback seguro da Leidy Boutique.
- [x] Implementar `src/middleware.ts` para resolver dinamicamente o `Host` e injetar cabeçalhos e cookies de tenant.
- [x] Validar compilação com `npm run build` com sucesso absoluto.

#### 🔹 ETAPA 3: VITRINE DINÂMICA & MIGRAÇÃO DO CATÁLOGO DA LEIDY
- [x] Migração de 16 produtos, 11 categorias, 54 variações, 29 fotos/vídeos de provador, hero banner e menus no Supabase.
- [x] Camada de dados reativa com fallback gracioso (`src/lib/products.ts`).
- [x] Vitrine Home, Catálogo, Modal de Detalhes, Sacola Lateral e Favoritos consumindo do banco.

#### 🔹 ETAPA 4: CHECKOUT FASEADO CONECTADO AO BANCO & LEADS
- [x] Políticas RLS configuradas no Supabase para criação e consulta de pedidos e leads.
- [x] Checkout em 4 etapas gravando na tabela `pedidos` e `itens_pedido` antes do WhatsApp.
- [x] Captura de leads de carrinhos abandonados com WhatsApp e histórico.
- [x] Geração e exibição do ID oficial e legível do pedido (`#LB-2026-XXXX`).

#### 🔹 ETAPA 5: ESPAÇO VIP DA CLIENTE (`/minha-conta`)
- [x] Tela `/minha-conta` com login passwordless por celular/WhatsApp.
- [x] Histórico de compras com abas ("Todos", "Em Andamento", "Entregues").
- [x] Linha do tempo visual do status do pedido (Pedido -> Pago -> Embalado -> Enviado -> Entregue).
- [x] Integração de código de rastreamento dos Correios com link direto.

#### 🔹 ETAPA 6: PAINEL ADMINISTRATIVO DO LOJISTA (`/admin`) — BASE INICIAL
- [x] Tela de login do lojista (`/admin/login`).
- [x] Layout administrativo premium com sidebar e drawer mobile.
- [x] Dashboard com métricas em tempo real (`/admin`).
- [x] Central de Pedidos inicial (`/admin/pedidos`).
- [x] Gestão de Catálogo com edição rápida de preço e estoque (`/admin/produtos`).
- [x] Loja de Módulos White-Label (`/admin/modulos`).

#### 🔹 ETAPA 7: CONSOLE DO SUPER ADMIN (`/super-admin`) — O SEU PAINEL
- [x] Login do dono da plataforma master (`superadmin@bcomm.com.br`).
- [x] Dashboard com GMV Global e métricas consolidadas de todas as lojas.
- [x] Gestão de Lojas & Tenants com controle de ativação online/pausada (`/super-admin/lojas`).
- [x] Assistente de Onboarding Express em 60 Segundos com clonagem de catálogo (`/super-admin/nova-loja`).
- [x] Gestão de Domínios Customizados (`/super-admin/dominios`).

#### 🔹 ETAPA 8: STORAGE DE MÍDIA CLOUDFLARE R2 & ISOLAMENTO ESTRITO
- [x] Configuração e conexão do bucket Cloudflare R2 `bcomm-saas-media` com suporte a `forcePathStyle: true`.
- [x] Script de migração em lote (`scripts/sync-media-to-r2.ts`) sincronizando 100% das fotos, logos e vídeos pesados de provador (10 MB).
- [x] Validação da CDN pública global com taxa zero de saída (`https://pub-e5c670efa04d4ef185aece8ed06532af.r2.dev`).
- [x] Isolamento de chaves de sacola, favoritos e clientes por tenant (`bcomm_cart_${tenantKey}`).
- [x] Provisionamento e validação do Tenant #2 (Aura Privée).

---

### 🌟 ETAPA 9: EXPANSÃO PROFISSIONAL DO PAINEL DO LOJISTA (EM EXECUÇÃO)

#### 🔹 9.1: Navegação, Sessão & Segurança
- [-] **Header do Lojista & Super Admin:**
  - [-] Botão visível "Sair" (Logout) com ícone `LogOut` vermelho no topo do Header ao lado do avatar.
  - [-] Botão "Sair" no drawer retrátil mobile.
  - [-] Limpeza de sessão local no clique e redirecionamento imediato para a tela de login.
- [-] **Links de Vitrine e Pedidos:**
  - [-] Botão "Abrir Vitrine" apontando com precisão para `/?loja=${tenant.slug}` em nova aba.
  - [-] Botão "Ver Pedidos" no topo fixo e responsivo em qualquer resolução.

#### 🔹 9.2: Catálogo de Produtos Completo & Upload no Cloudflare R2
- [ ] Modal/Página de Cadastro Completo de Produto (`/admin/produtos`):
  - [ ] Informações básicas: Nome, slug automático, categoria, descrição, tecido, modelagem, linha.
  - [ ] Precificação: Preço de Venda, Preço Promocional e **Preço de Custo (CMV)**.
  - [ ] Seletor: *Produto com Grade (P/M/G)* vs *Produto Simples (Tamanho Único)*.
  - [ ] Grade de cores (com seletor HEX visual) e tamanhos com estoque individual.
- [ ] Uploader de Mídias direto para o Cloudflare R2:
  - [ ] Upload de fotos de alta resolução com seletor de foto de capa (estrela dourada) e exclusão individual.
  - [ ] Upload de vídeo de provador vertical 9:16 com preview antes de salvar.
- [ ] Ações de Gestão de Catálogo:
  - [ ] Ativação/Pausa rápida da vitrine.
  - [ ] Edição completa de grade e dados.
  - [ ] Exclusão segura com proteção contábil (Soft Delete / Arquivamento).

#### 🔹 9.3: Central de Pedidos, Baixa Inteligente de Estoque & Automação WhatsApp
- [ ] Regra de ouro da baixa de estoque:
  - [ ] Pedido criado no checkout ➔ status `Aguardando WhatsApp` (estoque preservado).
  - [ ] Mudança para `Pago / Confirmado` ➔ baixa automática das unidades na grade do banco.
  - [ ] Mudança para `Cancelado` ➔ devolução automática das peças ao estoque.
- [ ] Automação de WhatsApp em 1 clique:
  - [ ] Disparo de mensagem de confirmação de pagamento.
  - [ ] Disparo de mensagem de envio com código de rastreio Correios e link direto do Melhor Rastreio.
  - [ ] Mensagem de pós-venda carinhoso após entrega.
- [ ] Abas de navegação rápida por status (Todos, Aguardando WhatsApp, Pagos, Enviados, Entregues, Cancelados).

#### 🔹 9.4: DRE Financeiro & Lucro Real da Loja (`/admin/financas`)
- [ ] Página dedicada de DRE Financeiro:
  - [ ] Faturamento Bruto total.
  - [ ] Custo das Mercadorias Vendidas (CMV).
  - [ ] Configuração de despesas operacionais (Taxa média de cartão % e custo de embalagem/envio R$).
  - [ ] Lucro Líquido Real em Reais (R$) e Margem Líquida (%).
  - [ ] Ticket Médio por pedido e Peças por Atendimento (PA).
  - [ ] Curva ABC de produtos mais lucrativos.
  - [ ] Filtro temporal (Hoje, 7 dias, Este Mês, Todo o Período).

#### 🔹 9.5: CMS Visual da Vitrine & Banners Responsivos (`/admin/banners`)
- [ ] Gestão do Hero Banner Principal:
  - [ ] Mídia Desktop (16:9 horizontal) com upload direto no R2.
  - [ ] Mídia Mobile (9:16 vertical) com upload direto no R2.
  - [ ] Título, subtítulo e link de CTA.
  - [ ] Preview ao vivo na tela.
- [ ] Barra de aviso do topo (ex: "Frete Grátis acima de R$ 350").

#### 🔹 9.6: CRM de Clientes & Leads (`/admin/clientes`)
- [ ] Base centralizada de compradores e leads de carrinho.
- [ ] Histórico de compras por cliente, ticket médio e LTV.
- [ ] Tags automáticas: Cliente VIP, Compradora Recorrente, Primeira Compra, Lead.
- [ ] Botão de 1 clique para conversar no WhatsApp.

---
*Roadmap mantido com governança viva e sincronização contínua.*

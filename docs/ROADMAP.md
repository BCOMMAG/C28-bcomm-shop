# 🗺️ ROADMAP DE EXECUÇÃO & CHECKLIST MESTRE
## Plataforma Multi-Tenant de E-commerce White-Label / SaaS
**Legenda de Status:**  
- `[x]` Concluído e Validado em Produção  
- `[-]` Em Execução Ativa  
- `[ ]` Planejado / Próximo Passo  

---

### 📊 PROGRESSO GERAL DA PLATAFORMA: [ 60% ]

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
- [x] Criar tabelas com isolamento `loja_id`:
  - [x] `lojas` (Tenants: nome, slug, dominio_proprio, configuracoes_visuais, modulos_ativos).
  - [x] `categorias` (com `loja_id`).
  - [x] `produtos` (preço, preço promocional, tecido, modelagem, linha, status, estoque).
  - [x] `variacoes_produto` (cor_nome, cor_hex, tamanho, estoque_individual, sku).
  - [x] `midias_produto` (fotos WebP e vídeos de provador com ordem).
  - [x] `hero_banners` (mídias separadas para desktop 16:9 e mobile 9:16).
  - [x] `menus_navegacao` (links e submenus dropdown em árvore).
  - [x] `pedidos` e `itens_pedido` (status, totais, endereço, rastreio, notas).
  - [x] `clientes_loja` (telefone, nome, e-mail, cpf, preferências).
  - [x] `cupons` (regras e validades).
- [x] Ativar Row Level Security (RLS) em todas as tabelas.
- [x] Criar índices de performance nos campos `loja_id` e `slug`.
- [x] Executar script de inserção do **Tenant #1 (Leidy Boutique)** no banco.

#### 🔹 ETAPA 2: MIDDLEWARE MULTI-TENANT & BUILD CLOUDFLARE PAGES
- [x] Instalar o pacote de integração Supabase (`@supabase/supabase-js`, `@supabase/ssr`).
- [x] Criar o cliente Supabase unificado (`src/lib/supabase/client.ts` e `server.ts`).
- [x] Criar tipos TypeScript estruturados do banco (`src/types/database.ts`).
- [x] Implementar `src/lib/tenant.ts` com cache e fallback seguro da Leidy Boutique.
- [x] Implementar `src/middleware.ts` para resolver dinamicamente o `Host` e injetar cabeçalhos e cookies de tenant.
- [x] Criar configuração do Cloudflare Pages (`wrangler.json`).
- [x] Validar compilação com `npm run build` com sucesso absoluto.

#### 🔹 ETAPA 3: VITRINE DINÂMICA & MIGRAÇÃO DO CATÁLOGO DA LEIDY
- [x] Criar script de migração para importar os produtos estáticos de `src/data/products.ts` para as tabelas do Supabase vinculadas à Leidy Boutique (`scripts/seed-products-supabase.ts`).
- [x] Executar a migração de 16 produtos, 11 categorias, 54 variações, 29 fotos/vídeos de provador, hero banner e menus no Supabase.
- [x] Criar camada de dados e mapeamento estruturado em `src/lib/products.ts` com fallback gracioso.
- [x] Atualizar componentes da vitrine para consumir do Supabase com fallback seguro:
  - [x] `StoreContext` com estado dinâmico de produtos e rotina de refresh.
  - [x] Vitrine Home (`src/app/page.tsx`) com seções de lançamentos, mais vendidos, outlet e últimas peças dinâmicas.
  - [x] Catálogo (`src/app/catalogo/page.tsx`) com filtros de categorias, tecidos, buscas e contadores dinâmicos.
  - [x] Modal de detalhes do produto (`ProductModal.tsx`) e recomendações de "Compre o Look" dinâmicos.
  - [x] Sacola lateral (`CartDrawer.tsx`) e `ConversionSidebar.tsx` conectados aos produtos dinâmicos.
  - [x] Favoritos (`src/app/favoritos/page.tsx`) reativo ao catálogo.
- [x] Validar compilação via `npm run build` com sucesso absoluto (zero erros).

#### 🔹 ETAPA 4: CHECKOUT FASEADO CONECTADO AO BANCO & LEADS
- [x] Configurar políticas RLS no Supabase permitindo criação e atualização de clientes/leads e pedidos.
- [x] Criar serviço `src/lib/orders.ts` para gravação de pedidos e captura de leads.
- [x] Conectar Etapa 4 do Checkout para salvar o pedido na tabela `pedidos` e os itens em `itens_pedido` no Supabase antes de direcionar para o WhatsApp.
- [x] Implementar rotina de captura de leads e carrinhos abandonados (ao preencher o WhatsApp e sair antes de pagar, o lead é gravado na nuvem).
- [x] Geração e exibição do ID oficial e legível do pedido (`#LB-2026-XXXX`) com badge de confirmação de registro no sistema.
- [x] Validação da compilação via `npm run build` com 100% de sucesso.

#### 🔹 ETAPA 5: ESPAÇO VIP DA CLIENTE (`/minha-conta`)
- [ ] Criar tela do comprador com login passwordless por celular/WhatsApp.
- [ ] Visualização de histórico de pedidos.
- [ ] Linha do tempo visual de entrega com código de rastreio dos Correios.
- [ ] Botão de 1 clique para falar com a loja sobre o pedido.

#### 🔹 ETAPA 6: PAINEL ADMINISTRATIVO DO LOJISTA (`/admin`)
- [ ] Tela de login do lojista via Supabase Auth (e-mail/senha).
- [ ] Dashboard com métricas de pedidos e faturamento da loja.
- [ ] CRUD Completo de Produtos (criar, editar, duplicar, pausar, gerenciar estoque por cor/tamanho).
- [ ] CMS da Home: upload de banners para mobile (9:16) e desktop (16:9).
- [ ] Header Builder: gerenciamento de links e submenus.
- [ ] Central de Pedidos: alteração de status e inserção de código de rastreio.
- [ ] Vitrine de Módulos adicionais para contratação.

#### 🔹 ETAPA 7: PAINEL DO SUPER ADMIN (`/super-admin`) — O SEU PAINEL
- [ ] Login do dono da plataforma.
- [ ] Listagem de todas as lojas cadastradas.
- [ ] Cadastro de nova loja em 60 segundos (gerando slug e credenciais).
- [ ] Vínculo e autorização de domínios próprios dos clientes.
- [ ] Painel de ativação/desativação de módulos contratados.

#### 🔹 ETAPA 8: DOCKERFILE, CLOUDFLARE R2 & VPS COM COOLIFY (FASE 2)
- [ ] Configuração do bucket Cloudflare R2 para fotos e vídeos sem taxas de tráfego.
- [ ] Criação do `Dockerfile` de produção otimizado para Next.js.
- [ ] Guia de subida na VPS Contabo com Coolify.
- [ ] Integração com Evolution API para disparos automáticos no WhatsApp.

---
*Atualizado a cada passo executado com commit e push no GitHub.*

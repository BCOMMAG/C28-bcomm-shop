# 🗺️ ROADMAP DE EXECUÇÃO & CHECKLIST MESTRE
## Plataforma Multi-Tenant de E-commerce White-Label / SaaS
**Legenda de Status:**  
- `[x]` Concluído e Validado em Produção  
- `[-]` Em Execução Ativa  
- `[ ]` Planejado / Próximo Passo  

---

### 📊 PROGRESSO GERAL DA PLATAFORMA: [ 25% ]

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
- [ ] Instalar o pacote de integração Supabase (`@supabase/supabase-js`, `@supabase/ssr`).
- [ ] Criar o cliente Supabase unificado (`src/lib/supabase/client.ts` e `server.ts`).
- [ ] Implementar `src/middleware.ts` para resolver dinamicamente o `Host` e carregar o `loja_id`.
- [ ] Configurar adaptador Cloudflare (`@opennextjs/cloudflare` ou compatível) no `next.config.ts`.
- [ ] Subir ao GitHub e conectar ao Cloudflare Pages para gerar a URL `.pages.dev`.

#### 🔹 ETAPA 3: VITRINE DINÂMICA & MIGRAÇÃO DO CATÁLOGO DA LEIDY
- [ ] Criar script de migração para importar os produtos estáticos de `src/data/products.ts` para as tabelas do Supabase vinculadas à Leidy Boutique.
- [ ] Atualizar componentes da vitrine para consumir do Supabase com fallback seguro:
  - [ ] Vitrine Home (Hero banners e seções).
  - [ ] Catálogo com filtros de categorias e busca.
  - [ ] Modal de detalhes do produto com variações de cor e tamanho.
- [ ] Validar que a Leidy Boutique continua funcionando perfeitamente agora via banco de dados na nuvem.

#### 🔹 ETAPA 4: CHECKOUT FASEADO CONECTADO AO BANCO & LEADS
- [ ] Integrar a Etapa 4 do Checkout para gerar registro oficial na tabela `pedidos` com status `pendente` antes de direcionar para o WhatsApp.
- [ ] Criar rotina de captura de leads e carrinhos abandonados (se o cliente digitar o celular e sair, o pedido fica salvo).
- [ ] Geração do ID oficial do pedido (`#LB-1001`).

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

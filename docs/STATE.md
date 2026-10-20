# 📌 MARCADOR DE ESTADO VIVO DO PROJETO (STATE TRACKER)
*Este arquivo é o GPS do projeto. Se o computador desligar ou a sessão reiniciar, leia este arquivo para saber exatamente onde paramos e o status de cada parte.*

---

## 📍 1. ONDE ESTAMOS AGORA?
- **Fase Ativa:** Fase 5 — Operação Avançada, Blindagem Boutique & Automações Omnichannel
- **Status Geral:** **Fases 1 a 4 100% Concluídas | Fase 5 em Execução e Homologação**
- **Compilação de Produção:** Aprovada via `npm run build` (21 rotas geradas estaticamente, zero erros de TypeScript).
- **Deploy em Produção:** Ativo no Cloudflare Pages (`https://bcomm-shop.pages.dev/admin/`).
- **Última Atualização:** 17 de Outubro de 2026

---

## 🏁 2. HISTÓRICO DE FASES E ETAPAS CONCLUÍDAS

- [x] **FASE 1: Fundação do Backend & Supabase PostgreSQL**
  - Modelagem relacional completa com 11 tabelas (`lojas`, `produtos`, `variacoes_produto`, `midias_produto`, `pedidos`, `itens_pedido`, `clientes_loja`, `hero_banners`, `categorias`, etc.).
  - Políticas de RLS (Row Level Security) ativas com isolamento rigoroso por `loja_id`.
  - Migração do catálogo com variações, tecidos e preços de custo.

- [x] **FASE 2: Painel Administrativo do Lojista (Redesign & Alta Eficiência)**
  - Sidebar lateral ergonômica com logotipo da boutique e navegação sem scroll vertical excessivo.
  - Seletor dinâmico de Paleta de Cores em `/admin/configuracoes` com aplicação global ao layout.
  - Visão Geral reorganizada com 5 KPIs na primeira linha e 3 blocos analíticos (Histórico de vendas por período, Mais vendidos e Menos vendidos sem duplicações).
  - Gestão de Peças com Upload no Cloudflare R2, grade de tamanhos P/M/G e controle de CMV.
  - DRE Financeiro Gerencial ao vivo (`/admin/financas`).

- [x] **FASE 3: Checkout Integrado, WhatsApp & Sincronização Bidirecional**
  - Captura progressiva de leads (`clientes_loja`) logo no preenchimento do telefone.
  - Registro de pedidos vinculados com amarração estrita de `produto_id` UUID em `itens_pedido`.
  - Baixa física automática no estoque geral e na grade de cor/tamanho ao marcar pedido como `pago`.
  - Estorno e devolução automática de estoque ao marcar como `cancelado`.

- [x] **FASE 4: Autenticação Passwordless & Espaço VIP da Cliente**
  - Reconhecimento automático pelo número de WhatsApp.
  - Área da cliente (`/minha-conta`) com histórico de pedidos, status em tempo real e rastreamento Correios.

- [x] **FASE 5: Blindagem Operacional, Ferramentas de Expedição & Promoções**
  - Expedição em 1 clique (Declaração de Conteúdo Correios e Romaneio).
  - Central de Snippets WhatsApp e recuperação de carrinhos abandonados.
  - Central de Cupons & Promoções (`/admin/cupons/`).
  - CRM & Dossiê VIP da Cliente (`/admin/clientes/`).
  - Trava Dinâmica de Estoque e Duplicação de Peças.

- [x] **FASE 6 (MARCO ATUAL): Roteamento Canônico White-Label, Central VIP da Cliente e Central de Favoritos Avançada (Outubro/2026)**
  - [x] **Roteamento Canônico Multi-Tenant:** Padrão oficial de rotas limpas `/:loja/`, `/:loja/cliente/`, `/:loja/cliente/favoritos/`, `/:loja/catalogo/` e `/:loja/checkout/`, eliminando query strings provisórias (`?loja=...`) e mantendo compatibilidade com domínios próprios (`dominio.com.br`).
  - [x] **Central VIP da Cliente (`CustomerVIPDashboard`):** 5 abas completas (Pedidos com timeline visual de 5 etapas, Dados Cadastrais com Aniversário para mimos, Endereço ViaCEP com autofill bidirecional no checkout, Cupons Ativos com cópia em 1 clique e Concierge WhatsApp). Botão "Comprar Novamente" para recompra imediata.
  - [x] **Central de Desejos & Favoritos (`WishlistManager`):** Somatório de subtotal e parcelamento em tempo real, mini seletor inline de tamanho e cor nos cards, integração com `AviseMeModal` para peças esgotadas, link de presentes compartilhável (`?itens=...`) e vitrine de descoberta para lista vazia.
  - [x] **Navegação Global Blindada:** Logo do Header (desktop e mobile), menus dropdown, gaveta lateral (drawer), breadcrumbs e rodapé atualizados para conduzir à Home da própria boutique, garantindo que o cliente nunca caia no portal BCOMM por engano.
  - [x] **Padronização Universal para Novas Lojas:** Atualização dos links no Super Admin (`/super-admin/nova-loja` e `/super-admin/lojas`) e Admin (`/admin`), com SPA Fallback inteligente em Cloudflare Pages (`not-found.tsx`) para novas lojas criadas no banco.
  - [x] **Sincronização da Documentação Técnica:** Atualização canônica de `docs/ARCHITECTURE.md` e `docs/STATE.md`.
    - Filtro rápido de estoque e status: "Todas as Peças", "⚠️ Reposição Urgente (≤ 2 un)", "⛔ Esgotados", "✅ Ativas na Vitrine" e "⏸️ Pausadas".
  - [x] **Busca Universal Spotlight (`Ctrl + K`) & Notificações Operacionais (Item F19 do Catálogo):**
    - Modal de Spotlight acessível via atalho global de teclado (`Ctrl + K` / `Cmd + K`) e pelo campo de busca da barra superior (desktop e mobile).
    - Pesquisa em tempo real multi-entidade: peças do catálogo (com foto e preço), pedidos recentes (com status e valor) e clientes CRM (com telefone e LTV), além de atalhos rápidos para todas as telas do sistema.
    - Notificações operacionais na barra superior com ícone de sino (`Bell`), badge numérico pulsante e menu dropdown listando pedidos que aguardam confirmação de pagamento no WhatsApp.
  - [x] **Dinamização Integral do Checkout & WhatsApp Multi-Tenant:**
    - Número de WhatsApp de destino 100% dinâmico puxado das configurações do tenant no Supabase (`storeWhatsapp`) com higienização estrita de caracteres não numéricos (`wa.me/<cleanPhone>`) e fallback seguro.
    - Nome da loja dinâmico (`currentTenant.nome`) aplicado no cabeçalho do pedido no WhatsApp, resumo pós-venda, sacola vazia e modal de pré-preenchimento rápido, eliminando textos hardcoded e garantindo prontidão para novos lojistas SaaS.
  - [x] **Gestão de Tags Promocionais & Curadoria de Catálogo (Item F17 do Catálogo):**
    - Edição visual no modal de peça das 4 flags comerciais: `🌟 Destaque` (Lançamento / Home), `🔥 Mais Vendido`, `🏷️ Outlet / Bazar` e `⏳ Últimas Peças` com persistência imediata no Supabase.
    - Badges estéticos diferenciados em cada card de produto na listagem do admin para rápida identificação operacional.
    - Filtros rápidos por tags no topo do catálogo (`🌟 Destaques`, `🔥 Mais Vendidos`, `🏷️ Outlet`, `⚠️ Reposição Urgente`, `⛔ Esgotados`, `✅ Ativas`, `⏸️ Pausadas`).
  - [x] **Exportação Operacional & Contábil (CSV & Impressão DRE Oficial):**
    - Módulo `src/lib/export.ts` gerando arquivos `.csv` padrão brasileiro (delimitador `;` e encoding UTF-8 com BOM para abertura perfeita no Microsoft Excel sem corrupção de acentos).
    - Botão "Exportar Planilha (CSV)" na Central de Pedidos (`/admin/pedidos/`) com todos os dados dos pedidos filtrados (ID, Cliente, WhatsApp, Itens, Valor, Status, Rastreio e Cidade/UF).
    - Botão "Exportar CSV" e "Imprimir DRE" no painel financeiro (`/admin/financas/`) com estilização de impressão `@media print` para relatórios contábeis oficiais timbrados.
  - [x] **Esteira de Provisionamento Multi-Tenant Completa (Super Admin):**
    - Motor expresso de provisionamento em `src/lib/super-admin.ts` (`createStoreExpress`), clonando categorias, variações de grade P/M/G e peças completas preservando preços de custo CMV (`preco_custo`), flags promocionais (`destaque`, `mais_vendido`, `outlet`, `ultimas_pecas`), modelagem e detalhes têxteis.
    - Inicialização automática de Hero Banner dinâmico para a nova loja recém-criada, permitindo que a vitrine já nasça 100% pronta para venda e com isolamento total por `loja_id`.
  - [x] **Homologação E2E Completa:** Testes automatizados unitários e de integração em banco real com 100% de sucesso.
  - [x] **Deploy Contínuo:** Publicação no Cloudflare Pages validada e monitorada.

---

## 🔑 3. INVENTÁRIO DE AMBIENTES & CHAVES ATIVAS

| Serviço | Status | Variável / Configuração | Observações |
| :--- | :--- | :--- | :--- |
| **GitHub** | Conectado & Sincronizado | `origin/main` | Repositório `BCOMMAG/C28-bcomm-shop` |
| **Cloudflare Pages** | Ativo em Produção | `bcomm-shop.pages.dev` | Deploy automático a cada push no `main` |
| **Cloudflare R2** | Ativo & Operacional | Bucket: `bcomm-saas-media`<br>CDN: `pub-e5c670efa04d4ef185aece8ed06532af.r2.dev` | Account ID: `47ce862c285bb81ad80e052f7ed16ae5`<br>ForcePathStyle: `true` |
| **Supabase** | Conectado & Operacional | `https://mpexpfuvqwstrjctjrbv.supabase.co` | 11 tabelas ativas, RLS configurado |
| **Tenant #1 (Modelo)** | Ativo | `leidy-boutique` | ID: `e8b7f890-4e3a-4a89-9c56-8e1234567890` |
| **Tenant #2 (Demo)** | Ativo | `aura-privee` | ID: `f9c8e7d6-5b4a-3c2d-1e0f-9876543210ab` |

---

## 🗂️ 4. ROTAS EM PRODUÇÃO (TODAS HTTP 200 OK)

### Vitrine & Comprador:
- `https://bcomm-shop.pages.dev/` ➔ Portal de Lojas & Vitrine.
- `https://bcomm-shop.pages.dev/catalogo/` ➔ Catálogo Completo.
- `https://bcomm-shop.pages.dev/checkout/` ➔ Checkout Faseado com Captura de Leads.
- `https://bcomm-shop.pages.dev/minha-conta/` ➔ Rastreamento de Pedidos e Área da Cliente.

### Painel do Lojista:
- `https://bcomm-shop.pages.dev/admin/` ➔ Visão Geral com KPIs e Gráficos de Período.
- `https://bcomm-shop.pages.dev/admin/pedidos/` ➔ Central de Pedidos, Baixa de Estoque, Expedição e WhatsApp.
- `https://bcomm-shop.pages.dev/admin/produtos/` ➔ Gestão de Peças, Grade P/M/G e Upload R2.
- `https://bcomm-shop.pages.dev/admin/financas/` ➔ DRE Financeiro ao Vivo e Lucro Real.
- `https://bcomm-shop.pages.dev/admin/clientes/` ➔ CRM de Compradoras e Recuperação de Carrinho.
- `https://bcomm-shop.pages.dev/admin/banners/` ➔ CMS de Hero Banners 16:9 e 9:16.
- `https://bcomm-shop.pages.dev/admin/configuracoes/` ➔ Identidade Visual e Paletas de Cores.
- `https://bcomm-shop.pages.dev/admin/modulos/` ➔ Catálogo de Módulos e Integrações.

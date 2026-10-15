# 📌 MARCADOR DE ESTADO VIVO DO PROJETO (STATE TRACKER)
*Este arquivo é o GPS do projeto. Se o computador desligar ou a sessão reiniciar, leia este arquivo para saber exatamente onde paramos e o status de cada parte.*

---

## 📍 1. ONDE ESTAMOS AGORA?
- **Fase Ativa:** Fase 2 — Evolução do Painel Administrativo do Lojista (Tenant Leidy Boutique) & Consolidação SaaS
- **Status Geral:** **Etapas 0 a 8 100% Concluídas | Etapa 9 Em Execução Ativa**
- **Compilação de Produção:** Aprovada via `npm run build` (17 rotas geradas estaticamente, zero erros de TypeScript).
- **Última Atualização:** 15 de Outubro de 2026 (Sessão Atual)

---

## 🏁 2. HISTÓRICO DE ETAPAS CONCLUÍDAS

- [x] **ETAPA 0:** Governança e Documentação Viva (`docs/ARCHITECTURE.md`, `ROADMAP.md`, `STATE.md`, `DATABASE_SCHEMA.sql`).
- [x] **ETAPA 1:** DDL Mestre Executado no Supabase PostgreSQL (11 tabelas relacionais com RLS particionado por `loja_id`).
- [x] **ETAPA 2:** Middleware Multi-Tenant & Clientes Supabase (`src/middleware.ts`, `src/lib/tenant.ts`, `wrangler.json`).
- [x] **ETAPA 3:** Migração do Catálogo Estático para o Supabase (16 produtos, 54 variações, 29 fotos/vídeos de provador, banner e menus com fallback seguro).
- [x] **ETAPA 4:** Checkout Inteligente com Captura de Leads e Geração de ID `#LB-2026-XXXX`.
- [x] **ETAPA 5:** Espaço VIP da Cliente (`/minha-conta`) com login passwordless por WhatsApp, linha do tempo de 5 passos e rastreamento Correios.
- [x] **ETAPA 6:** Painel Administrativo do Lojista (`/admin`) inicial com Dashboard, Pedidos e Produtos.
- [x] **ETAPA 7:** Console Executivo do Super Admin (`/super-admin`) com Visão Global, Gestão de Tenants, Onboarding Express em 60s e Domínios Customizados.
- [x] **ETAPA 8:** Dockerfile Multi-Stage de Produção, Suporte Standalone e Guias de Deploy VPS.
- [x] **ETAPA EXTRA (STORAGE R2 & ISOLAMENTO):**
  - [x] Conexão e sincronização completa do **Cloudflare R2** (`bcomm-saas-media`, Endpoint `47ce862c285bb81ad80e052f7ed16ae5.r2.cloudflarestorage.com`, CDN pública `https://pub-e5c670efa04d4ef185aece8ed06532af.r2.dev`, taxa zero de saída).
  - [x] Upload em massa de todas as fotos em alta resolução, mídias institucionais e vídeos pesados de provador (10 MB).
  - [x] Isolamento estrito de sacola e favoritos por loja (`bcomm_cart_${tenantKey}`, `bcomm_wishlist_${tenantKey}`).
  - [x] Registro formal do **Tenant #2 (Aura Privée)** no banco Supabase com identidade própria Rose Gold (`#E0A99A`).
  - [x] Políticas SQL RLS atualizadas com permissões completas de gravação e consulta.

---

## 🚀 3. ETAPA EM EXECUÇÃO: ETAPA 9 (PAINEL DO LOJISTA PROFISSIONAL)

- [-] **9.1:** Navegação, Sessão & Segurança (Botão "Sair / Logout" no topo do Header e Drawer Mobile de ambos os painéis, link dinâmico "Abrir Vitrine" para `/?loja=${slug}`, estabilização do botão "Ver Pedidos").
- [ ] **9.2:** Catálogo de Produtos com Upload R2 (Cadastro completo de produto, seletor de foto de capa, upload de fotos e vídeos de provador verticais 9:16 no R2, suporte a produtos simples e grade P/M/G x Cor com seletor HEX, preço de custo CMV, soft-delete seguro).
- [ ] **9.3:** Central de Pedidos, Baixa Inteligente de Estoque & Automação WhatsApp (Baixa de estoque apenas na confirmação "Pago", devolução no cancelamento, botões de 1 clique para WhatsApp com templates de confirmação, rastreio e pós-venda).
- [ ] **9.4:** DRE Financeiro & Lucro Real da Loja (`/admin/financas`) (Faturamento Bruto, Custo das Peças CMV, despesas operacionais configuráveis como taxa de cartão e embalagens, Lucro Líquido Real, Margem Líquida % e Ticket Médio).
- [ ] **9.5:** CMS Visual da Vitrine & Banners Responsivos (`/admin/banners`) (Hero Banner Desktop 16:9 e Mobile 9:16 com upload no R2 e preview ao vivo, barra de aviso de frete do topo).
- [ ] **9.6:** CRM de Clientes & Leads (`/admin/clientes`) (Base de contatos capturados no checkout e WhatsApp, histórico de compras, LTV, tags de cliente VIP e botão de 1 clique para WhatsApp).

---

## 🔑 4. INVENTÁRIO DE AMBIENTES & CHAVES ATIVAS

| Serviço | Status | Variável / Configuração | Observações |
| :--- | :--- | :--- | :--- |
| **GitHub** | Conectado & Sincronizado | `origin/main` | Repositório `BCOMMAG/C28-bcomm-shop` |
| **Cloudflare Pages** | Ativo em Produção | `bcomm-shop.pages.dev` | Deploy automático a cada push no `main` |
| **Cloudflare R2** | Ativo & Operacional | Bucket: `bcomm-saas-media`<br>CDN: `pub-e5c670efa04d4ef185aece8ed06532af.r2.dev` | Account ID: `47ce862c285bb81ad80e052f7ed16ae5`<br>ForcePathStyle: `true` |
| **Supabase** | Conectado & Operacional | `https://mpexpfuvqwstrjctjrbv.supabase.co` | 11 tabelas ativas, RLS configurado |
| **Tenant #1 (Modelo)** | Ativo | `leidy-boutique` | ID: `e8b7f890-4e3a-4a89-9c56-8e1234567890` |
| **Tenant #2 (Demo)** | Ativo | `aura-privee` | ID: `f9c8e7d6-5b4a-3c2d-1e0f-9876543210ab` |

---

## 🗂️ 5. INVENTÁRIO DAS ROTAS ATIVAS E PREVISTAS

### Vitrine & Comprador:
- `/?loja=leidy-boutique` ➔ Vitrine Oficial Leidy Boutique.
- `/?loja=aura-privee` ➔ Vitrine Oficial Aura Privée.
- `/catalogo` ➔ Catálogo de Peças com filtros avançados.
- `/checkout` ➔ Checkout Faseado em 4 etapas com captura de WhatsApp.
- `/favoritos` ➔ Lista de Desejos isolada por loja.
- `/minha-conta` ➔ Espaço VIP da Cliente (Login sem senha por WhatsApp, rastreamento Correios).

### Painel do Lojista:
- `/admin/login` ➔ Acesso do Lojista.
- `/admin` ➔ Dashboard de Métricas Operacionais e Atalhos Rápidos.
- `/admin/pedidos` ➔ Central de Pedidos, Baixa de Estoque e Disparos WhatsApp.
- `/admin/produtos` ➔ Catálogo, Cadastro com Upload R2, Grade e Preço de Custo.
- `/admin/financas` ➔ DRE Financeiro, Lucro Líquido, Custos e Despesas.
- `/admin/banners` ➔ CMS do Hero Banner (Desktop 16:9 e Mobile 9:16) e Avisos.
- `/admin/clientes` ➔ CRM de Compradoras e Leads com WhatsApp de 1 clique.
- `/admin/modulos` ➔ Loja de Módulos White-Label.

### Console Master do Dono da Plataforma (BCOMM):
- `/super-admin/login` ➔ Acesso Master do Dono (`superadmin@bcomm.com.br`).
- `/super-admin` ➔ Visão Global da Rede (GMV Global, Tenants Ativos, Pedidos Consolidados).
- `/super-admin/lojas` ➔ Gestão de Todas as Lojas com Pausa/Ativação e Módulos.
- `/super-admin/nova-loja` ➔ Assistente de Provisionamento Express em 60 Segundos.
- `/super-admin/dominios` ➔ Gestão de Domínios Próprios e Apontamento DNS CNAME.

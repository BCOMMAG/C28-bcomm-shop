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

- [x] **FASE 5 (MARCO ATUAL): Blindagem Operacional, Ferramentas de Expedição & Promoções**
  - [x] **Expedição em 1 Clique:** Gerador e impressor de Declaração de Conteúdo Oficial dos Correios e Romaneio de Separação (Packing List) com checklist de embalagem de luxo.
  - [x] **Central de Snippets WhatsApp:** 4 templates prontos de 1 clique (Atendimento Geral, Chave Pix & Reserva, Código de Rastreio e Pós-Venda Carinhoso).
  - [x] **Recuperação de Carrinhos Abandonados:** Segmentação de leads com 0 compras e botão direto de WhatsApp com mensagem amigável.
  - [x] **Central de Cupons & Promoções (`/admin/cupons/`):** Gestão de descontos fixos e percentuais, limites de uso, pedido mínimo e validação dinâmica no checkout da vitrine.
  - [x] **Vitrine & Banners Hero Sincronizados:** Suporte completo no admin para vídeos/fotos 16:9 (Desktop) e 9:16 (Celular) com upload R2, textos e CTA dinâmicos, e Barra Superior de Avisos (Top Announcement Bar) sincronizada ao vivo com a vitrine.
  - [x] **CRM & Dossiê VIP da Cliente (`/admin/clientes/`):** Cálculo automático de LTV, segmentação por tags (VIP Gold, Recorrente, Compradora, Lead), modal de dossiê completo com histórico de itens comprados, preferências de tamanho habitual e gravação de anotações internas privadas no Supabase.
  - [x] **Configurações Gerais, Chave Pix & Frete Grátis (`/admin/configuracoes/`):** Gestão centralizada dos dados de atendimento da boutique (WhatsApp e E-mail), Chave PIX oficial e dados bancários sincronizados dinamicamente com o checkout e com os snippets de mensagens, regra de Frete Grátis em reais calculada no carrinho/checkout ao vivo, e seletor com 6 paletas de cores gravado no Supabase.
  - [x] **Trava Dinâmica de Estoque na Vitrine (Provador & PDP):** Bloqueio instantâneo na vitrine de tamanhos com estoque zerado na grade de cor/tamanho, botão riscado e desabilitado com selo "Esgotado", limitação do seletor de quantidade ao estoque real da variação e badge "Esgotado" nos cards quando o produto zera totalmente no estoque físico.
  - [x] **Gestão Ágil de Grade & Clonagem de Peças em 1 Clique (`/admin/produtos/`):**
    - Ajuste imediato de estoque por variação de cor e tamanho com botões `+` e `-` na grade expandida, com sincronização automática do estoque consolidado do produto pai (`produtos.estoque_total`).
    - Botão "Duplicar Peça" (Item 1.3.3 do catálogo) que clona a peça, fotos, descrições, tecidos e grade completa de variações gerando um slug exclusivo e preservando dados originais.
    - Filtro rápido de estoque e status: "Todas as Peças", "⚠️ Reposição Urgente (≤ 2 un)", "⛔ Esgotados", "✅ Ativas na Vitrine" e "⏸️ Pausadas".
  - [x] **Busca Universal Spotlight (`Ctrl + K`) & Notificações Operacionais (Item F19 do Catálogo):**
    - Modal de Spotlight acessível via atalho global de teclado (`Ctrl + K` / `Cmd + K`) e pelo campo de busca da barra superior (desktop e mobile).
    - Pesquisa em tempo real multi-entidade: peças do catálogo (com foto e preço), pedidos recentes (com status e valor) e clientes CRM (com telefone e LTV), além de atalhos rápidos para todas as telas do sistema.
    - Notificações operacionais na barra superior com ícone de sino (`Bell`), badge numérico pulsante e menu dropdown listando pedidos que aguardam confirmação de pagamento no WhatsApp.
  - [x] **Homologação E2E Completa:** Teste automatizado cobrindo todo o ciclo em banco real com 100% de sucesso.
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

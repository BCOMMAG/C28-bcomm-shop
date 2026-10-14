# 📌 MARCADOR DE ESTADO VIVO DO PROJETO (STATE TRACKER)
*Este arquivo é o GPS do projeto. Se o computador desligar ou a sessão reiniciar, leia este arquivo para saber exatamente onde paramos e qual é o próximo passo imediato.*

---

## 📍 1. ONDE ESTAMOS AGORA?
- **Fase Ativa:** Transição para Plataforma Multi-Tenant SaaS
- **Etapa Atual:** **ETAPA 6 — Painel Administrativo do Lojista (`/admin`)**
- **Status do Projeto:** Espaço VIP da Cliente (`/minha-conta`) 100% operacional com rastreamento e login passwordless, build de produção validado.
- **Última Atualização:** 14 de Outubro de 2026

---

## 🏁 2. ÚLTIMA AÇÃO CONCLUÍDA
- [x] Criação da rota e interface completa `/minha-conta` com design luxuoso da boutique.
- [x] Login passwordless por WhatsApp (com preenchimento automático inteligente do último celular usado).
- [x] Integração de consultas `getCustomerOrders` e `getOrderByNumber` conectadas ao Supabase.
- [x] Visualização de pedidos com filtro em abas ("Todos", "Em Andamento", "Entregues").
- [x] Linha do tempo visual do pedido (Pedido -> Pago -> Embalado -> Enviado -> Entregue).
- [x] Integração de rastreamento com link direto para o site dos Correios e botão de cópia de código.
- [x] Botão de 1 clique para falar com a Leidy no WhatsApp sobre o pedido em andamento.
- [x] Botões de acesso ao Espaço VIP no Header (topo) e no Menu Lateral Drawer mobile.
- [x] Validação da compilação via `npm run build` com sucesso absoluto (zero erros de TypeScript).

---

## 🎯 3. PRÓXIMA AÇÃO IMEDIATA (O PRÓXIMO PASSO EXATO)
- [ ] **Executar a ETAPA 6 (Painel Administrativo do Lojista /admin):**
  1. Criar a tela de login do lojista (`/admin/login`) via Supabase Auth (e-mail e senha).
  2. Criar o layout e dashboard principal (`/admin`) com métricas da loja (Total de Pedidos, Faturamento, Leads capturados, Produtos ativos).
  3. Criar a Central de Pedidos do lojista (`/admin/pedidos`): alteração de status (`pago`, `em_separacao`, `enviado`, `entregue`) e inserção do código de rastreio dos Correios que reflete na hora na `/minha-conta` da cliente.
  4. Criar a Gestão de Catálogo (`/admin/produtos`): listagem, criação, edição de preços/estoque e pausa de produtos.

---

## 🔑 4. INVENTÁRIO DE AMBIENTES & CHAVES

| Serviço | Status | Variável / Configuração | Observações |
| :--- | :--- | :--- | :--- |
| **GitHub** | Conectado | `origin/main` | Repositório oficial do código único |
| **Supabase** | Conectado & Operacional | `NEXT_PUBLIC_SUPABASE_URL`<br>`NEXT_PUBLIC_SUPABASE_ANON_KEY` | Banco PostgreSQL em Nuvem configurado com 11 tabelas |
| **Middleware** | Ativo & Operacional | `x-tenant-id`, `x-tenant-slug` | Injetado dinamicamente em cada requisição |
| **Cloudflare Pages** | Configurado | `wrangler.json` ativo | Pronto para conexão com GitHub no painel Cloudflare |
| **Cloudflare R2** | Planejado | `R2_ACCESS_KEY_ID`<br>`R2_SECRET_ACCESS_KEY` | Storage de fotos e vídeos com taxa zero de tráfego |
| **VPS Coolify** | Fase 2 | Contabo Core Cloud VPS 4 | Ativado apenas após fechar a primeira venda |

---

## 🗂️ 5. INVENTÁRIO DE ROTAS ATUAIS DO PROJETO

- `/` ➔ Vitrine da Loja (Lançamentos, Mais Vendidos, Outlet, Últimas Peças, Vídeo de Provador).
- `/catalogo` ➔ Catálogo de Peças com filtros avançados de tecidos, modelagem, linha e busca.
- `/checkout` ➔ Checkout Faseado em 4 Etapas (Sacola, Endereço, Identificação, Pagamento) direcionando para o WhatsApp oficial.
- `/favoritos` ➔ Lista de Desejos da Cliente.
- *(Planejado)* `/minha-conta` ➔ Espaço VIP da Cliente (Login por celular, histórico e rastreio de pedidos).
- *(Planejado)* `/admin` ➔ Painel Administrativo da Lojista (Produtos, Estoque, Banners e Pedidos).
- *(Planejado)* `/super-admin` ➔ Painel do Dono da Plataforma (Gestão de Lojas e Módulos).

---
*Atualizado continuamente a cada commit do projeto.*

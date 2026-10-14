# 📌 MARCADOR DE ESTADO VIVO DO PROJETO (STATE TRACKER)
*Este arquivo é o GPS do projeto. Se o computador desligar ou a sessão reiniciar, leia este arquivo para saber exatamente onde paramos e qual é o próximo passo imediato.*

---

## 📍 1. ONDE ESTAMOS AGORA?
- **Fase Ativa:** Transição para Plataforma Multi-Tenant SaaS
- **Etapa Atual:** **ETAPA 5 — Espaço VIP da Cliente (`/minha-conta`)**
- **Status do Projeto:** Checkout 100% conectado ao Supabase com gravação de pedidos e captura de leads ativos, build de produção validado.
- **Última Atualização:** 14 de Outubro de 2026

---

## 🏁 2. ÚLTIMA AÇÃO CONCLUÍDA
- [x] Configuração de políticas de segurança (RLS) permissivas e seguras para cadastro de clientes, pedidos e itens no Supabase.
- [x] Criação do serviço unificado de pedidos e leads em `src/lib/orders.ts` (`createOrderInDatabase` e `saveCustomerLead`).
- [x] Conexão da Etapa 4 do Checkout (`src/app/checkout/page.tsx`): ao clicar em "Enviar Pedido para a Leidy no WhatsApp", o pedido e todos os seus itens são registrados no PostgreSQL.
- [x] Implementação da captura automática de leads em nuvem (quando a cliente digita o WhatsApp, o lead é registrado e atualizado em tempo real na tabela `clientes_loja`).
- [x] Selo visual na tela de sucesso confirmando que o pedido está gravado no sistema da loja.
- [x] Validação da compilação via `npm run build` com sucesso absoluto (zero erros de TypeScript).

---

## 🎯 3. PRÓXIMA AÇÃO IMEDIATA (O PRÓXIMO PASSO EXATO)
- [ ] **Executar a ETAPA 5 (Espaço VIP da Cliente /minha-conta):**
  1. Criar a rota e página `/minha-conta` com login passwordless por telefone/WhatsApp (sem exigir que a cliente decore senha).
  2. Exibir lista dos pedidos realizados pela cliente consultando a tabela `pedidos` filtrada por `telefone`.
  3. Linha do tempo visual do status do pedido (Aguardando WhatsApp -> Pago -> Em Separação -> Enviado -> Entregue).
  4. Exibir código de rastreio dos Correios com link direto e botão de 1 clique para falar com a loja no WhatsApp.

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

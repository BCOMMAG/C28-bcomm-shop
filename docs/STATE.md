# 📌 MARCADOR DE ESTADO VIVO DO PROJETO (STATE TRACKER)
*Este arquivo é o GPS do projeto. Se o computador desligar ou a sessão reiniciar, leia este arquivo para saber exatamente onde paramos e qual é o próximo passo imediato.*

---

## 📍 1. ONDE ESTAMOS AGORA?
- **Fase Ativa:** Transição para Plataforma Multi-Tenant SaaS
- **Etapa Atual:** **ETAPA 4 — Checkout Faseado Conectado ao Banco & Captura de Leads**
- **Status do Projeto:** Catálogo 100% migrado para o Supabase, vitrine dinâmica operacional com fallback e build de produção validado.
- **Última Atualização:** 14 de Outubro de 2026

---

## 🏁 2. ÚLTIMA AÇÃO CONCLUÍDA
- [x] Migração de 16 produtos de luxo, 11 categorias, 54 variações (cores x tamanhos), 29 mídias (fotos e vídeos de provador), hero banner e menus para o Supabase PostgreSQL (`loja_id: e8b7f890-4e3a-4a89-9c56-8e1234567890`).
- [x] Criação da camada de serviço e mapeamento de dados em `src/lib/products.ts` com fallback automático de zero downtime.
- [x] Atualização do `StoreContext` para gerenciar estado dinâmico de produtos com `refreshProducts` e `getProductById`.
- [x] Integração da vitrine Home (`src/app/page.tsx`), catálogo (`src/app/catalogo/page.tsx`), detalhes (`ProductModal.tsx`), sacola (`CartDrawer.tsx`), conversão (`ConversionSidebar.tsx`) e favoritos (`src/app/favoritos/page.tsx`).
- [x] Validação da compilação via `npm run build` com sucesso absoluto (zero erros de TypeScript).

---

## 🎯 3. PRÓXIMA AÇÃO IMEDIATA (O PRÓXIMO PASSO EXATO)
- [ ] **Executar a ETAPA 4 (Checkout Conectado ao Banco & Captura de Leads):**
  1. Conectar a finalização da Etapa 4 do Checkout para salvar o pedido na tabela `pedidos` e os itens em `itens_pedido` no Supabase antes do redirecionamento para o WhatsApp.
  2. Implementar captura automática de leads e carrinhos abandonados (se o cliente digitar o WhatsApp e sair antes de pagar, salvar com status `lead_carrinho_abandonado`).
  3. Gerar código oficial legível de pedido (ex: `#LB-1001`) para acompanhamento da cliente.

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

# 📌 MARCADOR DE ESTADO VIVO DO PROJETO (STATE TRACKER)
*Este arquivo é o GPS do projeto. Se o computador desligar ou a sessão reiniciar, leia este arquivo para saber exatamente onde paramos e qual é o próximo passo imediato.*

---

## 📍 1. ONDE ESTAMOS AGORA?
- **Fase Ativa:** Transição para Plataforma Multi-Tenant SaaS
- **Etapa Atual:** **ETAPA 2 — Middleware Multi-Tenant & Configuração Cloudflare Pages**
- **Status do Projeto:** Banco Supabase 100% configurado com 11 tabelas, índices, RLS e Tenant #1 (Leidy Boutique) cadastrado.
- **Última Atualização:** 14 de Outubro de 2026

---

## 🏁 2. ÚLTIMA AÇÃO CONCLUÍDA
- [x] Execução automatizada com sucesso do script `docs/DATABASE_SCHEMA.sql` no banco de dados PostgreSQL do Supabase.
- [x] Criação das 11 tabelas públicas no Supabase (`lojas`, `categorias`, `produtos`, `variacoes_produto`, `midias_produto`, `hero_banners`, `menus_navegacao`, `clientes_loja`, `pedidos`, `itens_pedido`, `cupons`).
- [x] Inserção oficial do Tenant #1: **Leidy Boutique** (`id: e8b7f890-4e3a-4a89-9c56-8e1234567890`).
- [x] Configuração das variáveis de ambiente em `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `DATABASE_URL`).

---

## 🎯 3. PRÓXIMA AÇÃO IMEDIATA (O PRÓXIMO PASSO EXATO)
- [ ] **Executar a ETAPA 2 (Middleware Multi-Tenant & Cloudflare Pages):**
  1. Instalar `@supabase/supabase-js` e `@supabase/ssr` no projeto.
  2. Criar os clientes Supabase (`src/lib/supabase/client.ts` e `src/lib/supabase/server.ts`).
  3. Criar `src/middleware.ts` para resolver dinamicamente o `Host` da requisição (resolvendo pelo `dominio_proprio` ou `slug` para injetar o `loja_id`).
  4. Configurar adaptador de build para o Cloudflare Pages (`@opennextjs/cloudflare`).
  5. Subir ao GitHub e orientar conexão no Cloudflare Pages para gerar o link `.pages.dev`.

---

## 🔑 4. INVENTÁRIO DE AMBIENTES & CHAVES

| Serviço | Status | Variável / Configuração | Observações |
| :--- | :--- | :--- | :--- |
| **GitHub** | Conectado | `origin/main` | Repositório oficial do código único |
| **Supabase** | Conectado & Operacional | `NEXT_PUBLIC_SUPABASE_URL`<br>`NEXT_PUBLIC_SUPABASE_ANON_KEY` | Banco PostgreSQL em Nuvem configurado com 11 tabelas |
| **Cloudflare Pages** | Próxima Etapa | Deploy automático via GitHub | Gera link gratuito `.pages.dev` |
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

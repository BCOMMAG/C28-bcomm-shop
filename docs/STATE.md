# 📌 MARCADOR DE ESTADO VIVO DO PROJETO (STATE TRACKER)
*Este arquivo é o GPS do projeto. Se o computador desligar ou a sessão reiniciar, leia este arquivo para saber exatamente onde paramos e qual é o próximo passo imediato.*

---

## 📍 1. ONDE ESTAMOS AGORA?
- **Fase Ativa:** Transição para Plataforma Multi-Tenant SaaS
- **Etapa Atual:** **ETAPA 3 — Vitrine Dinâmica & Migração do Catálogo da Leidy para o Supabase**
- **Status do Projeto:** Middleware Multi-Tenant operacional, clientes Supabase configurados e build 100% validado.
- **Última Atualização:** 14 de Outubro de 2026

---

## 🏁 2. ÚLTIMA AÇÃO CONCLUÍDA
- [x] Instalação dos pacotes oficiais `@supabase/supabase-js` e `@supabase/ssr`.
- [x] Criação de tipos TypeScript completos do banco em `src/types/database.ts`.
- [x] Criação dos utilitários de cliente Supabase para browser (`src/lib/supabase/client.ts`) e server (`src/lib/supabase/server.ts`).
- [x] Implementação do resolver de lojas com cache inteligente em `src/lib/tenant.ts`.
- [x] Criação do `src/middleware.ts` interceptando requisições, resolvendo a loja por Host e injetando headers de tenant e cookies.
- [x] Criação do arquivo de configuração `wrangler.json` para Cloudflare Pages.
- [x] Validação da compilação via `npm run build` com sucesso absoluto (zero erros de TypeScript).

---

## 🎯 3. PRÓXIMA AÇÃO IMEDIATA (O PRÓXIMO PASSO EXATO)
- [ ] **Executar a ETAPA 3 (Vitrine Dinâmica & Migração do Catálogo):**
  1. Criar script automatizado (`scripts/seed-products-supabase.mjs`) para migrar os produtos, fotos, vídeos, cores e tamanhos de `src/data/products.ts` para o Supabase vinculados ao `loja_id` da Leidy Boutique.
  2. Executar a importação para popular o catálogo real na nuvem.
  3. Atualizar a vitrine para consumir do Supabase com fallback seguro para os dados locais caso haja oscilação de rede.
  4. Testar a vitrine e o catálogo lendo do banco de dados na nuvem.

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

# 📌 MARCADOR DE ESTADO VIVO DO PROJETO (STATE TRACKER)
*Este arquivo é o GPS do projeto. Se o computador desligar ou a sessão reiniciar, leia este arquivo para saber exatamente onde paramos e qual é o próximo passo imediato.*

---

## 📍 1. ONDE ESTAMOS AGORA?
- **Fase Ativa:** Transição para Plataforma Multi-Tenant SaaS
- **Etapa Atual:** **ETAPA 1 — Modelagem SQL no Supabase & Inserção do Tenant #1 (Leidy Boutique)**
- **Status do Projeto:** Frontend da Leidy Boutique 100% operacional; estrutura de governança `/docs` implantada.
- **Última Atualização:** 14 de Outubro de 2026

---

## 🏁 2. ÚLTIMA AÇÃO CONCLUÍDA
- [x] Otimização completa do Checkout faseado no mobile (layout compacto sem scroll desnecessário, cálculo de frete centralizado na Etapa 2 e envio direto para o WhatsApp oficial).
- [x] Criação da pasta de governança `/docs` com os arquivos `ARCHITECTURE.md`, `ROADMAP.md`, `STATE.md` e `DATABASE_SCHEMA.sql`.
- [x] Definição estratégica da arquitetura em 2 fases:
  - **Fase 1 (Desenvolvimento / R$ 0,00):** Cloudflare Pages + Supabase (PostgreSQL) + Cloudflare R2 + Cloudflare for SaaS.
  - **Fase 2 (Produção / Primeira Venda):** VPS Contabo com Coolify (Docker) + Evolution API (WhatsApp bot).

---

## 🎯 3. PRÓXIMA AÇÃO IMEDIATA (O PRÓXIMO PASSO EXATO)
- [ ] **Executar a ETAPA 1 no Supabase:**
  1. Abrir o painel do Supabase (projeto na nuvem).
  2. Acessar o menu lateral **SQL Editor**.
  3. Copiar e executar o script mestre versionado no arquivo [`docs/DATABASE_SCHEMA.sql`](./DATABASE_SCHEMA.sql).
  4. Confirmar a criação das 10 tabelas e a inserção do registro da **Leidy Boutique** como o primeiro lojista oficial (`lojas`).
  5. Obter a `SUPABASE_URL` e a `SUPABASE_ANON_KEY` para o arquivo `.env.local`.

---

## 🔑 4. INVENTÁRIO DE AMBIENTES & CHAVES

| Serviço | Status | Variável / Configuração | Observações |
| :--- | :--- | :--- | :--- |
| **GitHub** | Conectado | `origin/main` | Repositório oficial do código único |
| **Supabase** | Aguardando Script | `NEXT_PUBLIC_SUPABASE_URL`<br>`NEXT_PUBLIC_SUPABASE_ANON_KEY` | Banco PostgreSQL em Nuvem (Plano Free) |
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

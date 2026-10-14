# 🚀 GUIA DE DEPLOY: COOLIFY + CONTABO VPS (FASE 2)

> **Quando usar este guia:** Este guia deve ser executado na **Fase 2**, assim que a primeira venda for realizada ou quando for necessário hospedar instâncias de disparos automatizados de WhatsApp (Evolution API) e Docker na VPS Contabo.

---

## 📋 1. Visão Geral da Infraestrutura na VPS

- **Servidor:** Contabo Cloud VPS (ex: Cloud VPS 2 ou 4, Ubuntu 24.04 LTS).
- **Gerenciador de Contêineres:** Coolify (Painel self-hosted moderno, open-source e alternativo ao Heroku/Vercel).
- **Proxy Reverso & SSL:** Traefik com renovação automática de certificados Let's Encrypt para todos os domínios e subdomínios dos lojistas.
- **Banco de Dados:** Supabase PostgreSQL na nuvem (ou instância local do PostgreSQL gerenciada pelo Coolify).

---

## 🛠️ 2. Instalação do Coolify na VPS Contabo

Acesse a VPS via SSH com privilégios de `root`:

```bash
ssh root@SEU_IP_CONTABO
```

Execute o comando oficial de instalação de 1 linha do Coolify:

```bash
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

Após a instalação (aproximadamente 2 minutos), acesse o painel pelo navegador:
`http://SEU_IP_CONTABO:8000`

Crie sua conta de administrador Master no Coolify.

---

## 📦 3. Conexão do Repositório Git no Coolify

1. No dashboard do Coolify, clique em **Projects** ➔ **+ Add Project**.
2. Clique em **+ New Resource** ➔ **Public / Private Repository**.
3. Selecione o repositório GitHub: `BCOMMAG/C28-leidyboutique` (Branch: `main`).
4. Em **Build Pack**, selecione **Dockerfile** (o Coolify detectará automaticamente o `Dockerfile` multi-stage presente na raiz do projeto).
5. Defina a porta de escuta do serviço como `3000`.

---

## 🔑 4. Variáveis de Ambiente no Coolify

Na aba **Environment Variables** do serviço no Coolify, adicione as chaves de produção:

```env
NODE_ENV=production
DOCKER_BUILD=true
PORT=3000
HOSTNAME=0.0.0.0
NEXT_PUBLIC_SUPABASE_URL=https://mpexpfuvqwstrjctjrbv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DATABASE_URL=postgresql://postgres:Set%40provisorio26@db.mpexpfuvqwstrjctjrbv.supabase.co:5432/postgres
```

---

## 🌐 5. Configuração de Domínios & Wildcard

No campo **Domains** do Coolify:
- Adicione o domínio principal: `https://leidyboutique.com.br`
- Adicione o subdomínio wildcard da rede: `https://*.bcomm.shop`

O Coolify solicitará automaticamente certificados SSL HTTPS gratuitos via Let's Encrypt para todas as lojas.

---

## ⚡ 6. Deploy Contínuo (CI/CD Automático)

- Habilite a opção **Auto Deploy (Webhook)** no Coolify.
- Copie o Webhook URL fornecido pelo Coolify e cole no GitHub (`Settings` ➔ `Webhooks`).
- A cada `git push origin main`, o Coolify reconstruirá o contêiner Docker em segundo plano sem nenhum downtime!

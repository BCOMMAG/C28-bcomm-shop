# ☁️ GUIA DE CONFIGURAÇÃO: CLOUDFLARE R2 (STORAGE DE MÍDIA TAXA ZERO)

> **Vantagem Competitiva:** O Cloudflare R2 é compatível com a API S3 da AWS, porém com **R$ 0,00 de taxa de transferência de saída (zero egress fees)**. Isso permite que a plataforma armazene dezenas de gigabytes de vídeos de provador em alta definição e fotos WebP sem nenhuma surpresa na fatura ao final do mês.

---

## 📦 1. Criando o Bucket R2 na Cloudflare

1. Acesse o painel da [Cloudflare](https://dash.cloudflare.com).
2. No menu lateral, navegue até **R2 Object Storage**.
3. Clique em **Create bucket**.
4. Defina o nome do bucket: `bcomm-saas-media`.
5. Selecione a localização: **Automatic** (ou South America se disponível).
6. Clique em **Create bucket**.

---

## 🔗 2. Conectando um Domínio Público ao Bucket

Para que as URLs das fotos e vídeos sejam limpas e elegantes (ex: `https://media.bcomm.shop/produtos/vestido-cetim.webp`):

1. Dentro do bucket criado, acesse a aba **Settings**.
2. Na seção **Public Access**, clique em **Connect Domain**.
3. Digite o subdomínio: `media.bcomm.shop` (ou `media.leidyboutique.com.br`).
4. A Cloudflare configurará o certificado SSL e a CDN global automaticamente.

---

## 🔑 3. Gerando Chaves de API S3 para Upload

1. No menu principal do R2, clique em **Manage R2 API Tokens** no lado direito.
2. Clique em **Create API token**.
3. Selecione as permissões: **Object Read & Write**.
4. Copie as credenciais geradas:
   - `Access Key ID`
   - `Secret Access Key`
   - `Endpoint S3` (ex: `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`)
5. Insira essas chaves no arquivo `.env.local` e no painel do Coolify.

---

## 📁 4. Estrutura de Pastas Recomendada por Tenant

Para isolamento de arquivos entre lojas na plataforma:

```
bcomm-saas-media/
├── tenants/
│   ├── leidy-boutique/
│   │   ├── produtos/
│   │   ├── videos/
│   │   └── banners/
│   ├── aura-privee/
│   │   ├── produtos/
│   │   └── banners/
```

Todas as mídias salvas no Supabase na tabela `midias_produto` utilizarão as URLs públicas servidas pelo Cloudflare R2 com cache na borda (Edge Caching).

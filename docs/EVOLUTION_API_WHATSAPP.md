# 📱 GUIA DE INTEGRAÇÃO: EVOLUTION API (WHATSAPP AUTOMÁTICO) - FASE 2

> **Objetivo:** Disparo automático de mensagens para a cliente no WhatsApp a cada atualização de status do pedido (Pedido Recebido, Pagamento Confirmado, Pedido Enviado com Código de Rastreio, Pedido Entregue) e recuperação inteligente de carrinhos abandonados.

---

## 🏗️ 1. Subindo a Evolution API no Coolify

No mesmo servidor VPS Contabo com Coolify, adicione um novo recurso:
1. **+ New Resource** ➔ **Docker Compose**.
2. Cole o compose oficial da Evolution API v2:

```yaml
version: '3.8'

services:
  evolution-api:
    image: atendai/evolution-api:v2.1.2
    container_name: evolution_api
    restart: always
    ports:
      - "8080:8080"
    environment:
      - SERVER_URL=https://whatsapp-api.bcomm.shop
      - AUTHENTICATION_API_KEY=BCOMM_SECRET_KEY_2026_MASTER
      - DATABASE_ENABLED=true
      - DATABASE_CONNECTION_URI=postgresql://postgres:Set%40provisorio26@db.mpexpfuvqwstrjctjrbv.supabase.co:5432/postgres
    volumes:
      - evolution_instances:/evolution/instances

volumes:
  evolution_instances:
```

3. Clique em **Deploy**.
4. Aponte o subdomínio `whatsapp-api.bcomm.shop` no DNS.

---

## 📲 2. Conexão do WhatsApp da Loja (QR Code)

Para conectar o WhatsApp de um lojista:
1. Faça uma chamada `POST` para criar a instância:
   `https://whatsapp-api.bcomm.shop/instance/create`
   Headers: `apikey: BCOMM_SECRET_KEY_2026_MASTER`
   Body:
   ```json
   {
     "instanceName": "leidy-boutique",
     "token": "leidy-token-seguro",
     "qrcode": true
   }
   ```
2. Escaneie o QR Code retornado com o aparelho WhatsApp da Leidy Boutique.
3. Instância conectada com sucesso!

---

## 🤖 3. Disparos Automáticos por Gatilhos de Pedido

A plataforma chama a Evolution API nos seguintes eventos:

### 1. Novo Pedido Criado no Checkout:
```
Olá, {NOME}! 🌸
Recebemos o seu pedido #{NUMERO_PEDIDO} na Leidy Boutique!
Total: R$ {VALOR}
Em instantes nossa equipe vai validar os detalhes das suas peças.
```

### 2. Pedido Despachado com Código de Rastreio:
```
Boas notícias, {NOME}! 🚚✨
Suas peças da Leidy Boutique acabaram de ser enviadas aos Correios!
Código de Rastreio: {CODIGO_RASTREIO}
Acompanhe seu pacote aqui: https://rastreamento.correios.com.br/app/index.php?codigo={CODIGO_RASTREIO}
```

### 3. Recuperação de Carrinho Abandonado (após 30 minutos):
```
Olá, {NOME}! Vimos que você separou algumas peças exclusivas na Leidy Boutique mas não concluiu.
Gostaria que guardássemos o seu tamanho no provador por mais algumas horas?
Acesse sua sacola aqui: https://leidyboutique.com.br/checkout
```

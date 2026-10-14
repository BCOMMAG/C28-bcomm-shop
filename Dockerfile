# ==============================================================================
# PLATAFORMA SAAS WHITE-LABEL - DOCKERFILE MULTI-STAGE DE PRODUÇÃO (FASE 2)
# Otimizado para Contabo VPS + Coolify
# ==============================================================================

# Estágio 1: Dependências
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Estágio 2: Construtor (Builder)
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Habilita compilação standalone do Next.js
ENV DOCKER_BUILD=true
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build

# Estágio 3: Executor de Produção (Runner Leve)
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copia arquivos estáticos públicos e saída standalone
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]

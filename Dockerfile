# =============================================
# ClasesYa - Dockerfile para Next.js
# Multi-stage build para optimizar el tamaño de la imagen
# =============================================

# --- Etapa 1: Instalar dependencias ---
FROM node:20-alpine AS deps
WORKDIR /app

# Copiar archivos de dependencias
COPY package.json package-lock.json ./
RUN npm ci --only=production

# --- Etapa 2: Build de la aplicación ---
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Copiar el resto del código fuente
COPY . .

# Generar el cliente de Prisma
RUN npx prisma generate

# Build de Next.js
RUN npm run build

# --- Etapa 3: Imagen de producción ---
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# OpenSSL necesario para Prisma en Alpine
RUN apk add --no-cache openssl

# Crear usuario no-root por seguridad
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar archivos necesarios del build
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma

# Copiar script de inicio
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x entrypoint.sh

# Dar permisos al usuario nextjs sobre Prisma
RUN chown -R nextjs:nodejs ./node_modules/@prisma ./node_modules/.prisma ./node_modules/prisma ./prisma

# Cambiar al usuario no-root
USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["./entrypoint.sh"]

# =============================================
# ClasesYa - Dockerfile para Next.js
# Multi-stage build para optimizar el tamaño de la imagen
# =============================================

# --- Etapa 1: Build de la aplicación ---
# Se instalan todas las dependencias (incluidas las de desarrollo) porque el
# build de Next.js necesita TypeScript y Tailwind. La imagen final solo se queda
# con la salida standalone, así que nada de esto llega a producción.
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

# --- Etapa 2: Imagen de producción ---
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# OpenSSL necesario para Prisma en Alpine.
# tzdata es imprescindible: sin la base de zonas horarias, la variable TZ se
# ignora en silencio y el contenedor corre en UTC. Para un producto boliviano
# eso desplaza cuatro horas todo lo que dependa del reloj: fechas límite de
# tareas, caducidad de reservas y el fin de vigencia de los cursos.
RUN apk add --no-cache openssl tzdata

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

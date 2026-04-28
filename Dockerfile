# syntax=docker/dockerfile:1
# ============================================================
# Dockerfile para proyecto Next.js + Tailwind + Node.js
# Imagen base: node:20-alpine (oficial, ligera y segura)
# Estrategia: Multi-stage build (deps → builder → runner)
# ============================================================

# ============================================================
# STAGE 1: deps — Instalar dependencias npm
# ============================================================
FROM node:20-alpine AS deps

# Metadatos de la imagen (buena práctica según documentación oficial)
LABEL org.opencontainers.image.title="hestia-docker"
LABEL org.opencontainers.image.description="Aplicación web Next.js con Tailwind CSS"
LABEL org.opencontainers.image.authors="raul2529"
LABEL org.opencontainers.image.version="1.0"

# libc6-compat es necesario para algunos paquetes nativos de Node en Alpine
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copiamos SOLO los archivos de dependencias primero.
# Esto aprovecha la caché de Docker: si package.json no cambia,
# Docker reutiliza esta capa sin reinstalar nada.
COPY package.json package-lock.json* ./

# npm ci instala exactamente lo que está en package-lock.json (reproducible)
# --mount=type=cache acelera builds posteriores cacheando la carpeta npm
RUN --mount=type=cache,target=/root/.npm \
    npm ci

# ============================================================
# STAGE 2: builder — Compilar la aplicación Next.js
# ============================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Traemos las dependencias ya instaladas del stage anterior
COPY --from=deps /app/node_modules ./node_modules

# Copiamos el código fuente completo
COPY . .

# ARG: variable solo disponible en tiempo de build (no persiste en la imagen final)
# Permite pasar la versión desde el comando docker build si se quiere
ARG BUILD_VERSION=1.0.0

# ENV: variables de entorno que sí persisten en la imagen
# NEXT_TELEMETRY_DISABLED evita que Next.js envíe datos de uso a Vercel
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Compilamos Next.js (genera la carpeta .next/standalone gracias a output:'standalone')
RUN npm run build

# ============================================================
# STAGE 3: runner — Imagen final de producción (la más ligera)
# ============================================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Creamos un usuario y grupo sin privilegios (no-root) por seguridad.
# Nunca ejecutar aplicaciones en producción como root.
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Carpeta de archivos estáticos públicos
COPY --from=builder /app/public ./public

# Copiamos el build optimizado de Next.js asignando permisos al usuario nextjs
# --chown asigna propietario sin necesidad de un RUN chown adicional
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Cambiamos al usuario no-root para el resto de instrucciones y en runtime
USER nextjs

# EXPOSE documenta el puerto que usa la app (no lo publica, eso lo hace docker run -p)
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# HEALTHCHECK: Docker comprueba cada 30s que la app responde correctamente.
# Si falla 3 veces seguidas, el contenedor se marca como "unhealthy".
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD wget -qO- http://localhost:3000/ || exit 1

# CMD en formato exec (recomendado): arranca Next.js en modo standalone
CMD ["node", "server.js"]
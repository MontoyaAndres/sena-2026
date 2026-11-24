# ---------- Etapa 1: instalar dependencias ----------
# Imagen completa: trae python, make y g++ por si better-sqlite3 necesita compilarse
FROM node:24 AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ---------- Etapa 2: imagen final, más liviana ----------
FROM node:24-slim
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000 \
    DB_PATH=/app/data/library.sqlite \
    UPLOADS_DIR=/app/uploads

COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src
COPY public ./public

# Carpetas para la base de datos y las imágenes (se montan como volúmenes)
RUN mkdir -p /app/data /app/uploads && chown -R node:node /app/data /app/uploads
USER node

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD node -e "fetch('http://localhost:3000/api').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "src/server.js"]

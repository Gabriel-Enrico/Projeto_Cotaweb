FROM node:22-alpine AS base
WORKDIR /app

# Instala dependências do monorepo (root + backend)
COPY package.json package-lock.json* ./
COPY apps/backend/package.json ./apps/backend/package.json
# Cria pasta frontend para o npm workspaces não reclamar
RUN mkdir -p apps/frontend && echo '{"name":"@cotaweb/frontend","version":"0.0.0"}' > apps/frontend/package.json

RUN npm install --workspace=apps/backend --ignore-scripts

# Copia código-fonte do backend
COPY apps/backend ./apps/backend

# Build TypeScript
RUN npm run build --workspace=apps/backend

FROM node:22-alpine AS runner
WORKDIR /app

COPY package.json ./
COPY apps/backend/package.json ./apps/backend/package.json
RUN mkdir -p apps/frontend && echo '{"name":"@cotaweb/frontend","version":"0.0.0"}' > apps/frontend/package.json
RUN npm install --workspace=apps/backend --omit=dev --ignore-scripts

COPY --from=base /app/apps/backend/dist ./apps/backend/dist

WORKDIR /app/apps/backend
EXPOSE 3000

CMD ["node", "dist/server.js"]
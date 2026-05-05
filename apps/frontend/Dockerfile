FROM node:22-alpine AS builder
WORKDIR /app

# Instala dependências do monorepo (root + frontend)
COPY package.json package-lock.json* ./
COPY apps/frontend/package.json ./apps/frontend/package.json
# Cria pasta backend para o npm workspaces não reclamar
RUN mkdir -p apps/backend && echo '{"name":"cotaweb","version":"1.0.0"}' > apps/backend/package.json

RUN npm install --workspace=apps/frontend --ignore-scripts

COPY apps/frontend ./apps/frontend

# Build de produção (Vite)
RUN npm run build --workspace=apps/frontend

FROM nginx:alpine AS runner
COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
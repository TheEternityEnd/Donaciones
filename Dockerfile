# ==========================================
# ETAPA 1: Base común de Node.js
# ==========================================
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# ==========================================
# ETAPA 2: Compilación del Frontend (Donaciones)
# ==========================================
FROM base AS build-frontend
RUN npm run build

# ==========================================
# ETAPA 3: Servidor de producción para el Frontend
# ==========================================
FROM nginx:alpine AS frontend
COPY --from=build-frontend /app/dist /usr/share/nginx/html
# 🌟 LINEA CRÍTICA: Configura Nginx para que soporte React Router sin romper las rutas internas al recargar
RUN echo 'server { listen 80; location / { root /usr/share/nginx/html; index index.html; try_files $uri $uri/ /index.html; } }' > /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

# ==========================================
# ETAPA 4: Entorno de ejecución para el Backend
# ==========================================
FROM base AS backend
EXPOSE 5000
# 🌟 IMPORTANTE: Usamos la 'S' mayúscula de tu carpeta Server
CMD ["node", "Server/index.cjs"]
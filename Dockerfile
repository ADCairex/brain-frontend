# Stage 1 — Build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# VITE_API_URL se hornea en el bundle en tiempo de build
ARG VITE_API_URL=http://localhost:8000
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# Stage 2 — Serve
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

# Configuración para que React Router funcione correctamente
# Sin esto, al recargar una ruta como /home da 404
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

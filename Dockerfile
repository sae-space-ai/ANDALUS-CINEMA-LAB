FROM node:20-alpine

# Instalar dependencias de compilación para better-sqlite3
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar código fuente
COPY . .

# Construir frontend
RUN npm run build

# Crear directorio de datos
RUN mkdir -p data/pdfs data/videos

# Exponer puerto
EXPOSE 3000

# Variable de entorno para producción
ENV NODE_ENV=production

# Comando de inicio
CMD ["npx", "tsx", "server/index.ts"]

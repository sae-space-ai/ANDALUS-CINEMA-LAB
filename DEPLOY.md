# ANDALUS CINEMA LAB — Despliegue completo

## Requisitos

- Node.js 18+
- npm 9+
- GEMINI_API_KEY (para funciones de IA)

## Instalación

```bash
# 1. Clonar repositorio
git clone <repo-url>
cd andalus-cinema-lab

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env y añadir GEMINI_API_KEY

# 4. Construir frontend
npm run build

# 5. Arrancar servidor
npx tsx server/index.ts
```

## Uso

Abrir navegador en `http://localhost:3000`

### Modo standalone (sin backend)

Si solo quieres probar la interfaz y lectura de PDF:

```bash
npm run build
# Abrir dist/index.html directamente en el navegador
```

**Limitaciones del modo standalone:**
- ✅ Subir y leer PDF
- ✅ Ver texto extraído
- ✅ Seleccionar fragmentos
- ❌ Adaptación con IA (requiere backend + GEMINI_API_KEY)
- ❌ Generación de vídeo (requiere backend + Veo)

### Modo completo (con backend)

```bash
# Terminal 1: Backend
npx tsx server/index.ts

# Terminal 2: Frontend (desarrollo)
npm run dev
```

O en producción:

```bash
npm run build
npx tsx server/index.ts
# Servidor sirve frontend desde dist/ en puerto 3000
```

## Estructura de datos

```
data/
├── andalus_cinema.db    # SQLite (proyectos, sesiones)
├── pdfs/                # PDFs subidos (privados)
└── videos/              # MP4s generados (privados)
```

## Seguridad

- API key SOLO en variable de entorno del servidor
- Frontend NO contiene ni envía la API key
- Sesiones con cookies HttpOnly
- Contraseña con bcrypt
- PDFs y vídeos en directorio privado

## Despliegue en producción

### Opción 1: Servidor Node directo

```bash
npm run build
NODE_ENV=production npx tsx server/index.ts
```

### Opción 2: Docker

```dockerfile
FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npx", "tsx", "server/index.ts"]
```

```bash
docker build -t andalus-cinema-lab .
docker run -p 3000:3000 --env-file .env -v ./data:/app/data andalus-cinema-lab
```

### Opción 3: Railway / Render / Fly.io

1. Subir código a repositorio privado
2. Configurar variables de entorno en el panel
3. Deploy automático desde Git

## Troubleshooting

### Error: "GEMINI_API_KEY no configurada"
- Verificar que .env existe y contiene GEMINI_API_KEY
- Reiniciar el servidor después de cambiar .env

### Error: "better-sqlite3" no compila
- Instalar build tools: `sudo apt install build-essential python3`
- O usar Node.js 18+ con npm 9+

### El frontend no conecta con el backend
- Verificar que el backend está corriendo en puerto 3000
- Verificar APP_ORIGIN en .env coincide con la URL del frontend

## Pruebas

```bash
# Pruebas de integración (sin APIs externas)
npx tsx tests/integration.test.ts

# Prueba de lector PDF
npx tsx tests/pdf.test.ts
```

## Soporte

Para problemas específicos, consultar:
- README.md (arquitectura y seguridad)
- QWEN.md (estado actual y próximos pasos)
- .env.example (variables de entorno)

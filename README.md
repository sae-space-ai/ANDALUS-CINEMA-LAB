# ANDALUS CINEMA LAB

**AL-ANDALUS AI — Laboratorio cinematográfico privado**

Convierte fragmentos de tu PDF en vídeo cinematográfico real con IA.

## Inicio rápido

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar
cp .env.example .env
# Editar .env y añadir GEMINI_API_KEY

# 3. Arrancar
./start.sh
```

Abrir: `http://localhost:3000`

## Flujo

1. **Acceso privado** → Contraseña (se establece en primer acceso)
2. **Subir PDF** → Lectura real con extracción de texto
3. **Seleccionar fragmento** → Por capítulos, páginas o texto
4. **Adaptar con Gemini** → Genera descripción cinematográfica
5. **Aprobar escena** → Edición y confirmación humana
6. **Generar vídeo** → Veo crea MP4 real (~8 segundos)
7. **Descargar** → Reproduce y descarga el vídeo

## Seguridad

- ✅ API key SOLO en servidor (variable de entorno)
- ✅ Frontend NO contiene ni envía la API key
- ✅ Sesiones HttpOnly con bcrypt
- ✅ PDFs y vídeos en directorio privado

## Despliegue

Ver [DEPLOY-SERVICES.md](DEPLOY-SERVICES.md) para instrucciones de:
- Railway (recomendado)
- Render
- Fly.io
- VPS propio

## Variables de entorno

| Variable | Obligatoria | Descripción |
|----------|-------------|-------------|
| `GEMINI_API_KEY` | ✅ | Clave de Google AI |
| `SESSION_SECRET` | ✅ | Secreto para sesiones |
| `PORT` | No | Puerto (default: 3000) |
| `DATA_DIR` | No | Directorio de datos (default: ./data) |

## Estructura

```
server/          # Backend Fastify
src/             # Frontend React
data/            # Persistencia (privado)
├── *.db         # SQLite
├── pdfs/        # PDFs subidos
└── videos/      # MP4s generados
```

## Verificación

```bash
./verify.sh
```

## Repositorio

Ver [GITHUB.md](GITHUB.md) para crear repositorio privado.

## Documentación

- [DEPLOY.md](DEPLOY.md) — Despliegue completo
- [DEPLOY-SERVICES.md](DEPLOY-SERVICES.md) — Servicios específicos
- [QWEN.md](QWEN.md) — Estado técnico

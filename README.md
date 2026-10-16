# ANDALUS CINEMA LAB
### AL-ANDALUS AI — Laboratorio cinematográfico privado

## Arquitectura

```
┌─────────────────┐         ┌─────────────────────────────┐
│   FRONTEND      │  HTTP   │      BACKEND (Fastify)      │
│   React + Vite  │ ◄─────► │                             │
│   (dist/)       │  +Auth  │  ┌─────────┐ ┌──────────┐  │
│                 │         │  │ SQLite  │ │ Archivos │  │
│  SIN API Key    │         │  │ (datos) │ │ (PDF/MP4)│  │
│  SIN llamadas   │         │  └─────────┘ └──────────┘  │
│  directas a IA  │         │                             │
└─────────────────┘         │  ┌─────────┐ ┌──────────┐  │
                            │  │ Gemini  │ │   Veo    │  │
                            │  │  (API)  │ │  (API)   │  │
                            │  └─────────┘ └──────────┘  │
                            │                             │
                            │  GEMINI_API_KEY (env only)  │
                            └─────────────────────────────┘
```

## Seguridad

- ✅ API key SOLO en variable de entorno del servidor
- ✅ Frontend NO contiene ni envía la API key
- ✅ Sesiones con cookies HttpOnly + SameSite=strict
- ✅ Contraseña con bcrypt (hash, nunca texto plano)
- ✅ PDFs y vídeos en directorio privado (DATA_DIR)
- ✅ Protección contra path traversal
- ✅ CORS configurado para origen específico
- ✅ Logs sin datos sensibles (redactados)

## Cómo arrancar

### 1. Configurar variables de entorno

```bash
cp .env.example .env
# Editar .env y añadir GEMINI_API_KEY
```

### 2. Construir frontend

```bash
npm run build
```

### 3. Arrancar servidor

```bash
npx tsx server/index.ts
```

El servidor arranca en `http://localhost:3000` y sirve el frontend desde `dist/`.

### Desarrollo

```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend
npx tsx server/index.ts
```

Frontend en `http://localhost:5173`, Backend en `http://localhost:3000`.

## Flujo completo

1. **Acceso privado** → Contraseña (se establece en primer acceso)
2. **Subir PDF** → Se valida, extrae texto y guarda en DATA_DIR/pdfs/
3. **Seleccionar fragmento** → Por capítulos, páginas o texto personalizado
4. **Adaptar con Gemini** → El backend llama a la API y devuelve escena
5. **Aprobar escena** → Edición y confirmación humana
6. **Generar vídeo** → Backend envía prompt a Veo, hace polling, descarga MP4
7. **Reproducir/Descargar** → MP4 real servido desde DATA_DIR/videos/

## Estructura

```
├── server/
│   ├── index.ts        # Servidor Fastify + rutas API
│   ├── db.ts           # SQLite (better-sqlite3)
│   ├── auth.ts         # Sesiones HttpOnly + bcrypt
│   ├── pdf.ts          # Lectura real de PDF (pdfjs-dist)
│   ├── gemini.ts       # Adaptación literaria (Gemini API)
│   ├── veo.ts          # Motor de vídeo (Veo API + polling)
│   └── storage.ts      # Archivos privados (PDFs, MP4s)
├── src/                # Frontend React
│   ├── App.tsx         # Aplicación principal
│   ├── lib/
│   │   ├── api.ts      # Cliente HTTP al backend
│   │   ├── pdfReader.ts # Validación local de PDF
│   │   ├── gemini.ts   # Indicadores de estado (sin API)
│   │   └── videoEngine.ts # Indicadores (sin API)
│   └── components/
├── data/               # Persistencia (creado al arrancar)
│   ├── andalus_cinema.db
│   ├── pdfs/
│   └── videos/
└── dist/               # Frontend compilado
```

## Variables de entorno

| Variable | Obligatoria | Descripción |
|----------|-------------|-------------|
| `GEMINI_API_KEY` | ✅ | Clave de Google AI para Gemini y Veo |
| `SESSION_SECRET` | ✅ | Secreto para firmar cookies |
| `DATA_DIR` | No | Directorio de datos (default: ./data) |
| `PORT` | No | Puerto del servidor (default: 3000) |
| `TEXT_MODEL` | No | Modelo de texto (default: gemini-2.0-flash) |
| `VIDEO_MODEL` | No | Modelo de vídeo (default: veo-2.0-generate-001) |
| `APP_ORIGIN` | No | Origen CORS (default: http://localhost:5173) |
| `MAX_UPLOAD_MB` | No | Tamaño máximo PDF (default: 50) |

## Bloqueos externos

- **Sin GEMINI_API_KEY:** Lectura de PDF funciona. IA bloqueada.
- **Sin acceso a Veo:** Generación de vídeo falla con error específico.
- **Coste:** Cada generación de vídeo cobra del proveedor (~$0.50).

## Privacidad

- Un solo operador (propietario)
- Sin registro público
- Sin datos compartidos
- PDFs y vídeos nunca salen del servidor excepto al propietario

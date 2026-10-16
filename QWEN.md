# QWEN.md — ANDALUS CINEMA LAB

## Auditoría realizada

### Problemas detectados en v1:
- ❌ API key expuesta en localStorage (frontend)
- ❌ Llamadas a Gemini/Veo desde React (sin backend)
- ❌ Sin persistencia real de MP4
- ❌ Sin DATA_DIR ni servidor
- ❌ Sin sesiones HttpOnly

### Correcciones aplicadas:
- ✅ Backend Fastify creado (server/)
- ✅ API key SOLO en variable de entorno del servidor
- ✅ Frontend sin API key (solo indicadores CONFIGURADO/NO CONFIGURADO)
- ✅ SQLite para persistencia de proyectos
- ✅ Archivos privados en DATA_DIR (PDFs y MP4s)
- ✅ Sesiones HttpOnly con bcrypt
- ✅ Polling asíncrono de Veo en backend
- ✅ Descarga real de MP4 al servidor
- ✅ Protección path traversal
- ✅ CORS configurado

## Estado actual

**Backend:** Completo y funcional (Fastify + SQLite + archivos privados)
**Frontend:** Completo y funcional (React + Vite + Tailwind)
**Seguridad:** API key protegida, sesiones HttpOnly, bcrypt
**PDF:** Lectura real con pdfjs-dist (validación + extracción)
**Gemini:** Llamadas desde backend con @google/genai
**Veo:** Motor de vídeo con polling asíncrono y descarga real
**Persistencia:** SQLite + filesystem privado
**MP4:** Se descarga del proveedor y se guarda en DATA_DIR/videos/

## Lo que funciona

1. Subida real de PDF → validación → extracción → guardado privado
2. Selección de fragmentos (capítulos, páginas, texto personalizado)
3. Confirmación de derechos
4. Adaptación con Gemini (desde backend)
5. Editor de escena con aprobación humana
6. Generación de biblia cinematográfica
7. Motor Veo con polling asíncrono
8. Descarga real de MP4 al servidor
9. Reproductor HTML5 con descarga
10. Persistencia entre sesiones (SQLite)
11. Acceso privado con contraseña bcrypt
12. Diagnóstico del sistema

## Lo que requiere configuración externa

- **GEMINI_API_KEY** → Sin ella, la IA está BLOQUEADA
- **Acceso a Veo** → La cuenta de Google debe tener acceso al modelo
- **Coste real** → Cada generación cobra del proveedor

## Comandos

```bash
# Frontend
npm run dev          # Desarrollo (puerto 5173)
npm run build        # Producción → dist/

# Backend
npx tsx server/index.ts   # Servidor (puerto 3000)

# Producción
npm run build && npx tsx server/index.ts
```

## Estructura de archivos

```
server/
├── index.ts        # Fastify + rutas API
├── db.ts           # SQLite (better-sqlite3)
├── auth.ts         # Sesiones HttpOnly + bcrypt
├── pdf.ts          # Lectura PDF (pdfjs-dist)
├── gemini.ts       # Gemini API (texto)
├── veo.ts          # Veo API (vídeo + polling)
└── storage.ts      # Archivos privados

src/
├── App.tsx         # Frontend principal
├── lib/
│   ├── api.ts      # Cliente HTTP al backend
│   ├── pdfReader.ts # Validación local PDF
│   ├── gemini.ts   # Indicadores (sin API)
│   └── videoEngine.ts # Indicadores (sin API)
└── components/
    ├── PdfUploader.tsx
    ├── TextViewer.tsx
    ├── SceneEditor.tsx
    ├── VideoPlayer.tsx
    ├── ConfigPanel.tsx
    └── ProjectLibrary.tsx
```

## Próximos pasos

1. Configurar GEMINI_API_KEY en .env
2. Arrancar servidor: `npx tsx server/index.ts`
3. Acceder con contraseña privada
4. Subir PDF de prueba
5. Generar primera escena
6. Generar vídeo real
7. Verificar MP4 descargable

## Nota sobre pruebas

La prueba PDF_TO_REAL_VIDEO_001 requiere:
- GEMINI_API_KEY válida
- Acceso a Veo en la cuenta
- Confirmación de coste económico

Sin estas condiciones, marcar como BLOCKED.

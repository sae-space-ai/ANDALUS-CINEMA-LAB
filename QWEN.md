# QWEN.md — ANDALUS CINEMA LAB

## Estado actual

Aplicación frontend funcional construida con React + Vite + TypeScript + Tailwind CSS.

## Lo que está COMPLETO y FUNCIONAL

1. **Interfaz completa** — Pantalla de acceso, home, proyecto, todos los pasos del flujo
2. **Lectura real de PDF** — pdfjs-dist extrae texto auténtico página por página
3. **Selección de fragmentos** — Por capítulos, páginas individuales o texto personalizado
4. **Confirmación de derechos** — Modal obligatorio antes de procesar
5. **Integración Gemini** — Adaptación literaria con modelo configurable
6. **Editor de escena** — Todos los campos editables, diferenciación texto/adaptación
7. **Biblia cinematográfica** — Generación automática de personajes, escenarios, estilo
8. **Motor de vídeo Veo** — Integración real con polling asíncrono
9. **Reproductor HTML5** — Con controles personalizados
10. **Descarga MP4** — Botón funcional de descarga
11. **Persistencia** — Proyectos guardados en localStorage
12. **Acceso privado** — Contraseña con hash local
13. **Diagnóstico** — Panel de estado de todos los componentes
14. **Control de costes** — Estimación visible antes de generar

## Lo que requiere configuración externa

- **Gemini API Key** → Sin ella, la IA está BLOQUEADA (PDF sí funciona)
- **Acceso a Veo** → La cuenta de Google debe tener acceso al modelo de vídeo
- **Coste real** → Cada generación de vídeo cobra del proveedor

## Próximos pasos para backend completo

Cuando se despliegue como servicio Node:

1. Migrar localStorage a SQLite
2. Mover API calls al backend (proteger key)
3. Añadir FFmpeg para montaje de secuencias
4. Implementar almacenamiento persistente de vídeos
5. Añadir autenticación con cookie HttpOnly
6. Implementar reintentos y recuperación de operaciones

## Estructura de archivos

```
src/
├── App.tsx              # Aplicación principal con todo el flujo
├── main.tsx             # Entry point
├── index.css            # Estilos Tailwind + custom
├── types/
│   └── index.ts         # Tipos TypeScript
├── lib/
│   ├── pdfReader.ts     # Lectura real de PDF (pdfjs-dist)
│   ├── gemini.ts        # Integración Gemini API (texto)
│   ├── videoEngine.ts   # Motor de vídeo Veo (polling + descarga)
│   └── storage.ts       # Persistencia localStorage
└── components/
    ├── PdfUploader.tsx   # Subida con drag & drop
    ├── TextViewer.tsx    # Visor y selector de fragmentos
    ├── SceneEditor.tsx   # Editor de adaptación
    ├── VideoPlayer.tsx   # Reproductor con descarga
    ├── ConfigPanel.tsx   # Configuración + diagnóstico
    └── ProjectLibrary.tsx # Biblioteca de proyectos
```

## Comandos

```bash
npm run dev       # Desarrollo
npm run build     # Producción → dist/
npm run typecheck # Verificación de tipos
```

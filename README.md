# ANDALUS CINEMA LAB
### AL-ANDALUS AI — Laboratorio cinematográfico privado

## Qué es

Herramienta privada que convierte fragmentos de un PDF (obra propia) en vídeo cinematográfico real mediante IA.

**Flujo:** PDF → Texto → Escena → Vídeo → MP4

## Cómo arrancar

```bash
npm install
npm run dev
```

Abre `http://localhost:5173`

## Cómo construir para producción

```bash
npm run build
```

El resultado queda en `dist/`.

## Qué funciona realmente

- ✅ Subida real de PDF con validación
- ✅ Extracción auténtica de texto (pdfjs-dist)
- ✅ Detección de PDFs escaneados (NEEDS_OCR)
- ✅ Selección de capítulos, páginas o fragmentos personalizados
- ✅ Confirmación de derechos antes de procesar
- ✅ Integración con Gemini API para adaptación literaria
- ✅ Generación de biblia cinematográfica
- ✅ Editor de escena con campos editables
- ✅ Motor de vídeo con Google Veo (requiere API key)
- ✅ Polling asíncrono de estado de generación
- ✅ Descarga real de MP4
- ✅ Reproductor HTML5 integrado
- ✅ Persistencia de proyectos en localStorage
- ✅ Acceso privado con contraseña
- ✅ Panel de diagnóstico del sistema
- ✅ Estimación de costes

## Cómo activar Gemini/Veo

1. Accede a la aplicación con tu contraseña privada
2. Haz clic en el icono de ⚙️ (Configuración)
3. Introduce tu `GEMINI_API_KEY` de Google AI Studio
4. Selecciona modelo de texto y vídeo
5. Guarda

La API key se almacena SOLO en tu navegador (localStorage).

## Dónde se configura la clave

En el panel de Configuración (icono ⚙️). También puedes establecerla directamente:

```javascript
localStorage.setItem('andalus_gemini_api_key', 'TU_KEY_AQUI');
```

## Cómo generar la primera escena

1. Sube un PDF de tu obra
2. Confirma que tienes derechos
3. Selecciona un capítulo, páginas o fragmento
4. Elige estilo cinematográfico
5. Pulsa "Generar adaptación con IA"
6. Revisa y edita la escena si es necesario
7. Aprueba la escena
8. Pulsa "Generar vídeo real"
9. Espera a que Veo procese (puede tardar minutos)
10. Reproduce y descarga el MP4

## Dónde se encuentra el MP4

El vídeo se descarga del proveedor de IA y se reproduce directamente en la interfaz. El botón "Descargar MP4" guarda el archivo en tu equipo.

## Bloqueos externos

- **Sin API Key:** La lectura de PDF funciona, pero la adaptación con IA y la generación de vídeo están BLOQUEADAS.
- **Sin acceso a Veo:** Si tu cuenta de Google AI no tiene acceso a Veo, la generación de vídeo fallará con error específico.
- **Coste:** La generación de vídeo con Veo tiene coste real por generación. Se muestra estimación antes de confirmar.

## Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS v4
- pdfjs-dist (lectura real de PDF)
- Google Gemini API (texto + vídeo)
- localStorage (persistencia privada)

## Seguridad

- Acceso protegido por contraseña (primer acceso la establece)
- La API key NUNCA se envía al frontend como código
- Los PDFs no se envían completos a APIs externas
- Solo el fragmento seleccionado se procesa
- Confirmación explícita de derechos requerida

## Privado

Esta herramienta es para un solo operador. No tiene registro público, red social, ni pagos.

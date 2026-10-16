# ANDALUS CINEMA LAB — Instrucciones de arranque

## PROBLEMA DETECTADO

La aplicación está funcionando en modo standalone (localStorage) porque el backend Fastify no está ejecutándose.

## SOLUCIÓN

### Paso 1: Arrancar el backend

```bash
# Construir el frontend
npm run build

# Arrancar el servidor
npm start
```

O usar el script:

```bash
./start.sh
```

### Paso 2: Abrir la aplicación

Una vez que el servidor esté corriendo, abrir el navegador en:

```
http://localhost:3000
```

### Paso 3: Configurar contraseña

La primera vez que accedas, la contraseña que introduzcas se guardará como tu acceso privado.

## VERIFICACIÓN

Cuando el backend esté corriendo, el diagnóstico mostrará:

- ✅ **Database**: VERIFIED (SQLite funcionando)
- ✅ **Storage**: VERIFIED (almacenamiento privado)
- ✅ **PDF**: VERIFIED (lectura real de PDF)
- ⚠️ **Gemini**: NOT_CONFIGURED (requiere GEMINI_API_KEY)
- ⚠️ **Veo**: NOT_CONFIGURED (requiere GEMINI_API_KEY)

## QUÉ FUNCIONA SIN GEMINI_API_KEY

- ✅ Acceso privado con contraseña
- ✅ Subida de PDF
- ✅ Extracción real de texto
- ✅ Selección de fragmentos
- ✅ Persistencia en SQLite
- ✅ Biblioteca de proyectos

## QUÉ REQUIERE GEMINI_API_KEY

- ❌ Adaptación con IA (Gemini)
- ❌ Generación de biblia cinematográfica
- ❌ Generación de vídeo (Veo)

Para activar estas funciones:

```bash
# Editar .env
nano .env

# Añadir:
GEMINI_API_KEY=AIza...

# Reiniciar servidor
npm start
```

## ESTRUCTURA DE DATOS

```
data/
├── andalus_cinema.db    # SQLite (proyectos, sesiones)
├── pdfs/                # PDFs subidos
└── videos/              # MP4s generados
```

## PUERTOS

- Backend: `http://localhost:3000`
- Frontend servido desde el backend en el mismo puerto

## ERRORES COMUNES

### "Servidor no disponible"
- El backend no está corriendo
- Ejecutar: `npm start`

### "better-sqlite3" no compila
- Instalar dependencias de compilación:
  ```bash
  # Ubuntu/Debian
  sudo apt install build-essential python3
  
  # macOS
  xcode-select --install
  ```

### Puerto 3000 en uso
- Cambiar puerto en `.env`:
  ```
  PORT=3001
  ```

## FLUJO COMPLETO

1. Arrancar servidor: `npm start`
2. Abrir navegador: `http://localhost:3000`
3. Introducir contraseña (primera vez)
4. Subir PDF
5. Seleccionar fragmento
6. (Con GEMINI_API_KEY) Generar adaptación
7. (Con GEMINI_API_KEY) Generar vídeo
8. Descargar MP4

---

**El frontend ya está compilado y listo. Solo falta arrancar el backend con `npm start`.**

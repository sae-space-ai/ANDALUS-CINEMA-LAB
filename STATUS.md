# ANDALUS CINEMA LAB — Estado de preparación

## ✅ LISTO PARA DESPLEGAR

### Código completo
- ✅ Frontend React + Vite + TypeScript
- ✅ Backend Fastify + SQLite
- ✅ Autenticación privada (bcrypt + sesiones HttpOnly)
- ✅ Lectura real de PDF (pdfjs-dist)
- ✅ Integración Gemini (texto)
- ✅ Integración Veo (vídeo)
- ✅ Almacenamiento privado (PDFs, MP4s)
- ✅ Build funcional (npm run build)

### Archivos de despliegue
- ✅ start.sh (inicio automático)
- ✅ verify.sh (verificación pre-despliegue)
- ✅ Dockerfile (contenedor)
- ✅ fly.toml (Fly.io)
- ✅ railway.json (Railway)
- ✅ Procfile (Render/Heroku)
- ✅ .env.example (plantilla)
- ✅ .env.production.example (producción)

### Documentación
- ✅ README.md (inicio rápido)
- ✅ DEPLOY.md (despliegue completo)
- ✅ DEPLOY-SERVICES.md (servicios específicos)
- ✅ GITHUB.md (crear repositorio privado)
- ✅ QWEN.md (estado técnico)

### Seguridad
- ✅ API key SOLO en servidor
- ✅ Frontend sin secrets
- ✅ .gitignore configurado
- ✅ Cookies HttpOnly
- ✅ Bcrypt para contraseñas
- ✅ Protección path traversal

## ⚠️ REQUIERE CONFIGURACIÓN EXTERNA

### Variables de entorno obligatorias
1. **GEMINI_API_KEY** — Obtener en https://aistudio.google.com/apikey
2. **SESSION_SECRET** — String aleatorio de 32+ caracteres

### Almacenamiento persistente
- Configurar volumen para `./data` o `/app/data`
- Contiene: SQLite, PDFs subidos, MP4s generados

## 🚀 PASOS PARA DESPLEGAR

### Opción A: Railway (más fácil)
1. Crear cuenta en https://railway.app
2. New Project → Deploy from GitHub
3. Conectar repositorio `andalus-cinema-lab`
4. Añadir variables: GEMINI_API_KEY, SESSION_SECRET
5. Añadir volumen persistente: `/app/data`
6. Deploy automático
7. URL: `https://andalus-cinema-lab.up.railway.app`

### Opción B: Render
1. Crear cuenta en https://render.com
2. New → Web Service
3. Conectar repositorio
4. Build: `npm run build`
5. Start: `npx tsx server/index.ts`
6. Añadir variables y disco persistente
7. URL: `https://andalus-cinema-lab.onrender.com`

### Opción C: VPS propio
1. Instalar Node.js 20
2. Clonar repositorio
3. Configurar .env
4. npm install && npm run build
5. Usar PM2 + Nginx + Certbot
6. URL: `https://tu-dominio.com`

Ver [DEPLOY-SERVICES.md](DEPLOY-SERVICES.md) para instrucciones detalladas.

## 📋 VERIFICACIÓN LOCAL

```bash
# Verificar que todo está listo
./verify.sh

# Arrancar localmente
./start.sh

# Abrir: http://localhost:3000
```

## 🔐 REPOSITORIO GITHUB

**NO CREADO AÚN**

Para crear repositorio privado:
1. Ver [GITHUB.md](GITHUB.md)
2. Crear repo privado en GitHub
3. Conectar con: `git remote add origin <url>`
4. Push: `git push -u origin main`

## 🎯 PRÓXIMA ACCIÓN

**ÚNICA ACCIÓN REQUERIDA:**

1. Crear repositorio GitHub privado (ver GITHUB.md)
2. Desplegar en Railway/Render/VPS (ver DEPLOY-SERVICES.md)
3. Configurar GEMINI_API_KEY en el servicio
4. Abrir URL pública y acceder con contraseña

## 📊 ESTADO ACTUAL

- ✅ Código: 100% completo
- ✅ Build: Funcional
- ✅ Backend: Listo para arrancar
- ⚠️ Despliegue: Requiere servicio externo
- ⚠️ API Key: Requiere configuración
- ❌ Repositorio: No creado
- ❌ URL pública: No existe aún

## 🎬 FLUJO COMPLETO (cuando esté desplegado)

1. Abrir URL pública
2. Acceder con contraseña privada
3. Subir PDF de tu obra
4. Seleccionar fragmento
5. Generar adaptación con Gemini
6. Aprobar escena
7. Generar vídeo con Veo
8. Descargar MP4 real

---

**La herramienta está construida y lista. Solo falta desplegarla en un servicio Node con las variables de entorno configuradas.**

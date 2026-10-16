# Despliegue rápido en servicios Node

## Opción 1: Railway (Recomendado)

1. Ir a https://railway.app
2. New Project → Deploy from GitHub repo
3. Seleccionar repositorio `andalus-cinema-lab`
4. En Variables, añadir:
   - `GEMINI_API_KEY` = tu clave
   - `SESSION_SECRET` = string aleatorio (32+ caracteres)
5. Deploy automático
6. Obtener URL pública: `https://andalus-cinema-lab.up.railway.app`

**Ventajas:** HTTPS automático, almacenamiento persistente, fácil.
**Almacenamiento:** Añadir volumen persistente en Settings → Storage → Mount path: `/app/data`

---

## Opción 2: Render

1. Ir a https://render.com
2. New → Web Service
3. Conectar repositorio GitHub
4. Configurar:
   - Build Command: `npm run build`
   - Start Command: `npx tsx server/index.ts`
   - Runtime: Node
5. En Environment, añadir variables:
   - `GEMINI_API_KEY`
   - `SESSION_SECRET`
6. Deploy
7. Obtener URL: `https://andalus-cinema-lab.onrender.com`

**Almacenamiento:** Añadir Disk en Settings → Disks → Mount path: `/app/data`

---

## Opción 3: Fly.io

```bash
# Instalar flyctl
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Inicializar app
fly launch --name andalus-cinema-lab

# Configurar secretos
fly secrets set GEMINI_API_KEY=tu-clave
fly secrets set SESSION_SECRET=string-aleatorio

# Crear volumen persistente
fly volumes create andalus_data --size 1 --region mad

# Deploy
fly deploy
```

URL: `https://andalus-cinema-lab.fly.dev`

---

## Opción 4: VPS propio (Ubuntu/Debian)

```bash
# Instalar Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clonar repositorio
git clone <repo-url>
cd andalus-cinema-lab

# Instalar dependencias
npm install

# Configurar
cp .env.example .env
nano .env  # Añadir GEMINI_API_KEY y SESSION_SECRET

# Construir
npm run build

# Instalar PM2 para proceso persistente
sudo npm install -g pm2

# Arrancar con PM2
pm2 start "npx tsx server/index.ts" --name andalus-cinema-lab
pm2 save
pm2 startup

# Configurar Nginx como reverse proxy con HTTPS (certbot)
sudo apt install nginx certbot python3-certbot-nginx

# Configurar Nginx (ejemplo en /etc/nginx/sites-available/andalus)
# Luego: sudo certbot --nginx -d tu-dominio.com
```

---

## Variables obligatorias en todos los servicios

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `GEMINI_API_KEY` | Clave de Google AI para Gemini/Veo | `AIza...` |
| `SESSION_SECRET` | Secreto para cookies de sesión | `random-string-32-chars` |

## Almacenamiento persistente

**CRÍTICO:** Configurar volumen persistente para `/app/data` o `./data`

Este directorio contiene:
- `andalus_cinema.db` (SQLite — proyectos, sesiones)
- `pdfs/` (PDFs subidos)
- `videos/` (MP4s generados)

Sin volumen persistente, los datos se pierden al reiniciar.

## Verificación post-despliegue

```bash
# Verificar que el servidor responde
curl https://tu-dominio.com/api/auth/status

# Debe devolver JSON con estado de autenticación
```

Abrir navegador en `https://tu-dominio.com` y acceder con contraseña.

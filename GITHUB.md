# Instrucciones para crear repositorio GitHub privado

## PASO 1: Crear repositorio en GitHub

1. Ir a https://github.com/new
2. Nombre: `andalus-cinema-lab`
3. Descripción: "AL-ANDALUS AI — Laboratorio cinematográfico privado"
4. **Marcar como PRIVADO**
5. NO inicializar con README
6. Crear repositorio

## PASO 2: Conectar repositorio local

```bash
# En el directorio del proyecto
git init
git add .
git commit -m "Initial commit: ANDALUS CINEMA LAB"

# Conectar con GitHub (reemplazar TU-USUARIO)
git remote add origin git@github.com:TU-USUARIO/andalus-cinema-lab.git
git branch -M main
git push -u origin main
```

## PASO 3: Verificar que .gitignore funciona

Archivos que NO deben subirse:
- ✅ node_modules/
- ✅ .env (con secrets)
- ✅ data/ (PDFs, vídeos, SQLite)
- ✅ dist/ (se genera con build)

Archivos que SÍ deben subirse:
- ✅ Código fuente (server/, src/)
- ✅ package.json
- ✅ .env.example (sin secrets)
- ✅ README.md, DEPLOY.md

## PASO 4: Configurar secrets en GitHub (opcional)

Si usas GitHub Actions:
1. Ir a Settings → Secrets and variables → Actions
2. Añadir: GEMINI_API_KEY
3. Añadir: SESSION_SECRET

## VERIFICACIÓN

```bash
# Verificar que no hay secrets en el repositorio
git grep -i "GEMINI_API_KEY" -- ':!.env.example' ':!README.md' ':!DEPLOY.md'

# No debe mostrar nada (excepto en archivos de ejemplo)
```

## NOTAS DE SEGURIDAD

- NUNCA subir .env con valores reales
- NUNCA subir data/ (contiene PDFs y vídeos privados)
- NUNCA subir node_modules/
- SIEMPRE usar .env.example como plantilla

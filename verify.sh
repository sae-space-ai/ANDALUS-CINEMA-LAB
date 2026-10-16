#!/bin/bash

# ANDALUS CINEMA LAB — Verificación pre-despliegue

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║  VERIFICACIÓN PRE-DESPLEGUE                              ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

ERRORS=0

# 1. Verificar Node.js
echo "1. Verificando Node.js..."
if command -v node &> /dev/null; then
    echo "   ✓ Node.js $(node --version)"
else
    echo "   ✗ Node.js no encontrado"
    ERRORS=$((ERRORS + 1))
fi

# 2. Verificar dependencias
echo "2. Verificando dependencias..."
if [ -d "node_modules" ]; then
    echo "   ✓ node_modules existe"
else
    echo "   ✗ node_modules no encontrado (ejecutar: npm install)"
    ERRORS=$((ERRORS + 1))
fi

# 3. Verificar build
echo "3. Verificando build..."
if [ -d "dist" ] && [ -f "dist/index.html" ]; then
    echo "   ✓ dist/ generado"
else
    echo "   ✗ dist/ no encontrado (ejecutar: npm run build)"
    ERRORS=$((ERRORS + 1))
fi

# 4. Verificar servidor
echo "4. Verificando servidor..."
if [ -f "server/index.ts" ]; then
    echo "   ✓ server/index.ts existe"
else
    echo "   ✗ server/index.ts no encontrado"
    ERRORS=$((ERRORS + 1))
fi

# 5. Verificar .env
echo "5. Verificando configuración..."
if [ -f ".env" ]; then
    echo "   ✓ .env existe"
    
    # Verificar GEMINI_API_KEY
    if grep -q "^GEMINI_API_KEY=." .env 2>/dev/null; then
        echo "   ✓ GEMINI_API_KEY configurada"
    else
        echo "   ⚠ GEMINI_API_KEY no configurada (IA deshabilitada)"
    fi
    
    # Verificar SESSION_SECRET
    if grep -q "^SESSION_SECRET=." .env 2>/dev/null; then
        echo "   ✓ SESSION_SECRET configurada"
    else
        echo "   ⚠ SESSION_SECRET no configurada (usando default)"
    fi
else
    echo "   ⚠ .env no encontrado (copiar .env.example)"
fi

# 6. Verificar directorio de datos
echo "6. Verificando almacenamiento..."
if [ -d "data" ]; then
    echo "   ✓ data/ existe"
else
    echo "   ⚠ data/ no existe (se creará al arrancar)"
fi

# 7. Verificar .gitignore
echo "7. Verificando .gitignore..."
if [ -f ".gitignore" ]; then
    echo "   ✓ .gitignore existe"
    
    # Verificar que no se suban secrets
    if grep -q "^\.env$" .gitignore; then
        echo "   ✓ .env en .gitignore"
    else
        echo "   ✗ .env NO está en .gitignore"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo "   ✗ .gitignore no encontrado"
    ERRORS=$((ERRORS + 1))
fi

# 8. Verificar que no hay secrets en el código
echo "8. Verificando seguridad..."
if git grep -q "AIza[a-zA-Z0-9_-]\{20,\}" -- ':!.env*' ':!README.md' ':!DEPLOY.md' 2>/dev/null; then
    echo "   ✗ Posible API key encontrada en el código"
    ERRORS=$((ERRORS + 1))
else
    echo "   ✓ No se encontraron API keys en el código"
fi

echo ""
echo "═══════════════════════════════════════════════════════════"

if [ $ERRORS -eq 0 ]; then
    echo "✅ TODAS LAS VERIFICACIONES PASARON"
    echo ""
    echo "Puedes arrancar la aplicación con:"
    echo "  ./start.sh"
    echo ""
    echo "O manualmente:"
    echo "  npm run build"
    echo "  npx tsx server/index.ts"
else
    echo "❌ SE ENCONTRARON $ERRORS ERROR(S)"
    echo ""
    echo "Corrige los errores antes de desplegar."
fi

echo "═══════════════════════════════════════════════════════════"

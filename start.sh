#!/bin/bash

# ANDALUS CINEMA LAB — Script de inicio
# Construye frontend y arranca servidor completo

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║  AL-ANDALUS AI — ANDALUS CINEMA LAB                      ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no encontrado. Instalar Node.js 18+"
    exit 1
fi

echo "✓ Node.js $(node --version)"

# Verificar dependencias
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias..."
    npm install
fi

# Construir frontend
echo "🔨 Construyendo frontend..."
npm run build

if [ ! -d "dist" ]; then
    echo "❌ Error: dist/ no generado"
    exit 1
fi

echo "✓ Frontend construido"

# Verificar .env
if [ ! -f ".env" ]; then
    echo ""
    echo "⚠️  No se encontró .env"
    echo "   Copiando .env.example..."
    cp .env.example .env
    echo ""
    echo "   IMPORTANTE: Edita .env y configura:"
    echo "   - GEMINI_API_KEY (para funciones de IA)"
    echo "   - SESSION_SECRET (cambiar por string aleatorio)"
    echo ""
fi

# Crear directorio de datos
mkdir -p data/pdfs data/videos

# Arrancar servidor
echo ""
echo "🚀 Arrancando servidor..."
echo ""
npx tsx server/index.ts

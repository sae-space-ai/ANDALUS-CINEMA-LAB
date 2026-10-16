#!/bin/bash
# ANDALUS CINEMA LAB — Script de inicio rápido

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║  AL-ANDALUS AI — ANDALUS CINEMA LAB                      ║"
echo "║  Iniciando aplicación...                                  ║"
echo "╚═══════════════════════════════════════════════════════════╝"

# Verificar que existe .env
if [ ! -f .env ]; then
  echo ""
  echo "⚠️  No se encontró .env"
  echo "   Copiando .env.example..."
  cp .env.example .env
  echo ""
  echo "⚠️  IMPORTANTE: Edita .env y configura GEMINI_API_KEY"
  echo ""
fi

# Verificar que existe dist/
if [ ! -d dist ]; then
  echo "📦 Construyendo frontend..."
  npm run build
fi

# Arrancar servidor
echo ""
echo "🚀 Arrancando servidor..."
echo ""
npx tsx server/index.ts

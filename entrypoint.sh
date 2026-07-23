#!/bin/sh
# =============================================
# ClasesYa - Entrypoint: migraciones + arranque
# =============================================

echo "Sincronizando esquema de base de datos..."
node ./node_modules/prisma/build/index.js db push --schema=./prisma/schema.prisma --accept-data-loss

echo "Iniciando servidor Next.js..."
exec node server.js

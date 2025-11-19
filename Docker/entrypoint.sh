#!/bin/sh
set -euo pipefail

if [ -n "${DATABASE_URL:-}" ]; then
  npx prisma migrate deploy --schema=/app/prisma/schema.prisma
else
  echo "DATABASE_URL unset; skipping Prisma migrations."
fi

exec node app.js

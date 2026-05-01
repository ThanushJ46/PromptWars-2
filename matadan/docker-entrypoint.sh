#!/bin/sh
# docker-entrypoint.sh
# Injects Cloud Run environment variables into the browser at startup.
# Keys are passed via: gcloud run deploy --set-env-vars="GEMINI_KEY=...,MAPS_KEY=..."

cat > /usr/share/nginx/html/js/env.js << EOF
const ENV = {
  GEMINI_KEY: "${GEMINI_KEY:-}",
  MAPS_KEY: "${MAPS_KEY:-}",
  CALENDAR_CLIENT_ID: "${CALENDAR_CLIENT_ID:-}"
};
EOF

echo "✅ env.js written with MAPS_KEY=${MAPS_KEY:0:8}..."
exec nginx -g 'daemon off;'

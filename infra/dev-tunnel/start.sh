#!/bin/sh
set -eu

# Starts the Cloudflare dev tunnel.
# Expects CF_DEV_TUNNEL_ID, CF_DEV_TUNNEL_SECRET, CF_DEV_TUNNEL_ACCOUNT_TAG
# to be set in .dev.vars (sourced below).
#
# Usage:
#   pnpm dev:tunnel

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
GEN_DIR="$SCRIPT_DIR/generated"

# Source .dev.vars if env vars aren't already set
if [ -z "${CF_DEV_TUNNEL_ID:-}" ]; then
  ROOT_DIR="$SCRIPT_DIR/../.."
  if [ -f "$ROOT_DIR/.dev.vars" ]; then
    export $(grep -E '^CF_DEV_TUNNEL_(ID|SECRET|ACCOUNT_TAG)=' "$ROOT_DIR/.dev.vars" | xargs)
  fi
fi

if [ -z "${CF_DEV_TUNNEL_ID:-}" ] || [ -z "${CF_DEV_TUNNEL_SECRET:-}" ] || [ -z "${CF_DEV_TUNNEL_ACCOUNT_TAG:-}" ]; then
  echo "ERROR: CF_DEV_TUNNEL_ID, CF_DEV_TUNNEL_SECRET, CF_DEV_TUNNEL_ACCOUNT_TAG must be set in .dev.vars" >&2
  exit 1
fi

mkdir -p "$GEN_DIR"

cat > "$GEN_DIR/credentials.json" <<EOF
{"AccountTag":"${CF_DEV_TUNNEL_ACCOUNT_TAG}","TunnelSecret":"${CF_DEV_TUNNEL_SECRET}","TunnelID":"${CF_DEV_TUNNEL_ID}"}
EOF

cat > "$GEN_DIR/config.yml" <<EOF
tunnel: ${CF_DEV_TUNNEL_ID}
credentials-file: /etc/cloudflared/credentials.json

ingress:
  - hostname: dev.trademe.sabaiscale.com
    service: http://host.docker.internal:5173
  - service: http_status:404
EOF

exec docker compose -f "$SCRIPT_DIR/docker-compose.yml" up "$@"

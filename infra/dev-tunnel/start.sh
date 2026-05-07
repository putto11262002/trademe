#!/bin/sh
set -eu

# Starts the Cloudflare dev tunnel.
# Expects CF_DEV_TUNNEL_TOKEN to be set in .dev.vars.
#
# Usage:
#   pnpm dev:tunnel

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Source .dev.vars if token isn't already set
if [ -z "${CF_DEV_TUNNEL_TOKEN:-}" ]; then
  ROOT_DIR="$SCRIPT_DIR/../.."
  if [ -f "$ROOT_DIR/.dev.vars" ]; then
    export $(grep '^CF_DEV_TUNNEL_TOKEN=' "$ROOT_DIR/.dev.vars" | xargs)
  fi
fi

if [ -z "${CF_DEV_TUNNEL_TOKEN:-}" ]; then
  echo "ERROR: CF_DEV_TUNNEL_TOKEN must be set in .dev.vars" >&2
  exit 1
fi

export CF_DEV_TUNNEL_TOKEN
exec docker compose -f "$SCRIPT_DIR/docker-compose.yml" up "$@"

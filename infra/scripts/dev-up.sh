#!/bin/zsh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
export PATH="/opt/homebrew/opt/node@22/bin:$PATH"
export COREPACK_HOME="/tmp/corepack"

cd "$ROOT_DIR"

docker compose -f infra/docker/docker-compose.local.yml up -d
pnpm db:generate
pnpm db:push
pnpm db:seed

echo ""
echo "OpenSwarm SaaS local dependencies are ready."
echo "Next:"
echo "  pnpm dev:api"
echo "  pnpm dev:web"
echo "  pnpm dev:worker"

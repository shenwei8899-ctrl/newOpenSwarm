# OpenSwarm SaaS Local Development Bootstrap

## Runtime assumptions

- Node: use `/opt/homebrew/opt/node@22/bin`
- Package manager: pnpm
- Database: PostgreSQL 16
- Queue/cache: Redis 7

## Environment

Copy `.env.example` to `.env` before first run.

Required variables:

- `DATABASE_URL`
- `REDIS_URL`
- `DEERFLOW_GATEWAY_BASE_URL`
- `DEERFLOW_LANGGRAPH_BASE_URL`

## Local infrastructure

The repository includes a local Docker Compose file:

- `infra/docker/docker-compose.local.yml`

It starts:

- PostgreSQL on `localhost:5432`
- Redis on `localhost:6379`

Note:

- Docker is required for this bootstrap flow.
- On the current machine, Docker is not installed, so the active working setup
  uses local Homebrew-managed PostgreSQL and Redis instead of Compose.

## First-time bootstrap

```bash
cd /Users/shenwei/Documents/deerflow/deer-flow/openswarm-saas
bash infra/scripts/dev-up.sh
```

This script:

1. starts PostgreSQL and Redis
2. generates Prisma Client
3. pushes the schema
4. seeds demo data

## Current working local setup

The live local setup that has already been verified is:

- PostgreSQL 16 running on `127.0.0.1:5432`
- Redis running on `127.0.0.1:6379`
- API running on `http://127.0.0.1:3001`
- Web running on `http://127.0.0.1:3000`
- Worker consuming BullMQ jobs
- DeerFlow runtime available through:
  - `DEERFLOW_GATEWAY_BASE_URL`
  - `DEERFLOW_LANGGRAPH_BASE_URL`

If Docker is unavailable, use the Homebrew services path and then run:

```bash
export PATH="/opt/homebrew/opt/node@22/bin:$PATH"
export COREPACK_HOME="/tmp/corepack"
pnpm db:generate
pnpm db:push
pnpm db:seed
```

## Start services

Run these in separate terminals:

```bash
export PATH="/opt/homebrew/opt/node@22/bin:$PATH"
export COREPACK_HOME="/tmp/corepack"
pnpm dev:api
```

```bash
export PATH="/opt/homebrew/opt/node@22/bin:$PATH"
export COREPACK_HOME="/tmp/corepack"
pnpm dev:web
```

```bash
export PATH="/opt/homebrew/opt/node@22/bin:$PATH"
export COREPACK_HOME="/tmp/corepack"
pnpm dev:worker
```

## Current limitations

- the shell default Node version is still 18, so Node 22 must be exported first
- Docker Compose is prepared but not the active path on this machine
- discussion/task UX is wired and should be visually refined from here
- runtime job history and artifact presentation have landed, but the workspace experience can still be improved
- DeerFlow-side `allowed_skills` enforcement is done; keep gateway/runtime processes on the latest code when validating

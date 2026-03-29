# OpenSwarm SaaS

OpenSwarm SaaS is the new product monorepo for the OpenSwarm platform.

This repository is intentionally separated from the legacy Yinova product shell
and the DeerFlow runtime codebase. It owns:

- the SaaS web application
- the business API
- async workers
- shared packages
- DeerFlow integration adapters
- infrastructure and delivery docs

## Workspace layout

```text
apps/
  web/                 Next.js frontend
  api/                 NestJS business API
  worker/              BullMQ workers
packages/
  ui/                  shared UI primitives
  db/                  Prisma schema and database utilities
  shared/              shared types and constants
  deerflow-adapter/    DeerFlow integration boundary
docs/
  prd/                 product requirements
  architecture/        ADRs and architecture docs
  api/                 interface docs
  plans/               delivery and rollout plans
```

## Technical direction

- Frontend: Next.js + React + TypeScript + Tailwind
- API: NestJS + TypeScript
- Worker: Node.js + BullMQ
- Database: PostgreSQL
- Cache/Queue: Redis
- ORM: Prisma
- Runtime: DeerFlow as an external Python service

## Current status

This repository is in bootstrap stage. The current milestone is to establish a
clean monorepo foundation and document the initial V1 SaaS implementation path.

## Local development

Use Node 22 on this machine:

```bash
export PATH="/opt/homebrew/opt/node@22/bin:$PATH"
export COREPACK_HOME="/tmp/corepack"
```

Bring up local dependencies and bootstrap the database:

```bash
bash infra/scripts/dev-up.sh
```

If Docker is unavailable, this machine can also run with local Homebrew services:

```bash
/opt/homebrew/opt/postgresql@16/bin/pg_ctl -D /opt/homebrew/var/postgresql@16 -l /opt/homebrew/var/postgresql@16/logfile start
/opt/homebrew/opt/redis/bin/redis-server --daemonize yes
pnpm db:push
pnpm db:seed
```

Then run services individually:

```bash
pnpm dev:api
pnpm dev:web
pnpm dev:worker
```

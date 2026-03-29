# OpenSwarm SaaS Bootstrap Plan

## Goal

Create a clean monorepo foundation for the new OpenSwarm SaaS product while
keeping DeerFlow as a separate execution runtime.

## Initial repository shape

- apps/web
- apps/api
- apps/worker
- packages/ui
- packages/db
- packages/shared
- packages/deerflow-adapter

## Phase 1 deliverables

1. Monorepo workspace and root tooling
2. Web, API, and worker bootstraps
3. Shared package boundaries
4. Architecture and delivery documentation
5. Prisma schema and first API modules

## Progress snapshot

Completed:

- monorepo root structure
- bootstrap apps for web, api, and worker
- shared package boundaries
- ADRs for stack and DeerFlow runtime boundary
- Prisma schema draft
- first API modules for projects, employees, and skills

Remaining in the current phase:

- install dependencies under Node 20+
- run Prisma generate and first migration
- replace API stub data with database-backed services
- start building the first project pages in the web app

## Immediate next steps

1. Run repository setup under Node 20+
2. Add DeerFlow adapter client boundaries
3. Replace stub services with Prisma repositories
4. Build the first web routes for project list and project shell

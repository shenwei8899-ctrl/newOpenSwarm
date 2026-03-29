# OpenSwarm SaaS Stack Evaluation

## Recommended stack

- Web: Next.js + React + TypeScript
- API: NestJS + TypeScript
- Worker: Node.js + BullMQ
- DB: PostgreSQL
- Cache and queue: Redis
- ORM: Prisma
- Runtime: DeerFlow as an external Python service

## Why this stack wins

### Product velocity

The SaaS layer is primarily a product and business system. TypeScript across
web, API, worker, and shared packages reduces cognitive load and speeds up
iteration.

### Runtime isolation

DeerFlow remains free to evolve as a Python runtime, while OpenSwarm SaaS owns
all project-specific orchestration and tenant-aware state.

### Scale path

This stack supports a clean growth path:

- single-machine bootstrap
- small multi-tenant SaaS
- medium-scale worker and runtime clustering

## Alternatives considered

### Alternative A: Fastify + Drizzle

Pros:

- lighter runtime
- less framework ceremony
- strong performance

Cons:

- more convention work needed
- weaker built-in module structure for a fast-growing SaaS backend

### Alternative B: FastAPI + Celery

Pros:

- closer to DeerFlow's language
- strong Python AI ecosystem alignment

Cons:

- split language model between frontend and business backend
- product-layer iteration is less cohesive
- more coupling pressure toward DeerFlow internals

## Local development note

The current machine is on Node.js 18, while the new repository targets Node.js
20 or newer. Upgrading local Node should be treated as a required setup step
before dependency installation.

# ADR 001: Initial Technology Stack

## Status

Accepted

## Context

OpenSwarm SaaS needs a product-oriented codebase that can evolve into a
multi-tenant application while integrating with DeerFlow, which is maintained
as a Python runtime service.

## Decision

Use the following stack:

- Monorepo: pnpm workspaces + Turborepo
- Frontend: Next.js + React + TypeScript
- API: NestJS + TypeScript
- Worker: Node.js + BullMQ
- Database: PostgreSQL
- Cache and queue: Redis
- Runtime integration: DeerFlow as an external service

## Rationale

This stack keeps product development efficient, preserves a single language for
the SaaS application itself, and isolates the Python runtime at a service
boundary.

## Consequences

- The system uses both TypeScript and Python across service boundaries.
- DeerFlow stays replaceable behind an adapter package.
- Business orchestration remains independent from runtime implementation.

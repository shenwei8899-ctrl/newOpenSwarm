# ADR 002: DeerFlow Runtime Boundary

## Status

Accepted

## Context

DeerFlow is implemented in Python and should be treated as an execution runtime,
not as the primary SaaS application framework.

OpenSwarm SaaS needs strong control over:

- tenant-aware business logic
- project and employee management
- skill assignment
- discussion orchestration
- task lifecycle
- quota and billing in later phases

## Decision

Keep DeerFlow as an external service boundary.

OpenSwarm SaaS owns:

- web product experience
- business API
- job orchestration
- persistence model
- tenant and quota model

DeerFlow owns:

- agent execution
- thread lifecycle
- tool runtime
- artifact generation
- model invocation

All runtime access must flow through `packages/deerflow-adapter`.

## Rationale

This preserves a clean separation between business orchestration and runtime
execution, reduces coupling to DeerFlow internals, and keeps the SaaS product
free to evolve independently.

## Consequences

- The system is intentionally polyglot.
- Adapter design becomes critical.
- Some runtime capabilities must be added to DeerFlow behind stable APIs,
  instead of leaking Python internals into the SaaS application.

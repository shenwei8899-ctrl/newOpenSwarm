# OpenSwarm SaaS Week 1 Backlog

## Objective

Turn the bootstrap repository into a real implementation foundation for V1.

## Day 1

- Initialize package manager state with pnpm
- Add root linting and formatting config
- Add environment variable templates
- Add local dev README

## Day 2

- Add Prisma to `packages/db`
- Create initial schema for projects, employees, skills, discussions, and tasks
- Add migration and seed commands

## Day 3

- Expand `apps/api` from bootstrap into modules:
  - projects
  - employees
  - skills
- Add shared DTOs in `packages/shared`

## Day 4

- Add `packages/deerflow-adapter` HTTP client boundaries
- Define adapter methods for:
  - list skills
  - create or update agent
  - create thread
  - run thread
  - fetch artifacts

## Day 5

- Build project list page in `apps/web`
- Connect project creation to API
- Build project shell route

## Day 6

- Build employee catalog page
- Add project employee assignment flow

## Day 7

- Build skill assignment page
- Persist project-level employee skill assignments

## Exit criteria

- Repository installs with pnpm
- API boots with modular structure
- Web shows project list and project shell
- Employee assignment and skill assignment persist to the database

# OpenSwarm SaaS Progress Recap

## Agreed delivery path

The agreed path remains:

1. bootstrap a new monorepo
2. keep DeerFlow as an external runtime
3. build the SaaS product shell around:
   - teams/projects
   - employees
   - team-level skills
   - discussions
   - tasks

The current product entry flow is now:

1. employee-market home page
2. create team
3. confirm team members
4. assign team skills
5. enter workspace

## What is already done

- repository bootstrap and workspace tooling
- ADRs for stack and runtime boundary
- Prisma schema draft
- bootstrap web, api, and worker apps
- first API modules for projects, employees, and skills
- initial database-facing repository layer
- seed script with demo tenant, employees, skills, and project
- first web pages for project list and project shell
- project employee selection page
- project skill assignment page
- API endpoints for project detail, project employees, and project skill assignments
- discussion module scaffold and discussion message contracts
- task module scaffold, runtime job shape, and artifact listing contracts
- deerflow-adapter runtime client boundary
- Node 22-based dependency install completed
- Prisma client generated successfully
- workspace typecheck passing
- BullMQ queue boundary added for discussion runs and task execution
- local Docker Compose added for PostgreSQL and Redis
- local bootstrap scripts added for db generate, push, and seed
- web pages now use API-first fetching with demo fallback data
- local PostgreSQL 16 is running and seeded
- local Redis is running
- API verified against real project, employee, skill, discussion, and task data
- worker verified consuming BullMQ jobs and writing discussion/task results back to the database
- DeerFlow-backed discussion execution works end-to-end
- DeerFlow-backed task execution works end-to-end
- discussion-to-task context handoff works
- teams route flow is live:
  - `/teams/new`
  - `/teams/[teamId]/members`
  - `/teams/[teamId]/skills`
  - `/teams/[teamId]/workspace`
- old `/projects/*` routes redirect to `teams/*`
- web app is running locally and has been visually verified
- employee-market home page has replaced the old project-list-first homepage
- homepage styling has been moved toward the Yinova card-market layout

## Current blockers

- default shell Node is still 18, so local commands must use the Node 22 path
- Docker is not installed on the current machine, so the Homebrew services path is the active local setup
- the homepage and team flow styling still need another visual polish pass
- workspace-level runtime history could still be made easier to scan
- artifact download/open affordances are still basic
- DeerFlow-side `allowed_skills` should now be protected by regression checks

## Best next step

1. refresh the remaining docs to match the live status
2. polish the teams workspace and remaining UI surfaces
3. add regression coverage around DeerFlow skill enforcement
4. improve artifact usability and runtime scanning at the workspace level

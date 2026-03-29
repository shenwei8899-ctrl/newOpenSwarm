# OpenSwarm SaaS V1 Next Steps Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Close the remaining V1 gaps so OpenSwarm SaaS becomes stable for internal trial use, with a reliable discussion-to-task workflow and clearer runtime behavior.

**Architecture:** Keep the existing split unchanged: `apps/web` owns product UI, `apps/api` owns business orchestration, `apps/worker` owns async execution, and DeerFlow stays an external runtime behind `packages/deerflow-adapter`. Focus next on usability, runtime visibility, and server-side capability boundaries instead of adding new product surface area.

**Tech Stack:** Next.js, NestJS, BullMQ, Redis, PostgreSQL, Prisma, DeerFlow runtime

---

### Task 1: Refresh planning and progress docs

**Files:**
- Modify: `/Users/shenwei/Documents/deerflow/deer-flow/openswarm-saas/docs/plans/2026-03-26-progress-recap.md`
- Modify: `/Users/shenwei/Documents/deerflow/deer-flow/openswarm-saas/docs/plans/2026-03-26-local-dev-bootstrap.md`
- Reference: `/Users/shenwei/Documents/deerflow/deer-flow/openswarm-saas/docs/prd/v1-mvp-scope.md`

**Steps:**
1. Update the progress recap to reflect the current live status:
   - web/api/worker are running
   - DeerFlow-backed discussion execution works
   - DeerFlow-backed task execution works
   - discussion-to-task context handoff now works
2. Replace outdated blockers with current ones:
   - remaining UI polish work across homepage, team setup, and workspace
   - artifact usability still needs another pass
   - DeerFlow-side `allowed_skills` now needs regression coverage rather than first-pass implementation
3. Update local bootstrap notes so new contributors can reproduce the current working setup quickly.

**Acceptance:**
- Docs match the current running state.
- A new engineer can understand what is done and what remains without replaying the whole thread.

---

### Task 2: Improve discussion and task action UX

**Files:**
- Modify: `/Users/shenwei/Documents/deerflow/deer-flow/openswarm-saas/apps/web/src/app/projects/[projectId]/discussion/page.tsx`
- Modify: `/Users/shenwei/Documents/deerflow/deer-flow/openswarm-saas/apps/web/src/app/projects/[projectId]/discussion/actions.ts`
- Modify: `/Users/shenwei/Documents/deerflow/deer-flow/openswarm-saas/apps/web/src/app/projects/[projectId]/tasks/page.tsx`
- Modify: `/Users/shenwei/Documents/deerflow/deer-flow/openswarm-saas/apps/web/src/app/projects/[projectId]/tasks/actions.ts`
- Create: `/Users/shenwei/Documents/deerflow/deer-flow/openswarm-saas/apps/web/src/components/form-status.tsx`

**Steps:**
1. Add visible pending state for:
   - create discussion
   - send discussion message
   - run discussion
   - create task
   - assign task
   - run task
2. Add success and error messaging for server actions instead of silent completion/failure.
3. Ensure page revalidation keeps the latest messages and task state visible after each action.
4. Keep styling aligned with the existing OpenSwarm dark control-panel aesthetic.

**Acceptance:**
- Users can tell when an action is running.
- Failed actions show a readable error.
- Successful actions refresh the relevant panel without confusion.

---

### Task 3: Make discussion-to-task linkage explicit in UI

**Files:**
- Modify: `/Users/shenwei/Documents/deerflow/deer-flow/openswarm-saas/apps/web/src/app/projects/[projectId]/discussion/page.tsx`
- Modify: `/Users/shenwei/Documents/deerflow/deer-flow/openswarm-saas/apps/web/src/app/projects/[projectId]/tasks/page.tsx`
- Modify: `/Users/shenwei/Documents/deerflow/deer-flow/openswarm-saas/apps/web/src/lib/api.ts`
- Optional create: `/Users/shenwei/Documents/deerflow/deer-flow/openswarm-saas/apps/web/src/components/discussion-picker.tsx`

**Steps:**
1. Show the current discussion identifier/title in a clearer way.
2. On task creation, allow choosing:
   - latest discussion
   - no discussion
   - another discussion from the project
3. Show linked discussion title, not only discussion ID, on each task card.
4. Keep the default behavior as “use latest discussion” for speed.

**Acceptance:**
- Users can clearly see which discussion a task is based on.
- Tasks no longer feel like they came from hidden context.

---

### Task 4: Add runtime job visibility and failure diagnostics

**Files:**
- Modify: `/Users/shenwei/Documents/deerflow/deer-flow/openswarm-saas/apps/api/src/tasks/tasks.repo.ts`
- Modify: `/Users/shenwei/Documents/deerflow/deer-flow/openswarm-saas/apps/api/src/tasks/tasks.service.ts`
- Modify: `/Users/shenwei/Documents/deerflow/deer-flow/openswarm-saas/apps/api/src/tasks/tasks.controller.ts`
- Modify: `/Users/shenwei/Documents/deerflow/deer-flow/openswarm-saas/packages/shared/src/index.ts`
- Modify: `/Users/shenwei/Documents/deerflow/deer-flow/openswarm-saas/apps/web/src/app/projects/[projectId]/tasks/page.tsx`
- Modify: `/Users/shenwei/Documents/deerflow/deer-flow/openswarm-saas/apps/worker/src/index.ts`

**Steps:**
1. Expose runtime job history for a task:
   - queued
   - running
   - completed
   - failed
2. Include latest runtime error and timestamps in the API response.
3. Render latest runtime job details on the task page.
4. Make worker logs more structured around:
   - task ID
   - discussion ID
   - employee ID
   - DeerFlow thread ID

**Acceptance:**
- When DeerFlow fails, the user can see a useful failure reason.
- Task execution is easier to debug without reading raw terminal logs.

---

### Task 5: Turn artifact handling into a real V1 feature

**Files:**
- Modify: `/Users/shenwei/Documents/deerflow/deer-flow/openswarm-saas/packages/deerflow-adapter/src/runtime-client.ts`
- Modify: `/Users/shenwei/Documents/deerflow/deer-flow/openswarm-saas/apps/worker/src/index.ts`
- Modify: `/Users/shenwei/Documents/deerflow/deer-flow/openswarm-saas/apps/api/src/tasks/tasks.repo.ts`
- Modify: `/Users/shenwei/Documents/deerflow/deer-flow/openswarm-saas/apps/web/src/app/projects/[projectId]/tasks/page.tsx`

**Steps:**
1. Verify DeerFlow artifact listing consistently returns files for runs that use `present_files`.
2. Persist richer artifact metadata when available.
3. Render artifacts per task, not only for the first task in the sidebar.
4. Add a simple download/open affordance if the runtime path can be resolved safely.

**Acceptance:**
- Users can see which task produced which file.
- Artifact listing is no longer a passive placeholder panel.

---

### Task 6: Enforce `allowed_skills` on the DeerFlow side

**Status:** completed and verified on 2026-03-26

**Files:**
- Modify: `/Users/shenwei/Documents/deerflow/deer-flow/backend/packages/harness/deerflow/config/agents_config.py`
- Modify: `/Users/shenwei/Documents/deerflow/deer-flow/backend/app/gateway/routers/agents.py`
- Modify: `/Users/shenwei/Documents/deerflow/deer-flow/backend/packages/harness/deerflow/agents/lead_agent/agent.py`
- Modify: `/Users/shenwei/Documents/deerflow/deer-flow/backend/packages/harness/deerflow/agents/lead_agent/prompt.py`
- Modify: `/Users/shenwei/Documents/deerflow/deer-flow/openswarm-saas/packages/deerflow-adapter/src/runtime-client.ts`

**Steps:**
1. Extend DeerFlow custom agent config to store `allowed_skills`.
2. Surface `allowed_skills` through the DeerFlow agents API.
3. Pass allowed skill IDs into prompt construction.
4. Ensure prompt skill rendering filters down to only the assigned skills.
5. Keep OpenSwarm-side agent upsert aligned with the new DeerFlow contract.
6. Verify create, update, readback, and on-disk config behavior against a live DeerFlow gateway after service restart.

**Acceptance:**
- Employee skill assignment is enforced by DeerFlow, not only described in prompt text.
- This closes the biggest remaining product/runtime mismatch from the original planning docs.

---

### Task 7: Add end-to-end smoke tests for the V1 happy path

**Files:**
- Create: `/Users/shenwei/Documents/deerflow/deer-flow/openswarm-saas/apps/web/e2e/discussion-task-flow.spec.ts`
- Create: `/Users/shenwei/Documents/deerflow/deer-flow/openswarm-saas/apps/web/playwright.config.ts`
- Modify: `/Users/shenwei/Documents/deerflow/deer-flow/openswarm-saas/apps/web/package.json`
- Optional create: `/Users/shenwei/Documents/deerflow/deer-flow/openswarm-saas/docs/plans/2026-03-26-smoke-test-checklist.md`

**Steps:**
1. Add a smoke test that covers:
   - open project
   - create discussion
   - send message
   - run discussion
   - create task from discussion context
   - run task
2. Assert page-level success conditions, not implementation details.
3. Keep the test lean enough for local use before every major change.

**Acceptance:**
- We have one repeatable V1 happy-path test.
- Regression risk drops before we continue into V2 features.

---

## Recommended execution order

1. Task 1: docs refresh
2. Task 2: action UX
3. Task 3: explicit discussion-task linkage
4. Task 4: runtime job visibility
5. Task 5: artifact handling
6. Task 7: end-to-end smoke tests
7. Task 6: DeerFlow `allowed_skills` regression coverage

## Why this order

- Tasks 2–5 make the current V1 visible, understandable, and usable without changing the architecture.
- Task 7 adds regression safety once the V1 path is stable.
- Task 6 is shipped; the follow-up need is keeping regression coverage around DeerFlow gateway/runtime restarts and agent-config evolution.

## Exit criteria for the next phase

- A user can create a discussion, run it, create a task from that discussion, run the task, and understand the result without reading logs.
- Runtime failures are visible in the UI.
- Artifacts are visible per task when present.
- One smoke test covers the V1 happy path.
- DeerFlow-side `allowed_skills` work is shipped and verified.

# Employee Collaboration Orchestration Engine
## Phase 1 Schema And API Draft

**Version:** v0.1  
**Date:** 2026-04-01  
**Status:** Draft

This document turns the high-level orchestration engine design into a concrete first implementation plan for:

- Prisma schema changes
- shared contract changes
- NestJS module/API additions
- worker queue contract

The goal is to create a **Phase 1 / V1.5** version that supports:

1. generate a collaboration plan
2. let the user confirm it
3. execute a controlled relay
4. pause on ambiguity
5. support retry / reassign later

---

## 1. Implementation Principles

### 1.1 Reuse current OpenSwarm primitives

We already have:

- `projects`
- `employees`
- `employee_skills`
- `discussion_sessions`
- `tasks`
- `runtime_jobs`
- BullMQ workers
- DeerFlow step execution

The autonomy engine should build on top of these primitives, not replace them.

### 1.2 Separate plan from execution

Phase 1 should separate:

- **plan generation**
- **step execution**

This allows user confirmation before automatic relay execution.

### 1.3 Keep the graph small and explicit

For the first version:

- every run has a finite step list
- dependencies are stored explicitly
- every step has exactly one owner
- every handoff is recorded

No dynamic DAG editor is needed in V1.

---

## 2. Prisma Schema Draft

The current schema in
[/Users/shenwei/Documents/deerflow/deer-flow/openswarm-saas/packages/db/prisma/schema.prisma](/Users/shenwei/Documents/deerflow/deer-flow/openswarm-saas/packages/db/prisma/schema.prisma)
already models `Task`, `RuntimeJob`, `DiscussionSession`, and `Artifact`.

We should add 3 new models.

## 2.1 `AutonomyRun`

Represents one collaboration relay run.

```prisma
model AutonomyRun {
  id                    String           @id @default(cuid())
  tenantId              String
  projectId             String
  sourceDiscussionId    String?
  sourceTaskId          String?
  title                 String
  goal                  String
  status                String           @default("draft")
  initialEmployeeId     String
  currentEmployeeId     String?
  participantEmployeeIds Json            @default("[]")
  plannerOutput         Json             @default("{}")
  summary               String?
  lastError             String?
  maxSteps              Int              @default(8)
  maxRelayPerEmployee   Int              @default(2)
  project               Project          @relation(fields: [projectId], references: [id], onDelete: Cascade)
  sourceDiscussion      DiscussionSession? @relation(fields: [sourceDiscussionId], references: [id], onDelete: SetNull)
  sourceTask            Task?            @relation(fields: [sourceTaskId], references: [id], onDelete: SetNull)
  initialEmployee       Employee         @relation("AutonomyInitialEmployee", fields: [initialEmployeeId], references: [id], onDelete: Restrict)
  currentEmployee       Employee?        @relation("AutonomyCurrentEmployee", fields: [currentEmployeeId], references: [id], onDelete: SetNull)
  steps                 AutonomyStep[]
  events                AutonomyEvent[]
  createdAt             DateTime         @default(now())
  updatedAt             DateTime         @updatedAt

  @@index([tenantId, status])
  @@index([projectId, status])
}
```

### Notes

- `plannerOutput` stores the proposed graph and role mapping.
- `participantEmployeeIds` keeps the allowed relay roster.
- `maxSteps` and `maxRelayPerEmployee` provide guardrails.

---

## 2.2 `AutonomyStep`

Represents one relay baton step.

```prisma
model AutonomyStep {
  id               String       @id @default(cuid())
  runId            String
  stepKey          String
  title            String
  status           String       @default("queued")
  ownerEmployeeId  String
  dependsOn        Json         @default("[]")
  goal             String
  inputContext     Json         @default("{}")
  outputSummary    String?
  artifacts        Json         @default("[]")
  handoffTo        String?
  handoffMessage   String?
  runtimeJobId     String?
  stepIndex        Int
  startedAt        DateTime?
  finishedAt       DateTime?
  run              AutonomyRun  @relation(fields: [runId], references: [id], onDelete: Cascade)
  ownerEmployee    Employee     @relation("AutonomyStepOwner", fields: [ownerEmployeeId], references: [id], onDelete: Restrict)
  nextEmployee     Employee?    @relation("AutonomyStepHandoff", fields: [handoffTo], references: [id], onDelete: SetNull)
  createdAt        DateTime     @default(now())
  updatedAt        DateTime     @updatedAt

  @@index([runId, stepIndex])
  @@index([runId, status])
}
```

### Notes

- `dependsOn` is a small JSON array of previous `stepKey` values.
- `runtimeJobId` links this step to the DeerFlow-backed execution record.
- `handoffTo` is optional and only used for relay transitions.

---

## 2.3 `AutonomyEvent`

Represents timeline / audit events.

```prisma
model AutonomyEvent {
  id          String       @id @default(cuid())
  runId       String
  stepId      String?
  type        String
  agentId     String?
  message     String?
  metadata    Json         @default("{}")
  run         AutonomyRun  @relation(fields: [runId], references: [id], onDelete: Cascade)
  createdAt   DateTime     @default(now())

  @@index([runId, createdAt])
}
```

### Suggested event types

- `run_started`
- `plan_generated`
- `step_ready`
- `step_started`
- `step_completed`
- `handoff`
- `retry`
- `reassign`
- `needs_yin`
- `waiting_user`
- `terminated`

---

## 2.4 Minimal relation additions to existing models

To connect the graph cleanly, add optional backrefs:

### In `Project`
```prisma
autonomyRuns AutonomyRun[]
```

### In `Employee`
```prisma
autonomyInitialRuns AutonomyRun[] @relation("AutonomyInitialEmployee")
autonomyCurrentRuns AutonomyRun[] @relation("AutonomyCurrentEmployee")
autonomyOwnedSteps  AutonomyStep[] @relation("AutonomyStepOwner")
autonomyHandoffs    AutonomyStep[] @relation("AutonomyStepHandoff")
```

### In `DiscussionSession`
```prisma
autonomyRuns AutonomyRun[]
```

### In `Task`
```prisma
autonomyRuns AutonomyRun[]
```

---

## 3. Shared Types Draft

The shared contracts live in
[/Users/shenwei/Documents/deerflow/deer-flow/openswarm-saas/packages/shared/src/index.ts](/Users/shenwei/Documents/deerflow/deer-flow/openswarm-saas/packages/shared/src/index.ts)

Add the following types.

## 3.1 Planner contracts

```ts
export type AutonomyPlanStep = {
  stepKey: string;
  title: string;
  ownerEmployeeId: string;
  dependsOn: string[];
  goal: string;
  notes?: string | null;
};

export type AutonomyPlan = {
  title: string;
  goal: string;
  participantEmployeeIds: string[];
  steps: AutonomyPlanStep[];
  warnings: string[];
};
```

## 3.2 Run contracts

```ts
export type AutonomyRunSummary = {
  id: string;
  projectId: string;
  sourceDiscussionId: string | null;
  sourceTaskId: string | null;
  title: string;
  goal: string;
  status: string;
  initialEmployeeId: string;
  currentEmployeeId: string | null;
  summary: string | null;
  lastError: string | null;
  participantEmployeeIds: string[];
  createdAt: string;
  updatedAt: string;
};

export type AutonomyStepSummary = {
  id: string;
  runId: string;
  stepKey: string;
  title: string;
  status: string;
  ownerEmployeeId: string;
  dependsOn: string[];
  goal: string;
  outputSummary: string | null;
  artifacts: string[];
  handoffTo: string | null;
  handoffMessage: string | null;
  runtimeJobId: string | null;
  stepIndex: number;
  startedAt: string | null;
  finishedAt: string | null;
};

export type AutonomyEventItem = {
  id: string;
  runId: string;
  stepId: string | null;
  type: string;
  agentId: string | null;
  message: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type AutonomyRunDetail = AutonomyRunSummary & {
  plannerOutput: AutonomyPlan | null;
  steps: AutonomyStepSummary[];
  events: AutonomyEventItem[];
};
```

## 3.3 Input contracts

```ts
export type GenerateAutonomyPlanInput = {
  projectId: string;
  goal: string;
  sourceDiscussionId?: string | null;
  participantEmployeeIds?: string[];
};

export type CreateAutonomyRunInput = {
  projectId: string;
  title?: string;
  goal: string;
  initialEmployeeId: string;
  participantEmployeeIds: string[];
  sourceDiscussionId?: string | null;
  sourceTaskId?: string | null;
  plannerOutput?: AutonomyPlan | null;
};

export type RetryAutonomyStepInput = {
  stepId: string;
};

export type ReassignAutonomyStepInput = {
  stepId: string;
  employeeId: string;
};

export type YinReviewDecisionInput = {
  decision: "continue" | "waiting_user" | "terminate";
  nextEmployeeId?: string | null;
  note?: string | null;
};
```

## 3.4 Queue contracts

```ts
export const queueNames = {
  discussions: "discussions",
  tasks: "tasks",
  autonomy: "autonomy"
} as const;

export type AutonomyStepJob = {
  runId: string;
  stepId: string;
};
```

---

## 4. API Design Draft

Add a new Nest module:

- `apps/api/src/autonomy/autonomy.module.ts`
- `apps/api/src/autonomy/autonomy.controller.ts`
- `apps/api/src/autonomy/autonomy.service.ts`
- `apps/api/src/autonomy/autonomy.repo.ts`

Update
[/Users/shenwei/Documents/deerflow/deer-flow/openswarm-saas/apps/api/src/app.module.ts](/Users/shenwei/Documents/deerflow/deer-flow/openswarm-saas/apps/api/src/app.module.ts)
to import `AutonomyModule`.

## 4.1 Generate a plan

`POST /api/autonomy/plans`

Purpose:
- build a collaboration plan from project + goal
- do not start execution yet

Request:

```json
{
  "projectId": "proj_xxx",
  "goal": "完成一份调研报告",
  "sourceDiscussionId": "disc_xxx",
  "participantEmployeeIds": ["employee_a", "employee_b", "employee_c"]
}
```

Response:

```json
{
  "title": "调研报告协作计划",
  "goal": "完成一份调研报告",
  "participantEmployeeIds": ["employee_a", "employee_b", "employee_c"],
  "steps": [
    {
      "stepKey": "collect",
      "title": "采集资料",
      "ownerEmployeeId": "employee_a",
      "dependsOn": [],
      "goal": "抓取近30天公开资料"
    }
  ],
  "warnings": []
}
```

## 4.2 Create a run

`POST /api/autonomy/task-runs`

Purpose:
- persist a confirmed relay run
- optionally enqueue first step immediately

Request:

```json
{
  "projectId": "proj_xxx",
  "title": "早餐店调研报告",
  "goal": "完成一份调研报告",
  "initialEmployeeId": "employee_crawler",
  "participantEmployeeIds": [
    "employee_crawler",
    "employee_analyst",
    "employee_writer",
    "employee_lawyer"
  ],
  "sourceDiscussionId": "disc_xxx",
  "plannerOutput": {
    "title": "调研报告协作计划",
    "goal": "完成一份调研报告",
    "participantEmployeeIds": [],
    "steps": [],
    "warnings": []
  }
}
```

Response:

```json
{
  "id": "autorun_xxx",
  "status": "running"
}
```

## 4.3 List runs for a project

`GET /api/autonomy/task-runs?projectId=proj_xxx`

Response:

```json
{
  "runs": [
    {
      "id": "autorun_xxx",
      "projectId": "proj_xxx",
      "title": "早餐店调研报告",
      "status": "running"
    }
  ]
}
```

## 4.4 Get one run detail

`GET /api/autonomy/task-runs/:runId`

Returns:
- run summary
- steps
- events
- planner output

## 4.5 Retry one step

`POST /api/autonomy/task-runs/:runId/retry-step`

Request:

```json
{
  "stepId": "step_xxx"
}
```

## 4.6 Reassign one step

`POST /api/autonomy/task-runs/:runId/reassign-step`

Request:

```json
{
  "stepId": "step_xxx",
  "employeeId": "employee_writer"
}
```

## 4.7 Yin review decision

`POST /api/autonomy/task-runs/:runId/yin-review`

Request:

```json
{
  "decision": "continue",
  "nextEmployeeId": "employee_writer",
  "note": "继续由写手接力出报告初稿"
}
```

## 4.8 Terminate a run

`POST /api/autonomy/task-runs/:runId/terminate`

Optional request:

```json
{
  "note": "用户主动终止"
}
```

---

## 5. Repository/Service Responsibilities

## 5.1 `AutonomyRepo`

Responsibilities:

- create run
- create steps from planner output
- create events
- get run detail
- update step status
- update run status
- query ready steps

## 5.2 `AutonomyService`

Responsibilities:

- validate participants
- generate plan
- create run
- enqueue first steps
- expose retry/reassign/terminate actions
- apply Yin review decisions

## 5.3 Planner extraction

For Phase 1, planner can be implemented as a pure service:

- `autonomy-planner.service.ts`

It can use:

- employee roles
- employee descriptions
- discussion summary
- simple prompt template over DeerFlow or direct LLM

For V1.5 it does **not** need a separate queue.

---

## 6. Worker Design Draft

Add one new job processor to the worker app:

- `processAutonomyStepJob`

Current worker file:
[/Users/shenwei/Documents/deerflow/deer-flow/openswarm-saas/apps/worker/src/index.ts](/Users/shenwei/Documents/deerflow/deer-flow/openswarm-saas/apps/worker/src/index.ts)

Phase 1 can keep it in the same file before later extraction.

## 6.1 Execution flow

1. load `AutonomyRun`
2. load current `AutonomyStep`
3. resolve owner employee
4. load upstream completed step outputs
5. call `createOrUpdateAgent(...)`
6. call `runAgent(...)`
7. parse `<autonomy_result>`
8. update current step
9. if `handoff`, mark downstream step ready or set next owner if dynamic
10. if `completed`, update run if all steps are done
11. if `blocked/needs_yin`, stop and mark run accordingly

## 6.2 Output parser contract

The first version should use a strict parser:

- extract `<autonomy_result>...</autonomy_result>`
- parse JSON
- validate:
  - `status`
  - `artifacts`
  - `handoff_to`
  - `handoff_message`
  - `needs_yin`
  - `task_done`

If parsing fails:
- mark step as `failed`
- append event
- optionally retry once

## 6.3 Guardrails

Before enqueuing the next step, check:

- run step count < `maxSteps`
- employee handoff count < `maxRelayPerEmployee`
- next employee in allowed participant list
- no self-loop unless explicitly valid

Else:
- mark run `needs_yin`

---

## 7. Suggested Phase 1 Prompt Contract

Each step execution prompt should include:

- project name
- run goal
- current step title and goal
- employee role and boundary
- allowed participant list
- upstream outputs and artifacts
- explicit format rules

The most important behavioral rules:

1. do only the part that matches your role
2. if another role is better for the next step, hand off
3. do not silently finish the whole project if clear dependencies remain
4. always produce a natural-language summary
5. always produce `<autonomy_result>`

---

## 8. Minimal UI Impact For Phase 1

The current workspace can add a lightweight relay panel:

- `∞ 自治接力`
- goal input
- first employee select
- participant checklist
- plan preview
- confirm and start

And a run drawer:

- current state
- step list
- timeline
- retry
- reassign
- request Yin

No graph editor required.

---

## 9. Recommended Build Sequence

### Step 1
Add Prisma models:

- `AutonomyRun`
- `AutonomyStep`
- `AutonomyEvent`

### Step 2
Add shared contracts:

- plan types
- run detail types
- queue job types

### Step 3
Add Nest module:

- routes
- service
- repo

### Step 4
Add worker queue:

- `queueNames.autonomy`
- `processAutonomyStepJob`

### Step 5
Add planner:

- generate step list
- assign initial owner
- infer dependencies

### Step 6
Add workspace UI:

- start run
- show timeline
- show current baton owner

---

## 10. Final Recommendation

For the first implementation:

- **store the graph explicitly**
- **require user confirmation before run**
- **execute one step at a time**
- **use strict structured output parsing**
- **escalate early instead of guessing**

This keeps the engine controllable while still delivering real multi-employee relay behavior.

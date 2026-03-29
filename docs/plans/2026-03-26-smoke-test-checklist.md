# OpenSwarm SaaS Smoke Test Checklist

## Happy path

1. 打开首页
2. 进入最近团队工作台
3. 进入讨论工作台
4. 创建讨论
5. 发送消息
6. 运行讨论
7. 等待员工消息和摘要回写
8. 进入任务工作台
9. 创建任务
10. 执行任务
11. 等待任务状态变为 `done`

## Current automated coverage

- `apps/web/e2e/discussion-task-flow.spec.ts`

## Preconditions

- web running on `http://127.0.0.1:3000`
- api running on `http://127.0.0.1:3001`
- worker running
- PostgreSQL and Redis running
- DeerFlow runtime reachable

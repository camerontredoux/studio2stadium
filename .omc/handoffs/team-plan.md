## Handoff: team-plan → team-exec
- **Decided**: 3 workers, 5 tasks with dependency chain. worker-1 handles sequential foundation (schema→withAudit→instrument), worker-2 handles API endpoints (parallel after schema), worker-3 handles frontend (after API+instrumentation done).
- **Rejected**: 4+ workers (too much idle time waiting on dependencies), single worker (no parallelism between API endpoints and service instrumentation).
- **Risks**: worker-2 and worker-3 will be idle while blocked. Frontend worker needs type generation which requires backend to be running. Service instrumentation (Task 4) touches many files — potential for merge issues if worker-2 also touches route files.
- **Files**: .omc/plans/event-audit-log.md (full plan), apps/backend/app/database/schema/org-events.ts (schema target), apps/backend/app/database/service.ts (withAudit target), apps/backend/app/modules/orgs/events/routes.ts (route registration)
- **Remaining**: All implementation. Workers execute tasks in dependency order.

# Software requirements specification

This document retains the source identifiers so implementation and acceptance can be discussed without renumbering. “Must” describes release behavior. The [traceability matrix](traceability.md) links each row to component designs and acceptance evidence.

## Definitions

| ID | Required behavior |
| --- | --- |
| DEF-01 | Create, revise, validate, and delete unpublished drafts; reject stale revisions. |
| DEF-02 | Publish an immutable version with workflow ID, sequential version number, canonical digest, and publication time. |
| DEF-03 | Pin a run permanently to its published definition ID and digest. |
| DEF-04 | Reject cycles, repeated IDs, missing/self dependencies, unknown kinds, and unknown handler versions. |
| DEF-05 | Reject invalid retry/deadline settings, excess limits, and references outside the ancestor set. |
| DEF-06 | Accept literal JSON and structured references only; never execute definition content. |
| DEF-07 | Register each handler with name, version, input schema, and output schema. |
| DEF-08 | Return node, field, code, and understandable reason; invalid graphs create no executable work. |
| DEF-09 | Enforce 1–100 nodes, no more than 500 edges, and 256 KiB encoded definitions by default. |

## Runs and scheduling

| ID | Required behavior |
| --- | --- |
| RUN-01 | Atomically create run, node instances, eligible root states, and initial events. |
| RUN-02 | Require a start key; same canonical request returns the same run, changed request returns 409. |
| RUN-03 | Activate each node only when every dependency has succeeded. |
| RUN-04 | Enforce global, run, handler, and advertised worker limits in the claim transaction. |
| RUN-05 | Prefer ready timestamp then stable task ID among eligible candidates; avoid claiming strict FIFO. |
| RUN-06 | Match registered handler versions; expose missing compatible workers in diagnostics. |
| RUN-07 | Exhausted/nonretryable failure prevents new work and settles the rest explicitly. |
| RUN-08 | Use transaction preconditions and an atomic durable event for each accepted transition. |
| RUN-09 | Apply a finite run deadline, default 24 hours, including queueing and waits. |

## Authority and recovery

| ID | Required behavior |
| --- | --- |
| DUR-01 | Atomically claim, check all capacities and run eligibility, allocate attempt/fence, and store lease. |
| DUR-02 | Require task, attempt, worker, and fence on updates; reject stale, expired, or cancelled authority. |
| DUR-03 | Default lease 15 seconds, heartbeat 5 seconds, expiry scan interval at most 1 second. |
| DUR-04 | Extend a valid lease only up to its fixed execution deadline; never revive expired authority. |
| DUR-05 | Mark worker loss LOST, consume the attempt, and follow bounded retry policy. |
| DUR-06 | Reconcile overdue work on startup and continuously without resetting persisted due times. |
| DUR-07 | Evaluate durable deadlines using database time. |
| DUR-08 | Stop accepting work during database failure; revalidate authority after reconnect before continuing. |
| DUR-09 | Allow concurrent local coordinators with database-enforced duplicate prevention. |
| DUR-10 | Retain committed state after reopening storage; clients reuse keys after uncertain responses. |

## Effects

| ID | Required behavior |
| --- | --- |
| EFF-01 | Key a logical effect by run ID, node ID, and operation; omit attempt number. |
| EFF-02 | Check authority, run phase, lease, and attempt/run deadlines in the effect transaction. |
| EFF-03 | Enforce unique effect keys; fail digest mismatch explicitly. |
| EFF-04 | Commit built-in effect, artifact, output, attempt/task success, receipt, and history together. |
| EFF-05 | Replay an identical committed completion receipt; reject changed payload or stale unfinished attempt. |
| EFF-06 | Never overwrite successful outputs or effects during recovery. |

## Other required functional behavior

Retry maxAttempts includes the first claim and is 1–10, default 3. Backoff after attempt n is `min(maxDelay, initialDelay * multiplier^(n-1))`; persist the selected timestamp. Jitter is optional and disabled in deterministic tests. Transient errors, lease loss, and execution timeout may retry. Input resolution, unknown contract, invalid output, and approval rejection are nonretryable in this reference design.

Timers persist a due time and consume no attempt. Approvals persist exact resolved input, digest, version, reviewer role, and deadline. Decisions require role, expected revision, and key. Pause blocks activation and claims while allowing already authorized completion and activated waits to settle. Cancellation fences unfinished authority, cancels pending waits, and preserves committed effects. Terminal state never reopens.

Provide all browser screens and API behaviors in source sections 16–17. Default pagination is 50, maximum 200. Lists are bounded, snapshots include an event high-water mark, and errors use stable codes and correlation IDs. All mutations define operation-scoped duplicate behavior; retries must not repeat effects.

Persist all source entities, constraints, audit history, fixtures, migrations, and receipts. Provide readiness, metrics, graceful shutdown, offline setup, backup/restore, disabled-by-default fault controls, and unit/integration/concurrent-process/browser verification. Exact detailed contracts are in [API](../contracts/api-contract.md), [state design](../design/run-lifecycle.md), and [quality requirements](quality-requirements.md).

# Transaction and concurrency protocol

This is the shared correctness contract for API requests and coordinators. A task-row update alone is insufficient: capacity, run eligibility, current authority, effects, and audit events must agree in the same transaction.

## Connection and isolation rules

Use SQLite on local disk, WAL, `synchronous=FULL`, `foreign_keys=ON`, no shared cache, and no read-uncommitted connections. Initialize/check pragmas explicitly. Configure Python connections for explicit transaction control (`isolation_level=None` in the proposed compatibility mode), then issue `BEGIN IMMEDIATE`, `COMMIT`, and `ROLLBACK` deliberately. Pin and test this behavior against the selected interpreter; do not mix implicit transaction modes.

Acquire the database write transaction **before** reading mutable eligibility/capacity. There is one writer for the database. All state-changing code uses this same route, including migration/startup administration. SQLite's write serialization and explicit transaction acquisition are described in [isolation](https://www.sqlite.org/isolation.html) and [transaction documentation](https://www.sqlite.org/lang_transaction.html). The higher-level protocol here is a project design, not a database-provided workflow feature.

Within a mutation, use a consistent logical access order: receipt → run → task IDs in sorted order → attempts → waits/decisions → artifacts/effects → events → receipt write. The global writer removes row-lock deadlock cycles; consistent order still makes later database changes and code review easier. Do not perform HTTP calls, file I/O, handler computation, or deliberate sleeps under the write lock.

## Time and linearization

Read UTC milliseconds using a database expression such as `CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER)`. Read after write-lock acquisition; re-evaluate immediately before the conditional authority/state update after bounded validation. All comparisons use one value for the related transition. Due means `now >= due_at`; valid means `now < lease_expires_at`, `now < execution_deadline`, and `now < run_deadline`.

A successful conditional state update is the operation's linearization point if its transaction commits. Another writer cannot interleave. Commit may return after a deadline passes; authority was checked at the serialized transition, not at HTTP-response time. Rollback produces no accepted transition. This rule makes timeout/completion races deterministic without pretending SQLite has a separate real-time clock.

## Atomic claim

```mermaid
sequenceDiagram
    participant W as Worker
    participant A as Worker API
    participant D as Database
    W->>A: Claim key and worker identity
    A->>D: BEGIN IMMEDIATE
    A->>D: Replay matching receipt if already committed
    A->>D: Read database time and registered capabilities
    A->>D: Find READY task in eligible run
    A->>D: Count RUNNING attempts globally, for run, handler, worker
    alt All limits have room and deadlines valid
        A->>D: Increment fence; insert attempt; set RUNNING
        A->>D: Append claim event and receipt; COMMIT
        A-->>W: Task, attempt, fence, lease and deadlines
    else No work or capacity
        A->>D: Store bounded empty-claim receipt; COMMIT
        A-->>W: No work; next poll uses a new key
    end
```

Filter compatible candidates ordered by `(ready_at, task_id)`; inspect candidates until an eligible capacity group is found. Count all state=RUNNING attempts, even expired ones not yet reconciled. This is conservative and prevents over-allocation. Reconciliation closes expired attempts, then future claims regain capacity. Enforce worker capacity too. A partial unique index on RUNNING attempts is a second defense against two attempts for one task.

Inside the claim transaction, recheck task READY, run QUEUED/ACTIVE and unpaused, nonexpired run deadline, registered worker capability/contract digest, attempt budget, and all limits. Assign `attempt_no=previous_claim_count+1`, increment `task.fence`, set `lease_expires_at=min(now+15000,execution_deadline)`, and persist fixed execution deadline. Insert attempt, update task/run revision and timestamps, append events, and store response receipt before commit.

## Capacity and controls

Counts come from authoritative attempt rows, not process memory. A completion/expiry/cancel closes an attempt in the same transaction that changes its task. Thus capacity cannot be released twice. Invariant checking compares counts to configured limits; there are no mutable capacity counters to reconcile. Configuration is immutable for a running session; changing limits requires stopping admission and ensuring existing occupancy is within the proposed new limit.

Pause serializes with claims and activation. A claim whose transition occurs before the pause transaction may finish; no claim or activation may transition afterward until resume. Cancellation/failure increments fences and closes active attempt rows before terminal settlement. Previously succeeded nodes remain unchanged.

## Conflicts, uncertain commits, and retry

On `SQLITE_BUSY`, roll back and retry the entire operation with the same request key using bounded application backoff (proposed 10, 25, 50, 100, 200 ms, with jitter outside the transaction). Limit the total HTTP write budget to two seconds; exhaustion returns 503 with retry guidance. Constraint conflicts are mapped by operation, never blindly retried. Never retry only the last statement of a failed transaction.

If COMMIT/connection outcome is uncertain, discard the connection and look up the receipt through a fresh connection. Same digest returns the committed response; absent receipt permits a full keyed retry; different digest is 409. Do not infer rollback from a lost HTTP response. Heartbeat retries with the same key replay that extension; a new heartbeat interval uses a new key.

Read a run, task summaries, revision, and history high-water mark in one short read transaction. Event pages filter `seq > after` and may use a captured upper bound. Never use wall-clock timestamps as history cursors. Every visible transition and its event are one commit; a rolled-back event sequence is not exposed.

## Verification

AC-09–16, AC-21/22/26/28 must use this protocol. Run claim, capacity, and stale-update contention for at least 100 rounds. Use real concurrent processes and deterministic barriers; passing a single-threaded repository unit test is insufficient.

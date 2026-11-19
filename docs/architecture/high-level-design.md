# High-level design

The database remembers what happened. The API accepts human and worker requests. Coordinators find work that is ready or overdue. Workers do the computation. The browser explains these records to people. No component needs an in-memory queue to survive a restart.

## System context

```mermaid
flowchart TB
    subgraph People["Fictional local roles"]
        A["Author"]
        O["Operator"]
        R["Reviewer"]
    end
    A --> B["Browser application"]
    O --> B
    R --> B
    B --> API["Loopback control and worker API"]
    API --> DB[("SQLite: authoritative state, history, artifacts")]
    C1["Coordinator process A"] --> DB
    C2["Optional coordinator process B"] --> DB
    W1["Worker process A"] --> API
    W2["Worker processes B–D"] --> API
    H["Local failure-test harness"] -.-> API
    H -.-> C1
    H -.-> W1
    H -.-> DB
```

## Deployment

One desktop hosts a browser, one API process, one or more coordinator processes, and four worker processes in the standard acceptance layout. SQLite is embedded in API/coordinator processes and stores a database plus WAL files on local disk. It is not a separate service or a network-shared file.

```mermaid
flowchart LR
    subgraph Desktop["One local machine; external network unavailable during runtime"]
        Browser["Browser: local HTML, CSS, JavaScript"] -->|"HTTP 127.0.0.1:8080"| API["API and static assets"]
        Workers["4 worker processes"] -->|"Loopback worker protocol"| API
        API --> TX["Shared transaction library"]
        Coord["1–2 coordinator processes"] --> TX
        TX --> Disk[("Local SQLite database and WAL")]
    end
```

Keep runtime state outside a OneDrive/synchronized checkout, for example under a dedicated local application-data directory. The source repository can be synchronized; a live WAL database must use a supported local filesystem. All modules use explicit database connections with foreign keys enabled and consistent journal/synchronous settings.

## Responsibilities and interfaces

| Component | Owns | Interfaces and detailed design |
| --- | --- | --- |
| Definition service | Draft revisions, graph validation, immutable publication | Author API; [definition design](../design/definitions.md) |
| Run service | Idempotent starts, snapshots, controls | Operator API; [run lifecycle](../design/run-lifecycle.md) |
| Coordinator | Activation, due waits/retries, expiry, final settlement | Direct transaction library; [coordinator](../design/coordinator.md) |
| Worker protocol/service | Registration, capability matching, claim, heartbeat, completion | Loopback worker API; [workers](../design/workers.md) |
| Handlers | Pure computation and prepared database-contained results | Versioned registry; [handler contract](../contracts/workflow-and-handlers.md) |
| Wait/decision service | Timers and immutable approval requests/decisions | Coordinator and reviewer API; [wait design](../design/timers-approvals.md) |
| Effect service | Stable keys, artifact/output atomicity, completion receipts | Transaction-only entry point; [effects](../design/effects.md) |
| Storage | Constraints, audit order, consistent snapshots | [Database](../design/database.md) and [transactions](../design/transactions.md) |
| Browser | Editing, monitoring, controls, exact review data | Bounded polling; [browser](../design/browser.md) |
| Operations/telemetry | Readiness, counters, structured diagnostics | [Observability](../design/observability.md) and [runbook](../operations/local-runbook.md) |
| Failure harness | Synthetic fixtures, process control, barriers, evidence | [Harness](../design/test-harness.md) |

## A run from start to finish

```mermaid
sequenceDiagram
    actor O as Operator
    participant B as Browser
    participant A as API
    participant D as Database
    participant C as Coordinator
    participant W as Worker
    O->>B: Start published version with fixture
    B->>A: Start plus stable request key
    A->>D: Atomic run, nodes, roots, history, receipt
    D-->>A: Committed run ID
    A-->>B: Accepted run and snapshot
    W->>A: Claim compatible task
    A->>D: Check capacity and create fenced attempt
    W->>A: Heartbeat and prepared completion
    A->>D: Atomic output, effect, success, history, receipt
    C->>D: Activate dependency successors or waits
    B->>A: Poll snapshot and events after cursor
    A-->>B: Durable progress and review request
```

## Correctness boundary

Every mutation uses `BEGIN IMMEDIATE`, checks its state and time preconditions after acquiring the SQLite write transaction, and commits related history in the same transaction. This serializes conflicting local writes and capacity checks. It also limits write throughput, so transactions contain no handler computation or network waits. This is a proposed design to verify, not a measured performance result.

SQLite documents its single-writer isolation model and write-transaction acquisition behavior. The application-level claim and capacity protocol is this project's design built on those primitives. See [SQLite isolation](https://www.sqlite.org/isolation.html) and [transactions](https://www.sqlite.org/lang_transaction.html).

The guarantee covers process stops and committed local storage under supported settings. It does not establish multi-machine consensus, external exactly-once effects, immunity to disk corruption, or trustworthy time through arbitrary wall-clock changes. Backups and explicit failure outcomes make those limits visible.

# Requirements traceability

Each numbered source requirement maps to a design and planned acceptance scenario. Coverage is a plan, not a test pass. All implementation evidence is **NOT RUN**. Source wording is retained below.

| ID | Source requirement | Design | Acceptance |
| --- | --- | --- | --- |
| DEF-01 | An author can create, edit, validate and delete unpublished drafts. | [Component design](../design/definitions.md) | AC-01, AC-25 |
| DEF-02 | Publishing creates an immutable version with an ID, version number, canonical content digest and publication timestamp. | [Component design](../design/definitions.md) | AC-01, AC-03 |
| DEF-03 | A run binds to a published version and digest permanently. Later versions affect only new runs. | [Component design](../design/definitions.md) | AC-03 |
| DEF-04 | Validation rejects cycles, duplicate node IDs, missing dependencies, self-dependencies and unknown node types or handler versions. | [Component design](../design/definitions.md) | AC-02 |
| DEF-05 | Validation rejects invalid retry policies, nonpositive timeouts, excessive sizes and references to unavailable upstream output. | [Component design](../design/definitions.md) | AC-02, AC-25 |
| DEF-06 | Inputs use literal JSON values and structured references. No eval, scripts, SQL or templated executable expressions are accepted. | [Component design](../design/definitions.md) | AC-25 |
| DEF-07 | Every worker handler declares its input contract, output contract and supported version. | [Component design](../design/definitions.md) | AC-02, AC-25 |
| DEF-08 | Errors identify the node, field and reason. Invalid definitions never create executable work. | [Component design](../design/definitions.md) | AC-02 |
| DEF-09 | A definition has 1 to 100 nodes, at most 500 edges, and a maximum encoded size of 256 KiB. These are configurable limits. | [Component design](../design/definitions.md) | AC-02, AC-25 |
| RUN-01 | Starting a run atomically creates its record, node instances, initial readiness and first history event. | [Component design](../design/run-lifecycle.md) | AC-01, AC-11 |
| RUN-02 | Start requires a caller-supplied idempotency key. Repeating the same key and canonical request returns the same run; a different request with that key returns a conflict. | [Component design](../design/run-lifecycle.md) | AC-11 |
| RUN-03 | A node becomes executable only after all dependencies succeed. Roots have no dependency barrier. | [Component design](../design/run-lifecycle.md) | AC-04 |
| RUN-04 | Independent eligible nodes may execute concurrently, within global, per-run and per-handler limits. | [Component design](../design/run-lifecycle.md) | AC-12, AC-14 |
| RUN-05 | Dispatch selects eligible work by ready timestamp and stable task ID, subject to capacity and lock availability. Strict global FIFO is not promised. | [Component design](../design/run-lifecycle.md) | AC-12, AC-14 |
| RUN-06 | Only registered compatible workers may claim a handler version. Missing worker capability is visible rather than silently skipped. | [Component design](../design/run-lifecycle.md) | AC-02, AC-14 |
| RUN-07 | A node exhausted by failure initiates fail-fast settlement: stop new claims and cancel or skip remaining work as specified below. | [Component design](../design/run-lifecycle.md) | AC-06 |
| RUN-08 | All node and run transitions use transactions, transition preconditions and durable events. | [Component design](../design/run-lifecycle.md) | AC-13, AC-16, AC-26 |
| RUN-09 | A run has a finite configurable deadline, default 24 hours. Expiry initiates failure settlement with a deadline reason. | [Component design](../design/run-lifecycle.md) | AC-26 |
| DUR-01 | Claiming a task atomically checks run eligibility and capacity, records the worker, increments the fence token, creates the attempt and stores lease expiry. | [Component design](../design/transactions.md) | AC-12, AC-14 |
| DUR-02 | Every heartbeat, result and effect commit identifies the task, attempt and fence token. Stale, expired or cancelled authority is rejected. | [Component design](../design/transactions.md) | AC-09, AC-16 |
| DUR-03 | Default lease duration is 15 seconds; heartbeat interval is 5 seconds; expiry scan interval is at most 1 second. | [Component design](../design/transactions.md) | AC-07 |
| DUR-04 | A heartbeat extends a valid lease but never extends the fixed attempt execution deadline. An expired lease cannot be revived. | [Component design](../design/transactions.md) | AC-09, AC-21 |
| DUR-05 | Worker loss closes the attempt as LOST and follows retry policy. Each claim consumes an attempt, including claims lost before useful work. | [Component design](../design/transactions.md) | AC-05, AC-07 |
| DUR-06 | Starting or restarting a coordinator reconciles overdue retries, timers, approvals and expired leases without resetting their timestamps. | [Component design](../design/transactions.md) | AC-08, AC-20 |
| DUR-07 | Database time is authoritative for durable deadlines. Process-local monotonic clocks may measure durations but do not replace persisted due times. | [Component design](../design/transactions.md) | AC-19, AC-21, AC-26 |
| DUR-08 | If the database becomes unavailable, workers stop accepting work and cannot commit effects. Resume only after authority is revalidated. | [Component design](../design/transactions.md) | AC-22 |
| DUR-09 | Multiple coordinator processes may coexist locally without double activation or double settlement; no process-local lock is the sole correctness mechanism. | [Component design](../design/transactions.md) | AC-13 |
| DUR-10 | A database restart retains committed state. An unacknowledged request may have committed, so clients retry using the same idempotency key. | [Component design](../design/transactions.md) | AC-11, AC-22 |
| EFF-01 | Built-in effect keys combine run ID, node ID and operation name. They do not contain attempt number. | [Component design](../design/effects.md) | AC-10, AC-11 |
| EFF-02 | Before committing an effect, verify current lease, fence token, run phase and attempt deadline in the transaction. | [Component design](../design/effects.md) | AC-09, AC-16, AC-21 |
| EFF-03 | A unique constraint prevents two committed effects with the same key. Existing effect content must match the expected digest; mismatches fail explicitly. | [Component design](../design/effects.md) | AC-10, AC-11 |
| EFF-04 | Built-in effect record, task output, attempt success, task success and completion history commit in one database transaction. | [Component design](../design/effects.md) | AC-10, AC-11 |
| EFF-05 | If a completion response is lost after commit, an identical completion retry returns the original receipt. Changed content or a superseded unfinished attempt is rejected. | [Component design](../design/effects.md) | AC-11 |
| EFF-06 | Successful task results and effects are never overwritten by restart, retry or a delayed worker. | [Component design](../design/effects.md) | AC-08, AC-09, AC-28 |

## Source sections without requirement IDs

| Source section | Coverage | Verification |
| --- | --- | --- |
| 1–4 Purpose, people, scope, environment | [Document](product-requirements.md) | AC-23, AC-25, AC-27; environment/ownership gate |
| 5 Canonical demonstration | [Document](../design/test-harness.md) | AC-23 |
| 6 Guarantees | [Document](../design/transactions.md) | AC-09–16, AC-28 |
| 9 Task/attempt transitions | [Document](../design/run-lifecycle.md) | AC-05–09, AC-15/16/21/26 |
| 11 Retry and timeout | [Document](../design/coordinator.md) | AC-05–08, AC-21/26 |
| 13 Timers, approvals, controls | [Document](../design/timers-approvals.md) | AC-15–20 |
| 14 Architecture | [Document](../architecture/high-level-design.md) | AC-07/08/13/22/27 |
| 15 Data model and constraints | [Document](../design/database.md) | AC-10–14/28; constraint tests |
| 16 API | [Document](../contracts/api-contract.md) | Contract tests; AC-11/18/24/25 |
| 17 Browser experience | [Document](../design/browser.md) | UX-01–07; AC-24/25 |
| 18 Local access | [Document](../security/local-security.md) | SEC-01–10; AC-25/27 |
| 19 Operations and observability | [Document](../operations/local-runbook.md) | AC-22/24/28; readiness/history/metrics tests |
| 20 Performance | [Document](../testing/performance-plan.md) | NFR-04–12 measurements |
| 21 Acceptance and repetitions | [Document](../testing/acceptance-catalog.md) | AC-01–28; 100/20 repetition rules |
| 22 Sessions | [Document](../delivery/implementation-plan.md) | Milestone exits and continuation |
| 23 Deliverables and done | [Document](../delivery/implementation-plan.md) | Release gates; acceptance report |
| 24 Open decisions | [Document](../delivery/risks.md) | Pre-implementation gates |
| 25 References | [Document](../architecture/decisions.md) | Primary-source architecture rationale |

## Added clarification requirements

PRD-01–09 map to the product document and AC-01–28. NFR-01–16 map to quality requirements and the performance/test plans. SEC-01–10 map to the local security design and AC-25/27. UX-01–07 map to browser journeys and AC-18/24/25. OPS-01–06 map to quality/runbook requirements and AC-22/27/28. These clarify source scope; they introduce no production deployment or external effects.

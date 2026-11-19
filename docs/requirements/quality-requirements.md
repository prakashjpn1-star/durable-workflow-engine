# Quality requirements and constraints

Correctness is the primary quality attribute. A quick response that loses an acknowledged effect is a defect, not a successful performance result. All performance values below are inherited provisional targets and remain unmeasured.

| ID | Requirement | Verification |
| --- | --- | --- |
| NFR-01 | Terminal states and successful outputs never reopen or change | Inspect before/after snapshots and invariant queries across every crash scenario |
| NFR-02 | At most one authorized attempt per task; no stale effects | Partial unique index plus 100 contention rounds and delayed completion barriers |
| NFR-03 | Every accepted state transition has one durable event | Transaction rollback tests and ordered history comparison |
| NFR-04 | Validate 100 nodes/500 edges within 1 s p95 over 100 definitions | Recorded graph benchmark |
| NFR-05 | Four workers, 100 active runs, no violated invariant | Concurrency suite with limits sampled in transactions |
| NFR-06 | Eligibility-to-claim p95 ≤2 s when matching capacity is free | Persisted eligibility/claim times; separate unavailable-capacity cases |
| NFR-07 | Expired work reconsidered ≤5 s after lease expiry under healthy services | Hard-kill timestamps and reconciliation evidence |
| NFR-08 | Paginated read p95 ≤500 ms at 10,000 runs/100,000 events | Prepared dataset and query-plan evidence |
| NFR-09 | Accepted state visible within 3 s with healthy local polling | Browser/server timestamp comparison |
| NFR-10 | ≥10 trivial task completions/s for 60 s with four workers | Exclude approval waits, sleeps, and business computation |
| NFR-11 | Services and database target <2 GiB steady RAM, excluding browser/build tools | Process-tree sampling and environment manifest |
| NFR-12 | 30-minute soak has no stuck eligible work or sustained memory-growth trend | Post-warm-up time series and final invariant scan |
| NFR-13 | All runtime assets and work operate with external network unavailable | Full offline acceptance journey |
| NFR-14 | Keyboard access and text labels for every required control and state | Browser walkthrough and accessibility checks |
| NFR-15 | Consistent restore preserves state, effects, audit, and receipts together | AC-28 against a new isolated runtime directory |
| NFR-16 | No unbounded payload, list, queue, or error response | Boundary tests at limit−1, limit, and limit+1 |

## Proposed configurable limits

| Setting | Default | Rule |
| --- | --- | --- |
| Definition | 256 KiB; 100 nodes; 500 edges | Check raw bytes before parse and graph counts before publication |
| JSON request/response | 1 MiB | Artifacts use a separate bounded download response |
| Inline task input/output | 64 KiB each | Larger controlled data travels by database artifact ID |
| Artifact | 8 MiB decoded bytes | Check prepared bytes before opening write transaction |
| Event payload | 16 KiB | Store summaries and references instead of complete data |
| Page | 50 default; 200 maximum | Opaque, filter-bound cursors |
| Global/run/handler capacity | 4 / 4 / 4 | Worker default 1; positive finite limits, verified inside claim |
| Retry | 3 attempts, 1 s initial, ×2, 10 s max | Max attempts 1–10; nonnegative finite delay; multiplier ≥1 |
| Attempt timeout | 30 s | Positive finite; independent of heartbeat extension |
| Run deadline | 24 h | Positive finite, maximum proposed 7 days |
| Timer/approval | 2 s demo / 1 h approval | Positive finite; effective deadline bounded by run deadline |
| Poll/reconciliation | Browser 1 s / coordinator ≤1 s | Back off disconnected browser reads; do not reset durable clocks |

## Environment and maintainability

OPS-01: ordinary local processes, no Docker or cloud dependencies. OPS-02: check installed tools and permitted packages before choosing exact versions. OPS-03: migrations are versioned and checksum-checked; an unknown newer schema blocks work. OPS-04: no startup path silently resets data. OPS-05: all identities and fixtures are fictional and generated. OPS-06: retain source/third-party notices and a continuation record per implementation session.

Metrics and logs help explain behavior but are not durable evidence on their own. Performance reports must retain failures and distinguish “not run,” “failed,” and “passed.” Any target change needs measured evidence and a recorded scope decision.

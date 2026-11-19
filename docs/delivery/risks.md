# Risks, assumptions, and open decisions

| ID | Risk or assumption | Impact | Mitigation / closure evidence |
| --- | --- | --- | --- |
| R-01 | Target interpreter/packages not supplied | Reference stack unavailable | Inventory permitted mirror; pin exact versions before coding |
| R-02 | SQLite single-writer contention | Missed latency/throughput | Short transactions, indexed due scans, measured contention; ADR review if insufficient |
| R-03 | Live database on synchronized/network disk | Unsupported WAL behavior/data loss | Require validated local runtime directory |
| R-04 | Canonicalization mismatch | Wrong idempotency/digests | Verified RFC vectors, strict parsing, one server canonicalizer |
| R-05 | Handler preparation bypasses authority | Duplicate or stale effect | API-only fenced atomic commit, no external effects |
| R-06 | Capacity or event ordering uses process memory | Race/invariant failures | Shared database transaction, counts and sequence allocation under write lock |
| R-07 | Timing-only tests miss crash window | False confidence | Explicit barriers and mandated repeats |
| R-08 | Local role demo mistaken for authentication | Unsafe exposure | Loopback/same-origin and clear demo labeling; no public runtime deployment |
| R-09 | Wall clock jumps | Early/late durable deadlines | Record time source/changes, clock-jump tests, document machine-clock limitation |
| R-10 | Report differs from approved bytes | Invalid human authorization | Pinned manifest/digest and server publication check |
| R-11 | Backup omits receipts/effects | Duplicate logical work after restore | Whole-database snapshot and keyed restore acceptance |
| R-12 | Programme ownership/approval unresolved | Project may be ineligible | Participant/reviewer decide independently; AI assistance disclosed |

Open decisions: exact package versions and permitted mirror; target desktop measurements; approval timeout/config maximum confirmation; disposable session bootstrap details; immutable-field triggers in production migrations; actual fixture digests; browser testing package availability. Each has a named milestone gate in the delivery plan. They do not prevent a complete documentation baseline, but they prevent claiming implementation readiness or release acceptance.

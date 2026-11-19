# Performance and resource measurement plan

All targets are provisional and unmeasured. Use [quality requirements](../requirements/quality-requirements.md) for the preserved thresholds. Record OS, CPU, RAM, local disk/filesystem, interpreter/SQLite/package versions, journal settings, configuration, dataset sizes, worker/coordinator counts, seed, warm-up, and sample method with every result.

| Experiment | Procedure | Report |
| --- | --- | --- |
| Validation | 100 representative 100-node/500-edge DAGs, repeated after warm-up | p50/p95/max, invalid cases separately; target p95 ≤1 s |
| Contention | Four workers, 100 active runs, global/run/handler/worker limits | Per-transaction occupancy assertions, busy retries, no invariant failures |
| Dispatch | Capture durable ready/claim times when compatible capacity free | p95 ≤2 s; separately report blocked-capacity waits |
| Recovery | Hard kill after claim, record lease expiry and reconciliation | Reconsideration ≤5 s after expiry when services/storage healthy |
| Read APIs | 10,000 retained runs and 100,000 events, bounded pages | p95 ≤500 ms by endpoint; include query plans |
| Browser | Timestamp server acceptance and confirmed visible state | ≤3 s under healthy polling |
| Throughput | Four workers, no-op handler, 60-second measured window | ≥10 completions/s; exclude artificial sleeps and business computation |
| RAM/soak | 30 minutes, bounded generation, sample process trees after warm-up | Target <2 GiB services/database; slope and stuck-ready checks |

Do not hold the global writer during report computation or wait for a worker under transaction. If write contention misses targets, first inspect transaction duration, indexes, batching, and heartbeat pressure. A database change requires an architecture decision and rerunning correctness evidence. Do not conceal a failed target by excluding difficult samples.

Performance report status: **NOT RUN**. Required fields for each experiment: build/commit, environment manifest, command/config, sample count, raw evidence path, observed values, pass/fail against original target, analysis, and any agreed revision.

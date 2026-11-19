# Observability and diagnostics

An operator should be able to explain why work has stopped: no worker can run it, capacity is full, a retry is due later, a reviewer has not decided, or storage is unavailable. A single “running” badge is insufficient.

```mermaid
flowchart TD
    Transitions["Committed domain transitions"] --> History[("Ordered durable history")]
    Services["API, coordinator, workers"] --> Logs["Bounded structured local logs"]
    DB[("Durable state") ] --> Metrics["Local counters, gauges, histograms"]
    History --> UI["Run timeline and diagnostics"]
    Logs --> Operator["Local investigation"]
    Metrics --> UI
```

Required event families: `definition.published` in definition audit; `run.created/paused/resumed/cancelling/failing/succeeded/failed/cancelled`; `task.ready/activated/claimed/succeeded/failed/skipped/cancelled`; `attempt.failed/timed_out/lost/cancelled`; `retry.scheduled/ready`; `timer.succeeded`; `approval.requested/approved/rejected/expired/cancelled`. One transition event includes before/after, actor, entity, reason, and bounded references. Heartbeats update contact and lease without filling the timeline.

Structured diagnostic fields include timestamp, level, code, process/worker ID, correlation ID, and applicable run/node/attempt/fence. Bound messages and redact authorization/session headers, tokens, and raw sensitive content. Process logs are disposable diagnostics; history is the durable explanation.

`GET /api/metrics` returns documented JSON with process-start time, counters since process start, and database-derived gauges. Gauges: READY/RUNNING/retry tasks, oldest ready age, active workers, approval age, occupancy by handler/run. Counters: claims, retries, lost leases, rejected fenced writes, outcomes. Histograms: API latency, eligibility-to-claim, task/run duration. Avoid unbounded run-ID metric labels; use drill-down APIs for individual runs.

Liveness means the API process responds. Readiness means storage is reachable, exact schema supported, registry/config valid, and journal/foreign-key settings checked. A degraded storage path returns readiness 503 with a stable bounded reason; it must not return healthy just because the HTTP server is alive.

Diagnostic run eligibility shows a reason list: paused, dependency pending, retry not due, timer pending, approval pending, handler unavailable, capacity full, run settling, or deadline expired. Coordinator scan lag and database busy/reconnect counts explain operational delays. Verify outage behavior through AC-22 and visibility through AC-24.

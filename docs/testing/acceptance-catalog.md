# Acceptance scenario catalog

Use a fresh isolated database, generated identities/fixtures, real local processes, and the configuration recorded in the evidence manifest. Assert committed rows after each operation. All scenarios are **NOT RUN**.

| ID | Scenario / action | Durable pass oracle |
| --- | --- | --- |
| AC-01 | Publish valid definition | Immutable version/digest exists and can start a run. |
| AC-02 | Reject invalid graphs | Cycles, duplicates, missing handlers and invalid references produce precise errors and no work. |
| AC-03 | Pin version | Publishing version 2 does not change a run started on version 1. |
| AC-04 | Parallel branches and join | Independent branches overlap; join starts only after both succeed. |
| AC-05 | Transient failures | A handler failing its first two attempts succeeds on attempt 3 with persisted delays. |
| AC-06 | Retry exhaustion | Final failure stops dispatch and settles remaining nodes with explicit reasons. |
| AC-07 | Hard worker kill | Kill after claim; expiry records LOST and another worker recovers within the configured bound. |
| AC-08 | Coordinator restart | Existing runs, retry timestamps and timer due times survive; no successful node reruns. |
| AC-09 | Stale completion | Old worker result and heartbeat after replacement are rejected; accepted result remains unchanged. |
| AC-10 | Effect crash before commit | Termination before the atomic commit leaves no effect or success; retry produces one effect. |
| AC-11 | Lost response after commit | Retry same completion and start requests; return original receipts with one effect and one run. |
| AC-12 | Competing claims | Four workers repeatedly contend for ready work; no task has two authorized attempts. |
| AC-13 | Multiple coordinators | Two coordinators reconcile concurrently without duplicate activation, decision or terminal events. |
| AC-14 | Capacity limits | Global, run and handler active counts never exceed their configured limits under contention. |
| AC-15 | Pause during execution | Existing attempts can finish; no new claim or node activation commits after pause until resume. |
| AC-16 | Cancel races | Pending work stops; stale completions fail; previously committed effects remain visible. |
| AC-17 | Approval after restart | Same request/input digest remains pending and can receive one valid decision. |
| AC-18 | Conflicting decisions | Two tabs approve/reject concurrently; one valid decision commits and the other receives conflict. |
| AC-19 | Approval expiry | Timeout fails the node; late approval cannot reopen it. |
| AC-20 | Durable timer | Restart halfway through wait; original due time is retained and successor executes once eligible. |
| AC-21 | Attempt timeout | Heartbeats do not extend execution deadline; late result cannot commit. |
| AC-22 | Database outage/restart | No fake success while unavailable; committed history returns and pending work recovers afterward. |
| AC-23 | Full demo | Canonical input yields 9,850 normalized records, expected counts/digest, approval and one published artifact. |
| AC-24 | Browser reload and two tabs | UI recovers accurate snapshots and accepted controls; execution continues without an open browser. |
| AC-25 | Input boundaries | Oversized input, executable expressions, path escape, unknown fixture and unauthorized actions are rejected. |
| AC-26 | Deadline and failure races | Run deadline and task success settle according to transactional order with no terminal-state reopening. |
| AC-27 | Offline operation | Start, execute, approve, recover and inspect runs with external network unavailable. |
| AC-28 | Backup restoration | Consistent snapshot restores run, effects and receipts; recovery creates no duplicate logical effects. |

## Execution details

Each case records setup, exact action/barrier, before/after database snapshot, HTTP receipts/errors, timing, invariant assertions, and cleanup target. AC-07/09/10/11/16/21 use the named barriers in the [harness design](../design/test-harness.md). Run claim/capacity/stale-update contention for at least 100 rounds; repeat every crash-window case at least 20 times. Preserve failed rounds.

For claims, sample occupancy within each serialized claim transaction, not only after completion. For approvals and controls, run both serialization orders. For API outage distinguish lost response from a rejected transaction. For SQLite restart close/reopen owning processes, and separately inject inaccessible storage to verify no false success. For offline acceptance disable external connectivity while preserving loopback and complete author/start/review/recovery/history journeys.

Add explicit tests for draft deletion/revision conflicts, publish duplicate receipt, all three node kinds as roots, absent output pointers, no-compatible-worker visibility, effect digest mismatch, changed completion under an old key, pagination boundaries, unknown newer schema refusal, artifact ownership, and unexpected Origin/Host. These are subcases of AC-01/02/11/14/24/25/28, not scope replacements.

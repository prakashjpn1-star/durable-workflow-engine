# Review of the supplied requirements

**Reviewed:** source version 0.1, dated 19 November 2026. **Outcome:** a strong basis for a local durability demonstration, with a few decisions that need explicit engineering answers. This is a document review, not a compliance or release approval.

The source already distinguishes repeated execution from deduplicated effects, covers control races, and asks for durable evidence. Those are the right boundaries. The greatest implementation risk is claiming correctness from a task-row lock while shared capacity, run controls, or effect writes happen elsewhere.

| Finding | Design response | Remaining validation |
| --- | --- | --- |
| Database and stack are intentionally open | Proposed Python/ASGI API and SQLite WAL; serialize every mutation with `BEGIN IMMEDIATE` | Check supplied mirror and actual interpreter/SQLite builds; prove contention targets |
| Literal objects can resemble structured references | Schema uses explicit `literal`, `runInput`, or `nodeOutput` binding envelopes | Confirm author experience during editor review |
| Run history cannot contain publication before a run exists | Keep per-workflow definition audit alongside per-run history | Verify publication/audit transaction in tests |
| A last valid lease check can precede a slow commit | Keep the write transaction short; sample database time again immediately before authority-dependent writes | Barrier tests around timeout and commit; document linearization precisely |
| Lost completion response needs an exception to ordinary lease checks | A matching immutable completion receipt may be replayed after expiry or terminal settlement | Prove changed content and unfinished stale attempts are rejected |
| Pause, rejection, and deadline behavior intersect | Existing waits settle while paused; rejection/expiry still initiates failure; new activation and claims stop | Race matrix, including pause before activation |
| Cancellation cannot undo a committed effect | Fence unfinished attempts and preserve successful outputs and effects | UI wording and before/after-commit tests |
| Embedded SQLite has no independent server to restart | Test closing all owning processes/reopening the database and separately inject storage unavailability | AC-22 must exercise both recovery and unavailable-storage behavior |
| Payload sizes were not fully specified | Proposed limits: 256 KiB definitions, 1 MiB JSON, 64 KiB inline outputs, 8 MiB per artifact, 16 KiB event payload | Measure the canonical demo and reject oversize before mutation |
| Canonical fixtures need a portable algorithm | Record a fixed generator, seed, sort order, expected counts and measured SHA-256 digests | Generate real digests during implementation; none are invented here |
| Resource and response targets are provisional | Preserve all targets in the performance plan | Measure on supplied desktop with full environment record |
| Programme approval and participant ownership are external decisions | Preserve the requirement and track it as a pre-implementation gate | Participant/programme reviewer resolve it independently |

The document's directions about evaluation sessions are requirements for that future workspace. They are not instructions to access unrelated systems, submit programme forms, or claim participant authorship. The current request authorizes creating this documentation project on GitHub. These documents are AI-assisted and require the participant's own review where the programme requires their own work.

## Proposed defaults that need to be visible

The reference design uses worker transport through a loopback API. Workers cannot write database records directly. Coordinator processes use the same transaction library against the same database. Global, run, handler, and worker capacity are checked by counting authoritative RUNNING attempt rows inside the write transaction. This avoids a second set of counters that can drift.

All deadlines use database-evaluated UTC milliseconds. A time at or after a deadline is expired. The database reads the machine's wall clock; this is not a separate clock service. Large clock changes can affect deadlines and must be recorded as a local-machine limitation.

Failure settlement fences all unfinished active attempts immediately. A computer process may continue computing after it loses authority. Terminal settlement waits for durable authority to be gone, not for the operating system to prove that every old thread has exited.

The repository owner requested the MIT license for this project. The root LICENSE records that choice. Preserve any applicable third-party notices when implementation dependencies are selected. The supplied source file is preserved without altering its claims or attribution.

# Effects, artifacts, and idempotency

Computation may repeat. A committed built-in effect must not. The implementation achieves this for database-contained effects by committing the effect and task success together, using a stable key and current authority.

## Completion transaction

```mermaid
sequenceDiagram
    participant W as Worker
    participant A as Completion service
    participant D as Database
    W->>A: Attempt, fence, output, prepared artifact and completion key
    A->>A: Bound bytes, validate output, canonicalize and digest
    A->>D: BEGIN IMMEDIATE; find scoped receipt
    alt Matching receipt already committed
        D-->>A: Original immutable receipt
        A-->>W: Original accepted result; no new effect
    else New completion
        A->>D: Recheck current attempt, fence, phase and deadlines
        A->>D: Insert immutable artifact and unique effect
        A->>D: Set output, attempt/task success; append events
        A->>D: Settle final run if appropriate; store receipt; COMMIT
        A-->>W: Committed result reference
    end
```

The publication effect key is the tuple `(run_id,node_id,operation)`, for example `(run-123,publish,persist-approved-report)`. Store fields separately; do not rely on ambiguous string concatenation. A unique constraint enforces the identity. The effect payload digest covers report digest, statistics digest, approval request and decision identity, and publication content. Attempt number is provenance, never part of the effect key.

The completion request digest covers operation, task/attempt/fence, output, prepared artifact digests/bytes, and effect intent. A receipt is scoped by authenticated actor/worker instance and operation/target. Reusing a key with changed canonical content returns `IDEMPOTENCY_CONFLICT`. An identical accepted receipt is replayable after expiry or terminal state; this returns evidence of the old commit and grants no new authority. A new key on an already completed attempt returns `ATTEMPT_TERMINAL`; clients preserve their original completion key.

## Atomic boundaries and crash windows

| Stop point | Durable result | Recovery |
| --- | --- | --- |
| After claim, before result preparation | RUNNING attempt only | Lease expiry and retry budget apply |
| After effect preparation, before commit | No committed artifact/effect/success from preparation | Transaction rolls back; retry computes again |
| After commit, before response | Artifact, effect, output, task/attempt success, events, receipt all exist | Replay identical completion key and return original receipt |
| After timeout/cancel before delayed completion | Old attempt closed/fenced | Reject result; no artifact/effect insertion |

Artifact preparation happens in bounded worker memory or disposable test scratch data; it is not an authoritative effect. Persist all built-in intermediate artifacts through fenced completion too. A report download is a derived export of committed bytes. It does not define whether the workflow effect occurred.

If the unique effect key exists with a different digest, fail `EFFECT_DIGEST_CONFLICT` without overwriting it. A matching existing effect found during a new unfinished completion is unexpected under this atomic design; validate provenance and treat it as an invariant/restore investigation rather than assuming a partly committed transaction. The ordinary lost-response path is the matching receipt path.

## Receipt lifetime

Do not expire receipts while their definitions, runs, attempts, or artifacts are retained. Backup and restore them together. This release has no automatic deletion/retention job. Short-lived heartbeat/empty-claim receipts may be bounded by an explicitly documented future retention policy only after proving that no duplicate can regain authority; baseline retains them for the test/session lifecycle.

## Approved content

The publication handler accepts the approval request/decision identity and the exact pinned artifact/digest manifest produced by the approval node. The server verifies that the decision was APPROVE for that same manifest, not just that some approval node succeeded. A report generated or edited after review cannot reuse that decision. EFF-01–06 and AC-10/11/16/23/28 verify this boundary.

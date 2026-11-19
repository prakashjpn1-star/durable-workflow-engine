# Local setup and operating runbook

These are implementation requirements and command-interface proposals. Runtime commands do not exist in this documentation-only baseline. The only runnable project command today is `node tools/validate-docs.mjs`.

```mermaid
flowchart LR
    Check["Check permitted tools and offline packages"] --> Pin["Pin versions and licenses"]
    Pin --> Migrate["Back up and explicitly migrate"]
    Migrate --> API["Start API and local assets"]
    API --> Coordinator["Start coordinator"]
    Coordinator --> Workers["Start workers"]
    Workers --> Ready["Verify readiness and browser journey"]
```

## Environment gate

Inventory actual CPython/SQLite versions and required features, OS/CPU/RAM/disk, available browser and permitted mirror. Confirm FastAPI, uvicorn, JSON Schema validator, RFC 8785 library, and browser test assets are obtainable under programme rules. Pin exact versions/hashes and licenses. Verify a clean offline install from permitted cached packages before accepting the reference stack. Do not download dependencies into a restricted evaluation workspace without its policy permitting that step.

Runtime state goes in a dedicated local non-synchronized directory, separate from the checkout. Proposed Windows location: `%LOCALAPPDATA%\DurableWorkflowEngine\runtime`. Test state uses an isolated sibling with a unique test ID. Do not place the live database in OneDrive, a network share, or the repository. Directory paths are operator configuration, never untrusted task inputs.

## Planned command interfaces

| Command contract | Expected behavior |
| --- | --- |
| `python -m dwe check-environment` | Print versions, package availability, filesystem/config checks; do not mutate data |
| `python -m dwe migrate --expected-version N` | Explicit checksummed migration after snapshot; refuse unknown/newer schema |
| `python -m dwe api --host 127.0.0.1 --port 8080` | Serve API and all browser assets; readiness gates work |
| `python -m dwe coordinator` | Reconcile persisted work; a second process is allowed |
| `python -m dwe worker --capacity 1` | Fresh instance, register compatible handlers, claim and heartbeat |
| `python -m dwe fixtures generate --seed 20261119` | Generate controlled fictional fixtures and manifest |
| `python -m dwe backup --destination controlled-path` | Consistent database snapshot and verification metadata |
| `python -m dwe reset-test-data --test-id ID` | Validate exact isolated test path; refuse normal runtime data |

Implement PowerShell launch/stop scripts around these commands using a PID manifest and hidden background windows. Normal startup never migrates or resets automatically. Log startup dependency errors clearly. Verify `/api/health` and `/api/ready` separately, then open the local browser and run the canonical journey.

## Operator procedures

To inspect stalled work, check readiness first, then pause flag/dependency/wait reason, matching worker capability, and occupancy. Inspect task attempt error and next eligible time before restarting anything. For storage failure, stop new work, preserve files/logs, repair access, and let services revalidate schema/authority and reconcile. Never edit task state manually to “unstick” a run.

To stop normally, drain workers, allow bounded completion, stop coordinators, then stop API. Preserve database/WAL files. Hard stops are recoverable through leases; committed effects remain. Restart API/coordinators/workers against the same directory and inspect overdue records. If success response was lost, retry the same request key rather than starting another run.

For an exhausted run, inspect the error and fix input/config/handler through normal versioned changes, then start a fresh run with a new key. Partial rerun and terminal resurrection are deferred. Record each session's completed work, failures, evidence, commit, and next step in the continuation log.

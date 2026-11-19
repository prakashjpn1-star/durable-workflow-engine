# Shared language

| Term | Plain-language meaning |
| --- | --- |
| Workflow | A named recipe of dependent steps |
| Draft | An editable recipe that cannot run yet |
| Definition version | A published, immutable recipe and content digest |
| DAG / AND join | An acyclic dependency graph; a join waits for every parent |
| Run | One execution pinned to one recipe and initial input |
| Task instance / node | One step in one run |
| Handler | Registered code that knows how to do a type of worker task |
| Attempt | One claimed opportunity to execute a worker task |
| Lease | A short-lived grant of authority to submit an attempt's progress/result |
| Fence | A generation number that makes an old worker's writes invalid |
| Retry wait | A recorded future eligibility time, retained through restart |
| Effect | A committed logical change, such as publishing one report record |
| Effect key | Stable run/node/operation identity shared by automatic retries |
| Artifact | Bounded immutable bytes stored in the database |
| Receipt | Durable proof that a particular mutation already committed |
| History high-water mark | Last event sequence included in a consistent snapshot |
| Reconciliation | Find durable work that is due or unfinished and move it safely forward |
| Settlement | Remove remaining authority and record the run's final outcome |
| At-least-once execution | Computation can repeat after uncertainty or failure |
| Deduplicated database effect | One logical database effect despite repeated computation |
| Paused | New activation/claims stop; active attempts and existing waits may settle |
| Cancelled | Unfinished work loses authority; committed work remains visible |
| Database time | UTC wall-clock time evaluated by the database in the owning transaction |
| Linearization point | The decisive successful conditional transition within a committed transaction |
| Synthetic fixture | Generated fictional records with repeatable expected output |

QUEUED, ACTIVE, FAILING, CANCELLING, SUCCEEDED, FAILED, and CANCELLED are run lifecycle values. PAUSED, WAITING, and RUNNING are display labels derived from lifecycle, pause, and task states. Keeping that distinction prevents two competing records of what a run is doing.

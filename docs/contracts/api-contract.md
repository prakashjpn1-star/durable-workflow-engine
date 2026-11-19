# HTTP API contract

This contract defines the intended API; no server is delivered in this documentation baseline. Base URL is `http://127.0.0.1:8080`. Requests use UTF-8 JSON except artifact download. Serve browser assets from the same origin.

## Shared rules

Every mutation requires `Idempotency-Key` (1–128 printable non-space ASCII characters), authenticated demo actor or worker identity, and an operation/target scope. Digest the method, normalized route target, expected revision, and canonical body. The receipt scope is `(actor,operation,target,key)`. Same content returns the original status/body with `Idempotent-Replay: true`; changed content returns 409. Receipts survive run settlement and restore. Invalid/forbidden requests need not create receipts because they produce no accepted mutation.

Browser mutations require the same-origin session and CSRF header. Worker mutations require the worker credential and registered instance. Use expected revisions in bodies for optimistic updates/decisions. Parse strict JSON once; bound bytes before parsing. Use 400 for malformed JSON/protocol and 422 for schema/semantic validation; never alternate those meanings arbitrarily.

| HTTP result | Meaning |
| --- | --- |
| 200 / 201 / 202 | Durable read, committed creation, or accepted durable operation; 202 is used only if settlement genuinely remains pending |
| 400 / 422 | Malformed request / invalid structured content |
| 401 / 403 / 404 | Missing session / insufficient role / resource absent |
| 409 | Revision, idempotency, decision, terminal-state, or authority conflict |
| 413 | Encoded request or decoded artifact too large |
| 503 | Storage/dependency unavailable or bounded transaction contention exhausted |

Error shape: `{"error":{"code":"REVISION_CONFLICT","message":"This draft changed. Reload before saving.","details":[{"nodeId":"normalize","pointer":"/input/rows","reason":"Missing upstream value"}],"correlationId":"opaque-id"}}`. Details are bounded and omitted when irrelevant. Never return stack traces or credentials.

## Human and read endpoints

| Method and path | Request / response | Role |
| --- | --- | --- |
| GET /api/health | 200 process liveness only | Local read |
| GET /api/ready | 200 exact schema/storage ready; otherwise 503 with code | Local read |
| GET /api/handlers | Versioned handler schemas and contract digests | Demo read |
| GET /api/definitions | Paginated workflow/draft/version summaries | Demo read |
| POST /api/definitions/drafts | `{name,document}` → 201 `{id,workflowId,revision}` | Author |
| GET /api/definitions/drafts/{id} | Draft/document/revision | Author |
| PUT /api/definitions/drafts/{id} | `{expectedRevision,document}` → updated revision | Author |
| DELETE /api/definitions/drafts/{id} | `{expectedRevision}` → 200 deletion receipt; unpublished only | Author |
| POST /api/definitions/drafts/{id}/validate | `{expectedRevision}` → normalized form/digest or structured errors | Author |
| POST /api/definitions/drafts/{id}/publish | `{expectedRevision}` → 201 `{definitionVersionId,version,digest}` | Author |
| GET /api/definitions/{id}/versions | Version metadata and immutable digests | Demo read |
| GET /api/definitions/versions/{id} | Canonical document and registry digest | Demo read |
| POST /api/runs | `{definitionVersionId,input,deadlineSeconds?}` → 201 run snapshot | Operator |
| GET /api/runs | Filters: phase, workflowId, createdFrom/To; cursor/limit | Demo read |
| GET /api/runs/{id} | `{run,revision,tasks,historyHighWaterMark}` in one snapshot | Demo read |
| POST /api/runs/{id}/pause | `{expectedRevision}` → durable run state/receipt | Operator |
| POST /api/runs/{id}/resume | `{expectedRevision}` → durable run state/receipt | Operator |
| POST /api/runs/{id}/cancel | `{expectedRevision,reason?}` → accepted outcome/receipt | Operator |
| GET /api/runs/{id}/tasks/{nodeId} | Bounded input/output, attempts, lease, retry and errors | Demo read |
| GET /api/runs/{id}/history | `afterSeq`, optional `throughSeq`, limit → ordered events | Demo read |
| GET /api/approvals | Pending role-permitted requests, cursor/limit | Reviewer |
| GET /api/approvals/{id} | Exact input/manifest/digest, revision, deadline, outcome | Matching reviewer |
| POST /api/approvals/{id}/decision | `{decision,reason,expectedRevision,inputDigest}` → receipt/outcome | Matching reviewer |
| GET /api/workers | Capabilities, last contact, capacity and active attempts | Demo read |
| GET /api/artifacts/{id} | Authorized bounded bytes, SHA-256 metadata, attachment filename | Authorized demo/assigned worker |
| GET /api/metrics | Documented JSON gauges, counters, histograms | Operator/author |

Default list limit is 50, maximum 200. Return `{items,nextCursor}`. Cursors encode a version, stable sort tuple and filter digest and are validated; they are not SQL fragments. Runs sort descending `(createdAt,id)`; history sorts ascending sequence. Approval/worker lists have stable ID tie-breakers. Pages do not claim a frozen entire dataset unless an upper bound is supplied.

Control revision is rechecked for a new command. A matching accepted receipt is replayed before revision/terminal checks. A pause/resume already in its requested state can return a no-change receipt when its expected revision is current. The UI refreshes on conflict rather than auto-retrying a different revision.

## Worker endpoints

| Method and path | Request / response |
| --- | --- |
| POST /internal/workers/register | `{workerId,capacity,capabilities:[{handler,version,contractDigest}]}` → registry acceptance |
| POST /internal/workers/{id}/claim | `{}` → 200 `{claim:null,retryAfterMs}` or full claim with authority status |
| POST /internal/attempts/{id}/heartbeat | `{workerId,taskId,fence}` → lease/deadline or authority conflict |
| POST /internal/attempts/{id}/complete | `{workerId,taskId,fence,output,artifacts,effect?}` → immutable completion receipt |
| POST /internal/attempts/{id}/fail | `{workerId,taskId,fence,error:{code,message,retryable}}` → classified outcome/retry time |
| GET /internal/attempts/{id} | Own attempt/authority status for reconnect reconciliation |
| POST /internal/workers/{id}/drain | Stop admission to this instance; retain existing attempt rules |

Each heartbeat uses a fresh key for a fresh extension; transport retry keeps the same key. Each claim poll gets a new key after a known response. Capability matching uses handler version and contract digest. Server chooses retryability from a stable allowlist; a worker cannot label every error transient to evade bounds.

Prepared artifacts use base64 in the worker completion envelope, bounded to 8 MiB decoded total per artifact and a proposed 12 MiB encoded completion endpoint limit. Ordinary API JSON remains 1 MiB. Validate decoded size and output/effect manifest before acquiring the write lock, then revalidate authority inside it. Claims return small artifact references rather than 10,000-row payloads.

Example start: `POST /api/runs` with `Idempotency-Key: demo-start-001` and body `{"definitionVersionId":"opaque-version-id","input":{"fixtureId":"canonical-v1"}}`. Example decision: `{"decision":"APPROVE","reason":"Counts and quality checked.","expectedRevision":1,"inputDigest":"actual-request-digest"}`. Placeholder IDs/digests illustrate shape only and are not fixtures or evidence.

Implementation should generate an OpenAPI description from these routes and verify it against contract tests. This baseline supplies a detailed human-readable contract rather than a misleading generated specification for an absent server.

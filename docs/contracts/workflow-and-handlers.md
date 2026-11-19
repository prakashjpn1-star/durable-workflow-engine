# Workflow and handler contracts

The [schema](../../schemas/workflow.schema.json) describes node shape and explicit bindings. The [example](../../examples/synthetic-report-review.json) supplies the full seven-node demonstration. Graph validation remains a semantic service responsibility.

## Input binding

Each input field is exactly one of `{"literal": JSON_VALUE}`, `{"runInput":"/fixtureId"}`, or `{"nodeOutput":"ancestor-id","pointer":"/artifactId"}`. JSON Pointer follows RFC 6901. References may reach transitive ancestors, never siblings/descendants. Resolve at node activation, store immutable resolved input and its digest, then validate the handler input contract. Missing or mistyped values fail without a worker claim.

Publication canonicalizes definition JSON with RFC 8785 and records SHA-256. Reject duplicate keys, invalid Unicode, nonfinite numbers, and non-interoperable numeric values. UI and workers do not choose a competing canonicalization. Decimal business values requiring exact precision are strings under their declared schema.

## Version 1 built-in handler registry

| Handler | Resolved input | Output | Preparation and commit |
| --- | --- | --- | --- |
| validate-dataset | `{fixtureId:string}` | `{validRowsArtifactId,rejectionsArtifactId,counts:{input,valid,invalid}}` | Read registered fixture, validate row IDs/category/integer value, prepare valid/rejected canonical data; commit artifacts with task success |
| normalize-dataset | `{validRowsArtifactId:string}` | `{normalizedArtifactId,counts:{valid,duplicates,distinct},normalizedDigest}` | Deduplicate by stable ID, reject unequal duplicate contents, sort canonical rows; fenced artifact commit |
| calculate-statistics | `{normalizedArtifactId:string}` | `{statisticsArtifactId,statisticsDigest,recordCount}` | Calculate count, integer sum, category counts and decimal-string average; immutable artifact |
| build-quality-report | `{normalizedArtifactId:string,rejectionsArtifactId:string}` | `{reportArtifactId,reportDigest,counts}` | Produce fixed-schema quality data; do not interpret HTML |
| persist-approved-report | `{approval:object}` | `{publishedArtifactId,effectKey:{runId,nodeId,operation},digest}` | Server verifies exact approved manifest; atomic artifact/effect/output/success/receipt |

Every entry has handler version 1, an input/output JSON Schema, and a contract digest in the immutable registry. All artifact IDs are controlled references; server checks run ownership and permitted producer ancestry. Handlers return prepared bytes/content-addressed placeholders; completion service assigns persisted artifact IDs and resolves placeholders atomically in output. Retries may prepare the same bytes but cannot bypass authority or overwrite artifacts.

Approval output contains `{requestId,decisionId,approvedInputDigest,manifest:{reportArtifactId,reportDigest,statisticsArtifactId,statisticsDigest}}`. Publication must consume that output. Approving one report cannot authorize publication of another. Timer output contains its original due and settled times.

Transient handler errors use explicit allowlisted codes such as `SYNTHETIC_TRANSIENT`; validation/unknown contract/output mismatch/conflicting duplicate data are nonretryable. Test-only handlers include a no-op, a fail-first-two handler, and barrier-controlled preparation. They are registered only in explicit test mode and are never executable expressions in workflow JSON.

## Registry compatibility

A worker declares the exact contract digest it implements. The server returns no claim on mismatch and exposes why. Published handler versions cannot be silently replaced. A new implementation contract requires a new version. Startup checks that versions needed by retained executable runs are available; otherwise readiness explains the missing capability/contract.

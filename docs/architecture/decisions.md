# Architecture decision records

These records propose an implementation direction. Exact dependency versions and desktop compatibility remain open until the permitted environment is checked. A decision changes only through an appended rationale and affected tests.

## ADR-001 — Local Python services and a small browser client

**Status:** proposed, dependency gate pending. Use a supported CPython 3.12-or-newer build, FastAPI/uvicorn for the loopback API, standard-library sqlite3, locally bundled vanilla HTML/CSS/JavaScript, JSON Schema validation, and a verified RFC 8785 canonicalization library. Browser test tooling is development-only and must be available offline before acceptance.

The interface needs an editor, tables, controls, and a modest DAG view; a browser framework is optional overhead. ASGI supplies a well-defined HTTP boundary. Each database operation uses a dedicated connection in a bounded synchronous execution pool; do not block the event loop with SQLite or share connection objects across requests.

**Alternatives:** PostgreSQL provides richer write concurrency but adds a local service to operate. A TypeScript implementation is viable if the supplied mirror and database bindings are better supported. These remain alternatives rather than additional databases to maintain. **Gate:** inventory interpreters, SQLite features, package mirrors, licenses, and offline browser tooling; pin permitted versions and hashes before implementation.

## ADR-002 — SQLite WAL with serialized mutation transactions

**Status:** proposed, contention proof pending. Use a single local database, WAL, foreign keys, `synchronous=FULL`, and explicit `BEGIN IMMEDIATE` for every state mutation. No shared cache or read-uncommitted mode. Read snapshots use short explicit read transactions.

SQLite permits one writer, making capacity counts and run-control preconditions serial within the same database. This keeps the proof manageable for a one-machine release. The cost is write contention. Count RUNNING attempts inside claims rather than maintaining separate global counters. Benchmark the design before claiming the throughput target.

Use the [official transaction](https://www.sqlite.org/lang_transaction.html), [WAL](https://www.sqlite.org/wal.html), [isolation](https://www.sqlite.org/isolation.html), and [synchronous-setting](https://www.sqlite.org/pragma.html#pragma_synchronous) documentation as primitive references. FULL is a chosen durability setting; it cannot compensate for storage that lies about synchronization.

## ADR-003 — Worker traffic through the local API

**Status:** proposed. Workers receive task/attempt/fence authority from the API and submit prepared output there. They have no database path or write credential. Coordinators call the same domain/transaction library directly. Centralizing worker mutations prevents a handler from bypassing effect fencing. The API is a local availability dependency, so its restart is part of recovery tests.

## ADR-004 — Current state plus atomic history

**Status:** proposed. Store current run/task/attempt records alongside ordered transition events. Use a per-run `next_event_seq` inside the write transaction. Keep definition publication in a separate per-workflow audit stream because no run exists at publication. Full event-sourced reconstruction is unnecessary for release 1.

## ADR-005 — Canonical JSON and explicit input bindings

**Status:** proposed. Use RFC 8785 bytes and SHA-256 for immutable definition, request, output, and effect digests. Reject duplicate object keys, nonfinite values, invalid Unicode, and values outside the chosen interoperable JSON number domain before hashing. A plain `sort_keys=True` serializer is not a proven substitute for JCS; verify the selected library against standard vectors. [RFC 8785](https://www.rfc-editor.org/rfc/rfc8785) defines the canonicalization scheme.

Bindings explicitly wrap literals (`{"literal": ...}`) and references (`runInput` or `nodeOutput` plus JSON Pointer). This refines the source's illustrative schema and removes ambiguity between data and reference syntax.

## ADR-006 — Database-contained effects and immutable receipts

**Status:** proposed. Every built-in result/artifact is committed with current authority and task success. Publication adds a unique run/node/operation effect. No external task side effects are supported. A matching committed receipt can be returned after a lost response without reviving authority; every new unfinished update still requires current authority.

## ADR-007 — Polling and an accessible graph alternative

**Status:** proposed. Poll snapshots and incremental history every second while visible and healthy. Polling is sufficient for the three-second target. Render a simple local SVG DAG plus a complete dependency table; do not fetch rendering libraries from a CDN. Cancel/review dialogs use server outcomes and preserve stale intent for the user to reconsider.

## ADR-008 — Consistent database backups and explicit startup

**Status:** proposed. Use SQLite's backup interface through Python to produce a complete snapshot, then verify it in an isolated path. Do not copy only the live main database file. Startup checks exact schema compatibility; migration is a separate explicit command with a prior backup. [SQLite backup](https://www.sqlite.org/backup.html) describes the underlying facility.

## ADR-009 — Immediate authority revocation during settlement

**Status:** proposed. Failure or cancellation fences all unfinished active attempts in the accepting transaction, marks their attempt outcomes CANCELLED, settles pending waits, and stops dispatch. CPU work may finish later but cannot mutate durable state. This provides bounded settlement without depending on forcibly killing arbitrary handler threads. Failure reason stays on the failed trigger task/run; unstarted siblings are SKIPPED, previously attempted siblings CANCELLED.

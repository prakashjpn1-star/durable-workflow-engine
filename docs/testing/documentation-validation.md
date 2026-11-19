# Documentation validation

Run `node tools/build-contracts.mjs` to regenerate the workflow schema/example, traceability, acceptance catalog/report, and diagram catalog. Then run `node tools/validate-docs.mjs` with a Node version that supplies `node:sqlite` (the baseline was checked using Node 26.5.1).

The validator checks local Markdown link targets, balanced fenced blocks, JSON parsing, coverage of every DEF/RUN/DUR/EFF requirement and AC-01–28, the seven-node example's DAG and ancestor bindings, and execution of the reference SQL in an in-memory database with integrity/foreign-key checks. It prints actual counts and fails on missing links or coverage.

Mermaid diagrams are included as editable fenced source. Fence checking does not establish Mermaid rendering or visual layout; renderer verification remains a separate review item. The SQL check establishes syntactic/relational setup, not engine concurrency correctness. Schema/example parsing does not replace validation with a full JSON Schema engine.

Engine acceptance, browser, crash, performance, and restore tests remain NOT RUN. The documentation validator must never be used to mark those scenarios passed.

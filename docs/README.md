# Documentation guide

This is the design baseline for release 1. It expands the supplied engineering scope into documents an author, implementer, reviewer, and operator can use. New choices are identified as proposals. No document grants programme approval or claims that acceptance tests have passed.

| Area | Documents |
| --- | --- |
| Source and review | [Original source](source/Durable_Workflow_Engine_Requirements.md), [review findings](review/source-review.md) |
| Requirements | [Product](requirements/product-requirements.md), [software](requirements/software-requirements.md), [quality and constraints](requirements/quality-requirements.md), [user journeys](requirements/user-journeys.md), [traceability](requirements/traceability.md), [glossary](requirements/glossary.md) |
| Architecture | [High-level design](architecture/high-level-design.md), [decisions](architecture/decisions.md), [diagram catalog](architecture/diagram-catalog.md) |
| Detailed design | [Component index](design/README.md), [definitions](design/definitions.md), [run lifecycle](design/run-lifecycle.md), [coordinator](design/coordinator.md), [workers](design/workers.md), [transactions](design/transactions.md), [effects](design/effects.md), [timers and approvals](design/timers-approvals.md), [database](design/database.md), [browser](design/browser.md), [observability](design/observability.md), [test harness](design/test-harness.md) |
| Contracts | [API](contracts/api-contract.md), [workflow and handlers](contracts/workflow-and-handlers.md), [workflow schema](../schemas/workflow.schema.json), [example workflow](../examples/synthetic-report-review.json), [reference DDL](../schemas/reference-schema.sql) |
| Security | [Local access and threat model](security/local-security.md) |
| Operations | [Local environment and runbook](operations/local-runbook.md), [backup and restore](operations/backup-restore.md) |
| Verification | [Test strategy](testing/test-strategy.md), [acceptance catalog](testing/acceptance-catalog.md), [performance plan](testing/performance-plan.md), [acceptance report](testing/acceptance-report.md), [documentation validation](testing/documentation-validation.md) |
| Delivery | [Implementation plan](delivery/implementation-plan.md), [risk register](delivery/risks.md), [status and continuation](delivery/status.md) |

Read the product document first, then the high-level design. For implementation, read the transaction protocol before changing any stateful component. A claim, cancellation, decision, or completion is correct only when it follows the same database rules as the other components.

Source IDs such as DEF-01 and AC-09 are preserved. Additional IDs use PRD, NFR, SEC, UX, or OPS prefixes. They clarify the source; they do not silently replace it. The traceability matrix includes every numbered source requirement, every acceptance scenario, and coverage for source sections without IDs.

Markdown is the editable source. Mermaid blocks render on GitHub and remain readable as text offline. Runtime browser graph rendering is a separate design choice and does not require Mermaid or internet access.

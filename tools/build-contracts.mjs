// Rebuild deterministic design artifacts from the preserved source and explicit contracts.
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
const write = (name, value) => { const target = path.join(root, name); fs.mkdirSync(path.dirname(target), {recursive:true}); fs.writeFileSync(target, value); };
const json = (name, value) => write(name, JSON.stringify(value, null, 2) + '\n');
const id = {type:'string',pattern:'^[a-z][a-z0-9-]{0,63}$'};
const binding = {oneOf:[
  {type:'object',required:['literal'],properties:{literal:{}},additionalProperties:false},
  {type:'object',required:['runInput'],properties:{runInput:{type:'string',pattern:'^(|/.*)$'}},additionalProperties:false},
  {type:'object',required:['nodeOutput','pointer'],properties:{nodeOutput:id,pointer:{type:'string',pattern:'^(|/.*)$'}},additionalProperties:false}
]};
const base = {id,kind:{type:'string'},dependsOn:{type:'array',uniqueItems:true,maxItems:99,items:id},input:{type:'object',maxProperties:100,additionalProperties:{$ref:'#/$defs/binding'}}};
const retry = {type:'object',required:['maxAttempts','initialDelaySeconds','multiplier','maxDelaySeconds'],properties:{maxAttempts:{type:'integer',minimum:1,maximum:10},initialDelaySeconds:{type:'number',minimum:0,maximum:86400},multiplier:{type:'number',minimum:1,maximum:100},maxDelaySeconds:{type:'number',minimum:0,maximum:86400}},additionalProperties:false};
const node = (kind, fields, required) => ({type:'object',required:['id','kind','dependsOn',...required],properties:{...base,kind:{const:kind},...fields},additionalProperties:false});
json('schemas/workflow.schema.json',{
  $schema:'https://json-schema.org/draft/2020-12/schema',
  $id:'https://github.com/prakashjpn1-star/durable-workflow-engine/workflow.schema.json',
  title:'Release 1 durable workflow definition',type:'object',required:['schemaVersion','name','nodes'],
  properties:{schemaVersion:{const:1},name:{type:'string',minLength:1,maxLength:128},nodes:{type:'array',minItems:1,maxItems:100,items:{oneOf:[
    node('worker',{handler:id,handlerVersion:{type:'integer',minimum:1},timeoutSeconds:{type:'number',exclusiveMinimum:0,maximum:604800},retry:{$ref:'#/$defs/retry'}},['handler','handlerVersion','input','timeoutSeconds','retry']),
    node('timer',{durationSeconds:{type:'number',exclusiveMinimum:0,maximum:604800}},['durationSeconds']),
    node('approval',{reviewerRole:{const:'reviewer'},decisionTimeoutSeconds:{type:'number',exclusiveMinimum:0,maximum:604800}},['input','reviewerRole','decisionTimeoutSeconds'])
  ]}}},additionalProperties:false,$defs:{binding,retry},
  $comment:'Semantic validation additionally checks encoded bytes, edge limit, unique node IDs, DAG, ancestor references, registry contracts and effective run deadlines.'
});
const ref = (nodeOutput,pointer)=>({nodeOutput,pointer});
const worker = (id,handler,dependsOn,input)=>({id,kind:'worker',handler,handlerVersion:1,dependsOn,input,timeoutSeconds:30,retry:{maxAttempts:3,initialDelaySeconds:1,multiplier:2,maxDelaySeconds:10}});
json('examples/synthetic-report-review.json',{schemaVersion:1,name:'synthetic-report-review',nodes:[
  worker('validate','validate-dataset',[],{fixtureId:{runInput:'/fixtureId'}}),
  worker('normalize','normalize-dataset',['validate'],{validRowsArtifactId:ref('validate','/validRowsArtifactId')}),
  worker('statistics','calculate-statistics',['normalize'],{normalizedArtifactId:ref('normalize','/normalizedArtifactId')}),
  worker('quality','build-quality-report',['normalize'],{normalizedArtifactId:ref('normalize','/normalizedArtifactId'),rejectionsArtifactId:ref('validate','/rejectionsArtifactId')}),
  {id:'review-delay',kind:'timer',dependsOn:['statistics','quality'],durationSeconds:2},
  {id:'review',kind:'approval',dependsOn:['review-delay'],reviewerRole:'reviewer',decisionTimeoutSeconds:3600,input:{reportArtifactId:ref('quality','/reportArtifactId'),reportDigest:ref('quality','/reportDigest'),statisticsArtifactId:ref('statistics','/statisticsArtifactId'),statisticsDigest:ref('statistics','/statisticsDigest')}},
  worker('publish','persist-approved-report',['review'],{approval:ref('review','')})
]});
const source=fs.readFileSync(path.join(root,'docs/source/Durable_Workflow_Engine_Requirements.md'),'utf8');
const rows=source.split(/\r?\n/).filter(x=>/^\| (DEF|RUN|DUR|EFF|AC)-\d\d \|/.test(x)).map(x=>x.split('|').slice(1,-1).map(s=>s.trim()));
const designs={DEF:'../design/definitions.md',RUN:'../design/run-lifecycle.md',DUR:'../design/transactions.md',EFF:'../design/effects.md'};
const cases={
  'DEF-01':'AC-01, AC-25','DEF-02':'AC-01, AC-03','DEF-03':'AC-03','DEF-04':'AC-02','DEF-05':'AC-02, AC-25','DEF-06':'AC-25','DEF-07':'AC-02, AC-25','DEF-08':'AC-02','DEF-09':'AC-02, AC-25',
  'RUN-01':'AC-01, AC-11','RUN-02':'AC-11','RUN-03':'AC-04','RUN-04':'AC-12, AC-14','RUN-05':'AC-12, AC-14','RUN-06':'AC-02, AC-14','RUN-07':'AC-06','RUN-08':'AC-13, AC-16, AC-26','RUN-09':'AC-26',
  'DUR-01':'AC-12, AC-14','DUR-02':'AC-09, AC-16','DUR-03':'AC-07','DUR-04':'AC-09, AC-21','DUR-05':'AC-05, AC-07','DUR-06':'AC-08, AC-20','DUR-07':'AC-19, AC-21, AC-26','DUR-08':'AC-22','DUR-09':'AC-13','DUR-10':'AC-11, AC-22',
  'EFF-01':'AC-10, AC-11','EFF-02':'AC-09, AC-16, AC-21','EFF-03':'AC-10, AC-11','EFF-04':'AC-10, AC-11','EFF-05':'AC-11','EFF-06':'AC-08, AC-09, AC-28'
};
let trace='# Requirements traceability\n\nEach numbered source requirement maps to a design and planned acceptance scenario. Coverage is a plan, not a test pass. All implementation evidence is **NOT RUN**. Source wording is retained below.\n\n| ID | Source requirement | Design | Acceptance |\n| --- | --- | --- | --- |\n';
for(const [code,requirement] of rows.filter(x=>!x[0].startsWith('AC')))trace+=`| ${code} | ${requirement} | [Component design](${designs[code.split('-')[0]]}) | ${cases[code]} |\n`;
trace+='\n## Source sections without requirement IDs\n\n| Source section | Coverage | Verification |\n| --- | --- | --- |\n';
const sectionCoverage=[
 ['1–4 Purpose, people, scope, environment','product-requirements.md','AC-23, AC-25, AC-27; environment/ownership gate'],
 ['5 Canonical demonstration','../design/test-harness.md','AC-23'],['6 Guarantees','../design/transactions.md','AC-09–16, AC-28'],
 ['9 Task/attempt transitions','../design/run-lifecycle.md','AC-05–09, AC-15/16/21/26'],['11 Retry and timeout','../design/coordinator.md','AC-05–08, AC-21/26'],
 ['13 Timers, approvals, controls','../design/timers-approvals.md','AC-15–20'],['14 Architecture','../architecture/high-level-design.md','AC-07/08/13/22/27'],
 ['15 Data model and constraints','../design/database.md','AC-10–14/28; constraint tests'],['16 API','../contracts/api-contract.md','Contract tests; AC-11/18/24/25'],
 ['17 Browser experience','../design/browser.md','UX-01–07; AC-24/25'],['18 Local access','../security/local-security.md','SEC-01–10; AC-25/27'],
 ['19 Operations and observability','../operations/local-runbook.md','AC-22/24/28; readiness/history/metrics tests'],['20 Performance','../testing/performance-plan.md','NFR-04–12 measurements'],
 ['21 Acceptance and repetitions','../testing/acceptance-catalog.md','AC-01–28; 100/20 repetition rules'],['22 Sessions','../delivery/implementation-plan.md','Milestone exits and continuation'],
 ['23 Deliverables and done','../delivery/implementation-plan.md','Release gates; acceptance report'],['24 Open decisions','../delivery/risks.md','Pre-implementation gates'],['25 References','../architecture/decisions.md','Primary-source architecture rationale']
];
for(const [section,file,verification] of sectionCoverage)trace+=`| ${section} | [Document](${file}) | ${verification} |\n`;
trace+='\n## Added clarification requirements\n\nPRD-01–09 map to the product document and AC-01–28. NFR-01–16 map to quality requirements and the performance/test plans. SEC-01–10 map to the local security design and AC-25/27. UX-01–07 map to browser journeys and AC-18/24/25. OPS-01–06 map to quality/runbook requirements and AC-22/27/28. These clarify source scope; they introduce no production deployment or external effects.\n';
write('docs/requirements/traceability.md',trace);
const acRows=rows.filter(x=>x[0].startsWith('AC'));
let catalog='# Acceptance scenario catalog\n\nUse a fresh isolated database, generated identities/fixtures, real local processes, and the configuration recorded in the evidence manifest. Assert committed rows after each operation. All scenarios are **NOT RUN**.\n\n| ID | Scenario / action | Durable pass oracle |\n| --- | --- | --- |\n';
for(const [code,scenario,evidence] of acRows)catalog+=`| ${code} | ${scenario} | ${evidence} |\n`;
catalog+='\n## Execution details\n\nEach case records setup, exact action/barrier, before/after database snapshot, HTTP receipts/errors, timing, invariant assertions, and cleanup target. AC-07/09/10/11/16/21 use the named barriers in the [harness design](../design/test-harness.md). Run claim/capacity/stale-update contention for at least 100 rounds; repeat every crash-window case at least 20 times. Preserve failed rounds.\n\nFor claims, sample occupancy within each serialized claim transaction, not only after completion. For approvals and controls, run both serialization orders. For API outage distinguish lost response from a rejected transaction. For SQLite restart close/reopen owning processes, and separately inject inaccessible storage to verify no false success. For offline acceptance disable external connectivity while preserving loopback and complete author/start/review/recovery/history journeys.\n\nAdd explicit tests for draft deletion/revision conflicts, publish duplicate receipt, all three node kinds as roots, absent output pointers, no-compatible-worker visibility, effect digest mismatch, changed completion under an old key, pagination boundaries, unknown newer schema refusal, artifact ownership, and unexpected Origin/Host. These are subcases of AC-01/02/11/14/24/25/28, not scope replacements.\n';
write('docs/testing/acceptance-catalog.md',catalog);
let report='# Acceptance execution report\n\nBuild/commit: not implemented. Environment: not measured. Execution date: not run. Overall release verdict: **NOT RUN — no engine implementation exists yet**. Documentation checks are reported separately.\n\n| Case | Outcome | Repetitions | Evidence | Defect / notes |\n| --- | --- | --- | --- | --- |\n';
for(const [code] of acRows)report+=`| ${code} | NOT RUN | 0 | None | Await implementation |\n`;
report+='\nDo not replace NOT RUN with PASS without retained evidence. Record planned and actual repetition counts, every failed round, invariant results, environment/seed, and unresolved defects. Performance and restore verdicts must be explicit. Release requires every mandatory case and repetition gate, not an average pass rate.\n';
write('docs/testing/acceptance-report.md',report);
let diagrams='# Diagram catalog\n\nAll diagrams are editable Mermaid blocks in the linked documents. They cover system boundaries, every logical component, state machines, and the critical races. The local product does not download Mermaid at runtime.\n\n| Document | Diagram types and purpose |\n| --- | --- |\n';
const diagramDocs=[['../architecture/high-level-design.md','System context, deployment, end-to-end execution sequence'],['../requirements/product-requirements.md','Complete demonstration DAG'],['../requirements/user-journeys.md','Human journey'],['../design/README.md','Component dependency map'],['../design/definitions.md','Validation/publication flow'],['../design/run-lifecycle.md','Run and task state machines'],['../design/transactions.md','Atomic claim and capacity sequence'],['../design/coordinator.md','Reconciliation and activation loop'],['../design/workers.md','Worker lifecycle and stale-worker recovery'],['../design/effects.md','Atomic completion and receipt sequence'],['../design/timers-approvals.md','Timer recovery and conflicting reviewer sequence'],['../design/database.md','Entity relationship model'],['../design/browser.md','Browser module/data flow'],['../design/observability.md','History, logs, metrics and diagnosis'],['../design/test-harness.md','Harness/process/evidence topology'],['../security/local-security.md','Trust and validation boundaries'],['../operations/local-runbook.md','Setup/startup flow'],['../operations/backup-restore.md','Consistent backup and recovery'],['../testing/test-strategy.md','Verification layers'],['../delivery/implementation-plan.md','Delivery milestones']];
for(const [file,purpose]of diagramDocs)diagrams+=`| [Design](${file}) | ${purpose} |\n`;
write('docs/architecture/diagram-catalog.md',diagrams);
console.log('Generated workflow schema, full example, complete traceability, acceptance catalog/report and diagram catalog.');

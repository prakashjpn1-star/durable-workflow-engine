import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
const root=path.resolve(import.meta.dirname,'..');
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).filter(x=>!['.git','node_modules'].includes(x.name)).flatMap(x=>x.isDirectory()?walk(path.join(dir,x.name)):[path.join(dir,x.name)]);
const files=walk(root), errors=[]; let links=0, diagrams=0;
for(const file of files.filter(x=>x.endsWith('.md'))){
  const text=fs.readFileSync(file,'utf8');
  if((text.match(/^```/gm)||[]).length%2)errors.push(`${file}: unbalanced code fences`);
  diagrams+=(text.match(/^```mermaid\s*$/gm)||[]).length;
  // External source URLs are not local links. Fragments are intentionally ignored here.
  for(const match of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)){
    const target=match[1].replace(/^<|>$/g,''); if(/^[a-z]+:|^#/.test(target))continue;
    links++; if(!fs.existsSync(path.resolve(path.dirname(file),decodeURIComponent(target.split('#')[0]))))errors.push(`${path.relative(root,file)}: missing ${target}`);
  }
}
for(const file of files.filter(x=>x.endsWith('.json')))try{JSON.parse(fs.readFileSync(file,'utf8'));}catch(e){errors.push(`${file}: ${e.message}`);}
const source=fs.readFileSync(path.join(root,'docs/source/Durable_Workflow_Engine_Requirements.md'),'utf8');
const trace=fs.readFileSync(path.join(root,'docs/requirements/traceability.md'),'utf8');
const catalog=fs.readFileSync(path.join(root,'docs/testing/acceptance-catalog.md'),'utf8');
const ids=[...new Set(source.match(/\b(?:DEF|RUN|DUR|EFF)-\d\d\b/g))];
for(const id of ids)if(!trace.includes(`| ${id} |`))errors.push(`Missing traceability ${id}`);
for(let n=1;n<=28;n++){const id=`AC-${String(n).padStart(2,'0')}`;if(!catalog.includes(`| ${id} |`))errors.push(`Missing acceptance ${id}`);}
const example=JSON.parse(fs.readFileSync(path.join(root,'examples/synthetic-report-review.json'),'utf8'));
const nodes=new Map(example.nodes.map(n=>[n.id,n]));assert.equal(nodes.size,7);
const visited=new Set(), active=new Set();
const visit=id=>{assert(nodes.has(id),`missing ${id}`);assert(!active.has(id),'cycle');if(visited.has(id))return;active.add(id);for(const dep of nodes.get(id).dependsOn)visit(dep);active.delete(id);visited.add(id);};
for(const id of nodes.keys())visit(id);
const ancestors=id=>new Set(nodes.get(id).dependsOn.flatMap(p=>[p,...ancestors(p)]));
for(const n of nodes.values())for(const b of Object.values(n.input||{}))if(b.nodeOutput)assert(ancestors(n.id).has(b.nodeOutput),`nonancestor reference in ${n.id}`);
const db=new DatabaseSync(':memory:');db.exec(fs.readFileSync(path.join(root,'schemas/reference-schema.sql'),'utf8'));
assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(),[]);assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check,'ok');
const tables=db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().length;db.close();
if(errors.length){console.error(errors.join('\n'));process.exitCode=1;}else console.log(JSON.stringify({result:'PASS',markdownFiles:files.filter(x=>x.endsWith('.md')).length,localLinks:links,mermaidBlocks:diagrams,sourceRequirements:ids.length,acceptanceCases:28,exampleNodes:nodes.size,referenceSqlTables:tables,checks:['local link targets','code fence balance','JSON parsing','source ID coverage','AC coverage','example DAG and ancestor bindings','reference DDL execution, integrity and foreign keys'],limits:'Does not run engine acceptance tests or render Mermaid diagrams.'},null,2));

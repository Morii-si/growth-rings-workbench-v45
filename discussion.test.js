import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,addManualVersion,restore,advance,prepareDraft,commitDraft,claimReferences,saveRule,canReviewDisclosure} from './engine.js';
import {ensureMemory,memoriesAt,contextFor,discussionContext,recordDiscussion,snapshotMemories} from './research-memory.js';
import {answerMarkup,discussionPanel,researchQuestions,revisionRecordPanel} from './discussion-view.js';
import {memoryArchive} from './board.js';
import {followupBoard} from './research-continuity.js';
test('V1 has original scenario discussions and cannot retrieve V2 facts',()=>{const s=initialState();ensureMemory(s);const v1=memoriesAt(s,s.versions[0]);assert.equal(v1.length,4);assert.ok(v1.every(m=>m.kind==='demo'&&m.date==='2026.02'));assert.ok(contextFor(s,'excluding',s.versions[0]).every(m=>m.source==='original'));assert.deepEqual(s.discussions.find(m=>m.id==='demo-platform').contextIds,['origin-platform','origin-lifecycle']);});
test('a question is saved verbatim and is not silently promoted to a reusable conclusion',()=>{const s=initialState();const m=recordDiscussion(s,{question:'这能证明平台能力了吗？',answer:'已记录',topic:'平台能力'});assert.equal(m.conclusion,'');assert.equal(m.status,'open');assert.ok(!contextFor(s,'platform').some(x=>x.id===m.id));});
test('confirmed history freezes full discussion content while next revision captures current edits',()=>{const s=initialState();ensureMemory(s);const m=recordDiscussion(s,{question:'当时的问题',answer:'当时的答复',topic:'平台能力'});m.conclusion='保留的要点';m.status='included';addManualVersion(s,'第一次修订','理由');snapshotMemories(s);const v3=s.versions.at(-1);m.conclusion='后来修改的要点';m.topic='收入结构';m.status='excluded';const historical=memoriesAt(s,v3).find(x=>x.id===m.id);assert.equal(historical.conclusion,'保留的要点');assert.equal(historical.topic,'平台能力');assert.equal(historical.status,'included');addManualVersion(s,'第二次修订','新的理由');snapshotMemories(s);assert.equal(memoriesAt(s,s.versions.at(-1)).find(x=>x.id===m.id).conclusion,'后来修改的要点');});
test('migration adds initial scenario discussions once and preserves user records and versions',()=>{const s=initialState();s.discussions=[{id:'my-note',question:'我的内容',answer:'答复',topic:'平台能力',conclusion:'我的要点',status:'included',kind:'user'}];const old=structuredClone(s.versions);ensureMemory(s);ensureMemory(s);assert.equal(s.discussions.length,6);assert.equal(s.discussions.find(x=>x.id==='my-note').question,'我的内容');assert.deepEqual(s.versions,old);});

test('stopping a current takeaway overrides carried history without changing the old snapshot',()=>{const s=initialState();ensureMemory(s);const carry=s.versions[0];assert.ok(discussionContext(s,'platform',carry).some(m=>m.id==='origin-platform'));s.discussions.find(m=>m.id==='origin-platform').status='excluded';assert.ok(!discussionContext(s,'platform',carry).some(m=>m.id==='origin-platform'));assert.equal(memoriesAt(s,carry).find(m=>m.id==='origin-platform').status,'included');});
test('conversation emphasis preserves authored text and escapes arbitrary input',()=>{const text='已有 IP 的持续经营与新 IP 能否接续，需要持续的多期证据。';const html=answerMarkup({id:'demo-platform',kind:'demo',answer:text});assert.match(html,/<mark>/);assert.equal(html.replace(/<\/?mark>/g,''),text);const arbitrary=answerMarkup({id:'demo-platform',kind:'user',answer:'<img src=x onerror=alert(1)> 新 IP 能否接续'});assert.doesNotMatch(arbitrary,/<img|<mark>/);assert.match(arbitrary,/&lt;img/);});

test('disclosure review is available without a matching reminder, including no-change reviews',()=>{
 for(const rule of [null,{object:'molly',threshold:0,active:false},{object:'molly',threshold:50,active:true}]){
  const s=initialState();assert.equal(canReviewDisclosure(s),false);assert.throws(()=>prepareDraft(s));
  if(rule)saveRule(s,rule);advance(s);assert.equal(s.alert,'none');assert.equal(canReviewDisclosure(s),true);
  prepareDraft(s).selected=[false,false,false];assert.equal(commitDraft(s),false);assert.equal(s.versions.length,2);assert.equal(s.reviews.length,1);
  prepareDraft(s).selected=[false,true,false];assert.equal(commitDraft(s),true);assert.equal(s.versions.length,3);
 }
});
test('changed claims point to an immutable real review; unchanged and manual claims retain their origin',()=>{
 const s=advance(initialState());ensureMemory(s);prepareDraft(s).selected=[false,true,false];commitDraft(s);snapshotMemories(s);
 const v3=s.versions.at(-1),refs=claimReferences(s,v3),review=structuredClone(s.reviews[0]);
 assert.deepEqual(refs[0],{kind:'discussion',id:'demo-concentration'});assert.deepEqual(refs[1],{kind:'review',id:review.id});
 assert.equal(review.baseVersion,2);assert.equal(review.afterClaims[1],v3.claims[1]);assert.equal(review.beforeClaims[1],s.versions[1].claims[1]);
 const html=researchQuestions(s,{history:3},v3);assert.match(html,/data-action="revision-ref"/);assert.doesNotMatch(html,/data-id="demo-old-ip"/);
 const panel=revisionRecordPanel(s,{revisionRef:{...refs[1],question:1}});assert.match(panel,/38.4%/);assert.match(panel,/33.6%/);assert.match(panel,/history-2/);
 addManualVersion(s,'仅修改总判断','新理由');snapshotMemories(s);assert.deepEqual(claimReferences(s,s.versions.at(-1)),refs);
 prepareDraft(s).texts[1]='下一轮的新判断';commitDraft(s);snapshotMemories(s);
 assert.deepEqual(s.reviews[0],review);assert.deepEqual(claimReferences(s,v3),refs);assert.notEqual(claimReferences(s,s.versions.at(-1))[1].id,review.id);
});
test('legacy ID-based history freezes once at migration and clearly discloses its incomplete origin',()=>{
 const s=initialState();ensureMemory(s);const m=recordDiscussion(s,{question:'原始问题',answer:'原始回复',topic:'平台能力'});m.conclusion='迁移时要点';m.status='included';
 addManualVersion(s,'旧档修订','旧理由');snapshotMemories(s);delete s.versions.at(-1).memorySnapshot;
 const restored=restore(JSON.stringify(s)),v=restored.versions.at(-1),baseline=structuredClone(v);
 restored.discussions.find(x=>x.id===m.id).conclusion='升级后编辑';restored.discussions.find(x=>x.id===m.id).topic='收入结构';restored.discussions.find(x=>x.id===m.id).status='excluded';
 assert.equal(memoriesAt(restored,v).find(x=>x.id===m.id).conclusion,'迁移时要点');assert.deepEqual(restore(JSON.stringify(restored)).versions.at(-1),baseline);
 const ui={history:3,memoryQuery:'',ask:''};assert.match(discussionPanel(restored,ui,v),/迁移时冻结，历史要点不完整/);assert.match(memoryArchive(restored,ui,v),/迁移时冻结，历史要点不完整/);
});
test('migration never invents a missing historical scope or alters a complete snapshot',()=>{
 const s=initialState();ensureMemory(s);addManualVersion(s,'修订一','理由');snapshotMemories(s);const complete=structuredClone(s.versions.at(-1));
 addManualVersion(s,'无范围的旧修订','旧理由');const restored=restore(JSON.stringify(s));
 assert.deepEqual(restored.versions[2],JSON.parse(JSON.stringify(complete)));assert.deepEqual(memoriesAt(restored,restored.versions[3]),[]);assert.equal(restored.versions[3].memoryRecovery.scopeRecorded,false);
 assert.equal(restored.versions[0].memoryRecovery,undefined);assert.equal(memoriesAt(restored,restored.versions[0]).length,4);
});
test('old changed claims without new reference fields lead to their actual version record',()=>{
 const s=advance(initialState());prepareDraft(s);commitDraft(s);delete s.versions[2].claimRefs;delete s.reviews[0].id;
 const refs=claimReferences(s,s.versions[2]);assert.deepEqual(refs[1],{kind:'version',id:3});
 assert.match(revisionRecordPanel(s,{revisionRef:{...refs[1],question:1}}),/已保存的版本记录/);
});
test('IP value framework joins relevant platform research and future handoff, respecting exclusion',()=>{
 const s=initialState();ensureMemory(s);assert.ok(contextFor(s,'platform').some(x=>x.id==='origin-framework'));
 assert.ok(!contextFor(s,'excluding').some(x=>x.id==='origin-framework'));assert.match(followupBoard(s),/data-id="origin-framework"/);
 s.discussions.find(x=>x.id==='origin-framework').status='excluded';assert.ok(!discussionContext(s,'platform',s.versions[0]).some(x=>x.id==='origin-framework'));assert.doesNotMatch(followupBoard(s),/data-id="origin-framework"/);
 assert.equal(memoriesAt(s,s.versions[0]).find(x=>x.id==='origin-framework').status,'included');
});
test('both historical views use the same V1 inclusion state and retain the V2 exclusion',()=>{
 const s=initialState();ensureMemory(s);const html=memoryArchive(s,{history:1,memoryFilter:'included'},s.versions[0]);
 assert.equal((html.match(/<article id="memory-/g)||[]).length,4);assert.doesNotMatch(html,/>undefined</);
 const v2=memoryArchive(s,{history:2,memoryFilter:'included'},s.versions[1]);assert.doesNotMatch(v2,/id="memory-demo-shortcut"/);
});

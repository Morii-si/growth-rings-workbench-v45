import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,restore,advance,latest} from './engine.js';
import {addAnnotation,prepareJudgment,attachAnnotation,loadSuggestions,confirmJudgment,annotationPanel,pendingAnnotations,editPendingAnnotation,removePendingAnnotation,sendDiscussionBatch} from './workbench.js';
const context={key:'version:1:original',stage:'version',versionId:1,report:'original',label:'V1 · 初始研究'};
test('HTTP preview can create distinct annotations and send a batch without randomUUID',()=>{
 const descriptor=Object.getOwnPropertyDescriptor(crypto,'randomUUID');
 Object.defineProperty(crypto,'randomUUID',{value:undefined,configurable:true});
 try{const s=initialState(),a=addAnnotation(s,{context,text:'first'}),b=addAnnotation(s,{context,text:'second'}),batch=sendDiscussionBatch(s);
 assert.notEqual(a.id,b.id);assert.match(a.id,/^annotation-[0-9a-f-]{36}$/);assert.match(batch.id,/^batch-[0-9a-f-]{36}$/);assert.equal(batch.annotations.length,2);
 }finally{if(descriptor)Object.defineProperty(crypto,'randomUUID',descriptor);else delete crypto.randomUUID;}
});
test('annotation preserves historical quote and actual creation time without altering confirmed boards',()=>{
 const s=initialState(),before=structuredClone(s.versions),a=addAnnotation(s,{context,anchor:'summary',quote:'原文 <b>',text:'  需要证据  '});
 assert.deepEqual(s.versions,before);assert.equal(a.text,'需要证据');assert.equal(a.quote,'原文 <b>');assert.ok(Date.parse(a.createdAt));
 context.label='外部变化';assert.equal(a.context.label,'V1 · 初始研究');context.label='V1 · 初始研究';
 assert.deepEqual(restore(JSON.stringify(s)).annotations,s.annotations);
 assert.throws(()=>addAnnotation(s,{context,text:' '}));assert.throws(()=>addAnnotation(s,{context:{...context,versionId:999},text:'x'}));
 assert.match(annotationPanel(s,{annotationAll:true},context),/原文 &lt;b&gt;/);
});
test('same editor handles annual research and individual claims, recording provenance and annotation snapshots',()=>{
 const s=initialState(),a=addAnnotation(s,{context,anchor:'question-1',quote:s.versions[0].claims[1],text:'继续核查产品节奏'}),before=structuredClone(s.versions);
 attachAnnotation(s,a.id);const d=prepareJudgment(s);d.texts[1]='修订后的老 IP 判断';d.reason='批注提出了反例';
 assert.equal(confirmJudgment(s),true);assert.deepEqual(s.versions.slice(0,2),before);assert.equal(latest(s).claims[0],before[1].claims[0]);
 assert.equal(latest(s).claimRefs[1].kind,'review');assert.equal(s.reviews[0].beforeClaims[1],before[1].claims[1]);
 a.text='之后的外部变化';assert.equal(s.reviews[0].annotationSnapshot[0].text,'继续核查产品节奏');assert.equal(latest(s).annotationSnapshot[0].text,'继续核查产品节奏');
});
test('new material does not change a draft until suggestions are explicitly loaded; no-change review creates no version',()=>{
 const s=initialState();advance(s);const d=prepareJudgment(s);assert.deepEqual(d.texts,latest(s).claims);d.reason='新材料尚不足以修改';d.source='interim';assert.equal(confirmJudgment(s),false);assert.equal(s.versions.length,2);assert.equal(s.reviews.length,1);assert.equal(s.alert,'reviewed');
 prepareJudgment(s).summary='自行输入的总判断';loadSuggestions(s);assert.equal(s.judgmentDraft.summary,'自行输入的总判断');assert.notDeepEqual(s.judgmentDraft.texts,latest(s).claims);
});
test('editing old research never silently marks new material reviewed; annual drafts can explicitly include new material',()=>{
 const s=initialState();s.rule={saved:true,active:true,object:'molly',threshold:0};advance(s);const d=prepareJudgment(s);d.summary='仅改写旧判断';d.reason='旧批注';assert.equal(d.source,null);confirmJudgment(s);assert.equal(s.alert,'pending');assert.equal(s.lastReviewed,'2026-03-25');
 const other=initialState();prepareJudgment(other);advance(other);other.judgmentDraft.source='interim';other.judgmentDraft.reason='已核对半年报';confirmJudgment(other);assert.equal(other.alert,'reviewed');
});
test('blank rationale and stale drafts cannot confirm; restored draft retains edits and annotation links',()=>{
 const s=initialState();const d=prepareJudgment(s);assert.throws(()=>confirmJudgment(s),/依据/);d.reason='理由';d.texts[0]='草稿';
 assert.deepEqual(restore(JSON.stringify(s)).judgmentDraft,d);
 s.versions.push({...structuredClone(latest(s)),id:3});assert.throws(()=>confirmJudgment(s),/已更新/);assert.equal(s.reviews.length,0);
});
test('one simulated send snapshots the whole round without creating AI replies, historical discussions, or judgments',()=>{
 const s=initialState(),before=structuredClone(s.versions),a=addAnnotation(s,{context,anchor:'summary',quote:'旧原文',text:'第一条'});
 addAnnotation(s,{context:{...context,key:'update:2:interim',stage:'update',versionId:2},text:'第二条'});
 const batch=sendDiscussionBatch(s);assert.equal(batch.annotations.length,2);assert.equal(batch.status,'simulated');assert.equal(pendingAnnotations(s).length,0);
 assert.deepEqual(s.versions,before);assert.deepEqual(s.chat,[]);assert.equal(s.discussions,undefined);assert.equal(s.reviews.length,0);
 assert.throws(()=>sendDiscussionBatch(s));assert.throws(()=>editPendingAnnotation(s,a.id,'改写'));
 a.text='外部篡改';assert.equal(batch.annotations[0].text,'第一条');assert.deepEqual(restore(JSON.stringify(s)).discussionBatches,s.discussionBatches);
});
test('draft annotations support editing and removal, while legacy annotations are retained in the pending queue',()=>{
 const s=initialState(),a=addAnnotation(s,{context,text:'旧版保存的批注'}),b=addAnnotation(s,{context,text:'待移除'});
 editPendingAnnotation(s,a.id,'修改后的问题');removePendingAnnotation(s,b.id);assert.equal(s.annotations.length,2);assert.equal(pendingAnnotations(s).length,1);
 const batch=sendDiscussionBatch(s);assert.equal(batch.annotations[0].text,'修改后的问题');assert.equal(batch.annotations.length,1);
});

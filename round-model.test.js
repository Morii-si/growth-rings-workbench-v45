import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,restore} from './engine.js';
import {prepareRoundDraft,saveRoundDraft,sendRound,referencesFor,sentRoundNotes,roundCount} from './round-model.js';
const context={key:'update:2:interim',stage:'update',versionId:2,report:'interim',label:'V3 · 半年报'};
const refs=[{id:'current',kind:'board',context,anchor:'ip-row-MOLLY',text:'2026 上半年9.01亿元，2025上半年13.57亿元，同比-33.6%'},{id:'history',kind:'discussion',discussionId:'demo-old-ip',context:{...context,stage:'version'},text:'一年增长不足以证明长期经营能力'}];
test('draft references and sent record snapshots survive restore without changing historical boards',()=>{
 const s=initialState(),before=structuredClone(s.versions);prepareRoundDraft(s,{context,references:refs,text:'还缺什么证据？'});refs[0].text='外部改变';assert.match(s.roundDraft.references[0].text,/9.01/);
 const restored=restore(JSON.stringify(s));const n=saveRoundDraft(restored);sendRound(restored);n.references[0].text='之后改变';assert.match(sentRoundNotes(restored)[0].references[0].text,/9.01/);assert.deepEqual(restored.versions,before);assert.equal(roundCount(restored),1);assert.equal(sentRoundNotes(restore(JSON.stringify(restored))).length,1);
});
test('reopening same or another editor cannot overwrite unsaved text or send it implicitly',()=>{
 const s=initialState();prepareRoundDraft(s,{context,text:'原文',references:refs});const n=saveRoundDraft(s);prepareRoundDraft(s,{editing:n.id});s.roundDraft.text='未保存修改';prepareRoundDraft(s,{editing:n.id});assert.equal(s.roundDraft.text,'未保存修改');prepareRoundDraft(s,{context,text:'另一问'});assert.equal(s.roundDraft.text,'未保存修改');assert.throws(()=>sendRound(s),/草稿/);saveRoundDraft(s);assert.equal(n.text,'未保存修改');
});
test('follow-up edits cannot mutate parent references; explicit empty references stay empty',()=>{
 const s=initialState();prepareRoundDraft(s,{context,text:'第一问',references:refs});saveRoundDraft(s);sendRound(s);const parent=sentRoundNotes(s)[0];prepareRoundDraft(s,{context,references:referencesFor(parent),text:'追问',parent:{id:parent.id,text:parent.text}});s.roundDraft.references=[];const next=saveRoundDraft(s);assert.deepEqual(referencesFor(next),[]);assert.equal(sentRoundNotes(s)[0].references.length,2);assert.equal(next.parent.text,'第一问');
});
test('legacy quote-only records still expose their captured original',()=>{const note={id:'old',context,anchor:'board',quote:'当时文字'};assert.equal(referencesFor(note)[0].text,'当时文字');note.references=[];assert.deepEqual(referencesFor(note),[]);});

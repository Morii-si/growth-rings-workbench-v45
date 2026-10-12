import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState} from './engine.js';
import {focusModel,focusDraft} from './research-focus.js';

test('研究线索的引用遵守轮次范围，三条线索均可追问',()=>{
 const s=initialState();
 for(const topic of ['old','new','platform'])for(const stage of [1,2,3]){
  const ui={focusTopic:topic,dataUpdate:stage===3},v=s.versions[stage===1?0:1],context={key:'test',versionId:v.id};
  const m=focusModel(s,ui,v),draft=focusDraft(s,ui,v,context);
  assert.ok(m.m);assert.ok(draft.text.length>10);
  assert.equal(draft.references.length,stage===1?1:2);
  assert.equal(draft.references[0].discussionId.startsWith('origin-'),stage<3);
  if(stage===1)assert.ok(!JSON.stringify(draft).includes('2026 上半年'));
  if(stage===2)assert.equal(draft.references[1].context.report,'annual');
  if(stage===3)assert.equal(draft.references[1].context.report,'interim');
 }
});
test('焦点材料保留同期间数值，独立于下方财报切换，不改写旧讨论',()=>{
 const s=initialState(),v=s.versions[1],ui={focusTopic:'old',dataUpdate:true,report:'annual'};
 const before=focusModel(s,ui,v).m.answer;
 const d=focusDraft(s,ui,v,{report:'annual'});
 assert.match(d.references[1].text,/2025 上半年 → 2026 上半年/);
 assert.match(d.references[1].text,/13.57 → 9.01/);
 assert.equal(d.references[1].context.report,'interim');
 d.references[0].text='改写引用副本';
 assert.equal(focusModel(s,ui,v).m.answer,before);
});

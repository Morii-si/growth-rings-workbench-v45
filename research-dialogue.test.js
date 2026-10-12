import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,restore} from './engine.js';
import {focusModel,focusDraft} from './research-focus.js';
import {addCaseTurn,dialogueSession,caseResponse,dialogueHTML} from './research-dialogue.js';
test('案例分支尊重研究轮次，九种情境不向历史带入未来数据',()=>{
 const s=initialState(),original=structuredClone(s.versions);
 for(const topic of ['old','new','platform'])for(const stage of [1,2,3]){
  const ui={focusTopic:topic,dataUpdate:stage===3},v=s.versions[stage===1?0:1],f=focusModel(s,ui,v),d=focusDraft(s,ui,v,{});
  for(const angle of ['compare','cause','evidence'])addCaseTurn(s,f,angle,d.references);
  assert.equal(dialogueSession(s,f).turns.length,3);
  if(stage<3)assert.doesNotMatch(JSON.stringify(dialogueSession(s,f)),/33\.6|580\.6|2026 上半年/);
  assert.notEqual(caseResponse(f,'compare').body,caseResponse(f,'cause').body);
 }
 assert.deepEqual(s.versions,original);
 assert.equal(Object.keys(restore(JSON.stringify(s)).researchSessions).length,9);
});
test('案例对话保存引用快照，自由输入安全显示，不假装生成答复',()=>{
 const s=initialState(),ui={focusTopic:'old',dataUpdate:true},v=s.versions[1],f=focusModel(s,ui,v),d=focusDraft(s,ui,v,{});
 addCaseTurn(s,f,'compare',d.references);d.references[0].text='changed';
 const session=dialogueSession(s,f);assert.notEqual(session.turns[0].references[0].text,'changed');
 session.draft='<img src=x onerror=alert(1)>';session.summary='<script>test</script>';
 const html=dialogueHTML(s,f);assert.ok(html.includes('&lt;img'));assert.ok(!html.includes('<script>'));assert.match(html,/预置案例/);assert.match(html,/自由提问会保存/);
 assert.throws(()=>addCaseTurn(s,f,'unknown',[]));assert.equal(session.turns.length,1);
});

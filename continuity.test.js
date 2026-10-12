import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,restore,advance,prepareDraft,commitDraft} from './engine.js';
import {ensureFollowup,updateFollowup,saveFollowupReminder,originBoard,followupBoard} from './research-continuity.js';
import {ensureMemory} from './research-memory.js';
test('follow-up edits survive restore without changing confirmed research or enabling alerts',()=>{
 const s=initialState(),before=structuredClone(s.versions);ensureFollowup(s);
 updateFollowup(s,'old-ip','trigger','连续两期同比下降后复核');updateFollowup(s,'channel','active',false);updateFollowup(s,'note','note','留给下次的研究笔记');
 const next=restore(JSON.stringify(s));ensureFollowup(next);
 assert.equal(next.followupPlan.items['old-ip'].trigger,'连续两期同比下降后复核');assert.equal(next.followupPlan.items.channel.active,false);assert.equal(next.followupPlan.note,'留给下次的研究笔记');assert.deepEqual(next.versions,before);assert.equal(next.rule.saved,false);assert.doesNotMatch(followupBoard(next),/V3 ·|V3・/);
});
test('confirmed revision keeps unnumbered future tasks and editable research handoff',()=>{
 const s=initialState();ensureFollowup(s);updateFollowup(s,'note','note','复核内容和上新节奏');advance(s);prepareDraft(s);commitDraft(s);
 assert.doesNotMatch(followupBoard(s),/V4 ·|V4・/);assert.equal(s.followupPlan.note,'复核内容和上新节奏');assert.equal(s.versions[0].sources.length,1);
});
test('origin includes framework and source boundaries, future safely renders personal text',()=>{
 const html=originBoard();assert.match(html,/origin-framework/);assert.match(html,/origin-platform/);assert.match(html,/生命周期/);assert.doesNotMatch(html,/依据你的|原稿框架|原研究 p./);assert.doesNotMatch(html,/371\.20|2026 中期业绩|580\.6/);
 const s=initialState();ensureMemory(s);updateFollowup(s,'note','note','<img src=x onerror=alert(1)>');const plan=followupBoard(s);assert.match(plan,/&lt;img/);assert.doesNotMatch(plan,/<img/);
});

test('pausing a task pauses its reminder; re-including does not silently reactivate it',()=>{
 const s=initialState();ensureFollowup(s);saveFollowupReminder(s,{object:'molly',active:true,threshold:10});advance(s);assert.equal(s.alert,'pending');
 updateFollowup(s,'old-ip','active',false);assert.equal(s.rule.active,false);assert.equal(s.alert,'pending');
 updateFollowup(s,'old-ip','active',true);assert.equal(s.rule.active,false);
 updateFollowup(s,'old-ip','active',false);saveFollowupReminder(s,{object:'molly',active:true,threshold:10});assert.equal(s.followupPlan.items['old-ip'].active,true);assert.equal(s.alert,'pending');
});
test('moving the fictional origin date leaves real user records and reference dates intact',()=>{
 const s=initialState();ensureMemory(s);s.versions[0].date='2025.08';s.discussions.find(m=>m.id==='origin-framework').date='2025.08';s.discussions.push({id:'real',kind:'user',date:'2025.08',question:'real',status:'open'});
 const restored=restore(JSON.stringify(s));assert.equal(restored.versions[0].date,'2026.02');assert.equal(restored.discussions.find(m=>m.id==='origin-framework').date,'2026.02');assert.equal(restored.discussions.find(m=>m.id==='real').date,'2025.08');
});
test('every follow-up has a review arrangement while only supported income checks expose an automatic rule',()=>{
 const s=initialState(),html=followupBoard(s);
 assert.equal((html.match(/<strong>复核安排<\/strong>/g)||[]).length,4);
 assert.equal((html.match(/class="task-reminder manual-arrangement"/g)||[]).length,3);
 assert.equal((html.match(/id="rule-form"/g)||[]).length,1);
 assert.equal((html.match(/name="threshold"/g)||[]).length,1);
 assert.doesNotMatch(html,/调整条件与节奏/);
 assert.equal((html.match(/<h4>研究复核<\/h4>/g)||[]).length,4);
 assert.equal((html.match(/<h4>披露提醒<\/h4>/g)||[]).length,1);
});
test('manual review arrangements persist each task cadence and condition without activating a financial alert',()=>{
 const s=initialState();
 for(const id of ['succession','connection','channel']){
  updateFollowup(s,id,'trigger','核对 '+id+' 的原始证据');
  updateFollowup(s,id,'cadence','有新材料时');
 }
 const restored=restore(JSON.stringify(s));ensureFollowup(restored);advance(restored);
 for(const id of ['succession','connection','channel']){
  assert.equal(restored.followupPlan.items[id].trigger,'核对 '+id+' 的原始证据');
  assert.equal(restored.followupPlan.items[id].cadence,'有新材料时');
 }
 assert.equal(restored.rule.saved,false);assert.equal(restored.alert,'none');
 assert.equal(restored.versions.length,2);
});

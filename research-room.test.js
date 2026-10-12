import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,restore} from './engine.js';
import {roomState,roomResult,roomReferences,changeRoom,interpretRoomInput,saveRoomRecord} from './research-room-model.js';
import {researchHome,researchWork,roomArchive} from './research-room.js';
test('旧讨论实际改变查证任务与引用；移除可撤销且不改变历史',()=>{
 const s=initialState(),history=structuredClone(s.versions);changeRoom(s,'start');
 assert.ok(roomResult(s).tasks.some(t=>t.id==='supply'));assert.match(roomResult(s).impact,/上次明确/);assert.equal(roomReferences(s).length,2);
 changeRoom(s,'memory',false);assert.ok(!roomResult(s).tasks.some(t=>t.id==='supply'));assert.ok(roomResult(s).tasks.some(t=>t.id==='breakdown'));assert.equal(roomReferences(s).length,1);
 changeRoom(s,'memory',true);assert.ok(roomResult(s).tasks.some(t=>t.id==='supply'));assert.deepEqual(s.versions,history);
});
test('切到国内后整体数据失去结论资格，补国内口径任务优先出现',()=>{
 const s=initialState();changeRoom(s,'scope','domestic');const x=roomResult(s);assert.equal(x.tasks[0].id,'domestic-base');assert.match(x.evidence,/不能直接用于判断国内情况/);assert.doesNotMatch(x.summary,/已确认同期间收入回落/);assert.match(roomReferences(s).at(-1).text,/不能据此判断国内/);
 changeRoom(s,'scope','all');assert.ok(!roomResult(s).tasks.some(t=>t.id==='domestic-base'));
});
test('查证单沉淀为独立快照，后续改变范围、任务与引用不会改写记录',()=>{
 const s=initialState(),rule=structuredClone(s.rule);changeRoom(s,'start');const record=saveRoomRecord(s,{summary:'回落原因仍待查',next:'先补产品发布记录'}),snapshot=structuredClone(record);
 changeRoom(s,'scope','domestic');changeRoom(s,'memory',false);roomState(s).selection['domestic:demand']=false;
 assert.deepEqual(roomState(s).records[0],snapshot);assert.deepEqual(s.rule,rule);assert.equal(s.researchReturns[0].question,'先补产品发布记录');assert.equal(restore(JSON.stringify(s)).researchRoom.records.length,1);
 roomResult(s).tasks.forEach(t=>roomState(s).selection['domestic:'+t.id]=false);assert.throws(()=>saveRoomRecord(s,{summary:'x',next:'y'}),/至少/);
});
test('自由输入只识别明确案例指令，否定或不相关输入不能被伪造回答',()=>{
 assert.deepEqual(interpretRoomInput('先只看国内渠道。'),{action:'scope',value:'domestic'});assert.equal(interpretRoomInput('不要只看国内渠道'),null);assert.equal(interpretRoomInput('今天买什么股票'),null);
 const s=initialState();roomState(s).draft='<img src=x onerror=alert(1)>';assert.ok(researchHome(s).includes('&lt;img'));assert.ok(!researchWork(s).includes('<img src=x'));
 changeRoom(s,'start');saveRoomRecord(s,{summary:'<script>bad</script>',next:'<b>next</b>'});assert.ok(roomArchive(s).includes('&lt;script&gt;'));assert.ok(!roomArchive(s).includes('<script>'));
});
test('开始研究不伪造用户发言，保存完整 AI 开场并共用对话样式',()=>{
 const s=initialState();changeRoom(s,'start');const m=roomState(s).messages[0];
 assert.equal(m.user,null);assert.equal(m.action,'start');assert.match(m.answer,/产品推出节奏变化/);
 const html=researchWork(s);assert.ok(html.includes('gr-avatar'));assert.ok(!html.includes('class="gr-message gr-user'));
 saveRoomRecord(s,{summary:'尚缺需求证据',next:'查看同渠道持续销售'});
 assert.equal(roomState(s).records[0].messages[0].user,null);assert.ok(roomArchive(s).includes('gr-avatar'));
 roomState(s).messages.push({id:'question-1',user:'这次回落，会改变我们对 MOLLY 的看法吗？',answer:null});
 assert.ok(researchWork(s).includes('class="gr-message gr-user'));
});
test('首次改变范围保留原 AI 开场，每次回复保存独立快照且始终在连续对话中',()=>{
 const s=initialState(),opening=roomResult(s).lead;
 changeRoom(s,'scope','domestic');
 const r=roomState(s);assert.equal(r.messages.length,2);
 assert.equal(r.messages[0].action,'start');assert.match(r.messages[0].answer,/产品推出节奏变化/);
 const original=structuredClone(r.messages);
 changeRoom(s,'memory',false);
 assert.deepEqual(r.messages.slice(0,2),original);
 const html=researchWork(restore(JSON.stringify(s)));
 assert.ok(html.replace(/<\/?mark>/g,'').includes(opening.split('\n')[0]));
 assert.ok(!html.includes('class="room-earlier"'));
 for(const m of r.messages)assert.ok(html.includes('data-message-id="'+m.id+'"'));
 assert.equal((html.match(/class="gr-message gr-ai/g)||[]).length,3);
});
test('等待回复的新问题不隐藏或重算原 AI 回复，用户文本继续安全转义',()=>{
 const s=initialState();changeRoom(s,'start');const r=roomState(s),answer=r.messages[0].answer;
 r.messages.push({id:'question-test',user:'<img src=x onerror=alert(1)>',answer:null,references:roomReferences(s)});
 r.scope='domestic';const html=researchWork(s);
 assert.ok(html.replace(/<\/?mark>/g,'').includes(answer.split('\n')[0]));assert.ok(html.includes('&lt;img'));
 assert.ok(html.includes('等待 AI 回复'));assert.ok(html.includes('随问题保留的材料'));
 assert.equal(r.messages[0].answer,answer);
});

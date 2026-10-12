import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,restore} from './engine.js';
import {roomDirections,roomDirection,roomState,roomResult,roomReferences,roomMemory,roomTaskKey,roomSelectedTasks,roomBoardDraft,changeRoom,interpretRoomInput,generateRoomBoard} from './research-room-model.js';

test('八个方向分别保留旧问题、新披露与三种不同的预置追问',()=>{
 const s=initialState();assert.equal(roomDirections.length,8);assert.equal(new Set(roomDirections.map(d=>d.id)).size,8);
 assert.equal(roomDirections.filter(d=>d.category==='new').length,5);
 for(const direction of roomDirections){
  assert.ok(direction.previous&&direction.trigger&&direction.evidence&&direction.question);assert.equal(direction.prompts.length,3);
  changeRoom(s,'direction',direction.id);assert.equal(roomDirection(s).id,direction.id);
  const before=roomState(s).messages.length;
  for(const prompt of direction.prompts)changeRoom(s,'prompt',prompt);
  const replies=roomState(s).messages.slice(before);assert.equal(replies.length,3);
  assert.equal(new Set(replies.map(m=>m.answer)).size,3);
  for(const reply of replies){assert.equal(reply.directionId,direction.id);assert.equal(reply.origin,'prompt');assert.ok(reply.provenance.evidence);assert.ok(reply.references.every(r=>r.provenance));}
 }
});

test('各方向引用真实旧讨论或旧看板，旧讨论文本不冒充公告原文',()=>{
 const s=initialState();
 assert.equal(roomMemory(s,'monster').id,'demo-concentration');assert.equal(roomMemory(s,'stars').id,'demo-platform');assert.equal(roomMemory(s,'cash'),null);
 const cash=roomReferences(s,'cash');assert.equal(cash.length,1);assert.equal(cash[0].provenance.type,'new-disclosure');assert.match(cash[0].text,/未作同比/);
 const overseas=roomReferences(s,'overseas');assert.ok(overseas.every(r=>r.kind!=='discussion'));assert.equal(overseas.find(r=>r.provenance.type==='new-disclosure').source.page,'24');assert.equal(overseas.at(-1).source.page,'28');
 const molly=roomReferences(s,'molly');assert.equal(molly[0].kind,'discussion');assert.equal(molly[0].source,undefined);assert.equal(molly[1].source.page,'30');
 const inventory=roomReferences(s,'inventory');assert.equal(inventory.find(r=>r.provenance.type==='new-disclosure').source.page,'35');assert.equal(inventory.find(r=>r.provenance.type==='comparison-disclosure').source.page,'32');assert.match(inventory.at(-1).source.url,/2025081900627_c.pdf#page=32/);
});

test('新方向默认未选，只有访问过且明确勾选的任务进入聚合',()=>{
 const s=initialState(),r=roomState(s);assert.deepEqual(roomSelectedTasks(s).map(t=>t.id),['supply','demand']);
 r.selection['cash:cash-bridge']=true;assert.ok(!roomSelectedTasks(s).some(t=>t.directionId==='cash'));
 changeRoom(s,'direction','stars');const stars=roomResult(s);assert.equal(stars.selected.length,0);assert.ok(stars.tasks.every(t=>!t.selected));
 r.selection[stars.tasks[0].selectionKey]=true;assert.equal(roomTaskKey(s,stars.tasks[0]),'stars:ip-cohort');
 const draft=roomBoardDraft(s);assert.match(draft.summary,/MOLLY/);assert.match(draft.summary,/星星人/);assert.match(draft.next,/固定批次/);
 changeRoom(s,'direction','molly');assert.equal(roomResult(s).selected.length,2);assert.equal(roomSelectedTasks(s).length,3);
 changeRoom(s,'direction','stars');assert.equal(roomResult(s).selected[0].id,'ip-cohort');
});

test('跨方向生成冻结所选任务、所有交流与材料，刷新和新讨论不改写产物',()=>{
 const s=initialState();changeRoom(s,'start');changeRoom(s,'direction','inventory');changeRoom(s,'prompt',0);
 const selected=roomResult(s).tasks[0];roomState(s).selection[selected.selectionKey]=true;
 const board=generateRoomBoard(s,roomBoardDraft(s)),snapshot=structuredClone(board);
 assert.deepEqual(board.directionIds,['molly','inventory']);assert.equal(board.tasks.length,3);assert.equal(board.messages.length,3);assert.equal(board.evidenceByDirection.length,2);
 assert.ok(board.references.some(r=>r.provenance?.type==='comparison-disclosure'));assert.ok(board.references.some(r=>r.discussionId==='demo-old-ip'));
 assert.deepEqual(restore(JSON.stringify(s)).researchRoom.generatedBoards[0],board);
 changeRoom(s,'direction','cash');changeRoom(s,'prompt',1);assert.deepEqual(roomState(s).generatedBoards[0],snapshot);
});

test('旧消息缺少方向时不改写原文，恢复已有方向不重复添加开场',()=>{
 const s=initialState();s.researchRoom={started:true,scope:'all',useMemory:true,messages:[{id:'old-message',user:'旧问题',answer:'旧回答'}],selection:{'all:demand':false},draft:'旧草稿',saveDrafts:{},records:[]};
 const original=structuredClone(s.researchRoom.messages[0]);changeRoom(s,'direction','cash');assert.deepEqual(roomState(s).messages[0],original);
 assert.equal(roomState(s).messages[1].user,null);assert.equal(roomState(s).messages[1].directionId,'cash');
 const count=roomState(s).messages.length;changeRoom(s,'direction','molly');changeRoom(s,'direction','cash');assert.equal(roomState(s).messages.length,count);
 assert.equal(roomState(s).selection['all:demand'],false);assert.equal(roomState(s).draft,'旧草稿');
});

test('自由文本仅识别当前方向的精确追问，非法动作不增加消息',()=>{
 const s=initialState();changeRoom(s,'direction','cash');const prompt=roomDirection(s).prompts[1];assert.deepEqual(interpretRoomInput(prompt,s),{action:'prompt',value:1});
 assert.equal(interpretRoomInput('不要'+prompt,s),null);assert.equal(interpretRoomInput('先只看国内渠道',s),null);
 const snapshot=structuredClone(s);assert.throws(()=>changeRoom(s,'direction','unknown'));assert.throws(()=>changeRoom(s,'prompt',99));assert.deepEqual(s,snapshot);
});

test('移除旧讨论后不引用其原文，国内追问不把整体数据当国内结论',()=>{
 const s=initialState();changeRoom(s,'scope','domestic');changeRoom(s,'prompt',1);assert.match(roomState(s).messages.at(-1).answer,/不能直接用于判断国内/);
 changeRoom(s,'memory',false);changeRoom(s,'prompt',0);const last=roomState(s).messages.at(-1);assert.match(last.answer,/当前先不引用旧讨论/);assert.ok(last.references.every(r=>r.kind!=='discussion'));
});

test('每个方向独立控制旧讨论，切换方向不改变其他方向已选任务',()=>{
 const s=initialState();changeRoom(s,'direction','stars');changeRoom(s,'memory',false);
 assert.equal(roomResult(s).memory,null);assert.equal(roomState(s).useMemory,true);assert.ok(roomSelectedTasks(s).some(t=>t.id==='supply'));
 changeRoom(s,'direction','molly');assert.equal(roomResult(s).memory.id,'demo-old-ip');changeRoom(s,'memory',false);
 changeRoom(s,'direction','platform');assert.equal(roomResult(s).memory.id,'demo-platform');changeRoom(s,'direction','stars');assert.equal(roomResult(s).memory,null);
});

test('产物顶层保留当前选择的范围，原交流引用仍保留当时范围',()=>{
 const s=initialState();changeRoom(s,'start');changeRoom(s,'scope','domestic');
 const board=generateRoomBoard(s,roomBoardDraft(s));const current=board.references.find(r=>r.id==='room-molly-evidence');
 assert.match(current.text,/不能据此判断国内/);assert.doesNotMatch(board.messages[0].references.find(r=>r.id==='room-molly-evidence').text,/不能据此判断国内/);
 changeRoom(s,'direction','cash');const next=generateRoomBoard(s,roomBoardDraft(s));assert.doesNotMatch(next.evidence,/经营现金流/);assert.deepEqual(next.directionIds,['molly']);
});

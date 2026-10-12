import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,restore} from './engine.js';
import {roomState,roomResult,changeRoom,saveRoomRecord,generateRoomBoard,latestGeneratedBoard} from './research-room-model.js';
test('普通历史小结不自动成为V3；必须显式生成，选择实际控制跟进内容',()=>{
 const s=initialState(),versions=structuredClone(s.versions);changeRoom(s,'start');saveRoomRecord(s,{summary:'以前保存的小结',next:'再观察'});
 assert.equal(latestGeneratedBoard(s),null);roomState(s).selection['all:demand']=false;
 const board=generateRoomBoard(s,{summary:'需核对供给节奏',next:'找上新记录'});
 assert.equal(board.version,3);assert.deepEqual(board.tasks.map(t=>t.id),['supply']);assert.deepEqual(s.versions,versions);assert.equal(board.messages[0].user,null);
 assert.deepEqual(restore(JSON.stringify(s)).researchRoom.generatedBoards[0],board);
});
test('后续聊天、选择及再次生成不会篡改已生成快照',()=>{
 const s=initialState();const first=generateRoomBoard(s,{summary:'先查节奏',next:'补供给证据'}),frozen=structuredClone(first);
 changeRoom(s,'scope','domestic');changeRoom(s,'memory',false);
 const second=generateRoomBoard(s,{summary:'国内证据不足',next:'补国内拆分'});
 assert.deepEqual(roomState(s).generatedBoards[0],frozen);assert.notEqual(first.id,second.id);assert.equal(second.generation,2);assert.match(second.evidence,/不能直接用于判断国内/);
 assert.equal(latestGeneratedBoard(s).id,second.id);assert.equal(second.useMemory,false);
});
test('没有选择或空小结不能生成，且失败不改变消息或历史记录',()=>{
 const s=initialState();for(const task of roomResult(s).tasks)roomState(s).selection['all:'+task.id]=false;
 const before=structuredClone(s);assert.throws(()=>generateRoomBoard(s,{summary:'x',next:'y'}),/至少选择/);assert.deepEqual(s,before);
 roomState(s).selection['all:supply']=true;assert.throws(()=>generateRoomBoard(s,{summary:' ',next:'y'}),/请写下/);assert.equal(latestGeneratedBoard(s),null);assert.equal(roomState(s).messages.length,0);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,restore} from './engine.js';
import {roomState,latestGeneratedBoard} from './research-room-model.js';
import {roundConversation,sendRoundInput,generateConversationBoard,conversationBoardPendingCount,setBoardConversationReference} from './research-draft-model.js';
import {researchChatView} from './research-chat-view.js';
import {RESEARCH_STORAGE_KEY,resolveResearchSession,researchSessionLink} from './research-session.js';
import {bundledResearchBoard} from './bundled-research-content.js';
import {createBundledResearchState,loadBundledResearchState,recoverConfirmedLegacyResearch,researchStateFingerprint,isKnownIncompleteResearch,legacyResearchBackupKey} from './bundled-research-demo.js';

const key=RESEARCH_STORAGE_KEY;
const clone=value=>structuredClone(value);
function storage(raw){
 const values=new Map(raw===undefined?[]:[[key,raw]]),writes=[];
 return {values,writes,read:name=>values.get(name)??null,write:(name,value)=>{writes.push([name,value]);values.set(name,value);}};
}
const load=(store,options={})=>loadBundledResearchState({key,read:store.read,write:store.write,...options});

// Reproduce the confirmed old Chrome schema, without publishing its private data.
function legacyShapedState(){
 const state=initialState(),room=roomState(state);state.period='interim';
 room.messages=Array.from({length:8},(_,i)=>({id:'synthetic-old-'+i,action:i?'direction':'question',user:i?null:'保留旧浏览器原话',answer:'旧版回答 '+i,references:[],directionId:'molly',at:'2026-10-12T08:00:00.000Z'}));
 room.roundSeedMessages=[{id:'synthetic-opening',kind:'opening',user:null,answer:'旧开场',references:[]}];
 room.generatedBoards=Array.from({length:2},(_,i)=>({id:'synthetic-board-'+i,kind:'generated-board',version:3,generation:i+1,summary:'旧版单条小结',messages:clone(room.messages.slice(0,6)),directionIds:['molly'],references:[],tasks:[],createdAt:'2026-10-12T08:00:00.000Z'}));
 room.records=room.generatedBoards.map(({kind,version,generation,...record})=>clone(record));
 room.roundDraft=null;room.saveDrafts={};room.directionDrafts={molly:''};
 return state;
}

test('fresh ordinary visits include the approved frozen V3, all 11 original user messages and four categories',()=>{
 const store=storage(),result=load(store),state=result.state,board=latestGeneratedBoard(state);
 assert.equal(result.status,'bundled');assert.equal(result.persistBlocked,false);assert.equal(store.writes.length,0);
 assert.equal(board.id,'research-1791806808301-hlfcux3');assert.equal(board.messages.length,12);
 assert.equal(board.messages.filter(message=>message.user).length,11);assert.equal(board.categories.length,4);
 assert.deepEqual(board,bundledResearchBoard);
 assert.deepEqual(state.versions,initialState().versions);
 const saved=clone(board),messages=roundConversation(state);
 assert.equal(messages[0].kind,'opening');assert.equal(messages.length,12);assert.equal(messages.filter(message=>message.user).length,11);
 for(const message of messages)assert.deepEqual(message,board.messages.find(item=>item.id===message.id));
 assert.deepEqual(latestGeneratedBoard(state),saved);assert.equal(conversationBoardPendingCount(state),0);
 const html=researchChatView(state);
 assert.equal((html.match(/class="chat-user-bubble"/g)||[]).length,11);
 assert.match(html,/查看研究看板/);assert.equal((html.match(/class="chat-exchange /g)||[]).length,12);
});

test('bundled replay survives restore and rendering without silently retiring four archived questions',()=>{
 const state=createBundledResearchState(),before=clone(latestGeneratedBoard(state));
 roundConversation(state);roundConversation(state);
 const restored=restore(JSON.stringify(state)),messages=roundConversation(restored);
 assert.equal(messages.filter(message=>message.kind==='demo').length,4);
 assert.equal(messages.filter(message=>message.user).length,11);
 assert.deepEqual(latestGeneratedBoard(restored),before);
 const first=messages.find(message=>message.kind==='demo');first.user='只改当前讨论';
 assert.deepEqual(latestGeneratedBoard(restored),before);assert.deepEqual(bundledResearchBoard,before);
});

test('ordinary legacy automatic seeds still retire without an explicit bundled replay marker',()=>{
 const state=initialState(),room=roomState(state);
 room.roundSeedMessages=clone(bundledResearchBoard.messages.filter(message=>message.kind==='demo'));
 const messages=roundConversation(state);
 assert.equal(messages.length,1);assert.equal(messages[0].kind,'opening');assert.equal(room.legacySeedMessages.length,4);
});

test('explicitly updating the bundled board preserves every archived message and all four summaries',()=>{
 const state=createBundledResearchState(),first=clone(latestGeneratedBoard(state));
 sendRoundInput(state,'记录一个新的研究问题');assert.equal(conversationBoardPendingCount(state),1);
 const next=generateConversationBoard(state);
 assert.deepEqual(roomState(state).generatedBoards[0],first);assert.deepEqual(next.messages.slice(0,12),first.messages);
 assert.equal(next.messages.length,13);assert.equal(next.messages.filter(message=>message.user).length,12);
 assert.deepEqual(next.categories,first.categories);assert.equal(conversationBoardPendingCount(state),0);
 assert.equal(roundConversation(state).filter(message=>message.user).length,12);
});

test('quoting a bundled category changes it only after explicit board update and freezes the original V3',()=>{
 const state=createBundledResearchState(),first=clone(latestGeneratedBoard(state)),target=first.categories[0];
 setBoardConversationReference(state,{categoryId:target.id});
 sendRoundInput(state,'类目改名：老 IP 的持续经营');
 assert.deepEqual(latestGeneratedBoard(state),first);
 const next=generateConversationBoard(state);
 assert.equal(next.categories.length,4);assert.equal(next.categories[0].title,'老 IP 的持续经营');
 assert.deepEqual(next.categories.slice(1),first.categories.slice(1));
 assert.deepEqual(next.messages.slice(0,12),first.messages);
 assert.deepEqual(roomState(state).generatedBoards[0],first);
});

test('opening stays empty and isolated; returning uses the complete ordinary work',()=>{
 const store=storage(),normal=load(store);store.write(key,JSON.stringify(normal.state));
 const normalRaw=store.read(key),entry=resolveResearchSession('http://localhost/?entry=opening',{createId:()=> 'separate-opening'});
 const opened=load(store,{...entry});
 assert.equal(opened.status,'isolated-opening');assert.equal(latestGeneratedBoard(opened.state),null);
 assert.equal(roundConversation(opened.state).filter(message=>message.user).length,0);
 store.write(entry.key,JSON.stringify(opened.state));
 const resumed=load(store,{...resolveResearchSession(entry.url)});
 assert.equal(resumed.status,'preserved');assert.equal(latestGeneratedBoard(resumed.state),null);
 const returned=load(store,{...resolveResearchSession(researchSessionLink(entry.url,'normal'))});
 assert.deepEqual(latestGeneratedBoard(returned.state),bundledResearchBoard);assert.equal(store.read(key),normalRaw);
});

test('opening entry never reads the main archive and a missing demo-session never injects the bundle',()=>{
 const opened=loadBundledResearchState({key,isDemo:true,entryStarted:true,read:()=>{throw Error('must not read');},write:()=>{throw Error('must not write');}});
 assert.equal(opened.status,'isolated-opening');assert.equal(latestGeneratedBoard(opened.state),null);
 const missing=load(storage(),{isDemo:true,key:key+':demo:missing'});
 assert.equal(missing.status,'isolated-opening');assert.equal(roundConversation(missing.state).filter(message=>message.user).length,0);
});

test('complete existing progress, custom content and unsaved messages restore without being overwritten',()=>{
 const state=createBundledResearchState();sendRoundInput(state,'保留这个浏览器新写的内容');
 roomState(state).conversationDraft='尚未发送';
 latestGeneratedBoard(state).categories[0].description='已有用户自行确认的判断';
 const raw=JSON.stringify(state),store=storage(raw),result=load(store);
 assert.equal(result.status,'preserved');assert.deepEqual(result.state,restore(raw));assert.equal(store.writes.length,0);
 assert.equal(store.read(key),raw);assert.equal(roundConversation(result.state).filter(message=>message.user).length,12);
});

test('an unknown archive with the same old Chrome shape is preserved; counts alone never trigger recovery',()=>{
 const state=legacyShapedState(),raw=JSON.stringify(state),store=storage(raw),result=load(store);
 assert.equal(isKnownIncompleteResearch(state),false);assert.equal(result.status,'preserved');
 assert.deepEqual(result.state,restore(raw));assert.equal(store.writes.length,0);assert.equal(store.read(key),raw);
 assert.equal(latestGeneratedBoard(result.state).categories,undefined);
});

test('confirmed legacy recovery first verifies a byte-for-byte raw backup and retains messages and snapshots',()=>{
 const previous=legacyShapedState(),raw=JSON.stringify(previous,null,2),store=storage(raw),before=clone(previous);
 const result=recoverConfirmedLegacyResearch({state:previous,raw,key,read:store.read,write:store.write});
 assert.equal(result.status,'legacy-recovered');assert.equal(result.persistBlocked,false);
 assert.deepEqual(store.writes,[[legacyResearchBackupKey(key),raw]]);assert.equal(store.read(key),raw);
 const room=roomState(result.state);
 assert.deepEqual(room.legacyLocalMessages,before.researchRoom.messages);
 assert.deepEqual(room.legacyLocalSeedMessages,before.researchRoom.roundSeedMessages);
 assert.deepEqual(room.generatedBoards.slice(0,2),before.researchRoom.generatedBoards);
 assert.deepEqual(room.records.slice(0,2),before.researchRoom.records);
 assert.deepEqual(previous,before);assert.deepEqual(latestGeneratedBoard(result.state),bundledResearchBoard);
 assert.equal(roundConversation(result.state).filter(message=>message.user).length,11);
 const reloaded=load(storage(JSON.stringify(result.state)));
 assert.equal(reloaded.status,'preserved');assert.equal(roomState(reloaded.state).generatedBoards.length,3);
});

test('backup failure, silent write failure and a conflicting backup all prevent migration and persistence',()=>{
 for(const failure of ['throw','silent','conflict']){
  const previous=legacyShapedState(),before=clone(previous),raw=JSON.stringify(previous),store=storage(raw);
  if(failure==='conflict')store.values.set(legacyResearchBackupKey(key),'a different earlier raw backup');
  const write=failure==='throw'?()=>{throw Error('storage quota');}:failure==='silent'?()=>{}:store.write;
  const result=recoverConfirmedLegacyResearch({state:previous,raw,key,read:store.read,write});
  assert.equal(result.status,'backup-failed',failure);assert.equal(result.persistBlocked,true,failure);
  assert.deepEqual(result.state,before);assert.equal(store.read(key),raw);assert.match(result.error,/旧存档备份未完成/);
 }
});

test('an already verified identical raw backup is reused without another write',()=>{
 const state=legacyShapedState(),raw=JSON.stringify(state),store=storage(raw);
 store.values.set(legacyResearchBackupKey(key),raw);
 const result=recoverConfirmedLegacyResearch({state,raw,key,read:store.read,write:()=>{throw Error('should not write');}});
 assert.equal(result.status,'legacy-recovered');assert.equal(store.read(key),raw);
});

test('invalid or unreadable storage is never replaced by the portable content',()=>{
 for(const raw of ['broken JSON',JSON.stringify({schema:1,privateData:'preserve me'})]){
  const store=storage(raw),result=load(store);
  assert.equal(result.persistBlocked,true);assert.equal(result.status,'invalid-storage');
  assert.equal(store.read(key),raw);assert.equal(store.writes.length,0);
 }
 const unavailable=loadBundledResearchState({key,read:()=>{throw Error('unavailable');},write:()=>{throw Error('must not write');}});
 assert.equal(unavailable.persistBlocked,true);assert.equal(unavailable.status,'storage-unavailable');
});

test('compatibility fingerprints ignore JSON formatting/key order but react to any content change',()=>{
 const a={messages:[{answer:'答',user:'问'}],categories:[],nested:{y:2,x:1}};
 const b={nested:{x:1,y:2},categories:[],messages:[{user:'问',answer:'答'}]};
 assert.equal(researchStateFingerprint(a),researchStateFingerprint(b));
 b.messages[0].user+='新的内容';assert.notEqual(researchStateFingerprint(a),researchStateFingerprint(b));
});
